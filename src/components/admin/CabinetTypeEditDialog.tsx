import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataTable } from '@/components/admin/shared/DataTable';
import { Plus, Trash2, Edit, Package, Settings, Wrench, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CabinetType {
  id?: string;
  name: string;
  category: string;
  subcategory?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  min_height_mm?: number;
  max_height_mm?: number;
  min_depth_mm?: number;
  max_depth_mm?: number;
  door_count: number;
  drawer_count: number;
  active: boolean;
  short_description?: string;
  long_description?: string;
  product_image_url?: string;
  is_featured?: boolean;
  display_order?: number;
}

interface CabinetPart {
  id: string;
  cabinet_type_id?: string;
  part_name: string;
  quantity: number;
  width_formula?: string;
  height_formula?: string;
  is_door: boolean;
  is_hardware: boolean;
}

interface CabinetHardwareRequirement {
  id: string;
  cabinet_type_id?: string;
  hardware_type_id: string;
  unit_scope: string;
  units_per_scope: number;
  notes?: string;
  active: boolean;
  hardware_types?: {
    name: string;
    category: string;
  };
}

interface HardwareRequirementFormProps {
  requirement: CabinetHardwareRequirement | null;
  onSave: (requirement: CabinetHardwareRequirement) => void;
  onCancel: () => void;
  loading: boolean;
  hardwareTypes: any[];
}

const HardwareRequirementForm: React.FC<HardwareRequirementFormProps> = ({ 
  requirement, 
  onSave, 
  onCancel, 
  loading,
  hardwareTypes 
}) => {
  const [formData, setFormData] = useState<Omit<CabinetHardwareRequirement, 'id' | 'cabinet_type_id' | 'hardware_types'>>({
    hardware_type_id: '',
    unit_scope: '',
    units_per_scope: 1,
    notes: '',
    active: true,
  });

  useEffect(() => {
    if (requirement) {
      setFormData({
        hardware_type_id: requirement.hardware_type_id,
        unit_scope: requirement.unit_scope,
        units_per_scope: requirement.units_per_scope,
        notes: requirement.notes || '',
        active: requirement.active,
      });
    }
  }, [requirement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: requirement?.id || '',
      cabinet_type_id: requirement?.cabinet_type_id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hardware_type_id">Hardware Type *</Label>
          <Select 
            value={formData.hardware_type_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, hardware_type_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select hardware type" />
            </SelectTrigger>
            <SelectContent>
              {hardwareTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} ({type.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="unit_scope">Unit Scope *</Label>
          <Select 
            value={formData.unit_scope} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, unit_scope: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_door">Per Door</SelectItem>
              <SelectItem value="per_drawer">Per Drawer</SelectItem>
              <SelectItem value="per_cabinet">Per Cabinet</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="units_per_scope">Units per Scope *</Label>
          <Input
            id="units_per_scope"
            type="number"
            min="1"
            value={formData.units_per_scope}
            onChange={(e) => setFormData(prev => ({ ...prev, units_per_scope: parseInt(e.target.value) }))}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes or specifications"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !formData.hardware_type_id || !formData.unit_scope}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

interface CabinetTypeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabinetType?: CabinetType | null;
}

const defaultCabinetType: CabinetType = {
  name: '',
  category: '',
  subcategory: '',
  default_width_mm: 600,
  default_height_mm: 720,
  default_depth_mm: 560,
  min_width_mm: 300,
  max_width_mm: 1200,
  min_height_mm: 200,
  max_height_mm: 1000,
  min_depth_mm: 200,
  max_depth_mm: 800,
  door_count: 0,
  drawer_count: 0,
  active: true,
  short_description: '',
  long_description: '',
  product_image_url: '',
  is_featured: false,
  display_order: 0,
};

interface PartFormProps {
  part: CabinetPart | null;
  onSave: (part: CabinetPart) => void;
  onCancel: () => void;
  loading: boolean;
}

const PartForm: React.FC<PartFormProps> = ({ part, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState<Omit<CabinetPart, 'id' | 'cabinet_type_id'>>({
    part_name: '',
    quantity: 1,
    width_formula: '',
    height_formula: '',
    is_door: false,
    is_hardware: false,
  });

  useEffect(() => {
    if (part) {
      setFormData({
        part_name: part.part_name,
        quantity: part.quantity,
        width_formula: part.width_formula || '',
        height_formula: part.height_formula || '',
        is_door: part.is_door,
        is_hardware: part.is_hardware,
      });
    }
  }, [part]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: part?.id || '',
      cabinet_type_id: part?.cabinet_type_id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="part_name">Part Name *</Label>
          <Input
            id="part_name"
            value={formData.part_name}
            onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))}
            placeholder="e.g., Side Panel, Back Panel"
            required
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width_formula">Width Formula</Label>
          <Input
            id="width_formula"
            value={formData.width_formula}
            onChange={(e) => setFormData(prev => ({ ...prev, width_formula: e.target.value }))}
            placeholder="e.g., WIDTH-32"
          />
        </div>
        <div>
          <Label htmlFor="height_formula">Height Formula</Label>
          <Input
            id="height_formula"
            value={formData.height_formula}
            onChange={(e) => setFormData(prev => ({ ...prev, height_formula: e.target.value }))}
            placeholder="e.g., HEIGHT-18"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_door"
            checked={formData.is_door}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_door: checked }))}
          />
          <Label htmlFor="is_door">Door Part</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_hardware"
            checked={formData.is_hardware}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_hardware: checked }))}
          />
          <Label htmlFor="is_hardware">Hardware Part</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !formData.part_name}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export const CabinetTypeEditDialog: React.FC<CabinetTypeEditDialogProps> = ({
  open,
  onOpenChange,
  cabinetType,
}) => {
  const [formData, setFormData] = useState<CabinetType>(defaultCabinetType);
  const [editingPart, setEditingPart] = useState<CabinetPart | null>(null);
  const [showPartForm, setShowPartForm] = useState(false);
  const [editingHardware, setEditingHardware] = useState<CabinetHardwareRequirement | null>(null);
  const [showHardwareForm, setShowHardwareForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cabinet parts for this cabinet type
  const { data: cabinetParts, isLoading: loadingParts } = useQuery({
    queryKey: ['cabinet-parts', cabinetType?.id],
    queryFn: async () => {
      if (!cabinetType?.id) return [];
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', cabinetType.id)
        .order('part_name');
      
      if (error) throw error;
      return data as CabinetPart[];
    },
    enabled: !!cabinetType?.id,
  });

  // Fetch hardware requirements for this cabinet type
  const { data: hardwareRequirements, isLoading: loadingHardware } = useQuery({
    queryKey: ['cabinet-hardware-requirements', cabinetType?.id],
    queryFn: async () => {
      if (!cabinetType?.id) return [];
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_types (
            name,
            category
          )
        `)
        .eq('cabinet_type_id', cabinetType.id)
        .order('hardware_type_id');
      
      if (error) throw error;
      return data as CabinetHardwareRequirement[];
    },
    enabled: !!cabinetType?.id,
  });

  // Fetch hardware types for dropdown
  const { data: hardwareTypes } = useQuery({
    queryKey: ['hardware-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_types')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Save cabinet type mutation
  const saveCabinetType = useMutation({
    mutationFn: async (data: CabinetType) => {
      if (data.id) {
        // Update existing
        const { error } = await supabase
          .from('cabinet_types')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('cabinet_types')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cabinet-types'] });
      toast.success(`Cabinet type ${cabinetType ? 'updated' : 'created'} successfully`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to ${cabinetType ? 'update' : 'create'} cabinet type`);
      console.error(error);
    },
  });

  // Save cabinet part mutation
  const saveCabinetPart = useMutation({
    mutationFn: async (data: CabinetPart) => {
      const partData = { ...data, cabinet_type_id: cabinetType?.id };
      if (data.id) {
        const { error } = await supabase
          .from('cabinet_parts')
          .update(partData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cabinet_parts')
          .insert([partData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-parts', cabinetType?.id] });
      toast.success('Part saved successfully');
      setEditingPart(null);
      setShowPartForm(false);
    },
    onError: (error) => {
      toast.error('Failed to save part');
      console.error(error);
    },
  });

  // Delete cabinet part mutation
  const deleteCabinetPart = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cabinet_parts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-parts', cabinetType?.id] });
      toast.success('Part deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete part');
      console.error(error);
    },
  });

  // Save hardware requirement mutation
  const saveHardwareRequirement = useMutation({
    mutationFn: async (data: CabinetHardwareRequirement) => {
      const hardwareData = { ...data, cabinet_type_id: cabinetType?.id };
      if (data.id) {
        const { error } = await supabase
          .from('cabinet_hardware_requirements')
          .update(hardwareData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cabinet_hardware_requirements')
          .insert([hardwareData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware-requirements', cabinetType?.id] });
      toast.success('Hardware requirement saved successfully');
      setEditingHardware(null);
      setShowHardwareForm(false);
    },
    onError: (error) => {
      toast.error('Failed to save hardware requirement');
      console.error(error);
    },
  });

  // Delete hardware requirement mutation
  const deleteHardwareRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cabinet_hardware_requirements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware-requirements', cabinetType?.id] });
      toast.success('Hardware requirement deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete hardware requirement');
      console.error(error);
    },
  });

  useEffect(() => {
    if (cabinetType) {
      setFormData(cabinetType);
    } else {
      setFormData(defaultCabinetType);
    }
  }, [cabinetType]);

  const handleSave = () => {
    saveCabinetType.mutate(formData);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Auto-save if there are changes and required fields are filled
      if (formData.name && formData.category && (cabinetType || formData.name !== defaultCabinetType.name)) {
        handleSave();
      } else {
        onOpenChange(false);
      }
    } else {
      onOpenChange(true);
    }
  };

  const handleInputChange = (field: keyof CabinetType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Parts table columns
  const partsColumns = [
    {
      key: 'part_name' as keyof CabinetPart,
      label: 'Part Name',
    },
    {
      key: 'quantity' as keyof CabinetPart,
      label: 'Qty',
    },
    {
      key: 'width_formula' as keyof CabinetPart,
      label: 'Width Formula',
      render: (value: string) => (
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          {value || 'N/A'}
        </code>
      ),
    },
    {
      key: 'height_formula' as keyof CabinetPart,
      label: 'Height Formula',
      render: (value: string) => (
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          {value || 'N/A'}
        </code>
      ),
    },
    {
      key: 'is_door' as keyof CabinetPart,
      label: 'Door',
      render: (value: boolean) => (
        value ? <Badge variant="default">Yes</Badge> : <span className="text-muted-foreground">No</span>
      ),
    },
    {
      key: 'id' as keyof CabinetPart,
      label: 'Actions',
      render: (value: string, item: CabinetPart) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingPart(item);
              setShowPartForm(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this part?')) {
                deleteCabinetPart.mutate(value);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Hardware requirements table columns
  const hardwareColumns = [
    {
      key: 'hardware_type_id' as keyof CabinetHardwareRequirement,
      label: 'Hardware Type',
      render: (value: string, item: CabinetHardwareRequirement) => (
        <span>{(item as any).hardware_types?.name || 'Unknown'}</span>
      ),
    },
    {
      key: 'unit_scope' as keyof CabinetHardwareRequirement,
      label: 'Unit Scope',
    },
    {
      key: 'units_per_scope' as keyof CabinetHardwareRequirement,
      label: 'Units per Scope',
    },
    {
      key: 'notes' as keyof CabinetHardwareRequirement,
      label: 'Notes',
      render: (value: string) => value || '-',
    },
    {
      key: 'id' as keyof CabinetHardwareRequirement,
      label: 'Actions',
      render: (value: string, item: CabinetHardwareRequirement) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingHardware(item);
              setShowHardwareForm(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this hardware requirement?')) {
                deleteHardwareRequirement.mutate(value);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {cabinetType ? 'Edit Cabinet Type' : 'Add Cabinet Type'}
              </DialogTitle>
              <DialogDescription>
                Configure cabinet specifications, parts, and hardware requirements
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Base Cabinet 2-Door"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">Base Cabinets</SelectItem>
                        <SelectItem value="wall">Wall Cabinets</SelectItem>
                        <SelectItem value="tall">Tall Cabinets</SelectItem>
                        <SelectItem value="specialty">Specialty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory || ''}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      placeholder="e.g., Standard, Corner"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleInputChange('active', checked)}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="default_width_mm">Default Width (mm)</Label>
                    <Input
                      id="default_width_mm"
                      type="number"
                      value={formData.default_width_mm}
                      onChange={(e) => handleInputChange('default_width_mm', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="default_height_mm">Default Height (mm)</Label>
                    <Input
                      id="default_height_mm"
                      type="number"
                      value={formData.default_height_mm}
                      onChange={(e) => handleInputChange('default_height_mm', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="default_depth_mm">Default Depth (mm)</Label>
                    <Input
                      id="default_depth_mm"
                      type="number"
                      value={formData.default_depth_mm}
                      onChange={(e) => handleInputChange('default_depth_mm', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="door_count">Door Count</Label>
                    <Input
                      id="door_count"
                      type="number"
                      min="0"
                      value={formData.door_count}
                      onChange={(e) => handleInputChange('door_count', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="drawer_count">Drawer Count</Label>
                    <Input
                      id="drawer_count"
                      type="number"
                      min="0"
                      value={formData.drawer_count}
                      onChange={(e) => handleInputChange('drawer_count', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="short_description">Short Description</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description || ''}
                    onChange={(e) => handleInputChange('short_description', e.target.value)}
                    placeholder="Brief description for listings"
                  />
                </div>

                <div>
                  <Label htmlFor="long_description">Long Description</Label>
                  <Textarea
                    id="long_description"
                    value={formData.long_description || ''}
                    onChange={(e) => handleInputChange('long_description', e.target.value)}
                    placeholder="Detailed description for product pages"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parts & Formulas - Only show for existing cabinet types */}
            {cabinetType?.id && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Parts & Formulas
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPart(null);
                        setShowPartForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Part
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showPartForm && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {editingPart ? 'Edit Part' : 'Add New Part'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PartForm
                          part={editingPart}
                          onSave={(partData) => saveCabinetPart.mutate(partData)}
                          onCancel={() => {
                            setEditingPart(null);
                            setShowPartForm(false);
                          }}
                          loading={saveCabinetPart.isPending}
                        />
                      </CardContent>
                    </Card>
                  )}
                  
                  <DataTable
                    columns={partsColumns}
                    data={(cabinetParts || []).filter(part => part.id).map(part => ({ 
                      ...part, 
                      id: part.id as string 
                    }))}
                    loading={loadingParts}
                  />
                </CardContent>
              </Card>
            )}

            {/* Hardware Requirements - Only show for existing cabinet types */}
            {cabinetType?.id && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Hardware Requirements
                      </CardTitle>
                      <CardDescription>
                        Define hardware requirements for this cabinet type
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingHardware(null);
                        setShowHardwareForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Hardware
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showHardwareForm && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {editingHardware ? 'Edit Hardware Requirement' : 'Add New Hardware Requirement'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <HardwareRequirementForm
                          requirement={editingHardware}
                          onSave={(hardwareData) => saveHardwareRequirement.mutate(hardwareData)}
                          onCancel={() => {
                            setEditingHardware(null);
                            setShowHardwareForm(false);
                          }}
                          loading={saveHardwareRequirement.isPending}
                          hardwareTypes={hardwareTypes || []}
                        />
                      </CardContent>
                    </Card>
                  )}
                  
                  <DataTable
                    columns={hardwareColumns}
                    data={(hardwareRequirements || []).filter(hw => hw.id).map(hw => ({ 
                      ...hw, 
                      id: hw.id as string 
                    }))}
                    loading={loadingHardware}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-6 py-4 bg-background">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.category || saveCabinetType.isPending}
            >
              {saveCabinetType.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};