import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

export interface PayPalPaymentData {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  checkoutId?: string;
  scheduleId?: string;
}

export const usePayPalPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { trackCheckoutEvent } = useAnalytics();

  const createPayPalOrder = async (paymentData: PayPalPaymentData) => {
    setIsProcessing(true);
    try {
      // Call edge function to create PayPal order
      const { data, error } = await supabase.functions.invoke('create-paypal-order', {
        body: {
          amount: paymentData.amount,
          currency: paymentData.currency || 'AUD',
          description: paymentData.description || 'Kitchen Cabinet Order',
          checkout_id: paymentData.checkoutId,
          schedule_id: paymentData.scheduleId
        }
      });

      if (error) throw error;

      return data.orderId;
    } catch (error: any) {
      console.error('Error creating PayPal order:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initialize PayPal payment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const capturePayPalOrder = async (orderId: string, checkoutId?: string) => {
    setIsProcessing(true);
    try {
      // Call edge function to capture PayPal payment
      const { data, error } = await supabase.functions.invoke('capture-paypal-order', {
        body: {
          order_id: orderId,
          checkout_id: checkoutId
        }
      });

      if (error) throw error;

      // Track successful payment
      if (checkoutId) {
        trackCheckoutEvent('identify_completed', {
          checkout_id: checkoutId,
          payment_method: 'paypal',
          amount: data.amount
        });
      }

      toast({
        title: 'Payment Successful',
        description: 'Your PayPal payment has been processed successfully.',
      });

      return data;
    } catch (error: any) {
      console.error('Error capturing PayPal payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to complete PayPal payment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal payment error:', error);
    toast({
      title: 'Payment Error',
      description: 'There was an issue with your PayPal payment. Please try again.',
      variant: 'destructive',
    });
  };

  return {
    isProcessing,
    createPayPalOrder,
    capturePayPalOrder,
    handlePayPalError,
  };
};