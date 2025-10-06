import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PaymentScheduleWidget } from "./PaymentScheduleWidget";
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
  CreditCard,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      console.log(`Fetching order: ${orderId}`);
      
      // Try to fetch by order_number first, then by id
      let { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            cabinet_types (
              name,
              category
            ),
            door_styles (name),
            colors (name, hex_code),
            finishes (name)
          ),
          invoices (*),
          shipments (*),
          payment_schedules (*)
        `)
        .eq('order_number', orderId)
        .maybeSingle();

      // If not found by order_number, try by id  
      if (!orderData && !orderError) {
        ({ data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              cabinet_types (
                name,
                category
              ),
              door_styles (name),
              colors (name, hex_code),
              finishes (name)
            ),
            invoices (*),
            shipments (*),
            payment_schedules (*)
          `)
          .eq('id', orderId)
          .maybeSingle());
      }

      if (orderError) {
        console.error('Order fetch error:', orderError);
        throw orderError;
      }

      if (!orderData) {
        // If no real data found, check if this is a sample order
        if (orderId === "ORD-2023-089" || orderId === "sample-089") {
          setOrder({
            id: "sample-089",
            order_number: "ORD-2023-089",
            status: "shipped",
            total_amount: 4200,
            subtotal: 3818,
            tax_amount: 382,
            created_at: "2023-11-15T00:00:00Z",
            order_items: [
              {
                id: "sample-item-1",
                quantity: 2,
                width_mm: 600,
                height_mm: 720,
                depth_mm: 560,
                unit_price: 1909,
                total_price: 3818,
                cabinet_types: { name: "Office Storage Cabinet", category: "base" }
              }
            ],
            invoices: [],
            shipments: [
              {
                id: "sample-ship-1",
                tracking_number: "AUS12345678",
                carrier: "Australia Post",
                status: "delivered",
                shipped_at: "2023-12-01T00:00:00Z",
                delivered_at: "2023-12-05T00:00:00Z"
              }
            ],
            payment_schedules: []
          });
          return;
        }
        
        console.log(`Order not found: ${orderId}`);
        throw new Error(`Order ${orderId} not found`);
      }
      
      console.log('Order found:', orderData);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load order details.",
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
        <p className="text-muted-foreground mb-4">
          The requested order "{orderId}" could not be found.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          This might be because:
          <br />• The order doesn't exist in the database
          <br />• You don't have permission to view this order
          <br />• There was a system error
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="mr-2"
        >
          Go Back
        </Button>
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
          {/* Design Drawings Section */}
          {order.drawings_status && order.drawings_status !== 'not_required' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Design Drawings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.drawings_status === 'pending_upload' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your drawings will be available soon. We'll notify you by email when they're ready for review.
                    </AlertDescription>
                  </Alert>
                )}

                {(order.drawings_status === 'sent' || order.drawings_status === 'under_review') && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      ⚠️ Action Required: Please review and approve your kitchen drawings to proceed with production.
                    </AlertDescription>
                  </Alert>
                )}

                {order.drawings_status === 'approved' && order.drawings_approved_at && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      ✅ Drawings approved on {new Date(order.drawings_approved_at).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                )}

                {(order.drawings_status === 'sent' || order.drawings_status === 'under_review') && (
                  <Button
                    onClick={() => window.location.href = `/portal/orders/${orderId}/drawings`}
                    size="lg"
                    className="w-full"
                  >
                    📐 Review Drawings Now
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

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
                      <p className="font-semibold">${item.total_price?.toLocaleString() || 0} inc GST</p>
                      <p className="text-sm text-muted-foreground">${item.unit_price?.toLocaleString() || 0} ea.</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>${(order.subtotal || 0).toLocaleString()}</span>
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
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule Widget */}
          {order.payment_schedules && order.payment_schedules.length > 0 && (
            <PaymentScheduleWidget
              orderId={order.id}
              schedule={order.payment_schedules}
              onPaymentComplete={fetchOrderData}
            />
          )}
        </div>
      </div>
    </div>
  );
};