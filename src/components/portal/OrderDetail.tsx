import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Download, 
  DollarSign, 
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  CreditCard
} from "lucide-react";

interface OrderDetailProps {
  orderId: string;
}

export const OrderDetail = ({ orderId }: OrderDetailProps) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            cabinet_types (
              name,
              category
            )
          ),
          invoices (
            *
          ),
          shipments (
            *
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
        <p className="text-muted-foreground">The requested order could not be found.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "outline" as const, text: "Pending" },
      confirmed: { variant: "secondary" as const, text: "Confirmed" },
      in_production: { variant: "default" as const, text: "In Production" },
      ready_for_dispatch: { variant: "default" as const, text: "Ready for Dispatch" },
      shipped: { variant: "default" as const, text: "Shipped" },
      completed: { variant: "default" as const, text: "Completed" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.order_number}</h1>
          <p className="text-muted-foreground mt-2">Order Details</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.cabinet_types?.name || 'Cabinet'}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} | {item.width_mm}×{item.height_mm}×{item.depth_mm}mm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.total_price?.toLocaleString() || 0}</p>
                      <p className="text-sm text-muted-foreground">${item.unit_price?.toLocaleString() || 0} ea.</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>${(order.subtotal_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST (10%):</span>
                    <span>${(order.tax_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${(order.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">${(order.total_amount || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Make Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};