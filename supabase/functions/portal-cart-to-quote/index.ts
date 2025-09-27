import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartItem {
  cabinet_type_id: string;
  door_style_id: string;
  color_id: string;
  finish_id: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  quantity: number;
  unit_price: number;
  configuration: any;
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

    const { action, quote_id, cart_items }: { action: string; quote_id?: string; cart_items: CartItem[] } = await req.json();
    console.log(`Cart-to-quote action: ${action} for user: ${user.id}`);

    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      throw new Error('No cart items provided');
    }

    let quoteId = quote_id;
    let result;

    switch (action) {
      case 'create_new':
        result = await createNewQuote();
        break;
      case 'add_to_existing':
        if (!quote_id) throw new Error('Quote ID required for add_to_existing action');
        result = await addToExistingQuote(quote_id);
        break;
      case 'replace_quote':
        if (!quote_id) throw new Error('Quote ID required for replace_quote action');
        result = await replaceQuote(quote_id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    async function createNewQuote() {
      console.log(`Creating new quote with ${cart_items.length} items`);
      
      // Calculate totals
      const subtotal = cart_items.reduce((sum: number, item: CartItem) => sum + (item.quantity * item.unit_price), 0);
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
          notes: 'Quote created from cart items',
          customer_email: user!.email,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (quoteError) throw quoteError;
      quoteId = quote.id;

      // Add items to quote
      const quoteItems = cart_items.map((item: CartItem) => ({
        quote_id: quoteId,
        cabinet_type_id: item.cabinet_type_id,
        door_style_id: item.door_style_id,
        color_id: item.color_id,
        finish_id: item.finish_id,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        depth_mm: item.depth_mm,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        notes: `Added from cart`,
        configuration: item.configuration
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      console.log(`Successfully created new quote ${quote.quote_number} with ${cart_items.length} items`);
      return { quote_number: quote.quote_number, action: 'created', items_count: cart_items.length };
    }

    async function addToExistingQuote(targetQuoteId: string) {
      console.log(`Adding ${cart_items.length} items to existing quote ${targetQuoteId}`);

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

      // Add items to quote
      const quoteItems = cart_items.map((item: CartItem) => ({
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
        total_price: item.quantity * item.unit_price,
        notes: `Added from cart to ${existingQuote.quote_number}`,
        configuration: item.configuration
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      console.log(`Successfully added ${cart_items.length} items to quote ${existingQuote.quote_number}`);
      return { quote_number: existingQuote.quote_number, action: 'added', items_count: cart_items.length };
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
      const quoteItems = cart_items.map((item: CartItem) => ({
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
        total_price: item.quantity * item.unit_price,
        notes: `Replaced items in ${existingQuote.quote_number}`,
        configuration: item.configuration
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      console.log(`Successfully replaced quote ${existingQuote.quote_number} with ${cart_items.length} items`);
      return { quote_number: existingQuote.quote_number, action: 'replaced', items_count: cart_items.length };
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