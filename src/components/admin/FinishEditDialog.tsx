import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Finish {
  id: string;
  name: string;
  finish_type: string;
  rate_per_sqm: number;
  active: boolean;
  brand_id: string;
}

interface Brand {
  id: string;
  name: string;
}

interface FinishEditDialogProps {
  finish: Finish | null;
  brands: Brand[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (finish: Partial<Finish>) => void;
}

const FinishEditDialog = ({ finish, brands, open, onOpenChange, onSave }: FinishEditDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    finish_type: "",
    rate_per_sqm: 0,
    active: true,
    brand_id: ""
  });

  useEffect(() => {
    if (finish) {
      setFormData({
        name: finish.name,
        finish_type: finish.finish_type,
        rate_per_sqm: finish.rate_per_sqm,
        active: finish.active,
        brand_id: finish.brand_id
      });
    } else {
      setFormData({
        name: "",
        finish_type: "",
        rate_per_sqm: 0,
        active: true,
        brand_id: ""
      });
    }
  }, [finish]);

  const handleSave = () => {
    onSave({
      id: finish?.id,
      ...formData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{finish ? 'Edit Finish' : 'Add New Finish'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Finish name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brand">Brand</Label>
            <Select value={formData.brand_id} onValueChange={(value) => setFormData({...formData, brand_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="finish_type">Finish Type</Label>
            <Input
              id="finish_type"
              value={formData.finish_type}
              onChange={(e) => setFormData({...formData, finish_type: e.target.value})}
              placeholder="e.g., laminex, polytec"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rate">Rate per SQM ($)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.rate_per_sqm}
              onChange={(e) => setFormData({...formData, rate_per_sqm: parseFloat(e.target.value) || 0})}
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

export default FinishEditDialog;