import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StripePaymentFormProps {
  checkoutId: string;
  totalAmount: number;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentType?: 'full' | 'deposit';
  depositAmount?: number;
  balanceAmount?: number;
  onPaymentSuccess: (paymentData: any) => void;
}

export const StripePaymentForm = ({ 
  checkoutId, 
  totalAmount, 
  customerInfo,
  paymentType = 'full',
  depositAmount,
  balanceAmount,
  onPaymentSuccess 
}: StripePaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStripePayment = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          checkoutId,
          totalAmount,
          paymentType,
          depositAmount,
          balanceAmount,
          customerInfo
        }
      });

      if (error) throw error;

      if (data.url) {
        // Open Stripe checkout in new tab
        const stripeWindow = window.open(data.url, '_blank');
        
        if (stripeWindow) {
          // Poll for window closure to detect when user returns
          const pollTimer = setInterval(() => {
            if (stripeWindow.closed) {
              clearInterval(pollTimer);
              // Check payment status when user returns
              handlePaymentReturn(data.sessionId);
            }
          }, 1000);
        } else {
          // Fallback: redirect in same window
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentReturn = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
        body: {
          sessionId,
          checkoutId
        }
      });

      if (error) throw error;

      if (data.success && data.paymentStatus === 'paid') {
        toast({
          title: 'Payment Successful!',
          description: 'Your order has been confirmed.',
        });
        
        onPaymentSuccess({
          method: 'stripe',
          reference: sessionId,
          amount: data.amount,
          customerEmail: data.customerEmail
        });
      } else {
        toast({
          title: 'Payment Not Completed',
          description: 'Your payment was not completed. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: 'Payment Verification Error',
        description: 'Unable to verify payment status. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit Card Payment
        </CardTitle>
        <CardDescription>
          Pay securely with your credit or debit card through Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>• Secure 256-bit SSL encryption</p>
          <p>• Supports Visa, Mastercard, American Express</p>
          <p>• Immediate payment confirmation</p>
        </div>
        
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">
              {paymentType === 'deposit' ? 'Deposit Amount:' : 'Total Amount:'}
            </span>
            <span className="text-xl font-bold text-primary">
              ${totalAmount.toFixed(2)} AUD
            </span>
          </div>
          {paymentType === 'deposit' && balanceAmount && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Balance due later:</span>
              <span>${balanceAmount.toFixed(2)} AUD</span>
            </div>
          )}
          
          <Button 
            onClick={handleStripePayment}
            disabled={isLoading}
            className="w-full mt-4"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {paymentType === 'deposit' 
                  ? `Pay Deposit ($${totalAmount.toFixed(2)})` 
                  : `Pay with Credit Card ($${totalAmount.toFixed(2)})`}
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            You will be redirected to Stripe's secure payment page
          </p>
        </div>
      </CardContent>
    </Card>
  );
};