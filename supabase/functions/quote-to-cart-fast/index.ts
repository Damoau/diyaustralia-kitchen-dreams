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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote_id } = await req.json();
    
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

    console.log(`Processing quote to cart conversion for quote: ${quote_id}, user: ${user.id}`);
    
    // Get quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (*)
      `)
      .eq('id', quote_id)
      .eq('user_id', user.id)
      .single();

    if (quoteError || !quote) {
      throw new Error('Quote not found or access denied');
    }

    // Get or create cart
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cart) {
      // Create new cart
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: user.id,
          name: `Quote ${quote.quote_number}`,
          source: 'quote_conversion',
          total_amount: 0,
          status: 'active'
        })
        .select('id')
        .single();

      if (createError) throw createError;
      cart = newCart;
    }

    // Prepare cart items (excluding fields that don't exist in cart_items table)
    const cartItems = quote.quote_items.map((item: any) => ({
      cart_id: cart!.id,
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
      finish_id: item.finish_id,
      notes: `Added from quote ${quote.quote_number}`
    }));

    // Bulk insert cart items
    const { error: itemsError } = await supabase
      .from('cart_items')
      .insert(cartItems);

    if (itemsError) {
      console.error('Error inserting cart items:', itemsError);
      throw itemsError;
    }

    // Update cart total
    const cartTotal = quote.quote_items.reduce((sum: number, item: any) => sum + item.total_price, 0);
    const { error: updateError } = await supabase
      .from('carts')
      .update({ 
        total_amount: cartTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', cart!.id);

    if (updateError) {
      console.error('Error updating cart total:', updateError);
      throw updateError;
    }

    console.log(`Successfully added ${quote.quote_items.length} items to cart ${cart.id}`);

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Items successfully added to cart',
      cart_id: cart.id,
      items_added: quote.quote_items.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in quote-to-cart-fast:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});