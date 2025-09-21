import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useCartToQuote = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const convertCartToQuote = async (
    cartId: string, 
    customerEmail?: string,
    notes?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-cart-to-quote', {
        body: {
          cart_id: cartId,
          customer_email: customerEmail,
          notes: notes
        }
      });

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

      return {
        success: true,
        quoteId: data.quote_id,
        quoteNumber: data.quote_number,
        totalAmount: data.total_amount
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