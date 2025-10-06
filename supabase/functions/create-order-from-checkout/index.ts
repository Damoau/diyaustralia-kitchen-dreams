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

    const { checkoutId, paymentReference, paymentMethod, paymentType = 'full' } = await req.json();

    console.log('Creating order from checkout:', { checkoutId, paymentMethod, paymentType });

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

    // 5. Create order with customer info in shipping_address
    const customerInfo = {
      name: `${checkout.customer_first_name || ''} ${checkout.customer_last_name || ''}`.trim(),
      email: checkout.customer_email,
      phone: checkout.customer_phone,
      company: checkout.customer_company,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: checkout.user_id,
        session_id: checkout.session_id,
        status: 'pending',
        payment_status: paymentType === 'deposit' ? 'partial' : (paymentMethod === 'stripe' ? 'paid' : 'pending'),
        payment_method: paymentMethod,
        payment_type: paymentType,
        subtotal,
        tax_amount: gstAmount,
        total_amount: totalAmount,
        shipping_address: customerInfo,
        shipping_method: 'standard',
        target_completion: defaultDueDate,
        drawings_status: paymentType === 'deposit' ? 'pending_upload' : 'not_required',
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
      const paymentAmount = paymentType === 'deposit' ? totalAmount * 0.20 : totalAmount;
      
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          checkout_id: checkoutId,
          amount: paymentAmount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'stripe' ? 'completed' : 'pending',
          external_payment_id: paymentReference,
          currency: 'AUD',
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      }
    }

    // 8. Generate payment schedules
    if (paymentType === 'deposit') {
      // Create 3-stage payment schedule: 20% deposit, 30% progress, 50% final
      const depositAmount = totalAmount * 0.20;
      const progressAmount = totalAmount * 0.30;
      const finalAmount = totalAmount * 0.50;

      const depositDueDate = new Date();
      depositDueDate.setDate(depositDueDate.getDate() + 7); // 7 days from now

      const paymentSchedules = [
        {
          order_id: order.id,
          schedule_type: 'deposit',
          percentage: 20,
          amount: depositAmount,
          due_date: depositDueDate.toISOString().split('T')[0],
          trigger_event: 'order_created',
          requires_document_approval: false,
          unlocked_at: new Date().toISOString(),
          status: paymentMethod === 'stripe' ? 'paid' : 'pending'
        },
        {
          order_id: order.id,
          schedule_type: 'progress',
          percentage: 30,
          amount: progressAmount,
          due_date: null, // Set after drawing approval
          trigger_event: 'drawings_approved',
          requires_document_approval: true,
          unlocked_at: null, // Locked until drawings approved
          status: 'pending'
        },
        {
          order_id: order.id,
          schedule_type: 'balance',
          percentage: 50,
          amount: finalAmount,
          due_date: null, // Set before delivery
          trigger_event: 'ready_for_delivery',
          requires_document_approval: false,
          unlocked_at: null, // Locked until production complete
          status: 'pending'
        }
      ];

      const { error: schedulesError } = await supabase
        .from('payment_schedules')
        .insert(paymentSchedules);

      if (schedulesError) {
        console.error('Error creating payment schedules:', schedulesError);
      } else {
        console.log('3-stage payment schedule created successfully');
      }
    } else if (paymentMethod === 'bank_transfer' || paymentMethod === 'quote_request') {
      // Legacy: 20/80 split for bank transfer and quote
      try {
        await supabase.rpc('generate_milestone_invoices', {
          p_order_id: order.id
        });
      } catch (error) {
        console.error('Error generating payment schedules:', error);
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
