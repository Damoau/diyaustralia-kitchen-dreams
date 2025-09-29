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
import { useCartOptimized } from "@/hooks/useCartOptimized";
import { useCheckout } from "@/hooks/useCheckout";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";
import { formatCurrency } from "@/lib/formatPrice";

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
      console.log('Initializing checkout - cartLoading:', cartLoading, 'cart:', cart);
      
      // Wait for cart to finish loading
      if (cartLoading) {
        console.log('Cart is still loading, waiting...');
        return;
      }
      
      // Validate cart exists and has an ID
      if (!cart || !cart.id) {
        console.error('No cart found after loading:', cart);
        toast.error("No cart found. Please add items to your cart first.");
        navigate('/cart');
        return;
      }

      // Validate cart has items - check both items array and length
      const items = cart.items || [];
      console.log('Cart items check:', { hasItems: items.length > 0, itemsCount: items.length, items });
      
      if (items.length === 0) {
        console.error('Cart is empty:', { cartId: cart.id, items });
        toast.error("Your cart is empty. Please add items to continue.");
        navigate('/cart');
        return;
      }

      console.log('✅ Cart validated successfully. Items:', items.length, 'Cart ID:', cart.id);

      try {
        console.log('Starting checkout for cart ID:', cart.id);
        const checkout = await startCheckout(cart.id);
        console.log('Checkout created:', checkout);
        
        if (checkout && checkout.id) {
          setCheckoutId(checkout.id);
          console.log('Checkout ID set:', checkout.id);
        } else {
          throw new Error('Failed to create checkout session');
        }
      } catch (error) {
        console.error('Failed to initialize checkout:', error);
        toast.error("Failed to start checkout. Please try again.");
        navigate('/cart');
      }
    };

    initCheckout();
  }, [cart, cartLoading, startCheckout, navigate]);

  const handleStepComplete = (stepId: string, data?: any) => {
    console.log(`Step ${stepId} completed with data:`, data);
    
    // Store step data
    if (stepId === 'identity') {
      setCustomerData(data);
    } else if (stepId === 'shipping') {
      // Calculate order summary with GST EXTRACTION (not addition)
      // All product prices already include GST, so we extract it for display
      const subtotalIncGST = getTotalPrice();
      const deliveryTotalIncGST = data?.deliveryOption?.price || 0;
      const totalIncGST = subtotalIncGST + deliveryTotalIncGST;
      
      // Extract GST from GST-inclusive price (GST = total - (total / 1.1))
      const taxAmount = totalIncGST - (totalIncGST / 1.1);
      const subtotalExGST = subtotalIncGST / 1.1;
      const deliveryExGST = deliveryTotalIncGST / 1.1;
      
      setOrderSummary({
        subtotal: subtotalExGST,
        deliveryTotal: deliveryExGST,
        taxAmount: taxAmount,
        finalTotal: totalIncGST
      });
    }
    
    // Update step status and move to next step
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex < steps.length - 1) {
      const nextStep = steps[stepIndex + 1];
      setCurrentStep(nextStep.id);
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
                  {/* Cart Items Preview */}
                  <div className="space-y-2">
                    {cart.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate">
                          {item.cabinet_type?.name} (×{item.quantity})
                        </span>
                        <span>{formatCurrency(item.total_price)}</span>
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
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>{formatCurrency(getTotalPrice())}</span>
                  </div>
                  
                   {/* Modern 20% Deposit Banner */}
                   <div className="w-full max-w-md mx-auto my-4">
                     <div className="bg-gradient-to-r from-primary to-blue-dark text-primary-foreground rounded-xl px-6 py-3 shadow-lg border border-primary/20 backdrop-blur-sm">
                       <div className="flex items-center gap-3">
                         <div className="flex flex-col">
                           <span className="text-sm font-medium opacity-90">20% deposit to get all cabinets started</span>
                           <span className="text-lg font-bold">
                             {formatCurrency(getTotalPrice() * 0.2)}
                           </span>
                         </div>
                         <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                           <span className="text-xs font-bold">20%</span>
                         </div>
                       </div>
                     </div>
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