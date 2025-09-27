import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCartConsolidation = () => {
  const consolidateCartsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cart-consolidation');
      
      if (error) {
        throw new Error(error.message || 'Failed to consolidate carts');
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.actions && data.actions.length > 0) {
        console.log('Cart consolidation completed:', data.actions);
        toast.success(`Cart consolidation completed: ${data.actions.join(', ')}`);
      }
    },
    onError: (error) => {
      console.error('Cart consolidation failed:', error);
      toast.error('Failed to clean up duplicate carts');
    }
  });

  return {
    consolidateCarts: consolidateCartsMutation.mutate,
    isConsolidating: consolidateCartsMutation.isPending
  };
};