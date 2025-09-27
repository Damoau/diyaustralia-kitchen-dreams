import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set the auth context
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Parse request body with correct parameter names matching frontend
    const { 
      cart_id, 
      customer_email, 
      notes, 
      existing_quote_id, 
      quote_name, 
      replace_items 
    } = await req.json();
    
    console.log(`Cart-to-quote conversion for user: ${user.id}, cart: ${cart_id}`);

    if (!cart_id) {
      throw new Error('Cart ID is required');
    }

    // Fetch cart items from database - handle both user and session carts
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select(`
        id, name, total_amount, status, user_id, session_id,
        cart_items (
          id, cabinet_type_id, door_style_id, color_id, finish_id,
          width_mm, height_mm, depth_mm, quantity, unit_price, total_price,
          configuration, notes
        )
      `)
      .eq('id', cart_id)
      .single();

    // Verify cart ownership - either by user_id or by session_id for anonymous users
    if (cartError || !cartData) {
      console.error('Error fetching cart:', cartError);
      throw new Error('Cart not found');
    }

    if (cartData.user_id && cartData.user_id !== user.id) {
      throw new Error('Cart access denied - user mismatch');
    }

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      throw new Error('Cart not found or access denied');
    }

    if (!cartData.cart_items || cartData.cart_items.length === 0) {
      throw new Error('Cart is empty');
    }

    const cart_items = cartData.cart_items;
    console.log(`Found cart with ${cart_items.length} items, total: $${cartData.total_amount}`);

    // Determine action based on parameters
    let action = 'create_new';
    let targetQuoteId = existing_quote_id;
    
    if (existing_quote_id) {
      action = replace_items ? 'replace_quote' : 'add_to_existing';
    }

    console.log(`Action determined: ${action}, target quote: ${targetQuoteId || 'new'}`);

    let result;
    switch (action) {
      case 'create_new':
        result = await createNewQuote();
        break;
      case 'add_to_existing':
        result = await addToExistingQuote(targetQuoteId!);
        break;
      case 'replace_quote':
        result = await replaceQuote(targetQuoteId!);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    async function createNewQuote() {
      console.log(`Creating new quote with ${cart_items.length} items`);
      
      // Calculate totals from cart items
      const subtotal = cart_items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
      const tax_amount = subtotal * 0.1;
      const total_amount = subtotal + tax_amount;

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user!.id,
          status: 'draft',
          subtotal,
          tax_amount,
          total_amount,
          notes: notes || 'Quote created from cart items',
          customer_email: customer_email || user!.email,
          customer_name: quote_name || 'Cart Quote',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Add items to quote
      const quoteItems = cart_items.map((item: any, index: number) => ({
        quote_id: quote.id,
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
        notes: item.notes || 'Added from cart',
        item_name: item.cabinet_type_id ? `Cabinet Item ${index + 1}` : `Item ${index + 1}`,
        configuration: item.configuration
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      console.log(`Successfully created new quote ${quote.quote_number} with ${cart_items.length} items`);
      return { 
        quote_id: quote.id,
        quote_number: quote.quote_number, 
        total_amount: quote.total_amount,
        action: 'created', 
        items_count: cart_items.length 
      };
    }

    async function addToExistingQuote(targetQuoteId: string) {
      console.log(`Adding ${cart_items.length} items to existing quote ${targetQuoteId}`);

      // Verify quote exists and belongs to user
      const { data: existingQuote, error: quoteError } = await supabase
        .from('quotes')
        .select('id, quote_number, user_id, subtotal, tax_amount, total_amount')
        .eq('id', targetQuoteId)
        .eq('user_id', user!.id)
        .single();

      if (quoteError || !existingQuote) {
        throw new Error('Quote not found or access denied');
      }

      // Add items to quote
      const quoteItems = cart_items.map((item: any, index: number) => ({
        quote_id: targetQuoteId,
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
        notes: item.notes || `Added from cart to ${existingQuote.quote_number}`,
        item_name: item.cabinet_type_id ? `Cabinet Item ${index + 1}` : `Item ${index + 1}`,
        configuration: item.configuration
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      // Update quote totals
      const newSubtotal = cart_items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
      const updatedSubtotal = existingQuote.subtotal + newSubtotal;
      const updatedTaxAmount = updatedSubtotal * 0.1;
      const updatedTotalAmount = updatedSubtotal + updatedTaxAmount;

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          subtotal: updatedSubtotal,
          tax_amount: updatedTaxAmount,
          total_amount: updatedTotalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetQuoteId);

      if (updateError) throw updateError;

      console.log(`Successfully added ${cart_items.length} items to quote ${existingQuote.quote_number}`);
      return { 
        quote_id: targetQuoteId,
        quote_number: existingQuote.quote_number, 
        total_amount: updatedTotalAmount,
        action: 'added', 
        items_count: cart_items.length 
      };
    }

    async function replaceQuote(targetQuoteId: string) {
      console.log(`Replacing quote ${targetQuoteId} with ${cart_items.length} items`);

      // Verify quote exists and belongs to user
      const { data: existingQuote, error: quoteError } = await supabase
        .from('quotes')
        .select('id, quote_number, user_id')
        .eq('id', targetQuoteId)
        .eq('user_id', user!.id)
        .single();

      if (quoteError || !existingQuote) {
        throw new Error('Quote not found or access denied');
      }

      // Delete existing quote items
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', targetQuoteId);

      if (deleteError) throw deleteError;

      // Add new items to quote
      const quoteItems = cart_items.map((item: any, index: number) => ({
        quote_id: targetQuoteId,
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
        notes: item.notes || `Replaced items in ${existingQuote.quote_number}`,
        item_name: item.cabinet_type_id ? `Cabinet Item ${index + 1}` : `Item ${index + 1}`,
        configuration: item.configuration
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      // Update quote totals
      const subtotal = cart_items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
      const tax_amount = subtotal * 0.1;
      const total_amount = subtotal + tax_amount;

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          subtotal,
          tax_amount,
          total_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetQuoteId);

      if (updateError) throw updateError;

      console.log(`Successfully replaced quote ${existingQuote.quote_number} with ${cart_items.length} items`);
      return { 
        quote_id: targetQuoteId,
        quote_number: existingQuote.quote_number, 
        total_amount,
        action: 'replaced', 
        items_count: cart_items.length 
      };
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in portal-cart-to-quote:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to process cart to quote conversion'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});