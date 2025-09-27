import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Building2, MessageSquare } from 'lucide-react';

interface ItemNamingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { itemName: string; jobReference?: string; notes?: string }) => void;
  loading?: boolean;
}

export const ItemNamingDialog: React.FC<ItemNamingDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false
}) => {
  const [itemName, setItemName] = useState('');
  const [jobReference, setJobReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!itemName.trim()) return;
    
    onConfirm({
      itemName: itemName.trim(),
      jobReference: jobReference.trim() || undefined,
      notes: notes.trim() || undefined
    });
    
    // Reset form
    setItemName('');
    setJobReference('');
    setNotes('');
  };

  const handleCancel = () => {
    setItemName('');
    setJobReference('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Name Your Quote Item
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-name" className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Item Name *
            </Label>
            <Input
              id="item-name"
              placeholder="e.g. Kitchen, Bedroom, Office"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              maxLength={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Give this item a memorable name (e.g., "Main Kitchen", "Master Bedroom")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-reference" className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Job Reference
            </Label>
            <Input
              id="job-reference"
              placeholder="e.g. Customer name, job number"
              value={jobReference}
              onChange={(e) => setJobReference(e.target.value)}
              maxLength={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add customer name, job number, or project reference
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any special requirements or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add special requirements, installation notes, etc.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1"
            disabled={!itemName.trim() || loading}
          >
            {loading ? 'Adding...' : 'Add to Quote'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};