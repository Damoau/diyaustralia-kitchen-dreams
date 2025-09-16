import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Truck, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  user_id: string;
  shipments?: any[]; // Using any[] to match database response
}

interface Shipment {
  id: string;
  order_id: string;
  method?: string;
  carrier?: string;
  status: string;
  tracking_number?: string;
  estimated_delivery?: string;
  shipment_packages?: ShipmentPackage[];
  exceptions?: Exception[];
}

interface ShipmentPackage {
  id: string;
  kind: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
  fragile: boolean;
  contents: any;
}

interface Exception {
  id: string;
  type: string;
  severity: string;
  description: string;
  resolution_status: string;
}

const FulfilmentBoard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateShipment, setShowCreateShipment] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const columns = [
    { status: 'ready_to_pack', title: 'Ready to Pack', color: 'bg-blue-50' },
    { status: 'packed', title: 'Packed', color: 'bg-yellow-50' },
    { status: 'booked', title: 'Booked', color: 'bg-purple-50' },
    { status: 'dispatched', title: 'Dispatched', color: 'bg-orange-50' },
    { status: 'out_for_delivery', title: 'Out for Delivery', color: 'bg-green-50' },
    { status: 'delivered', title: 'Delivered', color: 'bg-gray-50' },
    { status: 'exception', title: 'Exceptions', color: 'bg-red-50' }
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Get orders that are ready for fulfilment
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          shipments(
            *,
            shipment_packages(*),
            exceptions(*)
          )
        `)
        .in('status', ['paid', 'approved', 'ready_for_dispatch'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(ordersData || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderColumn = (order: Order): string => {
    if (order.shipments && order.shipments.length > 0) {
      const latestShipment = order.shipments[order.shipments.length - 1];
      if (latestShipment.exceptions && latestShipment.exceptions.length > 0) {
        return 'exception';
      }
      return latestShipment.status || 'pending';
    }
    
    // Default column based on order status
    if (order.status === 'ready_for_dispatch') return 'ready_to_pack';
    if (order.status === 'paid') return 'ready_to_pack';
    return 'ready_to_pack';
  };

  const getOrdersByColumn = (columnStatus: string): Order[] => {
    return orders.filter(order => getOrderColumn(order) === columnStatus);
  };

  const createShipment = async (orderData: any) => {
    try {
      const response = await supabase.functions.invoke('orders-fulfilment', {
        body: {
          order_id: orderData.order_id,
          method: orderData.method,
          carrier: orderData.carrier,
          delivery_address: orderData.delivery_address,
          packages: orderData.packages,
          notes: orderData.notes
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Shipment created successfully",
      });

      setShowCreateShipment(false);
      loadOrders();
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to create shipment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      booked: "default",
      dispatched: "default",
      delivered: "default",
      exception: "destructive"
    };
    
    return <Badge variant={variants[status] || "outline"}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading fulfilment board...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fulfilment Board</h1>
        <Button onClick={() => setShowCreateShipment(true)}>
          <Package className="w-4 h-4 mr-2" />
          Create Shipment
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {columns.map((column) => (
          <div key={column.status} className={`${column.color} rounded-lg p-4 min-h-[600px]`}>
            <h3 className="font-semibold mb-4 text-center">
              {column.title}
              <Badge variant="outline" className="ml-2">
                {getOrdersByColumn(column.status).length}
              </Badge>
            </h3>
            
            <div className="space-y-3">
              {getOrdersByColumn(column.status).map((order) => (
                <Card 
                  key={order.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{order.order_number}</span>
                        {getStatusBadge(getOrderColumn(order))}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          ${order.total_amount.toFixed(2)}
                        </div>
                        
                        {order.shipments && order.shipments.length > 0 && (
                          <div className="flex items-center">
                            <Truck className="w-3 h-3 mr-1" />
                            {order.shipments[0]?.carrier || 'TBA'}
                          </div>
                        )}
                        
                        {order.shipments?.[0]?.exceptions && order.shipments[0]?.exceptions?.length > 0 && (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {order.shipments[0]?.exceptions?.length} issue(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="shipments">Shipments</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Order Number</Label>
                    <div className="text-sm">{selectedOrder.order_number}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="text-sm">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <div className="text-sm">${selectedOrder.total_amount.toFixed(2)}</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="shipments" className="space-y-4">
                {selectedOrder.shipments && selectedOrder.shipments.length > 0 ? (
                  selectedOrder.shipments.map((shipment) => (
                    <Card key={shipment.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Method</Label>
                            <div className="text-sm capitalize">{shipment.method || 'TBA'}</div>
                          </div>
                          <div>
                            <Label>Carrier</Label>
                            <div className="text-sm">{shipment.carrier || 'TBA'}</div>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <div className="text-sm">{getStatusBadge(shipment.status)}</div>
                          </div>
                          {shipment.tracking_number && (
                            <div>
                              <Label>Tracking</Label>
                              <div className="text-sm">{shipment.tracking_number}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    No shipments created yet
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="packages" className="space-y-4">
                {selectedOrder.shipments?.flatMap(s => s.shipment_packages || []).length > 0 ? (
                  selectedOrder.shipments.flatMap(s => s.shipment_packages || []).map((pkg) => (
                    <Card key={pkg.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <Label>Type</Label>
                            <div className="text-sm capitalize">{pkg.kind}</div>
                          </div>
                          <div>
                            <Label>Dimensions (mm)</Label>
                            <div className="text-sm">{pkg.length_mm} × {pkg.width_mm} × {pkg.height_mm}</div>
                          </div>
                          <div>
                            <Label>Weight</Label>
                            <div className="text-sm">{pkg.weight_kg}kg</div>
                          </div>
                          <div>
                            <Label>Fragile</Label>
                            <div className="text-sm">{pkg.fragile ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    No packages defined yet
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Shipment Dialog */}
      <CreateShipmentDialog
        open={showCreateShipment}
        onClose={() => setShowCreateShipment(false)}
        onSubmit={createShipment}
        orders={orders.filter(o => !o.shipments || o.shipments.length === 0)}
      />
    </div>
  );
};

// Create Shipment Dialog Component
const CreateShipmentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  orders: Order[];
}> = ({ open, onClose, onSubmit, orders }) => {
  const [formData, setFormData] = useState({
    order_id: '',
    method: 'door',
    carrier: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Shipment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order_id">Order</Label>
            <Select value={formData.order_id} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, order_id: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} - ${order.total_amount.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="method">Delivery Method</Label>
            <Select value={formData.method} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, method: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Customer Pickup</SelectItem>
                <SelectItem value="depot">Depot Delivery</SelectItem>
                <SelectItem value="door">Door to Door</SelectItem>
                <SelectItem value="assembly">Door + Assembly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Select value={formData.carrier} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, carrier: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TNT">TNT</SelectItem>
                <SelectItem value="Allied">Allied Express</SelectItem>
                <SelectItem value="StarTrack">StarTrack</SelectItem>
                <SelectItem value="Hunter">Hunter Express</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special instructions..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Shipment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FulfilmentBoard;