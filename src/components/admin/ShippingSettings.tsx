import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Package, MapPin, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Mock data for demonstration until migration is approved
interface MaterialType {
  id: string;
  name: string;
  description?: string;
  density_kg_per_m3: number;
  weight_per_sqm: number;
  thickness_mm: number;
  active: boolean;
}

interface GlobalMaterialSettings {
  default_weight_multiplier: number;
  thickness_adjustment_factor: number;
  updated_at: string;
}

interface PostcodeZone {
  id: string;
  postcode: string;
  state: string;
  zone: string;
  metro: boolean;
  assembly_eligible: boolean;
  delivery_eligible: boolean;
}

interface ShippingDepot {
  id: string;
  name: string;
  address: string;
  postcode: string;
  zone_code: string;
  active: boolean;
}

const mockMaterialTypes: MaterialType[] = [
  { id: '1', name: 'MDF', description: 'Medium Density Fibreboard', density_kg_per_m3: 600, weight_per_sqm: 12.5, thickness_mm: 18, active: true },
  { id: '2', name: 'Plywood', description: 'Marine grade plywood', density_kg_per_m3: 500, weight_per_sqm: 9.8, thickness_mm: 18, active: true },
  { id: '3', name: 'Particle Board', description: 'Standard particle board', density_kg_per_m3: 650, weight_per_sqm: 14.2, thickness_mm: 16, active: true }
];

const mockPostcodeZones: PostcodeZone[] = [
  { id: '1', postcode: '3000', state: 'VIC', zone: 'MEL_METRO', metro: true, assembly_eligible: true, delivery_eligible: true },
  { id: '2', postcode: '3001', state: 'VIC', zone: 'MEL_METRO', metro: true, assembly_eligible: true, delivery_eligible: true },
  { id: '3', postcode: '4000', state: 'QLD', zone: 'BNE_METRO', metro: true, assembly_eligible: true, delivery_eligible: true },
  { id: '4', postcode: '2000', state: 'NSW', zone: 'SYD_METRO', metro: true, assembly_eligible: true, delivery_eligible: true }
];

const mockShippingDepots: ShippingDepot[] = [
  { id: '1', name: 'Melbourne Warehouse', address: '123 Industry St, Melbourne VIC', postcode: '3000', zone_code: 'MEL_METRO', active: true },
  { id: '2', name: 'Sydney Warehouse', address: '456 Commerce Ave, Sydney NSW', postcode: '2000', zone_code: 'SYD_METRO', active: true },
  { id: '3', name: 'Brisbane Warehouse', address: '789 Logistics Rd, Brisbane QLD', postcode: '4000', zone_code: 'BNE_METRO', active: true }
];

