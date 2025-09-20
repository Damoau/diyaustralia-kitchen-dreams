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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/admin/shared/DataTable';
import { CabinetComponentsTab } from '@/components/admin/CabinetComponentsTab';
import { Plus, Trash2, Edit, Package, Settings, Wrench, X, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
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
  cabinet_style?: string;
  // Corner cabinet specific fields
  right_side_width_mm?: number;
  left_side_width_mm?: number;
  right_side_depth_mm?: number;
  left_side_depth_mm?: number;
  qty_left_back?: number;
  qty_right_back?: number;
  qty_left_side?: number;
  qty_right_side?: number;
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  url_slug?: string;
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

interface CabinetDoorStyle {
  id: string;
  cabinet_type_id: string;
  door_style_id: string;
  image_url?: string;
  sort_order: number;
  active: boolean;
  door_styles?: {
    name: string;
    description?: string;
    base_rate_per_sqm: number;
  };
}

interface DoorStyle {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  base_rate_per_sqm: number;
  active: boolean;
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
  cabinet_style: 'standard',
  // Corner cabinet defaults
  right_side_width_mm: 600,
  left_side_width_mm: 600,
  right_side_depth_mm: 560,
  left_side_depth_mm: 560,
  qty_left_back: 0,
  qty_right_back: 0,
  qty_left_side: 0,
  qty_right_side: 0,
  // SEO defaults
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  url_slug: '',
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
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
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

  // Fetch cabinet door styles for this cabinet type
  const { data: cabinetDoorStyles, isLoading: loadingDoorStyles } = useQuery({
    queryKey: ['cabinet-door-styles', cabinetType?.id],
    queryFn: async () => {
      if (!cabinetType?.id) return [];
      const { data, error } = await supabase
        .from('cabinet_door_styles')
        .select(`
          *,
          door_styles (
            name,
            description,
            base_rate_per_sqm
          )
        `)
        .eq('cabinet_type_id', cabinetType.id)
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as CabinetDoorStyle[];
    },
    enabled: !!cabinetType?.id,
  });

  // Fetch all available door styles
  const { data: allDoorStyles } = useQuery({
    queryKey: ['door-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as DoorStyle[];
    },
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

  // Save cabinet door style mutation
  const saveCabinetDoorStyle = useMutation({
    mutationFn: async (data: { door_style_id: string; image_url?: string }) => {
      const doorStyleData = {
        cabinet_type_id: cabinetType?.id,
        door_style_id: data.door_style_id,
        image_url: data.image_url,
        sort_order: 0,
        active: true,
      };
      
      const { error } = await supabase
        .from('cabinet_door_styles')
        .upsert(doorStyleData, {
          onConflict: 'cabinet_type_id,door_style_id'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-door-styles', cabinetType?.id] });
      toast.success('Door style updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update door style');
      console.error(error);
    },
  });

  // Delete cabinet door style mutation
  const removeCabinetDoorStyle = useMutation({
    mutationFn: async (doorStyleId: string) => {
      const { error } = await supabase
        .from('cabinet_door_styles')
        .delete()
        .eq('cabinet_type_id', cabinetType?.id)
        .eq('door_style_id', doorStyleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-door-styles', cabinetType?.id] });
      toast.success('Door style removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove door style');
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

  const handleImageUpload = async (doorStyleId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${cabinetType?.id}-${doorStyleId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('door-style-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('door-style-images')
        .getPublicUrl(fileName);

      await saveCabinetDoorStyle.mutateAsync({
        door_style_id: doorStyleId,
        image_url: publicUrl
      });
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    }
  };

  const handleToggleDoorStyle = (doorStyleId: string, enabled: boolean) => {
    if (enabled) {
      saveCabinetDoorStyle.mutate({ door_style_id: doorStyleId });
    } else {
      removeCabinetDoorStyle.mutate(doorStyleId);
    }
  };

  const generateAIContent = async () => {
    if (!formData.name || !formData.category) {
      toast.error('Please enter cabinet name and category first');
      return;
    }

    setIsGeneratingContent(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/ai-content-generator', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory,
          cabinet_style: formData.cabinet_style,
          dimensions: {
            width: formData.default_width_mm,
            height: formData.default_height_mm,
            depth: formData.default_depth_mm
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');
      
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        meta_keywords: data.meta_keywords,
        url_slug: data.url_slug,
        short_description: data.short_description,
        long_description: data.long_description
      }));

      toast.success('AI content generated successfully!');
    } catch (error) {
      toast.error('Failed to generate AI content');
      console.error(error);
    } finally {
      setIsGeneratingContent(false);
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
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {cabinetType ? 'Edit Cabinet Type' : 'Add Cabinet Type'}
                </DialogTitle>
                <DialogDescription>
                  Configure cabinet specifications, parts, and hardware requirements
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col">
          <div className="px-6 py-2 border-b">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Basic Information
              </TabsTrigger>
              <TabsTrigger value="sizes" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Default Sizes
              </TabsTrigger>
              <TabsTrigger value="doors" disabled={!cabinetType?.id} className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Door Options
              </TabsTrigger>
              <TabsTrigger value="parts" disabled={!cabinetType?.id} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Parts & Formulas
              </TabsTrigger>
              <TabsTrigger value="hardware" disabled={!cabinetType?.id} className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Hardware Requirements
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 h-[calc(95vh-200px)] [&>div>div[style]]:!block">
            <div className="overflow-y-auto max-h-full pr-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
                 style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1D5DB #F3F4F6' }}>
            <TabsContent value="basic" className="p-6 space-y-8 m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <Button
                      variant="outline"
                      onClick={generateAIContent}
                      disabled={isGeneratingContent || !formData.name || !formData.category}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isGeneratingContent ? 'Generating...' : 'Generate SEO & Descriptions'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
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
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleInputChange('active', checked)}
                    />
                    <Label htmlFor="active">Active</Label>
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

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured || false}
                      onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                    />
                    <Label htmlFor="is_featured">Featured Product</Label>
                  </div>

                  <Separator />
                  
                  {/* SEO Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">SEO & Marketing</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="meta_title">Meta Title</Label>
                        <div className="relative">
                          <Input
                            id="meta_title"
                            value={formData.meta_title || ''}
                            onChange={(e) => handleInputChange('meta_title', e.target.value)}
                            placeholder="SEO title (under 60 characters)"
                            maxLength={60}
                          />
                          <span className="absolute right-2 top-2 text-xs text-muted-foreground">
                            {(formData.meta_title || '').length}/60
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="url_slug">URL Slug</Label>
                        <Input
                          id="url_slug"
                          value={formData.url_slug || ''}
                          onChange={(e) => handleInputChange('url_slug', e.target.value)}
                          placeholder="kitchen-cabinet-base-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="meta_description">Meta Description</Label>
                      <div className="relative">
                        <Textarea
                          id="meta_description"
                          value={formData.meta_description || ''}
                          onChange={(e) => handleInputChange('meta_description', e.target.value)}
                          placeholder="SEO description (150-160 characters)"
                          rows={3}
                          maxLength={160}
                        />
                        <span className="absolute right-2 bottom-2 text-xs text-muted-foreground">
                          {(formData.meta_description || '').length}/160
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="meta_keywords">Meta Keywords</Label>
                      <Input
                        id="meta_keywords"
                        value={formData.meta_keywords || ''}
                        onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                        placeholder="kitchen cabinets, flat pack, DIY, Australia"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Descriptions Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Product Descriptions</Label>
                    
                    <div>
                      <Label htmlFor="short_description">Short Description</Label>
                      <Input
                        id="short_description"
                        value={formData.short_description || ''}
                        onChange={(e) => handleInputChange('short_description', e.target.value)}
                        placeholder="Brief description for product listings"
                      />
                    </div>

                    <div>
                      <Label htmlFor="long_description">Long Description</Label>
                      <Textarea
                        id="long_description"
                        value={formData.long_description || ''}
                        onChange={(e) => handleInputChange('long_description', e.target.value)}
                        placeholder="Detailed product description for product pages"
                        rows={5}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizes" className="p-6 space-y-8 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Default Sizes & Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure cabinet style, default dimensions, and size ranges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cabinet Style Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Cabinet Style</Label>
                    <Select value={formData.cabinet_style || 'standard'} onValueChange={(value) => handleInputChange('cabinet_style', value)}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select cabinet style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Cabinet</SelectItem>
                        <SelectItem value="corner">Corner Cabinet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Default Dimensions - Different for Corner vs Standard */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Default Dimensions</Label>
                    {formData.cabinet_style === 'corner' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="left_side_width_mm">Left Width (mm)</Label>
                            <Input
                              id="left_side_width_mm"
                              type="number"
                              value={formData.left_side_width_mm || 600}
                              onChange={(e) => handleInputChange('left_side_width_mm', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="right_side_width_mm">Right Width (mm)</Label>
                            <Input
                              id="right_side_width_mm"
                              type="number"
                              value={formData.right_side_width_mm || 600}
                              onChange={(e) => handleInputChange('right_side_width_mm', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="default_height_mm">Height (mm)</Label>
                            <Input
                              id="default_height_mm"
                              type="number"
                              value={formData.default_height_mm}
                              onChange={(e) => handleInputChange('default_height_mm', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="left_side_depth_mm">Left Depth (mm)</Label>
                            <Input
                              id="left_side_depth_mm"
                              type="number"
                              value={formData.left_side_depth_mm || 560}
                              onChange={(e) => handleInputChange('left_side_depth_mm', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="right_side_depth_mm">Right Depth (mm)</Label>
                            <Input
                              id="right_side_depth_mm"
                              type="number"
                              value={formData.right_side_depth_mm || 560}
                              onChange={(e) => handleInputChange('right_side_depth_mm', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  <Separator />

                  {/* Size Ranges - Different for Corner vs Standard */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Size Ranges (50mm increments will be generated)</Label>
                    {formData.cabinet_style === 'corner' ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Left Width Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_left_width" className="text-xs">Minimum</Label>
                              <Input
                                id="min_left_width"
                                type="number"
                                step="50"
                                value={formData.min_width_mm || 300}
                                onChange={(e) => handleInputChange('min_width_mm', parseInt(e.target.value))}
                                placeholder="300"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_left_width" className="text-xs">Maximum</Label>
                              <Input
                                id="max_left_width"
                                type="number"
                                step="50"
                                value={formData.max_width_mm || 800}
                                onChange={(e) => handleInputChange('max_width_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available left widths: {formData.min_width_mm || 300}mm to {formData.max_width_mm || 800}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Right Width Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_right_width" className="text-xs">Minimum</Label>
                              <Input
                                id="min_right_width"
                                type="number"
                                step="50"
                                value={formData.min_width_mm || 300}
                                onChange={(e) => handleInputChange('min_width_mm', parseInt(e.target.value))}
                                placeholder="300"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_right_width" className="text-xs">Maximum</Label>
                              <Input
                                id="max_right_width"
                                type="number"
                                step="50"
                                value={formData.max_width_mm || 800}
                                onChange={(e) => handleInputChange('max_width_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available right widths: {formData.min_width_mm || 300}mm to {formData.max_width_mm || 800}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Height Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_height_mm" className="text-xs">Minimum</Label>
                              <Input
                                id="min_height_mm"
                                type="number"
                                step="50"
                                value={formData.min_height_mm || 200}
                                onChange={(e) => handleInputChange('min_height_mm', parseInt(e.target.value))}
                                placeholder="200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_height_mm" className="text-xs">Maximum</Label>
                              <Input
                                id="max_height_mm"
                                type="number"
                                step="50"
                                value={formData.max_height_mm || 1000}
                                onChange={(e) => handleInputChange('max_height_mm', parseInt(e.target.value))}
                                placeholder="1000"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available heights: {formData.min_height_mm || 200}mm to {formData.max_height_mm || 1000}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Depth Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_depth_mm" className="text-xs">Minimum</Label>
                              <Input
                                id="min_depth_mm"
                                type="number"
                                step="50"
                                value={formData.min_depth_mm || 200}
                                onChange={(e) => handleInputChange('min_depth_mm', parseInt(e.target.value))}
                                placeholder="200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_depth_mm" className="text-xs">Maximum</Label>
                              <Input
                                id="max_depth_mm"
                                type="number"
                                step="50"
                                value={formData.max_depth_mm || 600}
                                onChange={(e) => handleInputChange('max_depth_mm', parseInt(e.target.value))}
                                placeholder="600"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available depths: {formData.min_depth_mm || 200}mm to {formData.max_depth_mm || 600}mm in 50mm steps
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Width Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_width_mm" className="text-xs">Minimum</Label>
                              <Input
                                id="min_width_mm"
                                type="number"
                                step="50"
                                value={formData.min_width_mm || 300}
                                onChange={(e) => handleInputChange('min_width_mm', parseInt(e.target.value))}
                                placeholder="300"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_width_mm" className="text-xs">Maximum</Label>
                              <Input
                                id="max_width_mm"
                                type="number"
                                step="50"
                                value={formData.max_width_mm || 1200}
                                onChange={(e) => handleInputChange('max_width_mm', parseInt(e.target.value))}
                                placeholder="1200"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available widths: {formData.min_width_mm || 300}mm to {formData.max_width_mm || 1200}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Height Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_height_mm" className="text-xs">Minimum</Label>
                              <Input
                                id="min_height_mm"
                                type="number"
                                step="50"
                                value={formData.min_height_mm || 200}
                                onChange={(e) => handleInputChange('min_height_mm', parseInt(e.target.value))}
                                placeholder="200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_height_mm" className="text-xs">Maximum</Label>
                              <Input
                                id="max_height_mm"
                                type="number"
                                step="50"
                                value={formData.max_height_mm || 1000}
                                onChange={(e) => handleInputChange('max_height_mm', parseInt(e.target.value))}
                                placeholder="1000"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available heights: {formData.min_height_mm || 200}mm to {formData.max_height_mm || 1000}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Depth Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_depth_mm" className="text-xs">Minimum</Label>
                              <Input
                                id="min_depth_mm"
                                type="number"
                                step="50"
                                value={formData.min_depth_mm || 200}
                                onChange={(e) => handleInputChange('min_depth_mm', parseInt(e.target.value))}
                                placeholder="200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_depth_mm" className="text-xs">Maximum</Label>
                              <Input
                                id="max_depth_mm"
                                type="number"
                                step="50"
                                value={formData.max_depth_mm || 800}
                                onChange={(e) => handleInputChange('max_depth_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available depths: {formData.min_depth_mm || 200}mm to {formData.max_depth_mm || 800}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Display Order</Label>
                          <Input
                            id="display_order"
                            type="number"
                            value={formData.display_order || 0}
                            onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Corner Cabinet Quantities */}
                  {formData.cabinet_style === 'corner' && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Corner Cabinet Part Quantities</Label>
                        
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="qty_left_side">Left Side Qty</Label>
                            <Input
                              id="qty_left_side"
                              type="number"
                              min="0"
                              value={formData.qty_left_side || 0}
                              onChange={(e) => handleInputChange('qty_left_side', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="qty_right_side">Right Side Qty</Label>
                            <Input
                              id="qty_right_side"
                              type="number"
                              min="0"
                              value={formData.qty_right_side || 0}
                              onChange={(e) => handleInputChange('qty_right_side', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="qty_left_back">Left Back Qty</Label>
                            <Input
                              id="qty_left_back"
                              type="number"
                              min="0"
                              value={formData.qty_left_back || 0}
                              onChange={(e) => handleInputChange('qty_left_back', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="qty_right_back">Right Back Qty</Label>
                            <Input
                              id="qty_right_back"
                              type="number"
                              min="0"
                              value={formData.qty_right_back || 0}
                              onChange={(e) => handleInputChange('qty_right_back', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="doors" className="p-6 space-y-8 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Door Style Options
                  </CardTitle>
                  <CardDescription>
                    Select which door styles are available for this cabinet type and customize their images
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {allDoorStyles?.map((doorStyle) => {
                    const isEnabled = cabinetDoorStyles?.some(cds => cds.door_style_id === doorStyle.id);
                    const existingStyle = cabinetDoorStyles?.find(cds => cds.door_style_id === doorStyle.id);
                    
                    return (
                      <div key={doorStyle.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`door-${doorStyle.id}`}
                              checked={isEnabled}
                              onChange={(e) => handleToggleDoorStyle(doorStyle.id, e.target.checked)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <div>
                              <Label htmlFor={`door-${doorStyle.id}`} className="text-base font-medium">
                                {doorStyle.name}
                              </Label>
                              {doorStyle.description && (
                                <p className="text-sm text-muted-foreground">{doorStyle.description}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Base Rate: ${doorStyle.base_rate_per_sqm}/sqm
                              </p>
                            </div>
                          </div>
                          
                          {isEnabled && (
                            <div className="flex items-center gap-2">
                              {existingStyle?.image_url && (
                                <img
                                  src={existingStyle.image_url}
                                  alt={doorStyle.name}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              )}
                               <div 
                                className="relative border-2 border-dashed border-muted-foreground rounded-lg p-2 hover:border-primary transition-colors min-h-[30px]"
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                  const files = e.dataTransfer.files;
                                  if (files.length > 0) {
                                    const file = files[0];
                                    if (file.type.startsWith('image/')) {
                                      handleImageUpload(doorStyle.id, file);
                                    } else {
                                      toast.error('Please drop an image file');
                                    }
                                  }
                                }}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(doorStyle.id, file);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2 text-center">
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                  <div className="text-sm">
                                    <span className="font-medium text-primary">Click to upload</span>
                                    <span className="text-muted-foreground"> or drag and drop</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {existingStyle?.image_url ? 'Change Image' : 'Add Image'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isEnabled && existingStyle?.image_url && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium">Preview Image</Label>
                            <div className="mt-2">
                              <img
                                src={existingStyle.image_url}
                                alt={doorStyle.name}
                                className="w-32 h-32 object-cover rounded border"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {!allDoorStyles?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      No door styles available. Create door styles first in the Door Styles management section.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parts" className="p-6 m-0">
              <CabinetComponentsTab 
                cabinetId={cabinetType?.id || 'new'} 
                cabinetStyle={formData.cabinet_style || 'standard'}
                onCabinetStyleChange={(style) => handleInputChange('cabinet_style', style)}
              />
            </TabsContent>

            <TabsContent value="hardware" className="p-6 space-y-8 m-0">
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
            </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="border-t px-6 py-4 bg-background flex-shrink-0">
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