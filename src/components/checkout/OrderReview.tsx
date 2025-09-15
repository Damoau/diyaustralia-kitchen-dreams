import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  MapPin, 
  CreditCard, 
  Truck, 
  Clock,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Info,
  Loader2
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrderReviewProps {
  checkoutId: string;
  customerData: any;
  shippingData: any;
  paymentData: any;
  onComplete: () => void;
}

export const OrderReview = ({
  checkoutId,
  customerData,
  shippingData,
  paymentData,
  onComplete
}: OrderReviewProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { cartItems, totalAmount } = useCart();
  const { toast } = useToast();

  const calculateOrderSummary = () => {
    const subtotal = totalAmount;
    const deliveryTotal = shippingData?.delivery?.totalCost || 0;
    const taxAmount = (subtotal + deliveryTotal) * 0.1; // 10% GST
    const finalTotal = subtotal + deliveryTotal + taxAmount;

    return { subtotal, deliveryTotal, taxAmount, finalTotal };
  };

  const orderSummary = calculateOrderSummary();

  const generateOrderNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
  };

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please agree to the terms and conditions to place your order.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const orderNumber = generateOrderNumber();
      
      // Create order
      const orderData = {
        order_number: orderNumber,
        user_id: user?.id || null,
        session_id: !user ? sessionStorage.getItem('guest_cart_id') : null,
        status: paymentData.paymentMethod === 'credit_card' ? 'paid' : 'pending',
        payment_method: paymentData.paymentMethod,
        payment_status: paymentData.paymentMethod === 'credit_card' ? 'completed' : 'pending',
        subtotal: orderSummary.subtotal,
        tax_amount: orderSummary.taxAmount,
        shipping_amount: orderSummary.deliveryTotal,
        total_amount: orderSummary.finalTotal,
        shipping_address: JSON.stringify(shippingData.address),
        billing_address: JSON.stringify(paymentData.sameAsShipping ? shippingData.address : paymentData.billingAddress),
        notes: shippingData.address.instructions || null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        cabinet_type_id: item.cabinet_type_id,
        quantity: item.quantity,
        width_mm: item.width_mm,
        height_mm: item.height_mm,
        depth_mm: item.depth_mm,
        finish_id: item.finish_id,
        color_id: item.color_id,
        door_style_id: item.door_style_id,
        unit_price: item.unit_price,
        total_price: item.total_price,
        configuration: item.configuration,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update checkout status
      await supabase
        .from('checkouts')
        .update({ status: 'converted' })
        .eq('id', checkoutId);

      // Clear cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartItems[0]?.cart_id);

      if (clearCartError) throw clearCartError;

      toast({
        title: 'Order Placed Successfully!',
        description: `Order ${orderNumber} has been created. You will receive confirmation details shortly.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: 'Order Failed',
        description: 'There was an error placing your order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Review Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Review Your Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please review all details before placing your order. You'll receive confirmation via email once submitted.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-4 w-4" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{customerData.customer_first_name} {customerData.customer_last_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customerData.customer_email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customerData.customer_phone}</span>
              </div>
              {customerData.customer_company && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{customerData.customer_company}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MapPin className="h-4 w-4" />
                <span>Delivery Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{shippingData.address.firstName} {shippingData.address.lastName}</p>
                {shippingData.address.company && <p>{shippingData.address.company}</p>}
                <p>{shippingData.address.address}</p>
                <p>{shippingData.address.suburb}, {shippingData.address.state} {shippingData.address.postcode}</p>
                <p>{shippingData.address.country}</p>
                <div className="flex items-center space-x-2 pt-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{shippingData.address.phone}</span>
                </div>
                {shippingData.address.instructions && (
                  <div className="pt-2 text-sm">
                    <p className="font-medium">Delivery Instructions:</p>
                    <p className="text-muted-foreground">{shippingData.address.instructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Truck className="h-4 w-4" />
                <span>Delivery Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{shippingData.delivery.option.name}</p>
                  <p className="text-sm text-muted-foreground">{shippingData.delivery.option.description}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{shippingData.estimatedDelivery}</span>
                  </div>
                  {shippingData.delivery.addAssembly && (
                    <Badge variant="secondary" className="mt-2">
                      Professional Assembly Included
                    </Badge>
                  )}
                </div>
                <span className="font-semibold">${shippingData.delivery.totalCost}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <CreditCard className="h-4 w-4" />
                <span>Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {paymentData.paymentMethod === 'bank_transfer' && <Building className="h-4 w-4" />}
                  {paymentData.paymentMethod === 'credit_card' && <CreditCard className="h-4 w-4" />}
                  {paymentData.paymentMethod === 'quote_request' && <FileText className="h-4 w-4" />}
                  <span className="font-medium">
                    {paymentData.paymentMethod === 'bank_transfer' && 'Bank Transfer'}
                    {paymentData.paymentMethod === 'credit_card' && 'Credit Card'}
                    {paymentData.paymentMethod === 'quote_request' && 'Custom Quote Request'}
                  </span>
                </div>
                
                {paymentData.paymentMethod === 'bank_transfer' && (
                  <p className="text-sm text-muted-foreground">
                    Invoice will be sent after order confirmation
                  </p>
                )}
                
                {paymentData.paymentMethod === 'quote_request' && (
                  <p className="text-sm text-muted-foreground">
                    Our team will prepare a custom quote within 1-2 business days
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Items & Summary */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.cabinet_type?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.width_mm}mm × {item.height_mm}mm × {item.depth_mm}mm
                    </p>
                    {item.finish && (
                      <p className="text-xs text-muted-foreground">Finish: {item.finish.name}</p>
                    )}
                    {item.color && (
                      <p className="text-xs text-muted-foreground">Color: {item.color.name}</p>
                    )}
                    <p className="text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.total_price || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${orderSummary.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery & Assembly</span>
                <span>${orderSummary.deliveryTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (10%)</span>
                <span>${orderSummary.taxAmount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${orderSummary.finalTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="rounded border-gray-300 mt-1"
                  />
                  <label htmlFor="agreeTerms" className="text-sm">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Terms & Conditions
                    </a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    . I understand the delivery timeframes and payment terms.
                  </label>
                </div>

                {paymentData.paymentMethod !== 'credit_card' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Your order will be confirmed upon submission. 
                      {paymentData.paymentMethod === 'bank_transfer' 
                        ? ' An invoice with payment instructions will be sent to your email.'
                        : ' Our team will contact you within 1-2 business days with your custom quote.'
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handlePlaceOrder}
                  disabled={!agreedToTerms || isSubmitting}
                  size="lg"
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};