const ShippingSettings = () => {
  const [materialDialog, setMaterialDialog] = useState<{ open: boolean; material: MaterialType | null }>({
    open: false,
    material: null
  });
  
  const [zoneDialog, setZoneDialog] = useState<{ open: boolean; zone: PostcodeZone | null }>({
    open: false,
    zone: null
  });
  
  const [depotDialog, setDepotDialog] = useState<{ open: boolean; depot: ShippingDepot | null }>({
    open: false,
    depot: null
  });

  const [globalSettings, setGlobalSettings] = useState({
    default_weight_multiplier: 1.2,
    thickness_adjustment_factor: 0.95
  });

  const handleSaveGlobalSettings = () => {
    toast.success('Global material settings saved successfully (demo mode)');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shipping & Assembly Settings</h1>
        <p className="text-muted-foreground">Manage material types, postcode zones, and shipping depots</p>
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ Demo Mode: Full functionality will be available after the database migration is approved.
          </p>
        </div>
      </div>

      {/* Global Material Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Materials Settings</CardTitle>
            <p className="text-sm text-muted-foreground">Configure global material rates for cabinet pricing formulas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <Button onClick={handleSaveGlobalSettings}>
              Save Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="weightMultiplier">Default Weight Multiplier</Label>
              <Input
                id="weightMultiplier"
                type="number"
                step="0.01"
                value={globalSettings.default_weight_multiplier}
                onChange={(e) => setGlobalSettings({
                  ...globalSettings,
                  default_weight_multiplier: parseFloat(e.target.value) || 1.0
                })}
                placeholder="1.20"
              />
              <p className="text-xs text-muted-foreground">Applied to base material weight calculations</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thicknessAdjustment">Thickness Adjustment Factor</Label>
              <Input
                id="thicknessAdjustment"
                type="number"
                step="0.01"
                value={globalSettings.thickness_adjustment_factor}
                onChange={(e) => setGlobalSettings({
                  ...globalSettings,
                  thickness_adjustment_factor: parseFloat(e.target.value) || 1.0
                })}
                placeholder="0.95"
              />
              <p className="text-xs text-muted-foreground">Weight adjustment based on material thickness</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Types Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Types
          </CardTitle>
          <Button onClick={() => setMaterialDialog({ open: true, material: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material Type
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockMaterialTypes.map((material) => (
              <Card key={material.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{material.name}</h3>
                    <p className="text-sm text-muted-foreground">{material.weight_per_sqm} kg/m² • {material.thickness_mm}mm</p>
                    <p className="text-xs text-muted-foreground">Density: {material.density_kg_per_m3} kg/m³</p>
                    {material.description && (
                      <p className="text-xs text-muted-foreground mt-1">{material.description}</p>
                    )}
                  </div>
                  <Badge variant={material.active ? "default" : "secondary"}>
                    {material.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setMaterialDialog({ open: true, material })}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Postcode Zones Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Postcode Zones
          </CardTitle>
          <Button onClick={() => setZoneDialog({ open: true, zone: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockPostcodeZones.map((zone) => (
              <Card key={zone.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">Postcode: {zone.postcode}</h3>
                    <p className="text-sm text-muted-foreground">{zone.state} • Zone: {zone.zone}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {zone.metro && <Badge variant="secondary" className="text-xs">Metro</Badge>}
                      {zone.assembly_eligible && <Badge variant="default" className="text-xs">Assembly</Badge>}
                      {zone.delivery_eligible && <Badge variant="outline" className="text-xs">Delivery</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setZoneDialog({ open: true, zone })}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Depots Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Depots
          </CardTitle>
          <Button onClick={() => setDepotDialog({ open: true, depot: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Depot
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockShippingDepots.map((depot) => (
              <Card key={depot.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{depot.name}</h3>
                    <p className="text-sm text-muted-foreground">{depot.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {depot.postcode} • Zone: {depot.zone_code}
                    </p>
                  </div>
                  <Badge variant={depot.active ? "default" : "secondary"}>
                    {depot.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setDepotDialog({ open: true, depot })}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <MaterialTypeDialog 
        open={materialDialog.open}
        material={materialDialog.material}
        onOpenChange={(open) => setMaterialDialog({ open, material: null })}
        onSave={() => setMaterialDialog({ open: false, material: null })}
      />

      <PostcodeZoneDialog 
        open={zoneDialog.open}
        zone={zoneDialog.zone}
        onOpenChange={(open) => setZoneDialog({ open, zone: null })}
        onSave={() => setZoneDialog({ open: false, zone: null })}
      />

      <ShippingDepotDialog 
        open={depotDialog.open}
        depot={depotDialog.depot}
        onOpenChange={(open) => setDepotDialog({ open, depot: null })}
        onSave={() => setDepotDialog({ open: false, depot: null })}
      />
    </div>
  );
};

// Material Type Dialog
const MaterialTypeDialog = ({ open, material, onOpenChange, onSave }: {
  open: boolean;
  material: MaterialType | null;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    density_kg_per_m3: 0,
    weight_per_sqm: 0,
    thickness_mm: 18,
    active: true
  });

  React.useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        description: material.description || "",
        density_kg_per_m3: material.density_kg_per_m3,
        weight_per_sqm: material.weight_per_sqm,
        thickness_mm: material.thickness_mm,
        active: material.active
      });
    } else {
      setFormData({
        name: "",
        description: "",
        density_kg_per_m3: 0,
        weight_per_sqm: 0,
        thickness_mm: 18,
        active: true
      });
    }
  }, [material]);

  const handleSave = () => {
    toast.success('Material type saved successfully (demo mode)');
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{material ? 'Edit Material Type' : 'Add New Material Type'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Material name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Material description"
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="density">Density (kg/m³)</Label>
            <Input
              id="density"
              type="number"
              step="0.01"
              value={formData.density_kg_per_m3}
              onChange={(e) => setFormData({...formData, density_kg_per_m3: parseFloat(e.target.value) || 0})}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weightPsm">Weight per SQM (kg)</Label>
              <Input
                id="weightPsm"
                type="number"
                step="0.01"
                value={formData.weight_per_sqm}
                onChange={(e) => setFormData({...formData, weight_per_sqm: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thickness">Thickness (mm)</Label>
              <Input
                id="thickness"
                type="number"
                step="1"
                value={formData.thickness_mm}
                onChange={(e) => setFormData({...formData, thickness_mm: parseInt(e.target.value) || 18})}
                placeholder="18"
              />
            </div>
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

// Postcode Zone Dialog
const PostcodeZoneDialog = ({ open, zone, onOpenChange, onSave }: {
  open: boolean;
  zone: PostcodeZone | null;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) => {
  const handleSave = () => {
    toast.success('Postcode zone saved successfully (demo mode)');
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Postcode Zone Management</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            This feature will be fully functional after the database migration is approved.
          </p>
          <p className="text-sm">Currently showing demo data for interface preview.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Shipping Depot Dialog
const ShippingDepotDialog = ({ open, depot, onOpenChange, onSave }: {
  open: boolean;
  depot: ShippingDepot | null;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) => {
  const handleSave = () => {
    toast.success('Shipping depot saved successfully (demo mode)');
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Shipping Depot Management</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            This feature will be fully functional after the database migration is approved.
          </p>
          <p className="text-sm">Demo depot shown for interface preview.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingSettings;