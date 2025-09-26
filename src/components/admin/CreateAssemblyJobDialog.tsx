import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateAssemblyJobDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (jobData: any) => Promise<void>;
}

interface Order {
  id: string;
  order_number: string;
  user_id?: string;
}

export const CreateAssemblyJobDialog: React.FC<CreateAssemblyJobDialogProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({
    order_id: '',
    components_included: '',
    hours_estimated: '',
    price_ex_gst: '',
    customer_notes: '',
    scheduled_for: '',
    assigned_team: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadOrders();
    }
  }, [open]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, user_id')
        .in('status', ['confirmed', 'pending']) // Show confirmed and pending orders
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.order_id || !formData.components_included || !formData.price_ex_gst) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        order_id: formData.order_id,
        components_included: formData.components_included,
        hours_estimated: formData.hours_estimated ? parseFloat(formData.hours_estimated) : null,
        price_ex_gst: parseFloat(formData.price_ex_gst),
        customer_notes: formData.customer_notes || null,
        scheduled_for: formData.scheduled_for || null,
        assigned_team: formData.assigned_team || null,
      });

      // Reset form
      setFormData({
        order_id: '',
        components_included: '',
        hours_estimated: '',
        price_ex_gst: '',
        customer_notes: '',
        scheduled_for: '',
        assigned_team: '',
      });

      onClose();
    } catch (error) {
      console.error('Error creating assembly job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Assembly Job</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_id">Order *</Label>
              <Select value={formData.order_id} onValueChange={(value) => setFormData({...formData, order_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_ex_gst">Price (Ex GST) *</Label>
              <Input
                id="price_ex_gst"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price_ex_gst}
                onChange={(e) => setFormData({...formData, price_ex_gst: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="components_included">Components Included *</Label>
            <Textarea
              id="components_included"
              placeholder="e.g., Base cabinets x4, Wall cabinets x6, Pantry x1"
              value={formData.components_included}
              onChange={(e) => setFormData({...formData, components_included: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours_estimated">Estimated Hours</Label>
              <Input
                id="hours_estimated"
                type="number"
                step="0.5"
                placeholder="e.g., 8.0"
                value={formData.hours_estimated}
                onChange={(e) => setFormData({...formData, hours_estimated: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_team">Assigned Team</Label>
              <Input
                id="assigned_team"
                placeholder="e.g., Team A, John & Mike"
                value={formData.assigned_team}
                onChange={(e) => setFormData({...formData, assigned_team: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_for">Scheduled For</Label>
            <Input
              id="scheduled_for"
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData({...formData, scheduled_for: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_notes">Customer Notes</Label>
            <Textarea
              id="customer_notes"
              placeholder="Special instructions, access notes, etc."
              value={formData.customer_notes}
              onChange={(e) => setFormData({...formData, customer_notes: e.target.value})}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};