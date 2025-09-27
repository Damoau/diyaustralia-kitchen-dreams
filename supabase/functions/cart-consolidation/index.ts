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

    // Find cart with items
    const cartWithItems = userCarts.find(cart => cart.cart_items.length > 0);
    const emptyCarts = userCarts.filter(cart => cart.cart_items.length === 0);

    console.log(`Found ${userCarts.length} active carts, ${emptyCarts.length} empty carts`);

    let actions = [];

    // Deactivate empty carts
    if (emptyCarts.length > 0) {
      const { error: deactivateError } = await supabase
        .from('carts')
        .update({ 
          status: 'inactive',
          abandon_reason: 'Consolidated - duplicate empty cart',
          abandoned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', emptyCarts.map(cart => cart.id));

      if (deactivateError) {
        console.error('Error deactivating empty carts:', deactivateError);
      } else {
        actions.push(`Deactivated ${emptyCarts.length} empty carts`);
        console.log(`Deactivated ${emptyCarts.length} empty carts`);
      }
    }

    // If there's a cart with items, recalculate its total
    if (cartWithItems) {
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('total_price')
        .eq('cart_id', cartWithItems.id);

      if (!itemsError && cartItems) {
        const calculatedTotal = cartItems.reduce((sum, item) => sum + Number(item.total_price), 0);
        
        if (Math.abs(calculatedTotal - Number(cartWithItems.total_amount)) > 0.01) {
          const { error: updateError } = await supabase
            .from('carts')
            .update({ 
              total_amount: calculatedTotal,
              updated_at: new Date().toISOString()
            })
            .eq('id', cartWithItems.id);

          if (!updateError) {
            actions.push(`Updated cart total from $${cartWithItems.total_amount} to $${calculatedTotal}`);
            console.log(`Updated cart ${cartWithItems.id} total to $${calculatedTotal}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cart consolidation completed',
        actions,
        activeCartId: cartWithItems?.id || null,
        itemCount: cartWithItems?.cart_items.length || 0
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