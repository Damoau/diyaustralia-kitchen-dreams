import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartToQuoteRequest {
  cart_id: string;
  customer_email?: string; // For impersonation mode
  notes?: string;
  existing_quote_id?: string; // Add to existing quote
  quote_name?: string; // Custom name for new quote
  replace_items?: boolean; // Replace all existing items in quote instead of adding
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
      const { cart_id, customer_email, notes, existing_quote_id, quote_name, replace_items }: CartToQuoteRequest = await req.json();

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

      // Calculate totals for new items
      const subtotal = cart.cart_items.reduce((sum: number, item: any) => sum + item.total_price, 0);
      const taxAmount = subtotal * 0.10; // 10% GST
      const totalAmount = subtotal + taxAmount;

      let newQuote;
      let quoteNumber;

      if (existing_quote_id) {
        // Adding to existing quote or replacing items
        const { data: existingQuote, error: existingQuoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', existing_quote_id)
          .eq('user_id', userId)
          .single();

        if (existingQuoteError || !existingQuote) {
          throw new Error('Existing quote not found or access denied');
        }

        newQuote = existingQuote;
        quoteNumber = existingQuote.quote_number;

        if (replace_items) {
          // Replace all existing items - delete existing items and update totals to match cart
          console.log('Replacing all items in existing quote');
          
          // Delete existing quote items
          const { error: deleteError } = await supabase
            .from('quote_items')
            .delete()
            .eq('quote_id', existing_quote_id);

          if (deleteError) {
            throw new Error('Failed to clear existing quote items');
          }

          // Update quote totals to match cart totals (replace, not add)
          const { error: updateError } = await supabase
            .from('quotes')
            .update({
              subtotal: subtotal,
              tax_amount: taxAmount, 
              total_amount: totalAmount,
              updated_at: new Date().toISOString(),
              notes: notes ? `${existingQuote.notes || ''}\n\n${notes}`.trim() : existingQuote.notes
            })
            .eq('id', existing_quote_id);

          if (updateError) {
            throw updateError;
          }
        } else {
          // Add to existing quote (original behavior)
          console.log('Adding items to existing quote');
          
          // Update existing quote totals by adding
          const newSubtotal = existingQuote.subtotal + subtotal;
          const newTaxAmount = newSubtotal * 0.10;
          const newTotalAmount = newSubtotal + newTaxAmount;

          const { error: updateError } = await supabase
            .from('quotes')
            .update({
              subtotal: newSubtotal,
              tax_amount: newTaxAmount,
              total_amount: newTotalAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing_quote_id);

          if (updateError) {
            throw updateError;
          }
        }
      } else {
        // Create new quote
        const { data: generatedQuoteNumber } = await supabase.rpc('generate_quote_number');
        quoteNumber = generatedQuoteNumber;

        // Get customer email - either provided or from cart user lookup
        let finalCustomerEmail = customer_email;
        if (!finalCustomerEmail && userId) {
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          finalCustomerEmail = userData.user?.email || 'no-email@example.com';
        }

        const { data: createdQuote, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            user_id: userId,
            customer_email: finalCustomerEmail,
            customer_name: quote_name || null,
            quote_number: quoteNumber,
            status: 'draft',
            subtotal: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: notes || `Quote created from cart items`
          })
          .select()
          .single();

        if (quoteError) {
          throw quoteError;
        }

        newQuote = createdQuote;
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
        configuration: item.configuration,
        notes: item.notes || item.configuration?.notes || null
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

      // Create a new active cart for the user to continue shopping
      await supabase
        .from('carts')
        .insert({
          user_id: userId,
          name: 'My Cabinet Quote',
          status: 'active',
          total_amount: 0
        });

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

      console.log('Cart to quote conversion completed:', {
        quoteId: newQuote.id,
        quoteNumber: quoteNumber,
        totalAmount: existing_quote_id && replace_items ? totalAmount : (existing_quote_id ? newQuote.total_amount : totalAmount),
        itemsCount: cart.cart_items.length,
        operation: existing_quote_id ? (replace_items ? 'replaced_items' : 'added_items') : 'created_new'
      });

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
      error: error instanceof Error ? (error.message || 'Internal server error') : 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});