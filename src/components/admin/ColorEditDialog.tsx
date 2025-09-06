import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Color {
  id: string;
  name: string;
  hex_code: string;
  image_url: string;
  active: boolean;
  finish_id: string;
  surcharge_rate_per_sqm: number;
}

interface Finish {
  id: string;
  name: string;
}

interface ColorEditDialogProps {
  color: Color | null;
  finishes: Finish[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (color: Partial<Color>) => void;
}

const ColorEditDialog = ({ color, finishes, open, onOpenChange, onSave }: ColorEditDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    hex_code: "",
    image_url: "",
    active: true,
    finish_id: "",
    surcharge_rate_per_sqm: 0
  });

  useEffect(() => {
    if (color) {
      setFormData({
        name: color.name,
        hex_code: color.hex_code || "",
        image_url: color.image_url || "",
        active: color.active,
        finish_id: color.finish_id,
        surcharge_rate_per_sqm: color.surcharge_rate_per_sqm
      });
    } else {
      setFormData({
        name: "",
        hex_code: "",
        image_url: "",
        active: true,
        finish_id: "",
        surcharge_rate_per_sqm: 0
      });
    }
  }, [color]);

  const handleSave = () => {
    onSave({
      id: color?.id,
      ...formData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{color ? 'Edit Color' : 'Add New Color'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Color name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="finish">Finish</Label>
            <Select value={formData.finish_id} onValueChange={(value) => setFormData({...formData, finish_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select finish" />
              </SelectTrigger>
              <SelectContent>
                {finishes.map((finish) => (
                  <SelectItem key={finish.id} value={finish.id}>
                    {finish.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hex_code">Hex Code</Label>
            <div className="flex space-x-2">
              <Input
                id="hex_code"
                value={formData.hex_code}
                onChange={(e) => setFormData({...formData, hex_code: e.target.value})}
                placeholder="#FFFFFF"
              />
              <div 
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: formData.hex_code || '#ccc' }}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="surcharge">Surcharge per SQM ($)</Label>
            <Input
              id="surcharge"
              type="number"
              step="0.01"
              value={formData.surcharge_rate_per_sqm}
              onChange={(e) => setFormData({...formData, surcharge_rate_per_sqm: parseFloat(e.target.value) || 0})}
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

export default ColorEditDialog;