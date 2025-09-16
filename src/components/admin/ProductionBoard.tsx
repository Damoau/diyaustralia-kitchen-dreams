import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Package, Paintbrush, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProductionOrder {
  id: string;
  order_number: string;
  customer_name: string;
  production_status: string;
  stage: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  cutlist_generated: boolean;
  qc_passed: boolean;
  notes: string;
}

interface ProductionUpdate {
  id: string;
  stage: string;
  notes: string;
  created_at: string;
  created_by: string;
}

const PRODUCTION_STAGES = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-gray-500' },
  { value: 'cutlist_generated', label: 'Cut List Generated', icon: Calendar, color: 'bg-blue-500' },
  { value: 'cutting', label: 'Cutting', icon: Package, color: 'bg-yellow-500' },
  { value: 'painting', label: 'Painting', icon: Paintbrush, color: 'bg-purple-500' },
  { value: 'drying', label: 'Drying', icon: Clock, color: 'bg-orange-500' },
  { value: 'quality_check', label: 'Quality Check', icon: CheckCircle, color: 'bg-indigo-500' },
  { value: 'packaging', label: 'Packaging', icon: Package, color: 'bg-green-500' },
  { value: 'ready_for_shipping', label: 'Ready for Shipping', icon: CheckCircle, color: 'bg-emerald-500' },
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  urgent: 'bg-red-200 text-red-900 border-red-300'
};

export function ProductionBoard() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [updates, setUpdates] = useState<ProductionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadProductionOrders();
  }, []);

  const loadProductionOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          production_status,
          created_at,
          notes
        `)
        .in('status', ['confirmed', 'in_production', 'ready_for_shipping'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedOrders = data.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: 'Customer', // Simplified for now
        production_status: order.production_status || 'pending',
        stage: order.production_status || 'pending',
        priority: 'medium' as const,
        due_date: null,
        created_at: order.created_at,
        cutlist_generated: false,
        qc_passed: false,
        notes: order.notes || ''
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading production orders:', error);
      toast({
        title: "Error",
        description: "Failed to load production orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductionUpdates = async (orderId: string) => {
    try {
      const { data } = await supabase.functions.invoke('orders-production', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (data?.updates) {
        setUpdates(data.updates);
      }
    } catch (error) {
      console.error('Error loading production updates:', error);
    }
  };

  const updateProductionStage = async () => {
    if (!selectedOrder || !newStage) return;

    try {
      const updateData = {
        orderId: selectedOrder.id,
        stage: newStage,
        notes: updateNotes || undefined
      };

      const { error } = await supabase.functions.invoke('orders-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Production stage updated successfully"
      });

      // Refresh data
      await loadProductionOrders();
      if (selectedOrder) {
        await loadProductionUpdates(selectedOrder.id);
      }

      // Reset form
      setNewStage('');
      setUpdateNotes('');
      setUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error updating production stage:', error);
      toast({
        title: "Error",
        description: "Failed to update production stage",
        variant: "destructive"
      });
    }
  };

  const getStageInfo = (stage: string) => {
    return PRODUCTION_STAGES.find(s => s.value === stage) || PRODUCTION_STAGES[0];
  };

  const getOrdersByStage = (stage: string) => {
    return orders.filter(order => order.stage === stage);
  };

  const handleOrderClick = async (order: ProductionOrder) => {
    setSelectedOrder(order);
    await loadProductionUpdates(order.id);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading production orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Production Board</h2>
          <p className="text-muted-foreground">Manage production workflow and track progress</p>
        </div>
      </div>

      {/* Production Stages Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-4 overflow-x-auto">
        {PRODUCTION_STAGES.map((stage) => {
          const stageOrders = getOrdersByStage(stage.value);
          const StageIcon = stage.icon;

          return (
            <Card key={stage.value} className="min-w-[250px]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    {stageOrders.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm">{order.order_number}</div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${PRIORITY_COLORS[order.priority as keyof typeof PRIORITY_COLORS]}`}
                        >
                          {order.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{order.customer_name}</div>
                      {order.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.due_date).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex gap-1">
                        {order.cutlist_generated && (
                          <Badge variant="secondary" className="text-xs">Cut List</Badge>
                        )}
                        {order.qc_passed && (
                          <Badge variant="secondary" className="text-xs">QC ✓</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Production Details - {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <div className="text-sm text-muted-foreground">{selectedOrder.customer_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Stage</Label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStageInfo(selectedOrder.stage).color}`} />
                    <span className="text-sm">{getStageInfo(selectedOrder.stage).label}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${PRIORITY_COLORS[selectedOrder.priority as keyof typeof PRIORITY_COLORS]}`}
                  >
                    {selectedOrder.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.due_date ? new Date(selectedOrder.due_date).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>

              {/* Production History */}
              <div>
                <Label className="text-sm font-medium">Production History</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {updates.length > 0 ? (
                    updates.map((update) => (
                      <div key={update.id} className="flex items-start gap-3 p-2 bg-muted rounded">
                        <div className={`w-2 h-2 rounded-full mt-1 ${getStageInfo(update.stage).color}`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{getStageInfo(update.stage).label}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.created_at).toLocaleString()}
                            </span>
                          </div>
                          {update.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{update.notes}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No production updates yet</div>
                  )}
                </div>
              </div>

              {/* Update Production Stage */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium">Update Production Stage</Label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select next stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div>
                  <Label htmlFor="update-notes" className="text-sm font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="update-notes"
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Add any notes about this update..."
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                  <Button onClick={updateProductionStage} disabled={!newStage}>
                    Update Stage
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}