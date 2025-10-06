import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutSequence } from "@/components/checkout/CheckoutSequence";
import { CustomerIdentify } from "@/components/checkout/CustomerIdentify";
import { ShippingDelivery } from "@/components/checkout/ShippingDelivery";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { DetailedCheckoutOrderSummary } from "@/components/checkout/DetailedCheckoutOrderSummary";
import { useCartOptimized } from "@/hooks/useCartOptimized";
import { useCheckout } from "@/hooks/useCheckout";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";
import { formatCurrency } from "@/lib/formatPrice";
import { SEOTags } from "@/components/SEOTags";
import { supabase } from "@/integrations/supabase/client";

interface SequenceStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
}

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, isLoading: cartLoading, getTotalItems, getTotalPrice } = useCartOptimized();
  const { startCheckout } = useCheckout();
  
  // Get payment type from URL
  const searchParams = new URLSearchParams(window.location.search);
  const paymentType = searchParams.get('paymentType') as 'full' | 'deposit' || 'full';
  const isDepositCheckout = paymentType === 'deposit';
  
  const [currentStep, setCurrentStep] = useState('identity');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    deliveryTotal: 0,
    taxAmount: 0,
    finalTotal: 0,
    depositAmount: 0,
    isDeposit: isDepositCheckout
  });
  
  const steps: SequenceStep[] = [
    {
      id: 'identity',
      title: 'Customer Information',
      description: 'Provide your contact details',
      status: currentStep === 'identity' ? 'current' : 
              (currentStep === 'shipping' || currentStep === 'payment') ? 'completed' : 'pending'
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      description: 'Choose delivery options',
      status: currentStep === 'shipping' ? 'current' : 
              currentStep === 'payment' ? 'completed' : 'pending'
    },
    {
      id: 'payment',
      title: 'Review & Payment',
      description: 'Complete your order',
      status: currentStep === 'payment' ? 'current' : 'pending'
    }
  ];

  useEffect(() => {
    // Prevent multiple initializations
    if (checkoutId) {
      console.log('✅ Checkout already initialized:', checkoutId);
      return;
    }

    // Initialize checkout when component mounts
    const initCheckout = async () => {
      console.log('🔄 CHECKOUT INIT - cartLoading:', cartLoading);
      
      // Wait for cart to finish loading
      if (cartLoading) {
        console.log('⏳ Cart is still loading, waiting...');
        return;
      }
      
      // Validate cart exists and has an ID
      if (!cart || !cart.id) {
        console.error('❌ CHECKOUT ERROR: No cart found after loading');
        toast.error("No cart found. Please add items to your cart first.");
        navigate('/cart');
        return;
      }

      // Validate cart has items
      const items = cart.items || [];
      
      if (items.length === 0) {
        console.error('❌ CHECKOUT ERROR: Cart is empty');
        toast.error("Your cart is empty. Please add items to continue.");
        navigate('/cart');
        return;
      }

      console.log('✅ CHECKOUT: Cart validated, creating session...');

      try {
        const checkout = await startCheckout(cart.id);
        
        if (checkout && checkout.id) {
          setCheckoutId(checkout.id);
          console.log('✅ CHECKOUT: Session created:', checkout.id);
        } else {
          throw new Error('Failed to create checkout session');
        }
      } catch (error) {
        console.error('❌ CHECKOUT ERROR: Failed to initialize:', error);
        toast.error("Failed to start checkout. Please try again.");
        navigate('/cart');
      }
    };

    initCheckout();
  }, [cart?.id, cartLoading, checkoutId]);

  const handleStepComplete = async (stepId: string, data?: any) => {
    console.log(`✅ Step ${stepId} completed with data:`, data);
    
    // Store step data and update step status
    if (stepId === 'identity') {
      console.log('🔐 Identity step complete, storing customer data...');
      setCustomerData(data);
      
      // Update step statuses
      const updatedSteps = steps.map(step => {
        if (step.id === 'identity') return { ...step, status: 'completed' as const };
        if (step.id === 'shipping') return { ...step, status: 'current' as const };
        return step;
      });
      
      // Move to shipping step
      console.log('🚚 Transitioning to shipping step...');
      setCurrentStep('shipping');
      toast.success('Contact information saved! Now let\'s set up delivery.');
      
    } else if (stepId === 'shipping') {
      console.log('🚚 Shipping step complete, calculating totals...');
      
      // Calculate order summary with GST EXTRACTION (not addition)
      // All product prices already include GST, so we extract it for display
      const subtotalIncGST = getTotalPrice();
      const deliveryTotalIncGST = data?.delivery?.totalCost || 0;
      const totalIncGST = subtotalIncGST + deliveryTotalIncGST;
      
      // Extract GST from GST-inclusive price (GST = total - (total / 1.1))
      const taxAmount = totalIncGST - (totalIncGST / 1.1);
      const subtotalExGST = subtotalIncGST / 1.1;
      const deliveryExGST = deliveryTotalIncGST / 1.1;
      
      // Calculate deposit (20% of total)
      const depositAmount = isDepositCheckout ? totalIncGST * 0.2 : totalIncGST;
      
      setOrderSummary({
        subtotal: subtotalExGST,
        deliveryTotal: deliveryExGST,
        taxAmount: taxAmount,
        finalTotal: totalIncGST,
        depositAmount: depositAmount,
        isDeposit: isDepositCheckout
      });
      
      // Update step statuses
      const updatedSteps = steps.map(step => {
        if (step.id === 'identity' || step.id === 'shipping') {
          return { ...step, status: 'completed' as const };
        }
        if (step.id === 'payment') return { ...step, status: 'current' as const };
        return step;
      });
      
      // Move to payment step
      console.log('💳 Transitioning to payment step...');
      setCurrentStep('payment');
      toast.success('Delivery options saved! Ready for payment.');
      
    } else if (stepId === 'payment') {
      console.log('💳 Payment step complete, processing order...');
      
      try {
        // Mark payment step as completed
        const updatedSteps = steps.map(step => {
          if (step.id === 'payment') return { ...step, status: 'completed' as const };
          return step;
        });
        
        // For non-Stripe payments, create order
        if (data.paymentMethod !== 'stripe') {
          console.log('Creating order for payment method:', data.paymentMethod);
          
          const { data: orderData, error: orderError } = await supabase.functions.invoke(
            'create-order-from-checkout',
            {
              body: {
                checkoutId,
                paymentMethod: data.paymentMethod,
                paymentReference: null,
              }
            }
          );

          if (orderError) throw orderError;

          console.log('Order created successfully:', orderData);
          toast.success('Order created! Redirecting to confirmation...');
          
          setTimeout(() => {
            navigate(`/checkout/success?order_id=${orderData.orderId}&order_number=${orderData.orderNumber}&method=${data.paymentMethod}`);
          }, 1000);
        }
        
      } catch (error) {
        console.error('Error processing payment:', error);
        toast.error('Failed to create order. Please try again or contact support.');
      }
    }
  };


  const renderCurrentStep = () => {
    if (!checkoutId) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing checkout...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 'identity':
        return (
          <CustomerIdentify
            checkoutId={checkoutId}
            onComplete={(data) => handleStepComplete('identity', data)}
          />
        );
      case 'shipping':
        return (
          <ShippingDelivery
            checkoutId={checkoutId}
            customerData={customerData}
            onComplete={(data) => handleStepComplete('shipping', data)}
          />
        );
      case 'payment':
        return (
          <PaymentStep
            checkoutId={checkoutId}
            customerData={customerData}
            orderSummary={orderSummary}
            onComplete={(data) => handleStepComplete('payment', data)}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // Show loading state while cart is loading
  if (cartLoading) {
    return (
      <ImpersonationLayout>
        <SEOTags pageType="static" pageIdentifier="/checkout" />
        <div className="min-h-screen bg-background">
          <DynamicHeader />
          <main className="container mx-auto px-4 py-8 mobile-safe-bottom">
            <Card className="text-center py-12">
              <CardContent>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your cart...</p>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </ImpersonationLayout>
    );
  }

  if (!cart?.items?.length) {
    return (
      <ImpersonationLayout>
        <SEOTags pageType="static" pageIdentifier="/checkout" />
        <div className="min-h-screen bg-background">
          <DynamicHeader />
          <main className="container mx-auto px-4 py-8 mobile-safe-bottom">
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  You need items in your cart before you can checkout
                </p>
                <Button onClick={() => navigate("/shop")}>
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </ImpersonationLayout>
    );
  }

  return (
    <ImpersonationLayout>
      <SEOTags pageType="static" pageIdentifier="/checkout" />
      <Helmet>
        <title>Checkout - DIY Kitchens</title>
        <meta name="description" content="Complete your kitchen cabinet order with secure checkout." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <DynamicHeader />
        
        <main className="container mx-auto px-4 py-8 pb-[120px] md:pb-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Checkout</h1>
              <Badge variant="secondary">{getTotalItems()} items</Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Checkout Progress */}
              <CheckoutSequence currentStep={currentStep} steps={steps} />
              
              {/* Current Step Content */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {steps.find(step => step.id === currentStep)?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderCurrentStep()}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detailed Cart Items with All Options */}
                  <DetailedCheckoutOrderSummary items={cart.items} />
                  
                  <hr />
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal (ex GST)</span>
                    <span>{formatCurrency(getTotalPrice() / 1.1)}</span>
                  </div>
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (10%)</span>
                    <span>{formatCurrency((getTotalPrice() / 1.1) * 0.1)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-muted-foreground">Calculated in next step</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total (inc GST)</span>
                    <span>{formatCurrency(getTotalPrice())}</span>
                  </div>
                  
                  {isDepositCheckout && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Due Today (20% Deposit)</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(getTotalPrice() * 0.2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Remaining {formatCurrency(getTotalPrice() * 0.8)} due before delivery
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ImpersonationLayout>
  );
};

export default Checkout;