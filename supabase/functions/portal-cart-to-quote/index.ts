import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartToQuoteRequest {
  cart_id: string;
  customer_email?: string; // For impersonation mode
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method === 'POST') {
      const { cart_id, customer_email, notes }: CartToQuoteRequest = await req.json();

      if (!cart_id) {
        throw new Error('Cart ID is required');
      }

      // Get cart with items
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            *,
            cabinet_types (
              name,
              category,
              product_image_url
            ),
            door_styles (
              name,
              image_url
            ),
            colors (
              name,
              hex_code
            ),
            finishes (
              name
            )
          )
        `)
        .eq('id', cart_id)
        .single();

      if (cartError || !cart) {
        throw new Error('Cart not found or access denied');
      }

      if (!cart.cart_items || cart.cart_items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Determine user ID - either from cart or find by email for impersonation
      let userId = cart.user_id;
      
      if (customer_email && !userId) {
        // Look up user by email for impersonation mode
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          throw new Error('Error looking up user');
        }

        const user = userData.users.find(u => u.email === customer_email);
        if (user) {
          userId = user.id;
        } else {
          throw new Error('Customer not found');
        }
      }

      if (!userId) {
        throw new Error('User ID could not be determined');
      }

      // Calculate totals
      const subtotal = cart.cart_items.reduce((sum: number, item: any) => sum + item.total_price, 0);
      const taxAmount = subtotal * 0.10; // 10% GST
      const totalAmount = subtotal + taxAmount;

      // Generate quote number
      const { data: quoteNumber } = await supabase.rpc('generate_quote_number');

      // Create quote
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: userId,
          quote_number: quoteNumber,
          status: 'draft',
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          notes: notes || `Quote created from cart items`
        })
        .select()
        .single();

      if (quoteError) {
        throw quoteError;
      }

      // Create quote items from cart items
      const quoteItems = cart.cart_items.map((item: any) => ({
        quote_id: newQuote.id,
        cabinet_type_id: item.cabinet_type_id,
        door_style_id: item.door_style_id,
        color_id: item.color_id,
        finish_id: item.finish_id,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        depth_mm: item.depth_mm,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        configuration: item.configuration
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) {
        throw itemsError;
      }

      // Update cart to mark as converted
      await supabase
        .from('carts')
        .update({
          converted_quote_id: newQuote.id,
          status: 'converted'
        })
        .eq('id', cart_id);

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: userId,
        p_scope: 'cart_conversion',
        p_scope_id: newQuote.id,
        p_action: 'converted_to_quote',
        p_after_data: JSON.stringify({
          quote_id: newQuote.id,
          cart_id: cart_id,
          customer_email: customer_email,
          items_count: cart.cart_items.length,
          total_amount: totalAmount
        })
      });

      console.log(`Cart ${cart_id} converted to quote ${newQuote.id} for user ${userId}`);

      return new Response(JSON.stringify({ 
        success: true, 
        quote_id: newQuote.id,
        quote_number: quoteNumber,
        total_amount: totalAmount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error in portal-cart-to-quote:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});