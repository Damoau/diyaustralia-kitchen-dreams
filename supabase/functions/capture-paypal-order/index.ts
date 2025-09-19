import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Secure CORS headers - replace with your actual domain
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://nqxsfmnvdfdfvndrodvs.supabase.co",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface CaptureOrderRequest {
  order_id: string;
  checkout_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limiting
    const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
      p_identifier: user.id,
      p_action: 'capture_paypal_order',
      p_max_attempts: 10,
      p_window_minutes: 5
    });

    if (!rateLimitCheck) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody = await req.json();
    const { order_id, checkout_id }: CaptureOrderRequest = requestBody;

    // Input validation
    if (!order_id || typeof order_id !== 'string' || order_id.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid order ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PayPal API configuration
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const paypalApiUrl = Deno.env.get("PAYPAL_API_URL") || "https://api-m.sandbox.paypal.com";

    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    // Get access token
    const authResponse = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      console.error("PayPal auth error:", authData);
      throw new Error("Failed to authenticate with PayPal");
    }

    // Capture the order
    const captureResponse = await fetch(`${paypalApiUrl}/v2/checkout/orders/${order_id}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authData.access_token}`,
      },
    });

    const captureResult = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error("PayPal capture error:", captureResult);
      throw new Error("Failed to capture PayPal payment");
    }

    console.log('PayPal payment captured successfully:', captureResult);

    // Extract payment details
    const payment = captureResult.purchase_units[0].payments.captures[0];
    const amount = parseFloat(payment.amount.value);
    const currency = payment.amount.currency_code;
    const paypalTransactionId = payment.id;

    // Extract schedule_id from custom_id in PayPal order
    const customId = captureResult.purchase_units[0].custom_id;
    let scheduleId = null;
    let orderId = null;
    
    if (customId) {
      // Parse custom_id format: "schedule:{schedule_id}" or "order:{order_id}"
      if (customId.startsWith('schedule:')) {
        scheduleId = customId.replace('schedule:', '');
      } else if (customId.startsWith('order:')) {
        orderId = customId.replace('order:', '');
      }
    }

    // Record the payment in database
    const paymentRecord = {
      checkout_id: checkout_id,
      payment_schedule_id: scheduleId,
      order_id: orderId,
      amount: amount,
      currency: currency,
      payment_method: 'paypal',
      payment_status: 'completed',
      external_payment_id: paypalTransactionId,
      payment_data: captureResult,
      processed_at: new Date().toISOString()
    };

    const { data: insertedPayment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      throw new Error('Failed to record payment');
    }

    // If this is a schedule payment, update the payment schedule
    if (scheduleId) {
      const { error: scheduleError } = await supabase
        .from('payment_schedules')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: 'paypal',
          payment_reference: paypalTransactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (scheduleError) {
        console.error('Error updating payment schedule:', scheduleError);
      } else {
        console.log('Payment schedule updated:', scheduleId);
        
        // Trigger invoice generation
        try {
          await supabase.functions.invoke('generate-invoice-pdf', {
            body: { payment_schedule_id: scheduleId }
          });
        } catch (invoiceError) {
          console.error('Error generating invoice:', invoiceError);
        }
      }
    }

    // Update checkout status if provided
    if (checkout_id) {
      const { error: checkoutError } = await supabase
        .from('checkouts')
        .update({ 
          status: 'converted',
          updated_at: new Date().toISOString()
        })
        .eq('id', checkout_id);

      if (checkoutError) {
        console.error('Error updating checkout:', checkoutError);
      }
    }

    console.log('Payment recorded successfully:', insertedPayment.id);

    return new Response(JSON.stringify({
      success: true,
      payment_id: paypalTransactionId,
      amount: amount,
      currency: currency,
      status: captureResult.status,
      capture_data: captureResult
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in capture-paypal-order function:", error);
    
    // Log security event for suspicious activity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      await supabase.rpc('log_audit_event', {
        p_scope: 'paypal_error',
        p_action: 'capture_order_failed',
        p_after_data: JSON.stringify({
          error: error.message,
          timestamp: new Date().toISOString()
        })
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    // Return generic error message to prevent information disclosure
    return new Response(
      JSON.stringify({ error: "Payment processing error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);