import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CabinetTypePricingSetup } from "./CabinetTypePricingSetup";
import { CabinetHardwareSetup } from "./CabinetHardwareSetup";

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  door_count: number;
  drawer_count: number;
  active: boolean;
}

interface CabinetTypeEditDialogProps {
  cabinetType: CabinetType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cabinetType: Partial<CabinetType>) => void;
}

const CabinetTypeEditDialog = ({ cabinetType, open, onOpenChange, onSave }: CabinetTypeEditDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    default_width_mm: 300,
    default_height_mm: 720,
    default_depth_mm: 560,
    min_width_mm: 100,
    max_width_mm: 1200,
    min_height_mm: 200,
    max_height_mm: 1000,
    min_depth_mm: 200,
    max_depth_mm: 800,
    drawer_count: 0,
    active: true,
    min_price: 0,
    max_price: 10000
  });

  useEffect(() => {
    if (cabinetType) {
      setFormData({
        name: cabinetType.name,
        category: cabinetType.category,
        subcategory: (cabinetType as any).subcategory || "",
        default_width_mm: cabinetType.default_width_mm,
        default_height_mm: cabinetType.default_height_mm,
        default_depth_mm: cabinetType.default_depth_mm,
        min_width_mm: (cabinetType as any).min_width_mm || 100,
        max_width_mm: (cabinetType as any).max_width_mm || 1200,
        min_height_mm: (cabinetType as any).min_height_mm || 200,
        max_height_mm: (cabinetType as any).max_height_mm || 1000,
        min_depth_mm: (cabinetType as any).min_depth_mm || 200,
        max_depth_mm: (cabinetType as any).max_depth_mm || 800,
        drawer_count: cabinetType.drawer_count,
        active: cabinetType.active,
        min_price: (cabinetType as any).min_price || 0,
        max_price: (cabinetType as any).max_price || 10000
      });
    } else {
      setFormData({
        name: "",
        category: "",
        subcategory: "",
        default_width_mm: 300,
        default_height_mm: 720,
        default_depth_mm: 560,
        min_width_mm: 100,
        max_width_mm: 1200,
        min_height_mm: 200,
        max_height_mm: 1000,
        min_depth_mm: 200,
        max_depth_mm: 800,
        drawer_count: 0,
        active: true,
        min_price: 0,
        max_price: 10000
      });
    }
  }, [cabinetType]);

  const handleSave = () => {
    onSave({
      id: cabinetType?.id,
      ...formData
    });
  };

  const categories = ["base", "wall", "tall", "panels"];
  
  // Dynamic subcategories based on selected category
  const getSubcategoriesForCategory = (category: string) => {
    switch (category) {
      case 'base':
        return [
          { value: 'doors', label: 'Doors' },
          { value: 'drawers', label: 'Drawers' },
          { value: 'corners', label: 'Corners' },
          { value: 'appliance_cabinets', label: 'Appliance Cabinets' },
          { value: 'bin_cabinets', label: 'Bin Cabinets' }
        ];
      case 'wall':
        return [
          { value: 'doors', label: 'Doors' },
          { value: 'appliance_cabinets', label: 'Appliance Cabinets' },
          { value: 'lift_up_systems', label: 'Lift-Up Systems' },
          { value: 'corners', label: 'Corners' }
        ];
      case 'tall':
        return [
          { value: 'doors', label: 'Doors' },
          { value: 'corners', label: 'Corners' },
          { value: 'appliance_cabinets', label: 'Appliance Cabinets' }
        ];
      case 'panels':
        return [
          { value: 'base', label: 'Base' },
          { value: 'top', label: 'Top' },
          { value: 'pantry', label: 'Pantry' }
        ];
      default:
        return [];
    }
  };

  const availableSubcategories = getSubcategoriesForCategory(formData.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cabinetType ? 'Edit Cabinet Type' : 'Add Cabinet Type'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="hardware" disabled={!cabinetType}>Hardware</TabsTrigger>
            <TabsTrigger value="pricing" disabled={!cabinetType}>Pricing Setup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Filter Category</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                    disabled={!formData.category || availableSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select filter option" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.value} value={subcategory.value}>
                          {subcategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="width">Default Width (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.default_width_mm}
                    onChange={(e) => setFormData({ ...formData, default_width_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Default Height (mm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.default_height_mm}
                    onChange={(e) => setFormData({ ...formData, default_height_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Default Depth (mm)</Label>
                  <Input
                    id="depth"
                    type="number"
                    value={formData.default_depth_mm}
                    onChange={(e) => setFormData({ ...formData, default_depth_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Min/Max Dimensions */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Dimension Constraints</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Width Min/Max */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Width Range</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <Label htmlFor="min_width" className="text-xs">Min (mm)</Label>
                        <Input
                          id="min_width"
                          type="number"
                          value={formData.min_width_mm}
                          onChange={(e) => setFormData({ ...formData, min_width_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_width" className="text-xs">Max (mm)</Label>
                        <Input
                          id="max_width"
                          type="number"
                          value={formData.max_width_mm}
                          onChange={(e) => setFormData({ ...formData, max_width_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Height Min/Max */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Height Range</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <Label htmlFor="min_height" className="text-xs">Min (mm)</Label>
                        <Input
                          id="min_height"
                          type="number"
                          value={formData.min_height_mm}
                          onChange={(e) => setFormData({ ...formData, min_height_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_height" className="text-xs">Max (mm)</Label>
                        <Input
                          id="max_height"
                          type="number"
                          value={formData.max_height_mm}
                          onChange={(e) => setFormData({ ...formData, max_height_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Depth Min/Max */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Depth Range</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <Label htmlFor="min_depth" className="text-xs">Min (mm)</Label>
                        <Input
                          id="min_depth"
                          type="number"
                          value={formData.min_depth_mm}
                          onChange={(e) => setFormData({ ...formData, min_depth_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_depth" className="text-xs">Max (mm)</Label>
                        <Input
                          id="max_depth"
                          type="number"
                          value={formData.max_depth_mm}
                          onChange={(e) => setFormData({ ...formData, max_depth_mm: parseInt(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="min_price">Min Price ($)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    step="0.01"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_price">Max Price ($)</Label>
                  <Input
                    id="max_price"
                    type="number"
                    step="0.01"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
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
          </TabsContent>
          
          <TabsContent value="hardware">
            {cabinetType && cabinetType.id ? (
              <CabinetHardwareSetup cabinetTypeId={cabinetType.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please save the cabinet type first to configure hardware requirements.</p>
                <p className="text-sm mt-2">Click "Save" in the Basic Info tab, then return here to set up hardware.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pricing">
            {cabinetType && cabinetType.id ? (
              <CabinetTypePricingSetup cabinetTypeId={cabinetType.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please save the cabinet type first to configure pricing settings.</p>
                <p className="text-sm mt-2">Click "Save" in the Basic Info tab, then return here to set up pricing.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CabinetTypeEditDialog;