import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export const useCartToQuote = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const convertCartToQuote = async (
    cartId: string, 
    customerEmail?: string,
    notes?: string,
    existingQuoteId?: string,
    quoteName?: string,
    replaceItems?: boolean
  ) => {
    setIsLoading(true);
    try {
      console.log('Converting cart to quote:', { 
        cartId, 
        customerEmail, 
        notes, 
        existingQuoteId, 
        quoteName,
        replaceItems
      });

      const { data, error } = await supabase.functions.invoke('portal-cart-to-quote', {
        body: {
          cart_id: cartId,
          customer_email: customerEmail,
          notes: notes,
          existing_quote_id: existingQuoteId,
          quote_name: quoteName,
          replace_items: replaceItems || false
        }
      });

      console.log('Cart to quote response:', { data, error });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to convert cart to quote');
      }

      const actionText = existingQuoteId 
        ? (replaceItems 
          ? `Quote ${data.quote_number} updated with new items`
          : `Items added to quote ${data.quote_number}`)
        : `Cart converted to quote ${data.quote_number}`;

      toast({
        title: "Success",
        description: actionText,
      });

      // Cart clearing is now handled atomically in the edge function
      // Invalidate all cart-related queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.invalidateQueries({ queryKey: ['carts'] });
      
      // Dispatch cart updated event to ensure all components refresh
      window.dispatchEvent(new CustomEvent('cart-updated'));
      
      return {
        success: true,
        quoteId: data.quote_id,
        quoteNumber: data.quote_number,
        totalAmount: data.total_amount,
        shouldRefreshCart: true,
        cartCleared: data.cart_cleared || true, // Edge function handles clearing
        isNewQuote: !existingQuoteId
      };

    } catch (error) {
      console.error('Error converting cart to quote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert cart to quote",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    convertCartToQuote,
    isLoading
  };
};