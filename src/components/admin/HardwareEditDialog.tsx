import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HardwareType {
  id: string;
  name: string;
  category: string;
  description: string;
  active: boolean;
}

interface HardwareBrand {
  id: string;
  name: string;
  description: string;
  website_url: string;
  active: boolean;
}

interface HardwareProduct {
  id: string;
  hardware_type_id: string;
  hardware_brand_id: string;
  name: string;
  model_number: string;
  cost_per_unit: number;
  description: string;
  active: boolean;
}

interface ProductRange {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
}

interface HardwareEditDialogProps {
  type: 'hardware_type' | 'hardware_brand' | 'hardware_product' | 'product_range';
  item: HardwareType | HardwareBrand | HardwareProduct | ProductRange | null;
  hardwareTypes?: HardwareType[];
  hardwareBrands?: HardwareBrand[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: any) => void;
}

const HARDWARE_CATEGORIES = [
  'hinge', 'runner', 'handle', 'lock', 'mechanism', 'drawer', 'shelf', 'lighting'
];

const HardwareEditDialog = ({ 
  type, 
  item, 
  hardwareTypes = [], 
  hardwareBrands = [], 
  open, 
  onOpenChange, 
  onSave 
}: HardwareEditDialogProps) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      // Reset form based on type
      switch (type) {
        case 'hardware_type':
          setFormData({ name: "", category: "", description: "", active: true });
          break;
        case 'hardware_brand':
          setFormData({ name: "", description: "", website_url: "", active: true });
          break;
        case 'hardware_product':
          setFormData({ 
            hardware_type_id: "", 
            hardware_brand_id: "", 
            name: "", 
            model_number: "", 
            cost_per_unit: 0, 
            description: "", 
            active: true 
          });
          break;
        case 'product_range':
          setFormData({ name: "", description: "", sort_order: 0, active: true });
          break;
      }
    }
  }, [item, type]);

  const handleSave = () => {
    onSave({
      id: item?.id,
      ...formData
    });
  };

  const renderFormFields = () => {
    switch (type) {
      case 'hardware_type':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Hardware type name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category || ""} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {HARDWARE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Hardware type description"
              />
            </div>
          </>
        );

      case 'hardware_brand':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Brand name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                value={formData.website_url || ""}
                onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                placeholder="https://www.brand.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brand description"
              />
            </div>
          </>
        );

      case 'hardware_product':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Product name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hardware_type">Hardware Type</Label>
              <Select value={formData.hardware_type_id || ""} onValueChange={(value) => setFormData({...formData, hardware_type_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware type" />
                </SelectTrigger>
                <SelectContent>
                  {hardwareTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hardware_brand">Brand</Label>
              <Select value={formData.hardware_brand_id || ""} onValueChange={(value) => setFormData({...formData, hardware_brand_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {hardwareBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model_number">Model Number</Label>
              <Input
                id="model_number"
                value={formData.model_number || ""}
                onChange={(e) => setFormData({...formData, model_number: e.target.value})}
                placeholder="Model number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                value={formData.cost_per_unit || 0}
                onChange={(e) => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Product description"
              />
            </div>
          </>
        );

      case 'product_range':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="name">Range Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Range name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order || 0}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Range description"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    const titles = {
      hardware_type: 'Hardware Type',
      hardware_brand: 'Hardware Brand',
      hardware_product: 'Hardware Product',
      product_range: 'Product Range'
    };
    return `${item ? 'Edit' : 'Add New'} ${titles[type]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {renderFormFields()}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active || false}
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

export default HardwareEditDialog;