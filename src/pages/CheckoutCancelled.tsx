import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import DynamicHeader from "@/components/DynamicHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";

const CheckoutCancelled = () => {
  const navigate = useNavigate();

  return (
    <ImpersonationLayout>
      <Helmet>
        <title>Checkout Cancelled - DIY Kitchens</title>
        <meta name="description" content="Your checkout was cancelled." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <DynamicHeader />

        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-3xl">Checkout Cancelled</CardTitle>
              <p className="text-muted-foreground mt-2">
                Your payment was not processed. Your items are still in your cart.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No charges were made to your account. You can return to your cart
                  to complete your order when you're ready.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/cart")}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Return to Cart
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/shop")}
                  className="w-full"
                >
                  Continue Shopping
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate("/portal/quotes")}
                  className="w-full"
                >
                  Request a Quote Instead
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
                <p className="font-medium mb-1">Need Assistance?</p>
                <p className="text-muted-foreground">
                  If you experienced any issues during checkout or have questions,
                  please contact our support team. We're here to help!
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

export default CheckoutCancelled;
