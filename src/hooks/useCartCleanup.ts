import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useCartCleanup = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get cart health metrics
  const getCartHealth = useQuery({
    queryKey: ['cart-health', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get user's cart stats
      const { data: carts, error } = await supabase
        .from('carts')
        .select(`
          id,
          lifecycle_state,
          created_at,
          last_activity_at,
          cart_items (id)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const total_carts = carts.length;
      const active_carts = carts.filter(c => c.lifecycle_state === 'active').length;
      const empty_carts = carts.filter(c => c.cart_items.length === 0).length;
      const old_empty_carts = carts.filter(c => 
        c.cart_items.length === 0 && 
        new Date(c.last_activity_at || c.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;
      
      const health_score = total_carts > 0 ? Math.max(0, 100 - (empty_carts / total_carts) * 100) : 100;

      return {
        total_carts,
        active_carts,
        empty_carts,
        old_empty_carts,
        health_score: Math.round(health_score)
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000 // 30 seconds
  });

  // Clean up empty and old carts
  const cleanupCarts = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Starting cart cleanup for user:', user.id);

      // Call the enhanced cart consolidation function
      const { data, error } = await supabase.functions.invoke('cart-consolidation', {
        body: { user_id: user.id }
      });

      if (error) {
        console.error('Cart cleanup failed:', error);
        throw new Error(error.message || 'Cart cleanup failed');
      }

      console.log('Cart cleanup completed:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Cart cleanup successful:', data);
      queryClient.invalidateQueries({ queryKey: ['cart-health'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      const actions = data?.actions || [];
      if (actions.length > 0) {
        toast.success(`Cart cleanup completed: ${actions.join(', ')}`);
      } else {
        toast.success('Cart system is already optimized');
      }
    },
    onError: (error: any) => {
      console.error('Cart cleanup failed:', error);
      toast.error(error.message || 'Failed to clean up carts');
    }
  });

  return {
    cartHealth: getCartHealth.data,
    isLoadingHealth: getCartHealth.isLoading,
    refreshHealth: getCartHealth.refetch,
    cleanupCarts: cleanupCarts.mutate,
    isCleaningUp: cleanupCarts.isPending,
    cleanupResult: cleanupCarts.data
  };
};