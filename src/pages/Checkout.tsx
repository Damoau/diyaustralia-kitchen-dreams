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
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";

interface SequenceStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
}

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getItemCount } = useCart();
  const { startCheckout } = useCheckout();
  
  const [currentStep, setCurrentStep] = useState('identity');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    deliveryTotal: 0,
    taxAmount: 0,
    finalTotal: 0
  });
  
  const steps: SequenceStep[] = [
    {
      id: 'identity',
      title: 'Customer Information',
      description: 'Provide your contact details',
      status: currentStep === 'identity' ? 'current' : 'pending'
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      description: 'Choose delivery options',
      status: currentStep === 'shipping' ? 'current' : currentStep === 'identity' ? 'pending' : 'completed'
    },
    {
      id: 'payment',
      title: 'Review & Payment',
      description: 'Complete your order',
      status: currentStep === 'payment' ? 'current' : 'pending'
    }
  ];

  useEffect(() => {
    // Initialize checkout when component mounts
    const initCheckout = async () => {
      console.log('Initializing checkout with cart:', cart);
      
      if (!cart?.id) {
        console.error('No cart ID found:', cart);
        toast.error("No cart found. Please add items to your cart first.");
        navigate('/cart');
        return;
      }

      if (!cart?.items?.length) {
        console.error('Cart has no items:', cart.items);
        toast.error("Your cart is empty. Please add items to continue.");
        navigate('/cart');
        return;
      }

      try {
        console.log('Starting checkout for cart ID:', cart.id);
        const checkout = await startCheckout(cart.id);
        console.log('Checkout created:', checkout);
        
        if (checkout && checkout.id) {
          setCheckoutId(checkout.id);
          console.log('Checkout ID set:', checkout.id);
        } else {
          throw new Error('Failed to create checkout session - no checkout ID returned');
        }
      } catch (error) {
        console.error('Failed to initialize checkout:', error);
        toast.error("Failed to start checkout. Please try again.");
        navigate('/cart');
      }
    };

    if (cart !== null) { // Only initialize when cart data is loaded (not null)
      initCheckout();
    }
  }, [cart, startCheckout, navigate]);

  const handleStepComplete = (stepId: string, data?: any) => {
    console.log(`Step ${stepId} completed with data:`, data);
    
    // Store step data
    if (stepId === 'identity') {
      setCustomerData(data);
    } else if (stepId === 'shipping') {
      // Update order summary with shipping costs
      const subtotal = getTotalPrice();
      const deliveryTotal = data?.deliveryOption?.price || 0;
      const taxAmount = (subtotal + deliveryTotal) * 0.1; // 10% GST
      const finalTotal = subtotal + deliveryTotal + taxAmount;
      
      setOrderSummary({
        subtotal,
        deliveryTotal,
        taxAmount,
        finalTotal
      });
    }
    
    // Update step status and move to next step
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex < steps.length - 1) {
      const nextStep = steps[stepIndex + 1];
      setCurrentStep(nextStep.id);
    }
  };

  const getTotalPrice = () => {
    return cart?.total_amount || 0;
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
            orderSummary={orderSummary}
            onComplete={(data) => handleStepComplete('payment', data)}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  if (!cart?.items?.length) {
    return (
      <ImpersonationLayout>
        <div className="min-h-screen bg-background">
          <DynamicHeader />
          <main className="container mx-auto px-4 py-8">
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
      <Helmet>
        <title>Checkout - DIY Kitchens</title>
        <meta name="description" content="Complete your kitchen cabinet order with secure checkout." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <DynamicHeader />
        
        <main className="container mx-auto px-4 py-8">
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
              <Badge variant="secondary">{getItemCount()} items</Badge>
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
                  {/* Cart Items Preview */}
                  <div className="space-y-2">
                    {cart.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate">
                          {item.cabinet_type?.name} (×{item.quantity})
                        </span>
                        <span>${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                    {cart.items.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        +{cart.items.length - 3} more items
                      </div>
                    )}
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between">
                    <span>Subtotal ({getItemCount()} items)</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-muted-foreground">Calculated at checkout</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
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