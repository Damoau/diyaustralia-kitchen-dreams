import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { checkoutId, paymentReference, paymentMethod } = await req.json();

    console.log('Creating order from checkout:', { checkoutId, paymentMethod });

    // 1. Fetch and validate checkout
    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts')
      .select('*, cart_id, user_id, session_id')
      .eq('id', checkoutId)
      .single();

    if (checkoutError || !checkout) {
      throw new Error('Checkout not found');
    }

    if (checkout.status === 'converted') {
      throw new Error('Checkout already converted to order');
    }

    // 2. Fetch cart and items
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('id', checkout.cart_id)
      .single();

    if (cartError || !cart || !cart.cart_items || cart.cart_items.length === 0) {
      throw new Error('Cart not found or empty');
    }

    // 3. Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number');

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      throw new Error('Failed to generate order number');
    }

    const orderNumber = orderNumberData;

    // 4. Calculate totals
    const subtotal = cart.cart_items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
    const gstAmount = subtotal * 0.10;
    const totalAmount = subtotal + gstAmount;

    // 4a. Calculate default due date (4 weeks from now, excluding weekends)
    const calculateDueDate = (weeksFromNow: number): string => {
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + (weeksFromNow * 7));
      
      // If it's Saturday (6), move to Monday
      if (dueDate.getDay() === 6) {
        dueDate.setDate(dueDate.getDate() + 2);
      }
      // If it's Sunday (0), move to Monday
      else if (dueDate.getDay() === 0) {
        dueDate.setDate(dueDate.getDate() + 1);
      }
      
      return dueDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
    };

    const defaultDueDate = calculateDueDate(4);

    // 5. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: checkout.user_id,
        session_id: checkout.session_id,
        status: 'pending',
        payment_status: paymentMethod === 'stripe' ? 'paid' : 'pending',
        payment_method: paymentMethod,
        subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        customer_name: `${checkout.customer_first_name || ''} ${checkout.customer_last_name || ''}`.trim(),
        customer_email: checkout.customer_email,
        customer_phone: checkout.customer_phone,
        customer_company: checkout.customer_company,
        customer_abn: checkout.customer_abn,
        shipping_method: 'standard',
        target_completion: defaultDueDate,
        notes: checkout.how_heard ? `How they heard about us: ${checkout.how_heard}` : null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('Order created:', order.id);

    // 6. Copy cart items to order items
    const orderItems = cart.cart_items.map((item: any) => ({
      order_id: order.id,
      cabinet_type_id: item.cabinet_type_id,
      quantity: item.quantity,
      width_mm: item.width_mm,
      height_mm: item.height_mm,
      depth_mm: item.depth_mm,
      door_style_id: item.door_style_id,
      color_id: item.color_id,
      finish_id: item.finish_id,
      unit_price: item.unit_price,
      total_price: item.total_price,
      configuration: item.configuration,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    // 7. Create payment record
    if (paymentMethod && paymentMethod !== 'quote_request') {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          checkout_id: checkoutId,
          amount: paymentMethod === 'bank_transfer' ? totalAmount * 0.20 : totalAmount, // 20% deposit for bank transfer
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'stripe' ? 'completed' : 'pending',
          external_payment_id: paymentReference,
          currency: 'AUD',
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      }
    }

    // 8. Generate payment schedules (20/80 split for bank transfer and quote)
    if (paymentMethod === 'bank_transfer' || paymentMethod === 'quote_request') {
      try {
        await supabase.rpc('generate_milestone_invoices', {
          p_order_id: order.id
        });
      } catch (error) {
        console.error('Error generating payment schedules:', error);
        // Non-critical, continue
      }
    }

    // 9. Update checkout status
    await supabase
      .from('checkouts')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', checkoutId);

    // 10. Update cart status
    await supabase
      .from('carts')
      .update({ 
        lifecycle_state: 'converted',
        is_primary: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', checkout.cart_id);

    // 11. Send confirmation email
    try {
      await supabase.functions.invoke('send-order-confirmation', {
        body: { orderId: order.id }
      });
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Non-critical, continue
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
