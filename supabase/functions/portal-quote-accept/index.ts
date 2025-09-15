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

interface AcceptQuoteRequest {
  payment_option: 'deposit' | 'full';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const quoteId = pathSegments[pathSegments.indexOf('quotes') + 1];
    
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
      const { payment_option }: AcceptQuoteRequest = await req.json();

      // Get quote details
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (*)
        `)
        .eq('id', quoteId)
        .eq('user_id', user.id)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found or access denied');
      }

      if (quote.status !== 'sent') {
        throw new Error('Quote cannot be accepted in current status');
      }

      // Generate order number
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          subtotal: quote.subtotal,
          tax_amount: quote.tax_amount,
          total_amount: quote.total_amount,
          status: 'confirmed',
          payment_status: payment_option === 'full' ? 'pending' : 'partial',
          notes: `Created from quote ${quote.quote_number}`
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Copy quote items to order items
      const orderItems = quote.quote_items.map((item: any) => ({
        order_id: order.id,
        cabinet_type_id: item.cabinet_type_id,
        quantity: item.quantity,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        depth_mm: item.depth_mm,
        unit_price: item.unit_price,
        total_price: item.total_price,
        configuration: item.configuration,
        door_style_id: item.door_style_id,
        color_id: item.color_id,
        finish_id: item.finish_id
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Create payment schedules based on payment option
      let paymentSchedules = [];
      
      if (payment_option === 'deposit') {
        const depositAmount = quote.total_amount * 0.3; // 30% deposit
        const balanceAmount = quote.total_amount - depositAmount;
        
        paymentSchedules = [
          {
            order_id: order.id,
            schedule_type: 'deposit',
            percentage: 30,
            amount: depositAmount,
            due_date: new Date().toISOString().split('T')[0],
            status: 'pending'
          },
          {
            order_id: order.id,
            schedule_type: 'balance',
            percentage: 70,
            amount: balanceAmount,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
            status: 'pending'
          }
        ];
      } else {
        paymentSchedules = [{
          order_id: order.id,
          schedule_type: 'full',
          percentage: 100,
          amount: quote.total_amount,
          due_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        }];
      }

      const { error: scheduleError } = await supabase
        .from('payment_schedules')
        .insert(paymentSchedules);

      if (scheduleError) {
        throw scheduleError;
      }

      // Update quote status
      const { error: updateQuoteError } = await supabase
        .from('quotes')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          converted_order_id: order.id
        })
        .eq('id', quoteId);

      if (updateQuoteError) {
        throw updateQuoteError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'quote',
        p_scope_id: quoteId,
        p_action: 'accepted',
        p_after_data: JSON.stringify({ order_id: order.id, payment_option })
      });

      // Trigger webhook
      await supabase.functions.invoke('send-notifications', {
        body: {
          event: 'quote.accepted',
          data: {
            quote_id: quoteId,
            order_id: order.id,
            user_id: user.id,
            total: quote.total_amount,
            deposit_amount: payment_option === 'deposit' ? quote.total_amount * 0.3 : quote.total_amount
          }
        }
      });

      return new Response(JSON.stringify({ 
        order_id: order.id,
        order_number: orderNumber,
        payment_schedules: paymentSchedules
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-quote-accept:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});