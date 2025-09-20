import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Settings, DoorOpen, Wrench, Cog, Sparkles, Plus, Edit, Trash2, Upload, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/admin/shared/DataTable";
import { CabinetComponentsTab } from "@/components/admin/CabinetComponentsTab";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  cabinet_style?: string;
  active: boolean;
  door_count: number;
  drawer_count: number;
  featured_product: boolean;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  url_slug?: string;
  short_description?: string;
  long_description?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  min_height_mm?: number;
  max_height_mm?: number;
  min_depth_mm?: number;
  max_depth_mm?: number;
  width_increment: number;
  height_increment: number;
  depth_increment: number;
  left_side_width_mm?: number;
  right_side_width_mm?: number;
  left_side_depth_mm?: number;
  right_side_depth_mm?: number;
  display_order?: number;
  is_featured?: boolean;
  qty_left_side?: number;
  qty_right_side?: number;
  qty_left_back?: number;
  qty_right_back?: number;
}

interface DoorStyle {
  id: string;
  name: string;
  description?: string;
  base_rate_per_sqm: number;
  active: boolean;
}

interface CabinetDoorStyle {
  id: string;
  cabinet_type_id: string;
  door_style_id: string;
  image_url?: string;
  door_styles: DoorStyle;
}

interface CabinetHardwareRequirement {
  id?: string;
  cabinet_type_id?: string;
  hardware_type_id: string;
  quantity_formula: string;
  notes?: string;
  hardware_types?: {
    name: string;
    category: string;
  };
}

interface HardwareType {
  id: string;
  name: string;
  category: string;
  active: boolean;
}

const defaultCabinetType: CabinetType = {
  id: "",
  name: "",
  category: "",
  subcategory: "",
  cabinet_style: "standard",
  active: true,
  door_count: 0,
  drawer_count: 0,
  featured_product: false,
  description: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  default_width_mm: 600,
  default_height_mm: 720,
  default_depth_mm: 560,
  min_width_mm: 300,
  max_width_mm: 1200,
  min_height_mm: 300,
  max_height_mm: 900,
  min_depth_mm: 300,
  max_depth_mm: 600,
  width_increment: 50,
  height_increment: 50,
  depth_increment: 50,
  display_order: 0,
  is_featured: false,
};

