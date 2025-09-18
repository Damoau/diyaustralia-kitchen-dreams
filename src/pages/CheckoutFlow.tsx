import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { CustomerIdentify } from '@/components/checkout/CustomerIdentify';
import { ShippingDelivery } from '@/components/checkout/ShippingDelivery';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { OrderReview } from '@/components/checkout/OrderReview';
import { useCheckout } from '@/hooks/useCheckout';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

type CheckoutStep = 'identify' | 'shipping' | 'payment' | 'review';

const STEP_LABELS = {
  identify: 'Customer Information',
  shipping: 'Shipping & Delivery', 
  payment: 'Payment',
  review: 'Review & Place Order'
};

export default function CheckoutFlow() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('identify');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [shippingData, setShippingData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startCheckout } = useCheckout();
  const { cart, cartItems } = useCart();

  useEffect(() => {
    const initializeCheckout = async () => {
      if (!cart || cartItems.length === 0) {
        toast({
          title: 'Empty Cart',
          description: 'Your cart is empty. Add some items before checking out.',
          variant: 'destructive',
        });
        navigate('/cart');
        return;
      }

      // Start checkout process
      const checkout = await startCheckout(cart.id);
      if (checkout) {
        setCheckoutId(checkout.id);
      } else {
        navigate('/cart');
      }
    };

    initializeCheckout();
  }, [cart, cartItems, navigate, startCheckout, toast]);

  const getStepProgress = () => {
    const steps: CheckoutStep[] = ['identify', 'shipping', 'payment', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const handleStepComplete = (result: any) => {
    console.log('Step completed:', result);
    
    if (currentStep === 'identify') {
      setCustomerData(result);
      setCurrentStep('shipping');
      toast({
        title: 'Customer Information Saved',
        description: 'Proceeding to shipping options.',
      });
    } else if (currentStep === 'shipping') {
      setShippingData(result);
      setCurrentStep('payment');
      toast({
        title: 'Delivery Information Saved',
        description: 'Proceeding to payment options.',
      });
    } else if (currentStep === 'payment') {
      setPaymentData(result);
      setCurrentStep('review');
      toast({
        title: 'Payment Method Selected',
        description: 'Please review your order details.',
      });
    }
  };

  const handleOrderComplete = () => {
    navigate('/orders/confirmation');
  };

  const calculateOrderSummary = () => {
    const subtotal = cart?.total_amount || 0;
    const deliveryTotal = shippingData?.delivery?.totalCost || 0;
    const taxAmount = (subtotal + deliveryTotal) * 0.1; // 10% GST
    const finalTotal = subtotal + deliveryTotal + taxAmount;
    
    return { subtotal, deliveryTotal, taxAmount, finalTotal };
  };

  const handleBackToCart = () => {
    navigate('/cart');
  };

  if (!checkoutId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h1 className="text-2xl font-semibold mb-4">Loading Checkout...</h1>
              <p className="text-muted-foreground">Please wait while we prepare your checkout.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToCart}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cart</span>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">Checkout</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {['identify', 'shipping', 'payment', 'review'].indexOf(currentStep) + 1} of 4
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto max-w-6xl px-4 py-4">
        <div className="space-y-2">
          <Progress value={getStepProgress()} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            {Object.entries(STEP_LABELS).map(([step, label]) => (
              <span
                key={step}
                className={
                  currentStep === step
                    ? 'text-primary font-medium'
                    : ['identify', 'shipping', 'payment', 'review'].indexOf(currentStep) >
                      ['identify', 'shipping', 'payment', 'review'].indexOf(step as CheckoutStep)
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {currentStep === 'identify' && (
              <CustomerIdentify
                checkoutId={checkoutId}
                onComplete={handleStepComplete}
              />
            )}
            
            {currentStep === 'shipping' && (
              <ShippingDelivery
                checkoutId={checkoutId}
                onComplete={handleStepComplete}
                customerData={customerData}
              />
            )}

            {currentStep === 'payment' && (
              <PaymentStep
                checkoutId={checkoutId}
                onComplete={handleStepComplete}
                orderSummary={calculateOrderSummary()}
              />
            )}

            {currentStep === 'review' && (
              <OrderReview
                checkoutId={checkoutId}
                customerData={customerData}
                shippingData={shippingData}
                paymentData={paymentData}
                onComplete={handleOrderComplete}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.cabinet_type?.name}</p>
                        <p className="text-muted-foreground">
                          {item.width_mm}×{item.height_mm}×{item.depth_mm}mm
                        </p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(item.total_price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(cart?.total_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-muted-foreground">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST</span>
                    <span className="text-muted-foreground">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${(cart?.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-4">
                  <p>
                    Your order is not confirmed until you complete the checkout process.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}