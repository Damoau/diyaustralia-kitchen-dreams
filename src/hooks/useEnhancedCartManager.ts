import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CartLifecycleInfo {
  id: string;
  name: string;
  total_amount: number;
  item_count: number;
  lifecycle_state: 'active' | 'archived' | 'converted' | 'expired' | 'draft';
  last_activity_at: string;
  is_primary: boolean;
  version_number: number;
  quote_version?: string;
  source_details: any;
}

export interface ConsolidationResult {
  success: boolean;
  actions: string[];
  activeCartId: string | null;
  itemCount: number;
  consolidationType: string;
}

export const useEnhancedCartManager = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cartInfo, setCartInfo] = useState<CartLifecycleInfo | null>(null);
  const [consolidationStatus, setConsolidationStatus] = useState<ConsolidationResult | null>(null);

  // Generate session ID for guest users
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Get primary cart information
  const getPrimaryCart = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_primary_cart', {
        p_user_id: user?.id || null,
        p_session_id: user ? null : getSessionId()
      });

      if (error) {
        console.error('Error getting primary cart:', error);
        return null;
      }

      if (data && data.length > 0) {
        const primaryCart = data[0];
        const cartInfo: CartLifecycleInfo = {
          id: primaryCart.cart_id,
          name: primaryCart.cart_name,
          total_amount: primaryCart.total_amount,
          item_count: primaryCart.item_count,
          lifecycle_state: primaryCart.lifecycle_state as 'active' | 'archived' | 'converted' | 'expired' | 'draft',
          last_activity_at: primaryCart.last_activity_at,
          is_primary: true,
          version_number: 1,
          source_details: {}
        };
        setCartInfo(cartInfo);
        return cartInfo;
      }

      setCartInfo(null);
      return null;
    } catch (error) {
      console.error('Error fetching primary cart:', error);
      return null;
    }
  }, [user?.id, getSessionId]);

  // Enhanced cart consolidation
  const consolidateCarts = useCallback(async (): Promise<ConsolidationResult> => {
    if (!user?.id) {
      throw new Error('User must be authenticated for cart consolidation');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cart-consolidation');
      
      if (error) {
        throw new Error(error.message || 'Failed to consolidate carts');
      }
      
      const result: ConsolidationResult = {
        success: data.success,
        actions: data.actions || [],
        activeCartId: data.activeCartId,
        itemCount: data.itemCount || 0,
        consolidationType: data.consolidationType || 'enhanced'
      };

      setConsolidationStatus(result);
      
      // Refresh cart info after consolidation
      await getPrimaryCart();
      
      if (result.actions.length > 0) {
        toast.success(`Cart cleanup completed: ${result.actions.length} actions taken`);
      }

      return result;
    } catch (error: any) {
      console.error('Cart consolidation failed:', error);
      toast.error('Failed to clean up carts');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getPrimaryCart]);

  // Set a specific cart as primary
  const setPrimaryCart = useCallback(async (cartId: string): Promise<void> => {
    try {
      const { error } = await supabase.rpc('set_primary_cart', { p_cart_id: cartId });
      
      if (error) {
        throw new Error(error.message || 'Failed to set primary cart');
      }
      
      await getPrimaryCart();
      toast.success('Primary cart updated');
    } catch (error: any) {
      console.error('Error setting primary cart:', error);
      toast.error('Failed to update primary cart');
      throw error;
    }
  }, [getPrimaryCart]);

  // Archive a cart
  const archiveCart = useCallback(async (cartId: string, reason?: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('carts')
        .update({ 
          lifecycle_state: 'archived',
          is_primary: false,
          archive_reason: reason || 'Manual archive',
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);
      
      if (error) {
        throw new Error(error.message || 'Failed to archive cart');
      }
      
      await getPrimaryCart();
      toast.success('Cart archived');
    } catch (error: any) {
      console.error('Error archiving cart:', error);
      toast.error('Failed to archive cart');
      throw error;
    }
  }, [getPrimaryCart]);

  // Get cart health metrics
  const getCartHealth = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data: carts, error } = await supabase
        .from('carts')
        .select(`
          id, lifecycle_state, is_primary, last_activity_at,
          cart_items(id)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching cart health:', error);
        return null;
      }

      const metrics = {
        total: carts?.length || 0,
        active: carts?.filter(c => c.lifecycle_state === 'active').length || 0,
        archived: carts?.filter(c => c.lifecycle_state === 'archived').length || 0,
        withItems: carts?.filter(c => c.cart_items.length > 0).length || 0,
        empty: carts?.filter(c => c.cart_items.length === 0).length || 0,
        primary: carts?.filter(c => c.is_primary).length || 0,
        oldEmpty: carts?.filter(c => 
          c.cart_items.length === 0 && 
          c.lifecycle_state === 'active' &&
          new Date(c.last_activity_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0
      };

      return metrics;
    } catch (error) {
      console.error('Error calculating cart health:', error);
      return null;
    }
  }, [user?.id]);

  // Load primary cart on mount
  useEffect(() => {
    if (user?.id) {
      getPrimaryCart();
    }
  }, [user?.id, getPrimaryCart]);

  return {
    cartInfo,
    consolidationStatus,
    isLoading,
    
    // Actions
    consolidateCarts,
    setPrimaryCart,
    archiveCart,
    getPrimaryCart,
    getCartHealth,
    
    // Helpers
    getSessionId,
    
    // State management
    refreshCartInfo: getPrimaryCart,
    clearConsolidationStatus: () => setConsolidationStatus(null)
  };
};