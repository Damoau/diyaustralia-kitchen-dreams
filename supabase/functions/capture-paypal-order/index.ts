import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  try {
    const { order_id, checkout_id }: CaptureOrderRequest = await req.json();

    console.log('Capturing PayPal order:', { order_id, checkout_id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Record the payment in database
    if (checkout_id) {
      // Create payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .insert({
          checkout_id: checkout_id,
          amount: amount,
          currency: currency,
          payment_method: 'paypal',
          payment_status: 'completed',
          external_payment_id: paypalTransactionId,
          payment_data: captureResult,
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        throw new Error('Failed to record payment');
      }

      // Update checkout status to converted
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

      console.log('Payment recorded successfully:', paymentRecord.id);
    }

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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);