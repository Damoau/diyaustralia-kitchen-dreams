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

    console.log(`Cart consolidation for user: ${user.id}`);

    // Find the user's active cart with items
    const { data: userCarts, error: userCartsError } = await supabase
      .from('carts')
      .select(`
        id, name, total_amount, status, created_at,
        cart_items (id)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (userCartsError) {
      console.error('Error fetching user carts:', userCartsError);
      throw new Error('Failed to fetch user carts');
    }

    // Separate carts by content
    const emptyCarts = userCarts.filter(cart => cart.cart_items.length === 0);
    const cartsWithItems = userCarts.filter(cart => cart.cart_items.length > 0);
    const primaryCart = cartsWithItems.length > 0 ? cartsWithItems[0] : null;

    console.log(`Found ${userCarts.length} active carts: ${emptyCarts.length} empty, ${cartsWithItems.length} with items`);

    let actions = [];

    // Deactivate empty carts in batches to avoid URI length limits
    if (emptyCarts.length > 0) {
      const batchSize = 50; // Process in smaller batches
      let totalDeactivated = 0;
      
      for (let i = 0; i < emptyCarts.length; i += batchSize) {
        const batch = emptyCarts.slice(i, i + batchSize);
        const { error: deactivateError } = await supabase
          .from('carts')
          .update({ 
            status: 'inactive',
            abandon_reason: 'Consolidated - duplicate empty cart',
            abandoned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', batch.map(cart => cart.id));

        if (deactivateError) {
          console.error(`Error deactivating batch ${i / batchSize + 1}:`, deactivateError);
        } else {
          totalDeactivated += batch.length;
          console.log(`Deactivated batch of ${batch.length} empty carts`);
        }
      }
      
      if (totalDeactivated > 0) {
        actions.push(`Deactivated ${totalDeactivated} empty carts`);
        console.log(`Total deactivated: ${totalDeactivated} empty carts`);
      }
    }

    // Handle multiple carts with items - keep only the most recent one
    if (cartsWithItems.length > 1) {
      // Keep the most recent cart with items, deactivate others
      const [keepCart, ...deactivateCarts] = cartsWithItems;
      
      for (const cart of deactivateCarts) {
        const { error: deactivateError } = await supabase
          .from('carts')
          .update({ 
            status: 'inactive',
            abandon_reason: 'Consolidated - multiple carts with items',
            abandoned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', cart.id);

        if (!deactivateError) {
          actions.push(`Deactivated duplicate cart with ${cart.cart_items.length} items`);
        }
      }
    }

    // If there's a primary cart with items, recalculate its total
    if (primaryCart) {
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('total_price')
        .eq('cart_id', primaryCart.id);

      if (!itemsError && cartItems) {
        const calculatedTotal = cartItems.reduce((sum, item) => sum + Number(item.total_price), 0);
        
        if (Math.abs(calculatedTotal - Number(primaryCart.total_amount)) > 0.01) {
          const { error: updateError } = await supabase
            .from('carts')
            .update({ 
              total_amount: calculatedTotal,
              updated_at: new Date().toISOString()
            })
            .eq('id', primaryCart.id);

          if (!updateError) {
            actions.push(`Updated cart total from $${primaryCart.total_amount} to $${calculatedTotal}`);
            console.log(`Updated cart ${primaryCart.id} total to $${calculatedTotal}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cart consolidation completed',
        actions,
        activeCartId: primaryCart?.id || null,
        itemCount: primaryCart?.cart_items.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in cart-consolidation:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to consolidate carts'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});