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

    console.log(`Enhanced cart consolidation for user: ${user.id}`);

    // Use the new enhanced cart consolidation function
    const { data: consolidationResults, error: consolidationError } = await supabase
      .rpc('enhanced_cart_consolidation', { p_user_id: user.id });

    if (consolidationError) {
      console.error('Error in enhanced cart consolidation:', consolidationError);
      throw new Error('Failed to consolidate carts');
    }

    // Process results and format actions
    const actions = [];
    let primaryCartId = null;
    let itemCount = 0;

    for (const result of consolidationResults || []) {
      actions.push(result.details);
      if (result.action === 'primary_set' && result.details.includes('Primary cart:')) {
        const cartIdMatch = result.details.match(/Primary cart: ([a-f0-9-]+)/);
        if (cartIdMatch) {
          primaryCartId = cartIdMatch[1];
        }
      }
    }

    // Get the primary cart details if we have one
    if (primaryCartId && primaryCartId !== 'none') {
      const { data: primaryCart } = await supabase
        .from('carts')
        .select(`
          id, total_amount,
          cart_items (id)
        `)
        .eq('id', primaryCartId)
        .single();

      if (primaryCart) {
        itemCount = primaryCart.cart_items?.length || 0;
        
        // Recalculate and update cart total if needed
        if (itemCount > 0) {
          const { data: cartItems } = await supabase
            .from('cart_items')
            .select('total_price')
            .eq('cart_id', primaryCartId);

          if (cartItems) {
            const calculatedTotal = cartItems.reduce((sum, item) => sum + Number(item.total_price), 0);
            
            if (Math.abs(calculatedTotal - Number(primaryCart.total_amount)) > 0.01) {
              await supabase
                .from('carts')
                .update({ 
                  total_amount: calculatedTotal,
                  last_activity_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', primaryCartId);

              actions.push(`Updated cart total to $${calculatedTotal.toFixed(2)}`);
            }
          }
        }
      }
    }

    console.log('Enhanced consolidation completed:', actions);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Enhanced cart consolidation completed',
        actions,
        activeCartId: primaryCartId === 'none' ? null : primaryCartId,
        itemCount,
        consolidationType: 'enhanced'
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