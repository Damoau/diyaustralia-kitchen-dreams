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

    console.log(`Cart cleanup for user: ${user.id}`);

    // Find all active carts for the user
    const { data: activeCarts, error: cartsError } = await supabase
      .from('carts')
      .select('id, created_at, total_amount, name, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (cartsError) {
      throw cartsError;
    }

    let cleanupActions = [];

    if (!activeCarts || activeCarts.length === 0) {
      console.log('No active carts found');
      return new Response(JSON.stringify({ 
        message: 'No active carts found',
        actions_taken: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (activeCarts.length === 1) {
      // Recalculate the single cart's total
      const cart = activeCarts[0];
      
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('total_price')
        .eq('cart_id', cart.id);

      if (itemsError) {
        throw itemsError;
      }

      const calculatedTotal = cartItems?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;
      const storedTotal = Number(cart.total_amount) || 0;

      if (Math.abs(calculatedTotal - storedTotal) > 0.01) {
        console.log(`Fixing cart ${cart.id} total: ${storedTotal} -> ${calculatedTotal}`);
        
        const { error: updateError } = await supabase
          .from('carts')
          .update({ 
            total_amount: calculatedTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', cart.id);

        if (updateError) {
          throw updateError;
        }

        cleanupActions.push({
          type: 'total_fixed',
          cart_id: cart.id,
          old_total: storedTotal,
          new_total: calculatedTotal
        });
      }
    } else {
      // Multiple active carts - keep the most recent, deactivate others
      const [keepCart, ...deactivateCarts] = activeCarts;
      
      console.log(`Found ${activeCarts.length} active carts. Keeping ${keepCart.id}, deactivating ${deactivateCarts.length} others`);

      // Deactivate old carts
      const oldCartIds = deactivateCarts.map(cart => cart.id);
      
      const { error: deactivateError } = await supabase
        .from('carts')
        .update({ 
          status: 'abandoned',
          abandon_reason: 'Multiple active carts cleanup - kept most recent',
          abandoned_at: new Date().toISOString()
        })
        .in('id', oldCartIds);

      if (deactivateError) {
        throw deactivateError;
      }

      cleanupActions.push({
        type: 'multiple_carts_cleaned',
        kept_cart_id: keepCart.id,
        deactivated_cart_ids: oldCartIds,
        deactivated_count: oldCartIds.length
      });

      // Also fix the kept cart's total
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('total_price')
        .eq('cart_id', keepCart.id);

      if (itemsError) {
        throw itemsError;
      }

      const calculatedTotal = cartItems?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;
      const storedTotal = Number(keepCart.total_amount) || 0;

      if (Math.abs(calculatedTotal - storedTotal) > 0.01) {
        console.log(`Fixing kept cart ${keepCart.id} total: ${storedTotal} -> ${calculatedTotal}`);
        
        const { error: updateError } = await supabase
          .from('carts')
          .update({ 
            total_amount: calculatedTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', keepCart.id);

        if (updateError) {
          throw updateError;
        }

        cleanupActions.push({
          type: 'total_fixed',
          cart_id: keepCart.id,
          old_total: storedTotal,
          new_total: calculatedTotal
        });
      }
    }

    console.log(`Cart cleanup completed. Actions taken:`, cleanupActions);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cart cleanup completed',
      actions_taken: cleanupActions,
      user_id: user.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cart cleanup:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
