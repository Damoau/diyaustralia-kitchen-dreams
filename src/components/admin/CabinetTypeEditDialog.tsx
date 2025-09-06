import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CabinetTypePricingSetup } from "./CabinetTypePricingSetup";

interface CabinetType {
  id: string;
  name: string;
  category: string;
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
    default_width_mm: 300,
    default_height_mm: 720,
    default_depth_mm: 560,
    door_count: 0,
    drawer_count: 0,
    active: true
  });

  useEffect(() => {
    if (cabinetType) {
      setFormData({
        name: cabinetType.name,
        category: cabinetType.category,
        default_width_mm: cabinetType.default_width_mm,
        default_height_mm: cabinetType.default_height_mm,
        default_depth_mm: cabinetType.default_depth_mm,
        door_count: cabinetType.door_count,
        drawer_count: cabinetType.drawer_count,
        active: cabinetType.active
      });
    } else {
      setFormData({
        name: "",
        category: "",
        default_width_mm: 300,
        default_height_mm: 720,
        default_depth_mm: 560,
        door_count: 0,
        drawer_count: 0,
        active: true
      });
    }
  }, [cabinetType]);

  const handleSave = () => {
    onSave({
      id: cabinetType?.id,
      ...formData
    });
  };

  const categories = ["base", "wall", "tall", "specialty"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cabinetType ? 'Edit Cabinet Type' : 'Add Cabinet Type'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
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
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
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
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="width">Width (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.default_width_mm}
                    onChange={(e) => setFormData({ ...formData, default_width_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (mm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.default_height_mm}
                    onChange={(e) => setFormData({ ...formData, default_height_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Depth (mm)</Label>
                  <Input
                    id="depth"
                    type="number"
                    value={formData.default_depth_mm}
                    onChange={(e) => setFormData({ ...formData, default_depth_mm: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="door_count">Door Count</Label>
                  <Input
                    id="door_count"
                    type="number"
                    value={formData.door_count}
                    onChange={(e) => setFormData({ ...formData, door_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="drawer_count">Drawer Count</Label>
                  <Input
                    id="drawer_count"
                    type="number"
                    value={formData.drawer_count}
                    onChange={(e) => setFormData({ ...formData, drawer_count: parseInt(e.target.value) || 0 })}
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
          
          <TabsContent value="pricing">
            {cabinetType && (
              <CabinetTypePricingSetup cabinetTypeId={cabinetType.id} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CabinetTypeEditDialog;