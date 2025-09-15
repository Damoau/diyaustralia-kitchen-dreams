import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, 
  DollarSign, 
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Download
} from "lucide-react";
import { OrderApprovals } from "./OrderApprovals";
import { useApprovals } from "@/hooks/useApprovals";

interface OrderDetailProps {
  orderId: string;
}

export const OrderDetail = ({ orderId }: OrderDetailProps) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { approvals, isLoading: approvalsLoading, fetchApprovals } = useApprovals(orderId);

  // Mock data - in real app this would come from API
  const order = {
    id: orderId,
    quoteId: "QT-2023-045",
    label: "Kitchen Renovation",
    status: "in_production",
    amount: 15800,
    paidAmount: 3200,
    createdAt: "2024-01-05",
    estimatedCompletion: "2024-02-15",
    paymentSchedule: [
      { id: 1, type: "deposit", amount: 3200, dueDate: "2024-01-05", status: "paid", paidAt: "2024-01-05" },
      { id: 2, type: "progress", amount: 6300, dueDate: "2024-01-20", status: "due", paidAt: null },
      { id: 3, type: "final", amount: 6300, dueDate: "2024-02-15", status: "pending", paidAt: null }
    ],
    productionStages: [
      { stage: "Order Received", status: "completed", completedAt: "2024-01-05", description: "Order placed and confirmed" },
      { stage: "Materials Sourcing", status: "completed", completedAt: "2024-01-08", description: "All materials ordered and received" },
      { stage: "CNC Cutting", status: "in_progress", completedAt: null, description: "Cutting cabinet components" },
      { stage: "Edge Banding", status: "pending", completedAt: null, description: "Applying edge banding to panels" },
      { stage: "Assembly", status: "pending", completedAt: null, description: "Assembling cabinet boxes" },
      { stage: "Finishing", status: "pending", completedAt: null, description: "Painting and final finishes" },
      { stage: "Quality Control", status: "pending", completedAt: null, description: "Final inspection and testing" },
      { stage: "Packaging", status: "pending", completedAt: null, description: "Packing for shipment" },
      { stage: "Ready to Ship", status: "pending", completedAt: null, description: "Ready for delivery" }
    ],
    shipping: {
      status: "not_shipped",
      estimatedShipDate: "2024-02-15",
      trackingNumber: null,
      carrier: null,
      palletCount: 3,
      dimensions: "2400mm x 1200mm x 600mm"
    },
    items: [
      { name: "Base Cabinets", qty: 8, price: 6400 },
      { name: "Wall Cabinets", qty: 7, price: 4200 },
      { name: "Pantry Cabinet", qty: 1, price: 1900 },
      { name: "Hardware & Installation", qty: 1, price: 3300 }
    ]
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      in_production: { variant: "secondary" as const, text: "In Production" },
      ready_to_ship: { variant: "default" as const, text: "Ready to Ship" },
      shipped: { variant: "default" as const, text: "Shipped" },
      completed: { variant: "default" as const, text: "Completed" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.in_production;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      paid: { variant: "default" as const, text: "Paid" },
      due: { variant: "destructive" as const, text: "Due" },
      pending: { variant: "outline" as const, text: "Pending" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress": return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const completedStages = order.productionStages.filter(s => s.status === "completed").length;
  const progressPercentage = (completedStages / order.productionStages.length) * 100;

  const nextPayment = order.paymentSchedule.find(p => p.status === "due");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.id}</h1>
          <p className="text-muted-foreground mt-2">{order.label}</p>
          <p className="text-sm text-muted-foreground">From Quote {order.quoteId}</p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Approvals */}
          <OrderApprovals 
            orderId={orderId} 
            approvals={approvals}
            onUpdate={fetchApprovals}
          />

          {/* Production Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Production Progress</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {completedStages} of {order.productionStages.length} stages completed
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progressPercentage} className="w-full" />
                
                <div className="space-y-3">
                  {order.productionStages.map((stage, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {getStageIcon(stage.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{stage.stage}</p>
                          {stage.completedAt && (
                            <span className="text-xs text-muted-foreground">{stage.completedAt}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.qty}</p>
                    </div>
                    <p className="font-semibold">${item.price.toLocaleString()}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${order.amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline">
                    {order.shipping.status === "not_shipped" ? "Not Shipped" : order.shipping.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Estimated Ship Date:</span>
                  <span>{order.shipping.estimatedShipDate}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Pallets:</span>
                  <span>{order.shipping.palletCount}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Dimensions:</span>
                  <span>{order.shipping.dimensions}</span>
                </div>

                {order.shipping.trackingNumber && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tracking:</span>
                    <a 
                      href="#" 
                      className="text-primary hover:underline"
                      onClick={(e) => e.preventDefault()}
                    >
                      {order.shipping.trackingNumber}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.paymentSchedule.map((payment) => (
                <div key={payment.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{payment.type}</span>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    ${payment.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {payment.dueDate}
                  </p>
                  {payment.paidAt && (
                    <p className="text-xs text-green-600">
                      Paid: {payment.paidAt}
                    </p>
                  )}
                  {payment.status === "due" && (
                    <Button 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => setShowPaymentDialog(true)}
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      Pay Now
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Payment Progress</p>
                  <p className="font-semibold">
                    ${order.paidAmount.toLocaleString()} of ${order.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">{order.createdAt}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Est. Completion</p>
                  <p className="font-semibold">{order.estimatedCompletion}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Order Confirmation
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Production Drawings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Installation Guide
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      {nextPayment && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Payment Type:</span>
                  <span className="font-semibold capitalize">{nextPayment.type} Payment</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Amount Due:</span>
                  <span className="font-semibold">${nextPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Due Date:</span>
                  <span className="font-semibold">{nextPayment.dueDate}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowPaymentDialog(false)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ${nextPayment.amount.toLocaleString()}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};