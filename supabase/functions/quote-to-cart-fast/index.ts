import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
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
    const startTime = Date.now();
    const { quote_id, selected_item_ids } = await req.json();
    
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

    console.log(`Fast quote-to-cart conversion for quote: ${quote_id}, user: ${user.id}`);
    
    // Single query to get quote and items
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        user_id,
        quote_items!inner (
          id,
          cabinet_type_id,
          quantity,
          width_mm,
          height_mm,
          depth_mm,
          unit_price,
          total_price,
          configuration,
          door_style_id,
          color_id,
          finish_id
        )
      `)
      .eq('id', quote_id)
      .eq('user_id', user.id)
      .single();

    if (quoteError || !quote) {
      throw new Error('Quote not found or access denied');
    }

    // Filter selected items
    const selectedItems = quote.quote_items.filter(item => 
      selected_item_ids ? selected_item_ids.includes(item.id) : true
    );

    if (selectedItems.length === 0) {
      throw new Error('No items selected');
    }

    // Get the existing active cart for the user (don't create new ones)
    const { data: existingCart, error: cartError } = await supabase
      .from('carts')
      .select('id, total_amount')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cartError) {
      throw cartError;
    }

    let cartId;
    let currentTotal = 0;

    if (existingCart) {
      cartId = existingCart.id;
      currentTotal = Number(existingCart.total_amount) || 0;
      console.log(`Using existing cart: ${cartId} with current total: ${currentTotal}`);
    } else {
      // Only create new cart if none exists
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: user.id,
          name: `Quote ${quote.quote_number}`,
          source: 'quote_conversion',
          total_amount: 0,
          status: 'active'
        })
        .select('id, total_amount')
        .single();
      
      if (createError) throw createError;
      cartId = newCart.id;
      currentTotal = 0;
      console.log(`Created new cart: ${cartId}`);
    }

    // Get existing cart items to check for duplicates
    const { data: existingCartItems, error: existingError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId);

    if (existingError) {
      throw existingError;
    }

    // Process each selected item - update quantity if duplicate exists, or create new
    let totalItemsAdded = 0;
    let totalAmountAdded = 0;

    for (const item of selectedItems) {
      // Check for existing item with same configuration
      const existingItem = existingCartItems?.find(existing => 
        existing.cabinet_type_id === item.cabinet_type_id &&
        existing.width_mm === item.width_mm &&
        existing.height_mm === item.height_mm &&
        existing.depth_mm === item.depth_mm &&
        existing.door_style_id === item.door_style_id &&
        existing.color_id === item.color_id &&
        existing.finish_id === item.finish_id &&
        JSON.stringify(existing.configuration) === JSON.stringify(item.configuration)
      );

      if (existingItem) {
        // Update existing item quantity and total
        const newQuantity = existingItem.quantity + item.quantity;
        const newTotalPrice = item.unit_price * newQuantity;

        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            total_price: newTotalPrice,
            notes: `Updated from quote ${quote.quote_number}`
          })
          .eq('id', existingItem.id);

        if (updateError) {
          throw updateError;
        }

        totalAmountAdded += item.total_price; // Add the new amount
        console.log(`Updated existing cart item ${existingItem.id}: qty ${existingItem.quantity} -> ${newQuantity}`);
      } else {
        // Create new cart item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
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
          });

        if (insertError) {
          throw insertError;
        }

        totalAmountAdded += item.total_price;
        totalItemsAdded++;
        console.log(`Created new cart item for ${item.cabinet_type_id}`);
      }
    }

    // Calculate new total
    const newTotal = currentTotal + totalAmountAdded;
    
    console.log(`Updating cart total: ${currentTotal} + ${totalAmountAdded} = ${newTotal}`);
    
    const { error: updateError } = await supabase
      .from('carts')
      .update({ 
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId);

    if (updateError) {
      console.error('Error updating cart total:', updateError);
      throw updateError;
    }

    const processingTime = Date.now() - startTime;
    console.log(`Successfully processed ${selectedItems.length} items to cart ${cartId} (${totalItemsAdded} new, ${selectedItems.length - totalItemsAdded} merged) in ${processingTime}ms`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Items successfully added to cart',
      cart_id: cartId,
      items_added: selectedItems.length,
      processing_time_ms: processingTime
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