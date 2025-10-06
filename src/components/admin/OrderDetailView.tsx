import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, User, MapPin, CreditCard, Calendar, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderDetailViewProps {
  orderId: string;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId }) => {
  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            cabinet_types (name, description),
            door_styles (name),
            colors (name),
            finishes (name)
          ),
          payments (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
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
        </CardContent>
      </Card>
    );
  }

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
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{(order as any).customer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{(order as any).customer_email}</p>
            </div>
            {(order as any).customer_phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{(order as any).customer_phone}</p>
              </div>
            )}
            {(order as any).customer_company && (
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{(order as any).customer_company}</p>
              </div>
            )}
            {(order as any).customer_abn && (
              <div>
                <p className="text-sm text-muted-foreground">ABN</p>
                <p className="font-medium">{(order as any).customer_abn}</p>
              </div>
            )}
          </CardContent>
        </Card>

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
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items?.map((item: any, index: number) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.cabinet_types?.name || 'Cabinet'}</h4>
                    <div className="text-sm text-muted-foreground space-y-1 mt-2">
                      <p>Dimensions: {item.width_mm}W × {item.height_mm}H × {item.depth_mm}D mm</p>
                      {item.door_styles?.name && <p>Door Style: {item.door_styles.name}</p>}
                      {item.colors?.name && <p>Color: {item.colors.name}</p>}
                      {item.finishes?.name && <p>Finish: {item.finishes.name}</p>}
                      <p>Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.total_price?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.unit_price?.toFixed(2) || '0.00'} each
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
