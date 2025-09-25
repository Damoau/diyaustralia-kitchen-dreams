import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useCartToQuote = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to clear cart after successful quote conversion
  const clearCartAfterQuoteConversion = async (cartId: string) => {
    try {
      const { error } = await supabase
        .from('carts')
        .update({ 
          status: 'converted_to_quote',
          total_amount: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);

      if (error) throw error;

      // Also clear all cart items
      const { error: itemsError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (itemsError) throw itemsError;

      return { success: true };
    } catch (error) {
      console.error('Error clearing cart after quote conversion:', error);
      return { success: false, error: error.message };
    }
  };

  const convertCartToQuote = async (
    cartId: string, 
    customerEmail?: string,
    notes?: string
  ) => {
    setIsLoading(true);
    try {
      console.log('Converting cart to quote:', { cartId, customerEmail, notes });

      const { data, error } = await supabase.functions.invoke('portal-cart-to-quote', {
        body: {
          cart_id: cartId,
          customer_email: customerEmail,
          notes: notes
        }
      });

      console.log('Cart to quote response:', { data, error });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to convert cart to quote');
      }

      toast({
        title: "Success",
        description: `Cart converted to quote ${data.quote_number}`,
      });

      // Clear cart state to prevent confusion between quote and cart modes
      const clearCartResponse = await clearCartAfterQuoteConversion(cartId);
      
      return {
        success: true,
        quoteId: data.quote_id,
        quoteNumber: data.quote_number,
        totalAmount: data.total_amount,
        shouldRefreshCart: true, // Signal that cart needs to be refreshed
        cartCleared: clearCartResponse.success
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