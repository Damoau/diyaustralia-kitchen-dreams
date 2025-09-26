import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssemblyJob } from '@/hooks/useAssemblyJobs';

interface EditAssemblyJobDialogProps {
  open: boolean;
  onClose: () => void;
  job: AssemblyJob | null;
  onUpdate: (id: string, updates: any) => Promise<void>;
}

export const EditAssemblyJobDialog: React.FC<EditAssemblyJobDialogProps> = ({
  open,
  onClose,
  job,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    status: '',
    components_included: '',
    hours_estimated: '',
    hours_actual: '',
    price_ex_gst: '',
    scheduled_for: '',
    assigned_team: '',
    customer_notes: '',
    technician_notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job && open) {
      setFormData({
        status: job.status,
        components_included: job.components_included || '',
        hours_estimated: job.hours_estimated?.toString() || '',
        hours_actual: job.hours_actual?.toString() || '',
        price_ex_gst: job.price_ex_gst.toString(),
        scheduled_for: job.scheduled_for ? job.scheduled_for.slice(0, 16) : '', // Format for datetime-local
        assigned_team: job.assigned_team || '',
        customer_notes: job.customer_notes || '',
        technician_notes: job.technician_notes || '',
      });
    }
  }, [job, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;

    setLoading(true);
    try {
      const updates: Partial<AssemblyJob> = {
        status: formData.status as any,
        components_included: formData.components_included,
        hours_estimated: formData.hours_estimated ? parseFloat(formData.hours_estimated) : null,
        hours_actual: formData.hours_actual ? parseFloat(formData.hours_actual) : null,
        price_ex_gst: parseFloat(formData.price_ex_gst),
        scheduled_for: formData.scheduled_for || null,
        assigned_team: formData.assigned_team || null,
        customer_notes: formData.customer_notes || null,
        technician_notes: formData.technician_notes || null,
      };

      await onUpdate(job.id, updates);
      onClose();
    } catch (error) {
      console.error('Error updating assembly job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Assembly Job</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_ex_gst">Price (Ex GST)</Label>
              <Input
                id="price_ex_gst"
                type="number"
                step="0.01"
                value={formData.price_ex_gst}
                onChange={(e) => setFormData({...formData, price_ex_gst: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="components_included">Components Included</Label>
            <Textarea
              id="components_included"
              value={formData.components_included}
              onChange={(e) => setFormData({...formData, components_included: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours_estimated">Estimated Hours</Label>
              <Input
                id="hours_estimated"
                type="number"
                step="0.5"
                value={formData.hours_estimated}
                onChange={(e) => setFormData({...formData, hours_estimated: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_actual">Actual Hours</Label>
              <Input
                id="hours_actual"
                type="number"
                step="0.5"
                value={formData.hours_actual}
                onChange={(e) => setFormData({...formData, hours_actual: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_team">Assigned Team</Label>
              <Input
                id="assigned_team"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_notes">Customer Notes</Label>
              <Textarea
                id="customer_notes"
                value={formData.customer_notes}
                onChange={(e) => setFormData({...formData, customer_notes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician_notes">Technician Notes</Label>
              <Textarea
                id="technician_notes"
                value={formData.technician_notes}
                onChange={(e) => setFormData({...formData, technician_notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};