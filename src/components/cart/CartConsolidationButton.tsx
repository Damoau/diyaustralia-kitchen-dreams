import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useCartConsolidation } from '@/hooks/useCartConsolidation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export const CartConsolidationButton = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { consolidateCarts, isConsolidating } = useCartConsolidation();

  const handleConsolidate = () => {
    consolidateCarts(undefined, {
      onSuccess: () => {
        // Refresh cart data after consolidation
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    });
  };

  if (!user) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleConsolidate}
      disabled={isConsolidating}
      className="flex items-center gap-2"
    >
      {isConsolidating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Consolidating...
        </>
      ) : (
        <>
          <Trash2 className="w-4 h-4" />
          Clean Up Carts
        </>
      )}
    </Button>
  );
};