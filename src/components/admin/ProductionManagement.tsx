import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Hammer, Clock, CheckCircle, AlertTriangle, Factory, Truck } from 'lucide-react';

interface ProductionOrder {
  id: string;
  order_number: string;
  production_status: string;
  customer_name?: string;
  total_amount: number;
  created_at: string;
  target_completion?: string;
  production_notes?: string;
  order_items: Array<{
    id: string;
    cabinet_type_id: string;
    quantity: number;
    width_mm: number;
    height_mm: number;
    depth_mm: number;
  }>;
}

export const ProductionManagement = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['production-orders', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            cabinet_type_id,
            quantity,
            width_mm,
            height_mm,
            depth_mm
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('production_status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductionOrder[];
    },
  });

  // Update production status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      const updateData: any = { production_status: status };
      if (notes) updateData.production_notes = notes;
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast({
        title: "Status Updated",
        description: "Production status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update production status.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'awaiting_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'cutting': return 'bg-orange-100 text-orange-800';
      case 'assembly': return 'bg-purple-100 text-purple-800';
      case 'finishing': return 'bg-indigo-100 text-indigo-800';
      case 'quality_check': return 'bg-pink-100 text-pink-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started': return <Clock className="h-4 w-4" />;
      case 'awaiting_approval': return <AlertTriangle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'cutting': 
      case 'assembly': 
      case 'finishing': return <Hammer className="h-4 w-4" />;
      case 'quality_check': return <Factory className="h-4 w-4" />;
      case 'completed': return <Truck className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const productionStages = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'awaiting_approval', label: 'Awaiting Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'cutting', label: 'Cutting' },
    { value: 'assembly', label: 'Assembly' },
    { value: 'finishing', label: 'Finishing' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'completed', label: 'Completed' },
  ];

  if (isLoading) {
    return <div>Loading production orders...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Production Management</h1>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {productionStages.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productionStages.slice(0, 4).map((stage) => (
              <div key={stage.value} className="space-y-4">
                <h3 className="font-semibold text-lg">{stage.label}</h3>
                <div className="space-y-3">
                  {orders?.filter(order => order.production_status === stage.value).map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm">{order.order_number}</CardTitle>
                          <Badge className={`${getStatusColor(order.production_status)} flex items-center gap-1`}>
                            {getStatusIcon(order.production_status)}
                            <span className="text-xs">{stage.label}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {order.customer_name || 'Customer'}
                        </p>
                        <p className="text-sm font-medium mb-2">
                          ${order.total_amount?.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {order.order_items?.length || 0} items
                        </p>
                        <Select
                          value={order.production_status}
                          onValueChange={(value) => updateStatusMutation.mutate({ 
                            orderId: order.id, 
                            status: value 
                          })}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {productionStages.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {orders?.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name || 'Customer'} • ${order.total_amount?.toFixed(2)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.production_status)} flex items-center gap-1`}>
                      {getStatusIcon(order.production_status)}
                      {order.production_status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">Production Status</label>
                      <Select
                        value={order.production_status}
                        onValueChange={(value) => updateStatusMutation.mutate({ 
                          orderId: order.id, 
                          status: value 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {productionStages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Production Notes</label>
                      <Textarea
                        value={order.production_notes || ''}
                        onChange={(e) => {
                          // Debounced update would be better in real implementation
                          updateStatusMutation.mutate({ 
                            orderId: order.id, 
                            status: order.production_status,
                            notes: e.target.value 
                          });
                        }}
                        placeholder="Add production notes..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Order Items ({order.order_items?.length || 0})</h4>
                    <div className="text-sm text-muted-foreground">
                      {order.order_items?.slice(0, 3).map((item, index) => (
                        <span key={item.id}>
                          {item.quantity}x Cabinet ({item.width_mm}×{item.height_mm}×{item.depth_mm}mm)
                          {index < Math.min(2, (order.order_items?.length || 1) - 1) && ', '}
                        </span>
                      ))}
                      {(order.order_items?.length || 0) > 3 && ` +${(order.order_items?.length || 0) - 3} more`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {orders?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No production orders found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};