import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Package, User, MapPin, CreditCard, Calendar, FileText, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useReactToPrint } from 'react-to-print';

interface OrderDetailViewProps {
  orderId: string;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId }) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Order-${orderId}`,
  });

  const { data: order, isLoading, error: queryError } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      console.log('Fetching order details for:', orderId);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            cabinet_types (name),
            door_styles (name),
            colors (name),
            finishes (name)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }
      
      console.log('Order data fetched:', data);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Order not found</p>
          {queryError && <p className="text-sm text-red-500 mt-2">{queryError.message}</p>}
        </CardContent>
      </Card>
    );
  }

  // Parse shipping address from JSONB
  const shippingAddress = order.shipping_address as any;
  const billingAddress = order.billing_address as any;
  const orderData = order as any; // Type assertion for accessing all fields
  
  // Extract customer info from shipping address or order fields
  const customerName = shippingAddress?.name || orderData.customer_name || 'N/A';
  const customerEmail = shippingAddress?.email || orderData.customer_email || 'N/A';
  const customerPhone = shippingAddress?.phone || orderData.customer_phone || null;
  const customerCompany = shippingAddress?.company || orderData.customer_company || null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_production': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ready_for_delivery': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'delivered': return 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Print Button */}
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print Order
        </Button>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="space-y-6">
        {/* Order Header */}
        <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{order.order_number}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
              {order.payment_status && (
                <Badge className="ml-2" variant="outline">
                  {order.payment_status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{customerEmail}</p>
            </div>
            {customerPhone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{customerPhone}</p>
              </div>
            )}
            {customerCompany && (
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{customerCompany}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {shippingAddress ? (
              <>
                {shippingAddress.street && <p>{shippingAddress.street}</p>}
                {shippingAddress.suburb && <p>{shippingAddress.suburb}</p>}
                {shippingAddress.city && <p>{shippingAddress.city}</p>}
                {(shippingAddress.state || shippingAddress.postcode) && (
                  <p>
                    {shippingAddress.state} {shippingAddress.postcode}
                  </p>
                )}
                {shippingAddress.country && <p>{shippingAddress.country}</p>}
              </>
            ) : (
              <p className="text-muted-foreground">No shipping address</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Billing Address */}
        {billingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Billing Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {billingAddress.street && <p>{billingAddress.street}</p>}
              {billingAddress.suburb && <p>{billingAddress.suburb}</p>}
              {billingAddress.city && <p>{billingAddress.city}</p>}
              {(billingAddress.state || billingAddress.postcode) && (
                <p>
                  {billingAddress.state} {billingAddress.postcode}
                </p>
              )}
              {billingAddress.country && <p>{billingAddress.country}</p>}
            </CardContent>
          </Card>
        )}

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{order.payment_method?.replace('_', ' ') || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge variant="outline">{order.payment_status}</Badge>
            </div>
            <Separator className="my-3" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium">${order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">GST (10%)</span>
                <span className="font-medium">${order.tax_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${order.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items ({order.order_items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!order.order_items || order.order_items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No items in this order</p>
          ) : (
            <div className="space-y-4">
              {order.order_items.map((item: any, index: number) => {
                const config = item.configuration || {};
                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.cabinet_types?.name || 'Cabinet'}</h4>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${item.total_price?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.unit_price?.toFixed(2) || '0.00'} each
                        </p>
                        <p className="text-sm font-medium mt-1">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    {/* Specifications */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Dimensions</p>
                        <p className="font-medium">
                          {item.width_mm}W × {item.height_mm}H × {item.depth_mm}D mm
                        </p>
                      </div>
                      
                      {item.door_styles?.name && (
                        <div>
                          <p className="text-muted-foreground">Door Style</p>
                          <p className="font-medium">{item.door_styles.name}</p>
                        </div>
                      )}
                      
                      {item.colors?.name && (
                        <div>
                          <p className="text-muted-foreground">Color</p>
                          <p className="font-medium">{item.colors.name}</p>
                        </div>
                      )}
                      
                      {item.finishes?.name && (
                        <div>
                          <p className="text-muted-foreground">Finish</p>
                          <p className="font-medium">{item.finishes.name}</p>
                        </div>
                      )}
                      
                      {/* Additional configuration options */}
                      {config.hinge_type && (
                        <div>
                          <p className="text-muted-foreground">Hinge Type</p>
                          <p className="font-medium">{config.hinge_type}</p>
                        </div>
                      )}
                      
                      {config.handle_type && (
                        <div>
                          <p className="text-muted-foreground">Handle Type</p>
                          <p className="font-medium">{config.handle_type}</p>
                        </div>
                      )}
                      
                      {config.drawer_system && (
                        <div>
                          <p className="text-muted-foreground">Drawer System</p>
                          <p className="font-medium">{config.drawer_system}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Assembly Services */}
                    {config.assembly?.enabled && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm font-medium mb-2">Assembly Service:</p>
                          <div className="bg-muted p-3 rounded space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Type:</span>
                              <span className="text-sm">{config.assembly.type === 'with_doors' ? 'With Doors & Hardware' : 'Carcass Only'}</span>
                            </div>
                            {config.assembly.price && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Price:</span>
                                <span className="text-sm font-semibold">${config.assembly.price.toFixed(2)}</span>
                              </div>
                            )}
                            {config.assembly.postcode && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Postcode:</span>
                                <span className="text-sm">{config.assembly.postcode}</span>
                              </div>
                            )}
                            {config.assembly.lead_time_days && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Lead Time:</span>
                                <span className="text-sm">{config.assembly.lead_time_days} days</span>
                              </div>
                            )}
                            {config.assembly.includes && config.assembly.includes.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-sm font-medium mb-1">Includes:</p>
                                <ul className="text-sm space-y-1 ml-4 list-disc">
                                  {config.assembly.includes.map((item: string, idx: number) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Inside Notes */}
                    {(config.notes || config.internal_notes || item.notes) && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                          <p className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                            {config.notes || config.internal_notes || item.notes}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Status */}
      {order.production_status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Production Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="text-base px-4 py-2">
              {order.production_status.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Order Notes */}
      {(order.notes || orderData.customer_notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.notes && (
              <div>
                <p className="text-sm font-medium mb-1">Internal Notes:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                  {order.notes}
                </p>
              </div>
            )}
            {orderData.customer_notes && (
              <div>
                <p className="text-sm font-medium mb-1">Customer Notes:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                  {orderData.customer_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};
