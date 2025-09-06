import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Brand {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface BrandEditDialogProps {
  brand: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (brand: Partial<Brand>) => void;
}

const BrandEditDialog = ({ brand, open, onOpenChange, onSave }: BrandEditDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || "",
        active: brand.active
      });
    } else {
      setFormData({
        name: "",
        description: "",
        active: true
      });
    }
  }, [brand]);

  const handleSave = () => {
    onSave({
      id: brand?.id,
      ...formData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Brand name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brand description"
              rows={3}
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

export default BrandEditDialog;