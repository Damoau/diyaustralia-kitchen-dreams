import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Package, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const sessionId = searchParams.get("session_id");
  const checkoutId = searchParams.get("checkout_id");
  const orderIdParam = searchParams.get("order_id");
  const orderNumberParam = searchParams.get("order_number");
  const paymentMethod = searchParams.get("method");

  useEffect(() => {
    // If order already created (non-Stripe payments), skip verification
    if (orderIdParam && orderNumberParam) {
      setOrderNumber(orderNumberParam);
      setOrderId(orderIdParam);
      setIsVerifying(false);
      toast.success("Order confirmed!");
      return;
    }

    // Stripe payment verification
    const verifyPayment = async () => {
      if (!sessionId || !checkoutId) {
        toast.error("Invalid payment session");
        navigate("/cart");
        return;
      }

      try {
        console.log("Verifying payment:", { sessionId, checkoutId });

        // Call verify-stripe-payment edge function
        const { data, error } = await supabase.functions.invoke(
          "verify-stripe-payment",
          {
            body: { sessionId, checkoutId },
          }
        );

        if (error) throw error;

        console.log("Payment verification response:", data);

        if (data.success && data.paymentStatus === "paid") {
          toast.success("Payment confirmed! Your order has been placed.");
          
          // Set real order data from verification
          if (data.orderId) setOrderId(data.orderId);
          if (data.orderNumber) setOrderNumber(data.orderNumber);
        } else {
          toast.error("Payment verification failed");
          navigate("/checkout");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        toast.error("Failed to verify payment. Please contact support.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, checkoutId, navigate]);

  if (isVerifying) {
    return (
      <ImpersonationLayout>
        <div className="min-h-screen bg-background">
          <DynamicHeader />
          <main className="container mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto text-center py-12">
              <CardContent>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">Verifying your payment...</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your order
                </p>
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
        <title>Order Confirmed - DIY Kitchens</title>
        <meta name="description" content="Your order has been successfully placed." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <DynamicHeader />

        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-3xl">Order Confirmed!</CardTitle>
              <p className="text-muted-foreground mt-2">
                Thank you for your order. We've received your payment and will begin processing your cabinets.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {orderNumber && (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                  <p className="text-2xl font-bold">{orderNumber}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Confirmation Email</h3>
                    <p className="text-sm text-muted-foreground">
                      We've sent a confirmation email with your order details and receipt.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">What's Next?</h3>
                    <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
                      <li>Our team will review your order within 1 business day</li>
                      <li>We'll contact you to confirm delivery details</li>
                      <li>Manufacturing will begin after final approval</li>
                      <li>You'll receive tracking updates via email</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <Button
                  onClick={() => navigate(orderId ? `/portal/orders/${orderId}` : "/portal/orders")}
                  className="w-full"
                  size="lg"
                >
                  View Order Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate("/shop")}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
                <p className="font-medium mb-1">Need Help?</p>
                <p className="text-muted-foreground">
                  If you have any questions about your order, please contact our support team
                  or visit your{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate("/portal")}
                  >
                    customer portal
                  </Button>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </ImpersonationLayout>
  );
};

export default CheckoutSuccess;
