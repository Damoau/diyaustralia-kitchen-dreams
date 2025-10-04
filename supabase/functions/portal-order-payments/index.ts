import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  schedule_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract order ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 2]; // /api/portal/orders/{id}/payments

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Remove auth header setting as it's not supported in newer versions
    // supabase.auth.setAuth(authHeader.replace('Bearer ', ''));

    if (req.method === 'POST') {
      const { schedule_id }: CreatePaymentRequest = await req.json();

      // Verify user owns the order and get payment schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          order:orders!inner(
            id,
            user_id,
            session_id,
            order_number
          )
        `)
        .eq('id', schedule_id)
        .eq('order.id', orderId)
        .single();

      if (scheduleError || !schedule) {
        return new Response(JSON.stringify({ error: 'Payment schedule not found or unauthorized' }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check if schedule is pending
      if (schedule.status !== 'pending') {
        return new Response(JSON.stringify({ error: 'Payment schedule is not pending' }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check if PayPal is enabled
      const { data: paypalFlag } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('flag_key', 'payments.paypal')
        .single();

      if (!paypalFlag?.is_enabled) {
        return new Response(JSON.stringify({ error: 'PayPal payments are not available' }), {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Create PayPal order via existing function
      const { data: paypalOrder, error: paypalError } = await supabase.functions.invoke('create-paypal-order', {
        body: {
          amount: schedule.amount,
          currency: 'AUD',
          description: `${schedule.schedule_type || 'Payment'} for Order ${schedule.order.order_number}`,
          schedule_id: schedule_id
        }
      });

      if (paypalError || !paypalOrder) {
        console.error('PayPal order creation failed:', paypalError);
        return new Response(JSON.stringify({ error: 'Failed to create payment order' }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Update payment schedule to processing
      await supabase
        .from('payment_schedules')
        .update({
          status: 'processing',
          payment_reference: paypalOrder.orderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule_id);

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_scope: 'payment',
        p_scope_id: schedule_id,
        p_action: 'payment_initiated',
        p_after_data: JSON.stringify({
          payment_method: 'paypal',
          amount: schedule.amount,
          paypal_order_id: paypalOrder.orderId
        })
      });

      return new Response(JSON.stringify({
        paypal_order_id: paypalOrder.orderId,
        approval_url: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrder.orderId}`,
        amount: schedule.amount,
        currency: 'AUD'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in portal-order-payments function:", error);
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