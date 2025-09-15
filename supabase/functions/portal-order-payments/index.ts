import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface CreatePaymentRequest {
  schedule_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const orderId = pathSegments[pathSegments.indexOf('orders') + 1];
    
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    if (req.method === 'POST') {
      const { schedule_id }: CreatePaymentRequest = await req.json();

      // Verify order ownership and get payment schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          orders!inner(
            id,
            user_id,
            order_number,
            total_amount
          )
        `)
        .eq('id', schedule_id)
        .eq('orders.id', orderId)
        .eq('orders.user_id', user.id)
        .single();

      if (scheduleError || !schedule) {
        throw new Error('Payment schedule not found or access denied');
      }

      if (schedule.status !== 'pending') {
        throw new Error('Payment schedule is not pending');
      }

      // Check if PayPal is configured
      const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
      const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
      
      if (!paypalClientId || !paypalClientSecret) {
        throw new Error('PayPal not configured');
      }

      // Create PayPal order
      const { data: paypalOrder, error: paypalError } = await supabase.functions.invoke('create-paypal-order', {
        body: {
          amount: schedule.amount,
          currency: 'AUD',
          description: `Payment for Order ${schedule.orders.order_number} - ${schedule.schedule_type}`,
          metadata: {
            order_id: orderId,
            schedule_id: schedule_id,
            user_id: user.id
          }
        }
      });

      if (paypalError) {
        throw paypalError;
      }

      // Update payment schedule with PayPal order ID
      const { error: updateError } = await supabase
        .from('payment_schedules')
        .update({
          payment_reference: paypalOrder.id,
          status: 'processing'
        })
        .eq('id', schedule_id);

      if (updateError) {
        throw updateError;
      }

      // Log payment attempt
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'payment',
        p_scope_id: schedule_id,
        p_action: 'payment_initiated',
        p_after_data: JSON.stringify({
          paypal_order_id: paypalOrder.id,
          amount: schedule.amount,
          schedule_type: schedule.schedule_type
        })
      });

      return new Response(JSON.stringify({
        payment_intent: {
          id: paypalOrder.id,
          amount: schedule.amount,
          currency: 'AUD',
          approval_url: paypalOrder.links.find((link: any) => link.rel === 'approve')?.href,
          status: 'created'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-order-payments:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});