import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ConsolidationResult {
  success: boolean;
  actions: string[];
  activeCartId?: string;
  itemCount: number;
  consolidationType: 'merge' | 'cleanup' | 'none';
}

export const useCartConsolidationManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const consolidateCartsMutation = useMutation({
    mutationFn: async (): Promise<ConsolidationResult> => {
      const { data, error } = await supabase.functions.invoke('cart-consolidation');
      
      if (error) {
        throw new Error(error.message || 'Failed to consolidate carts');
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.actions && data.actions.length > 0) {
        console.log('Cart consolidation completed:', data.actions);
        toast.success(`Cart cleanup completed: ${data.actions.join(', ')}`);
        
        // Invalidate all cart-related queries
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        queryClient.invalidateQueries({ queryKey: ['cart-health'] });
        queryClient.invalidateQueries({ queryKey: ['enhanced-cart'] });
      } else {
        toast.success('Carts are already optimized');
      }
    },
    onError: (error) => {
      console.error('Cart consolidation failed:', error);
      toast.error('Failed to clean up duplicate carts');
    }
  });

  const getCartHealthQuery = useQuery({
    queryKey: ['cart-health', user?.id],
        queryFn: async () => {
          if (!user) return null;
          
          // Simple cart health calculation using direct queries
          const { data: carts, error } = await supabase
            .from('carts')
            .select('id, status, lifecycle_state, total_amount, item_count:cart_items(count), updated_at')
            .eq('user_id', user.id);
          
          if (error) throw error;
          
          const active = carts?.filter(c => c.lifecycle_state === 'active').length || 0;
          const archived = carts?.filter(c => c.lifecycle_state === 'archived').length || 0;
          const empty = carts?.filter(c => (c.item_count as any)?.[0]?.count === 0).length || 0;
          const total = carts?.length || 0;
          
          return {
            total_carts: total,
            active_carts: active,
            archived_carts: archived,
            empty_carts: empty,
            health_score: total > 0 ? Math.round(((active - empty) / total) * 100) : 100
          };
        },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    consolidateCarts: consolidateCartsMutation.mutate,
    isConsolidating: consolidateCartsMutation.isPending,
    consolidationResult: consolidateCartsMutation.data,
    cartHealth: getCartHealthQuery.data,
    isLoadingHealth: getCartHealthQuery.isLoading,
    refreshHealth: getCartHealthQuery.refetch,
  };
};