// Hardware requirement form component
const HardwareRequirementForm: React.FC<{
  requirement: CabinetHardwareRequirement | null;
  onSave: (data: CabinetHardwareRequirement) => void;
  onCancel: () => void;
  loading: boolean;
  hardwareTypes: HardwareType[];
}> = ({ requirement, onSave, onCancel, loading, hardwareTypes }) => {
  const [formData, setFormData] = useState({
    hardware_type_id: '',
    quantity_formula: '',
    notes: '',
  });

  useEffect(() => {
    if (requirement) {
      setFormData({
        hardware_type_id: requirement.hardware_type_id,
        quantity_formula: requirement.quantity_formula,
        notes: requirement.notes || '',
      });
    } else {
      setFormData({
        hardware_type_id: '',
        quantity_formula: '',
        notes: '',
      });
    }
  }, [requirement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: requirement?.id,
      cabinet_type_id: requirement?.cabinet_type_id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hardware_type">Hardware Type *</Label>
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
          <Label htmlFor="quantity_formula">Quantity Formula *</Label>
          <Input
            id="quantity_formula"
            value={formData.quantity_formula}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity_formula: e.target.value }))}
            placeholder="e.g., DOOR_COUNT * 2"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes or instructions"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !formData.hardware_type_id || !formData.quantity_formula}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export default function EditCabinetType() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [cabinetType, setCabinetType] = useState<CabinetType>(defaultCabinetType);
  const [editingHardware, setEditingHardware] = useState<CabinetHardwareRequirement | null>(null);
  const [showHardwareForm, setShowHardwareForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cabinet type data
  const { data: existingCabinetType, isLoading: loadingCabinetType } = useQuery({
    queryKey: ['cabinet-type', id],
    queryFn: async () => {
      if (id === 'new') return null;
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
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

  // Fetch cabinet door styles for this cabinet type
  const { data: cabinetDoorStyles, isLoading: loadingDoorStyles } = useQuery({
    queryKey: ['cabinet-door-styles', id],
    queryFn: async () => {
      if (id === 'new') return [];
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
        .eq('cabinet_type_id', id)
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as any;
    },
    enabled: id !== 'new',
  });

  // Fetch hardware requirements for this cabinet type
  const { data: hardwareRequirements, isLoading: loadingHardware } = useQuery({
    queryKey: ['cabinet-hardware-requirements', id],
    queryFn: async () => {
      if (id === 'new') return [];
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_types (
            name,
            category
          )
        `)
        .eq('cabinet_type_id', id)
        .order('hardware_type_id');
      
      if (error) throw error;
      return data as any;
    },
    enabled: id !== 'new',
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
      return data as HardwareType[];
    },
  });

  // Save cabinet type mutation
  const saveCabinetType = useMutation({
    mutationFn: async (data: CabinetType) => {
      if (data.id && id !== 'new') {
        // Update existing
        const { error } = await supabase
          .from('cabinet_types')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Create new
        const { data: newData, error } = await supabase
          .from('cabinet_types')
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        return newData;
      }
    },
    onSuccess: (newData) => {
      queryClient.invalidateQueries({ queryKey: ['admin-cabinet-types'] });
      queryClient.invalidateQueries({ queryKey: ['cabinet-type', id] });
      toast.success(`Cabinet type ${id === 'new' ? 'created' : 'updated'} successfully`);
      if (id === 'new' && newData) {
        navigate(`/admin/cabinets/${newData.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to ${id === 'new' ? 'create' : 'update'} cabinet type`);
      console.error(error);
    },
  });

  // Save cabinet door style mutation
  const saveCabinetDoorStyle = useMutation({
    mutationFn: async (data: { door_style_id: string; image_url?: string }) => {
      const doorStyleData = {
        cabinet_type_id: id,
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
      queryClient.invalidateQueries({ queryKey: ['cabinet-door-styles', id] });
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
        .eq('cabinet_type_id', id)
        .eq('door_style_id', doorStyleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-door-styles', id] });
      toast.success('Door style removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove door style');
      console.error(error);
    },
  });

  // Save hardware requirement mutation
  const saveHardwareRequirement = useMutation({
    mutationFn: async (data: CabinetHardwareRequirement) => {
      const hardwareData = { ...data, cabinet_type_id: id };
      if (data.id) {
        const { error } = await supabase
          .from('cabinet_hardware_requirements')
          .update(hardwareData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cabinet_hardware_requirements')
          .insert([{...hardwareData, unit_scope: 'each', units_per_scope: 1}]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware-requirements', id] });
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
    mutationFn: async (hwId: string) => {
      const { error } = await supabase
        .from('cabinet_hardware_requirements')
        .delete()
        .eq('id', hwId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware-requirements', id] });
      toast.success('Hardware requirement deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete hardware requirement');
      console.error(error);
    },
  });

  // Initialize cabinet type data
  useEffect(() => {
    if (existingCabinetType) {
      setCabinetType(existingCabinetType);
    } else if (id === 'new') {
      setCabinetType(defaultCabinetType);
    }
  }, [existingCabinetType, id]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveCabinetType.mutateAsync(cabinetType);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CabinetType, value: any) => {
    setCabinetType(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateContent = async () => {
    if (!cabinetType.name) {
      toast.error("Please enter a cabinet name first");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          cabinetName: cabinetType.name,
          category: cabinetType.category,
          subcategory: cabinetType.subcategory,
          description: cabinetType.description
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data) {
        setCabinetType(prev => ({
          ...prev,
          seo_title: data.meta_title || '',
          seo_description: data.meta_description || '',
          seo_keywords: data.meta_keywords || '',
          description: data.short_description || prev.description,
        }));
        toast.success("SEO content generated successfully");
      }
    } catch (error) {
      console.error('Generate content error:', error);
      toast.error("Failed to generate content: " + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (doorStyleId: string, file: File) => {
    if (id === 'new') {
      toast.error('Please save the cabinet type first before uploading images');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${doorStyleId}-${Date.now()}.${fileExt}`;
      
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
    if (id === 'new') {
      toast.error('Please save the cabinet type first before managing door styles');
      return;
    }

    if (enabled) {
      saveCabinetDoorStyle.mutate({ door_style_id: doorStyleId });
    } else {
      removeCabinetDoorStyle.mutate(doorStyleId);
    }
  };

  const hardwareColumns: any[] = [
    {
      key: 'hardware_types' as keyof CabinetHardwareRequirement,
      label: 'Hardware Type',
      render: (value: any) => value?.name || 'Unknown',
    },
    {
      key: 'hardware_types' as keyof CabinetHardwareRequirement,
      label: 'Category',
      render: (value: any) => value?.category || 'Unknown',
    },
    {
      key: 'quantity_formula' as keyof CabinetHardwareRequirement,
      label: 'Quantity Formula',
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
            onClick={() => deleteHardwareRequirement.mutate(value)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loadingCabinetType && id !== 'new') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/cabinets")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cabinets
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">
              {id === "new" ? "Create Cabinet Type" : "Edit Cabinet Type"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure cabinet specifications, parts, and hardware requirements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/cabinets")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container px-6 py-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Basic Information
            </TabsTrigger>
            <TabsTrigger value="sizes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Default Sizes
            </TabsTrigger>
            <TabsTrigger value="doors" className="flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Door Options
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Parts & Formulas
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              Hardware Requirements
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <TabsContent value="basic" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Basic Information</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateContent}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isLoading ? "Generating..." : "Generate SEO & Descriptions"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={cabinetType.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., 4 door base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={cabinetType.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Base Cabinets">Base Cabinets</SelectItem>
                          <SelectItem value="Wall Cabinets">Wall Cabinets</SelectItem>
                          <SelectItem value="Tall Cabinets">Tall Cabinets</SelectItem>
                          <SelectItem value="Corner Cabinets">Corner Cabinets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Input
                        id="subcategory"
                        value={cabinetType.subcategory || ''}
                        onChange={(e) => handleInputChange('subcategory', e.target.value)}
                        placeholder="e.g., doors"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={cabinetType.active}
                        onCheckedChange={(checked) => handleInputChange('active', checked)}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="door_count">Door Count</Label>
                      <Input
                        id="door_count"
                        type="number"
                        value={cabinetType.door_count}
                        onChange={(e) => handleInputChange('door_count', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="drawer_count">Drawer Count</Label>
                      <Input
                        id="drawer_count"
                        type="number"
                        value={cabinetType.drawer_count}
                        onChange={(e) => handleInputChange('drawer_count', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={cabinetType.featured_product}
                      onCheckedChange={(checked) => handleInputChange('featured_product', checked)}
                    />
                    <Label htmlFor="featured">Featured Product</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={cabinetType.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter cabinet description..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      value={cabinetType.seo_title || ''}
                      onChange={(e) => handleInputChange('seo_title', e.target.value)}
                      placeholder="SEO optimized title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea
                      id="seo_description"
                      value={cabinetType.seo_description || ''}
                      onChange={(e) => handleInputChange('seo_description', e.target.value)}
                      placeholder="SEO meta description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_keywords">SEO Keywords</Label>
                    <Input
                      id="seo_keywords"
                      value={cabinetType.seo_keywords || ''}
                      onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizes" className="space-y-6 m-0">
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
                    <Select value={cabinetType.cabinet_style || 'standard'} onValueChange={(value) => handleInputChange('cabinet_style', value)}>
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
                    {cabinetType.cabinet_style === 'corner' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                             <Label htmlFor="left_side_width_mm">Left Width (mm)</Label>
                             <Input
                               id="left_side_width_mm"
                               type="number"
                               step="50"
                               value={cabinetType.left_side_width_mm || 600}
                               onChange={(e) => {
                                 const value = parseInt(e.target.value);
                                 // Round to nearest 50mm increment
                                 const rounded = Math.round(value / 50) * 50;
                                 handleInputChange('left_side_width_mm', rounded);
                               }}
                             />
                           </div>
                          <div>
                            <Label htmlFor="right_side_width_mm">Right Width (mm)</Label>
                            <Input
                              id="right_side_width_mm"
                              type="number"
                              value={cabinetType.right_side_width_mm || 600}
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
                              value={cabinetType.default_height_mm}
                              onChange={(e) => handleInputChange('default_height_mm', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="left_side_depth_mm">Left Depth (mm)</Label>
                            <Input
                              id="left_side_depth_mm"
                              type="number"
                              value={cabinetType.left_side_depth_mm || 560}
                              onChange={(e) => handleInputChange('left_side_depth_mm', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="right_side_depth_mm">Right Depth (mm)</Label>
                            <Input
                              id="right_side_depth_mm"
                              type="number"
                              value={cabinetType.right_side_depth_mm || 560}
                              onChange={(e) => handleInputChange('right_side_depth_mm', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium">Width</h4>
                          <div className="space-y-2">
                            <Label>Default (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.default_width_mm}
                              onChange={(e) => handleInputChange('default_width_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.min_width_mm || 300}
                              onChange={(e) => handleInputChange('min_width_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.max_width_mm || 1200}
                              onChange={(e) => handleInputChange('max_width_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                           <div className="space-y-2">
                             <Label>Increment (mm)</Label>
                             <Input
                               type="number"
                               value={cabinetType.width_increment || 50}
                               onChange={(e) => handleInputChange('width_increment', parseInt(e.target.value) || 50)}
                             />
                           </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium">Height</h4>
                          <div className="space-y-2">
                            <Label>Default (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.default_height_mm}
                              onChange={(e) => handleInputChange('default_height_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.min_height_mm || 300}
                              onChange={(e) => handleInputChange('min_height_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.max_height_mm || 900}
                              onChange={(e) => handleInputChange('max_height_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Increment (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.height_increment}
                              onChange={(e) => handleInputChange('height_increment', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium">Depth</h4>
                          <div className="space-y-2">
                            <Label>Default (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.default_depth_mm}
                              onChange={(e) => handleInputChange('default_depth_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Min (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.min_depth_mm || 300}
                              onChange={(e) => handleInputChange('min_depth_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.max_depth_mm || 600}
                              onChange={(e) => handleInputChange('max_depth_mm', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Increment (mm)</Label>
                            <Input
                              type="number"
                              value={cabinetType.depth_increment}
                              onChange={(e) => handleInputChange('depth_increment', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Size Ranges - Different for Corner vs Standard */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Size Ranges (50mm increments will be generated)</Label>
                    {cabinetType.cabinet_style === 'corner' ? (
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
                                value={cabinetType.min_width_mm || 300}
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
                                value={cabinetType.max_width_mm || 800}
                                onChange={(e) => handleInputChange('max_width_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available left widths: {cabinetType.min_width_mm || 300}mm to {cabinetType.max_width_mm || 800}mm in 50mm steps
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
                                value={cabinetType.min_width_mm || 300}
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
                                value={cabinetType.max_width_mm || 800}
                                onChange={(e) => handleInputChange('max_width_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available right widths: {cabinetType.min_width_mm || 300}mm to {cabinetType.max_width_mm || 800}mm in 50mm steps
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
                                value={cabinetType.min_height_mm || 200}
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
                                value={cabinetType.max_height_mm || 1000}
                                onChange={(e) => handleInputChange('max_height_mm', parseInt(e.target.value))}
                                placeholder="1000"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available heights: {cabinetType.min_height_mm || 200}mm to {cabinetType.max_height_mm || 1000}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Left Depth Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_left_depth" className="text-xs">Minimum</Label>
                              <Input
                                id="min_left_depth"
                                type="number"
                                step="50"
                                value={cabinetType.min_depth_mm || 200}
                                onChange={(e) => handleInputChange('min_depth_mm', parseInt(e.target.value))}
                                placeholder="200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_left_depth" className="text-xs">Maximum</Label>
                              <Input
                                id="max_left_depth"
                                type="number"
                                step="50"
                                value={cabinetType.max_depth_mm || 800}
                                onChange={(e) => handleInputChange('max_depth_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available left depths: {cabinetType.min_depth_mm || 200}mm to {cabinetType.max_depth_mm || 800}mm in 50mm steps
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Right Depth Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_right_depth" className="text-xs">Minimum</Label>
                              <Input
                                id="min_right_depth"
                                type="number"
                                step="50"
                                value={cabinetType.min_depth_mm || 200}
                                onChange={(e) => handleInputChange('min_depth_mm', parseInt(e.target.value))}
                                placeholder="200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_right_depth" className="text-xs">Maximum</Label>
                              <Input
                                id="max_right_depth"
                                type="number"
                                step="50"
                                value={cabinetType.max_depth_mm || 800}
                                onChange={(e) => handleInputChange('max_depth_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available right depths: {cabinetType.min_depth_mm || 200}mm to {cabinetType.max_depth_mm || 800}mm in 50mm steps
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Width Range (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="min_width_mm" className="text-xs">Minimum</Label>
                              <Input
                                id="min_width_mm"
                                type="number"
                                step="50"
                                value={cabinetType.min_width_mm || 300}
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
                                value={cabinetType.max_width_mm || 1200}
                                onChange={(e) => handleInputChange('max_width_mm', parseInt(e.target.value))}
                                placeholder="1200"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available widths: {cabinetType.min_width_mm || 300}mm to {cabinetType.max_width_mm || 1200}mm in 50mm steps
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
                                value={cabinetType.min_height_mm || 200}
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
                                value={cabinetType.max_height_mm || 1000}
                                onChange={(e) => handleInputChange('max_height_mm', parseInt(e.target.value))}
                                placeholder="1000"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available heights: {cabinetType.min_height_mm || 200}mm to {cabinetType.max_height_mm || 1000}mm in 50mm steps
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
                                value={cabinetType.min_depth_mm || 200}
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
                                value={cabinetType.max_depth_mm || 800}
                                onChange={(e) => handleInputChange('max_depth_mm', parseInt(e.target.value))}
                                placeholder="800"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Available depths: {cabinetType.min_depth_mm || 200}mm to {cabinetType.max_depth_mm || 800}mm in 50mm steps
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="doors" className="space-y-6 m-0">
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

            <TabsContent value="parts" className="space-y-6 m-0">
              <div className="space-y-6">
                <CabinetComponentsTab 
                  cabinetId={id || 'new'} 
                  cabinetStyle={cabinetType.cabinet_style || 'standard'}
                  onCabinetStyleChange={(style) => handleInputChange('cabinet_style', style)}
                />
                
                {/* Corner Cabinet Part Quantities - Only show for corner cabinets */}
                {cabinetType.cabinet_style === 'corner' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Corner Cabinet Part Quantities</CardTitle>
                      <CardDescription>
                        Define the quantity of parts specific to corner cabinets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="qty_left_side">Left Side Qty</Label>
                          <Input
                            id="qty_left_side"
                            type="number"
                            min="0"
                            value={cabinetType.qty_left_side || 0}
                            onChange={(e) => handleInputChange('qty_left_side', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="qty_right_side">Right Side Qty</Label>
                          <Input
                            id="qty_right_side"
                            type="number"
                            min="0"
                            value={cabinetType.qty_right_side || 0}
                            onChange={(e) => handleInputChange('qty_right_side', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="qty_left_back">Left Back Qty</Label>
                          <Input
                            id="qty_left_back"
                            type="number"
                            min="0"
                            value={cabinetType.qty_left_back || 0}
                            onChange={(e) => handleInputChange('qty_left_back', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="qty_right_back">Right Back Qty</Label>
                          <Input
                            id="qty_right_back"
                            type="number"
                            min="0"
                            value={cabinetType.qty_right_back || 0}
                            onChange={(e) => handleInputChange('qty_right_back', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="hardware" className="space-y-6 m-0">
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
                      disabled={id === 'new'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Hardware
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {id === 'new' && (
                    <div className="text-center py-8 text-muted-foreground">
                      Save the cabinet type first to manage hardware requirements.
                    </div>
                  )}
                  
                  {id !== 'new' && showHardwareForm && (
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
                  
                  {id !== 'new' && (
                    <DataTable
                      columns={hardwareColumns}
                      data={(hardwareRequirements || []).filter(hw => hw.id).map(hw => ({ 
                        ...hw, 
                        id: hw.id as string 
                      }))}
                      loading={loadingHardware}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}