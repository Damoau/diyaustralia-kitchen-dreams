import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface DoorStyle {
  id: string;
  name: string;
  description: string;
  base_rate_per_sqm: number;
  active: boolean;
}

interface DoorStyleEditDialogProps {
  doorStyle: DoorStyle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (doorStyle: Partial<DoorStyle>) => void;
}

const DoorStyleEditDialog = ({ doorStyle, open, onOpenChange, onSave }: DoorStyleEditDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_rate_per_sqm: 0,
    active: true
  });

  useEffect(() => {
    if (doorStyle) {
      setFormData({
        name: doorStyle.name,
        description: doorStyle.description || "",
        base_rate_per_sqm: doorStyle.base_rate_per_sqm,
        active: doorStyle.active
      });
    } else {
      setFormData({
        name: "",
        description: "",
        base_rate_per_sqm: 0,
        active: true
      });
    }
  }, [doorStyle]);

  const handleSave = () => {
    onSave({
      id: doorStyle?.id,
      ...formData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{doorStyle ? 'Edit Door Style' : 'Add New Door Style'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Door style name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Door style description"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rate">Base Rate per SQM ($)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.base_rate_per_sqm}
              onChange={(e) => setFormData({...formData, base_rate_per_sqm: parseFloat(e.target.value) || 0})}
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({...formData, active: checked})}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoorStyleEditDialog;