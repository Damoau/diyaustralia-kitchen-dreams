import { supabase } from '@/integrations/supabase/client';

export interface CartDiagnostic {
  cartId: string;
  userId?: string;
  sessionId?: string;
  totalAmount: number;
  status: string;
  actualItemCount: number;
  dbItemCount: number;
  lastUpdated: string;
  issues: string[];
}

export const runCartDiagnostic = async (userId?: string, sessionId?: string): Promise<CartDiagnostic[]> => {
  console.log('🔧 Running cart diagnostic for:', { userId, sessionId });
  
  try {
    let query = supabase
      .from('carts')
      .select(`
        id, user_id, session_id, total_amount, status, updated_at,
        cart_items (
          id, cart_id, quantity, unit_price, total_price
        )
      `)
      .eq('status', 'active');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    const { data: carts, error } = await query.order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    const diagnostics: CartDiagnostic[] = carts?.map(cart => {
      const issues: string[] = [];
      const actualItemCount = cart.cart_items?.length || 0;
      const dbItemCount = cart.cart_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const calculatedTotal = cart.cart_items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
      
      // Check for inconsistencies
      if (cart.total_amount > 0 && actualItemCount === 0) {
        issues.push(`Cart shows total of $${cart.total_amount} but has no items`);
      }
      
      if (Math.abs(cart.total_amount - calculatedTotal) > 0.01) {
        issues.push(`Cart total mismatch: stored=$${cart.total_amount}, calculated=$${calculatedTotal}`);
      }
      
      if (actualItemCount === 0 && cart.total_amount === 0) {
        issues.push('Empty cart - this is normal');
      }
      
      return {
        cartId: cart.id,
        userId: cart.user_id,
        sessionId: cart.session_id,
        totalAmount: cart.total_amount,
        status: cart.status,
        actualItemCount,
        dbItemCount,
        lastUpdated: cart.updated_at,
        issues
      };
    }) || [];
    
    console.log('🔧 Cart diagnostic results:', diagnostics);
    return diagnostics;
    
  } catch (error) {
    console.error('🔧 Cart diagnostic failed:', error);
    throw error;
  }
};

export const fixCartInconsistencies = async (cartId: string): Promise<boolean> => {
  console.log('🔧 Fixing cart inconsistencies for:', cartId);
  
  try {
    // Recalculate cart total based on items
    const { data: items } = await supabase
      .from('cart_items')
      .select('total_price')
      .eq('cart_id', cartId);
    
    const correctTotal = items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    
    // Update cart with correct total
    const { error } = await supabase
      .from('carts')
      .update({ 
        total_amount: correctTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId);
    
    if (error) throw error;
    
    console.log('🔧 Cart fixed - new total:', correctTotal);
    return true;
    
  } catch (error) {
    console.error('🔧 Failed to fix cart:', error);
    return false;
  }
};

// Workflow simulation functions
export const simulateCheckoutWorkflow = async (userId?: string): Promise<{
  success: boolean;
  steps: Array<{ step: string; status: 'pass' | 'fail'; message: string; data?: any }>;
}> => {
  const steps: Array<{ step: string; status: 'pass' | 'fail'; message: string; data?: any }> = [];
  
  try {
    // Step 1: Load cart
    const sessionId = !userId ? sessionStorage.getItem('cart_session_id') : undefined;
    
    steps.push({
      step: 'Initialize Cart Context',
      status: 'pass',
      message: `Context: ${userId ? `User ${userId}` : `Session ${sessionId}`}`
    });
    
    // Step 2: Fetch cart data
    let query = supabase
      .from('carts')
      .select(`
        id, user_id, session_id, total_amount, status,
        cart_items (id, quantity, total_price)
      `)
      .eq('status', 'active');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      steps.push({
        step: 'Load Cart',
        status: 'fail',
        message: 'No user ID or session ID available'
      });
      return { success: false, steps };
    }
    
    const { data: cart, error } = await query.maybeSingle();
    
    if (error) {
      steps.push({
        step: 'Load Cart',
        status: 'fail',
        message: `Database error: ${error.message}`
      });
      return { success: false, steps };
    }
    
    if (!cart) {
      steps.push({
        step: 'Load Cart',
        status: 'fail',
        message: 'No active cart found'
      });
      return { success: false, steps };
    }
    
    steps.push({
      step: 'Load Cart',
      status: 'pass',
      message: `Cart loaded: ID=${cart.id}, Total=$${cart.total_amount}`,
      data: { cartId: cart.id, total: cart.total_amount, itemCount: cart.cart_items?.length }
    });
    
    // Step 3: Validate cart has items
    const hasItems = cart.cart_items && cart.cart_items.length > 0;
    const actualTotal = cart.cart_items?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    
    if (!hasItems) {
      steps.push({
        step: 'Validate Cart Items',
        status: 'fail',
        message: `Cart appears empty: ${cart.cart_items?.length || 0} items found`,
        data: { cartItems: cart.cart_items }
      });
    } else {
      steps.push({
        step: 'Validate Cart Items',
        status: 'pass',
        message: `Cart has ${cart.cart_items.length} items`,
        data: { itemCount: cart.cart_items.length }
      });
    }
    
    // Step 4: Verify total consistency
    if (Math.abs(cart.total_amount - actualTotal) > 0.01) {
      steps.push({
        step: 'Validate Cart Total',
        status: 'fail',
        message: `Total mismatch: stored=$${cart.total_amount}, calculated=$${actualTotal}`,
        data: { storedTotal: cart.total_amount, calculatedTotal: actualTotal }
      });
    } else {
      steps.push({
        step: 'Validate Cart Total',
        status: 'pass',
        message: `Cart totals match: $${cart.total_amount}`
      });
    }
    
    // Step 5: Simulate checkout creation
    if (hasItems && Math.abs(cart.total_amount - actualTotal) <= 0.01) {
      steps.push({
        step: 'Checkout Validation',
        status: 'pass',
        message: 'Cart is ready for checkout'
      });
      return { success: true, steps };
    } else {
      steps.push({
        step: 'Checkout Validation',
        status: 'fail',
        message: 'Cart failed validation - checkout would fail'
      });
      return { success: false, steps };
    }
    
  } catch (error: any) {
    steps.push({
      step: 'Workflow Error',
      status: 'fail',
      message: `Unexpected error: ${error.message}`
    });
    return { success: false, steps };
  }
};