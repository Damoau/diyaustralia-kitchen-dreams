import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Package, Save, DollarSign, Palette } from 'lucide-react';
import { ImageDropzone } from './ImageDropzone';
import { CabinetComponentsTab } from './CabinetComponentsTab';

interface CabinetTypeDetails {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  short_description: string;
  long_description: string;
  door_count: number;
  drawer_count: number;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  min_height_mm?: number;
  max_height_mm?: number;
  min_depth_mm?: number;
  max_depth_mm?: number;
  base_price?: number;
  stock_quantity?: number;
  active: boolean;
  backs_qty?: number;
  bottoms_qty?: number;
  sides_qty?: number;
  door_qty?: number;
  product_image_url?: string;
  door_style_id?: string;
}

interface CabinetTypeEditDialogProps {
  cabinetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CabinetTypeEditDialog: React.FC<CabinetTypeEditDialogProps> = ({
  cabinetId,
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [cabinetData, setCabinetData] = useState<CabinetTypeDetails | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  const { data: cabinet, isLoading } = useQuery({
    queryKey: ['cabinet-type-details', cabinetId],
    queryFn: async () => {
      if (cabinetId === 'new') {
        return {
          id: 'new',
          name: '',
          category: 'base',
          subcategory: '',
          short_description: '',
          long_description: '',
          door_count: 0,
          drawer_count: 0,
          default_width_mm: 600,
          default_height_mm: 720,
          default_depth_mm: 560,
          min_width_mm: 300,
          max_width_mm: 1200,
          min_height_mm: 600,
          max_height_mm: 900,
          min_depth_mm: 350,
          max_depth_mm: 600,
          base_price: 0,
          stock_quantity: 0,
          active: true,
          backs_qty: 1,
          bottoms_qty: 1,
          sides_qty: 2,
          door_qty: 0,
          product_image_url: '',
          door_style_id: '',
        } as CabinetTypeDetails;
      }
      
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', cabinetId)
        .single();

      if (error) throw error;
      return data as CabinetTypeDetails;
    },
    enabled: !!cabinetId && open,
  });

  // Initialize cabinet data when loaded
  useEffect(() => {
    if (cabinet) {
      setCabinetData(cabinet);
      setHasUnsavedChanges(false);
    }
  }, [cabinet]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<CabinetTypeDetails>) => {
      // Validate required fields
      if (!updates.name && (!cabinetData?.name || cabinetData.name === '')) {
        throw new Error('Cabinet name is required');
      }

      const dataToSave = { ...cabinetData, ...updates };
      
      if (cabinetId === 'new') {
        // Create new cabinet - ensure required fields are present
        if (!dataToSave.name || dataToSave.name.trim() === '') {
          throw new Error('Cabinet name is required');
        }
        const { error } = await supabase
          .from('cabinet_types')
          .insert(dataToSave);
        if (error) throw error;
      } else {
        // Update existing cabinet
        const { error } = await supabase
          .from('cabinet_types')
          .update(updates)
          .eq('id', cabinetId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-type-details'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cabinets'] });
      setHasUnsavedChanges(false);
      toast.success('Cabinet saved successfully');
    },
    onError: (error) => {
      console.error('Error saving cabinet:', error);
      toast.error(error.message || 'Failed to save cabinet');
    },
  });

  // Auto-save when data changes (debounced)
  useEffect(() => {
    if (cabinetData && hasUnsavedChanges && cabinetData.name && cabinetData.name.trim() !== '') {
      const saveTimeout = setTimeout(() => {
        updateMutation.mutate(cabinetData);
      }, 2000); // Auto-save after 2 seconds of no changes

      return () => clearTimeout(saveTimeout);
    }
  }, [cabinetData, hasUnsavedChanges]);

  // Auto-save when switching tabs
  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges && cabinetData?.name && cabinetData.name.trim() !== '') {
      updateMutation.mutate(cabinetData);
    }
    setActiveTab(newTab);
  };

  // Auto-save when closing dialog
  const handleDialogClose = (open: boolean) => {
    if (!open && hasUnsavedChanges && cabinetData?.name && cabinetData.name.trim() !== '') {
      updateMutation.mutate(cabinetData);
    }
    onOpenChange(open);
  };

  const updateCabinetData = (updates: Partial<CabinetTypeDetails>) => {
    setCabinetData(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!cabinetData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {cabinetId === 'new' ? 'Create New Cabinet' : `Edit Cabinet: ${cabinetData.name}`}
            {hasUnsavedChanges && <Badge variant="secondary">Unsaved Changes</Badge>}
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            {cabinetId === 'new' 
              ? 'Create a new cabinet with custom specifications and pricing. Changes auto-save as you type.'
              : 'Modify cabinet specifications, dimensions, and pricing. Changes auto-save as you type.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="price-ranges">Price Ranges</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab cabinet={cabinetData} onUpdate={updateCabinetData} />
          </TabsContent>

          <TabsContent value="dimensions">
            <DimensionsTab cabinet={cabinetData} onUpdate={updateCabinetData} />
          </TabsContent>

          <TabsContent value="components">
            <ComponentsTab cabinet={cabinetData} onUpdate={updateCabinetData} />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingTab cabinet={cabinetData} onUpdate={updateCabinetData} />
          </TabsContent>

          <TabsContent value="price-ranges">
            <PriceRangesTab cabinetId={cabinetData.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Basic Info Tab Component
const BasicInfoTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onUpdate: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Cabinet name, category, descriptions, and door styles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Cabinet Name *</Label>
            <Input
              id="name"
              value={cabinet.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Enter cabinet name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <CategorySelector
              value={cabinet.category}
              onChange={(value) => onUpdate({ category: value, subcategory: '' })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <SubcategorySelector
            category={cabinet.category}
            value={cabinet.subcategory || ''}
            onChange={(value) => onUpdate({ subcategory: value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="door_style">Default Door Style</Label>
          <DoorStyleSelector
            value={cabinet.door_style_id || 'none'}
            onChange={(value) => onUpdate({ door_style_id: value === 'none' ? '' : value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="short_description">Short Description</Label>
          <Input
            id="short_description"
            value={cabinet.short_description}
            onChange={(e) => onUpdate({ short_description: e.target.value })}
            placeholder="Brief description for listings"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="long_description">Long Description</Label>
          <Textarea
            id="long_description"
            value={cabinet.long_description}
            onChange={(e) => onUpdate({ long_description: e.target.value })}
            placeholder="Detailed description for product pages"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_image_url">Product Image</Label>
          <ImageDropzone
            value={cabinet.product_image_url}
            onChange={(url) => onUpdate({ product_image_url: url })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={cabinet.active}
            onCheckedChange={(checked) => onUpdate({ active: checked })}
          />
          <Label htmlFor="active">Active (visible to customers)</Label>
        </div>
      </CardContent>
    </Card>
  );
};

// Dimensions Tab Component
const DimensionsTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onUpdate: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dimensions</CardTitle>
        <CardDescription>Cabinet size specifications and constraints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Width (mm)</h4>
            <div className="space-y-2">
              <Label htmlFor="default_width">Default *</Label>
              <Input
                id="default_width"
                type="number"
                value={cabinet.default_width_mm}
                onChange={(e) => onUpdate({ default_width_mm: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_width">Minimum</Label>
              <Input
                id="min_width"
                type="number"
                value={cabinet.min_width_mm || 100}
                onChange={(e) => onUpdate({ min_width_mm: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_width">Maximum</Label>
              <Input
                id="max_width"
                type="number"
                value={cabinet.max_width_mm || 1200}
                onChange={(e) => onUpdate({ max_width_mm: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Height (mm)</h4>
            <div className="space-y-2">
              <Label htmlFor="default_height">Default *</Label>
              <Input
                id="default_height"
                type="number"
                value={cabinet.default_height_mm}
                onChange={(e) => onUpdate({ default_height_mm: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_height">Minimum</Label>
              <Input
                id="min_height"
                type="number"
                value={cabinet.min_height_mm || 200}
                onChange={(e) => onUpdate({ min_height_mm: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_height">Maximum</Label>
              <Input
                id="max_height"
                type="number"
                value={cabinet.max_height_mm || 1000}
                onChange={(e) => onUpdate({ max_height_mm: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Depth (mm)</h4>
            <div className="space-y-2">
              <Label htmlFor="default_depth">Default *</Label>
              <Input
                id="default_depth"
                type="number"
                value={cabinet.default_depth_mm}
                onChange={(e) => onUpdate({ default_depth_mm: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_depth">Minimum</Label>
              <Input
                id="min_depth"
                type="number"
                value={cabinet.min_depth_mm || 200}
                onChange={(e) => onUpdate({ min_depth_mm: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_depth">Maximum</Label>
              <Input
                id="max_depth"
                type="number"
                value={cabinet.max_depth_mm || 800}
                onChange={(e) => onUpdate({ max_depth_mm: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Components Tab Component
const ComponentsTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onUpdate: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Components</CardTitle>
        <CardDescription>Specify the number of each component for this cabinet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="door_count">Door Count *</Label>
            <Input
              id="door_count"
              type="number"
              min="0"
              value={cabinet.door_count}
              onChange={(e) => onUpdate({ door_count: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drawer_count">Drawer Count *</Label>
            <Input
              id="drawer_count"
              type="number"
              min="0"
              value={cabinet.drawer_count}
              onChange={(e) => onUpdate({ drawer_count: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">Panel Quantities</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backs_qty">Back Panels</Label>
              <Input
                id="backs_qty"
                type="number"
                min="0"
                value={cabinet.backs_qty || 1}
                onChange={(e) => onUpdate({ backs_qty: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bottoms_qty">Bottom Panels</Label>
              <Input
                id="bottoms_qty"
                type="number"
                min="0"
                value={cabinet.bottoms_qty || 1}
                onChange={(e) => onUpdate({ bottoms_qty: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sides_qty">Side Panels</Label>
              <Input
                id="sides_qty"
                type="number"
                min="0"
                value={cabinet.sides_qty || 2}
                onChange={(e) => onUpdate({ sides_qty: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="door_qty">Door Panels</Label>
              <Input
                id="door_qty"
                type="number"
                min="0"
                value={cabinet.door_qty || cabinet.door_count}
                onChange={(e) => onUpdate({ door_qty: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Pricing Tab Component
const PricingTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onUpdate: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing & Inventory
        </CardTitle>
        <CardDescription>Base pricing and stock management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="base_price">Base Price (AUD)</Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            min="0"
            value={cabinet.base_price || 0}
            onChange={(e) => onUpdate({ base_price: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-sm text-muted-foreground">
            Base price before material, finish, and dimension adjustments
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            value={cabinet.stock_quantity || 0}
            onChange={(e) => onUpdate({ stock_quantity: parseInt(e.target.value) || 0 })}
          />
          <p className="text-sm text-muted-foreground">
            Current inventory level for this cabinet type
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Door Style Selector Component
interface DoorStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const DoorStyleSelector: React.FC<DoorStyleSelectorProps> = ({ value, onChange }) => {
  const { data: doorStyles } = useQuery({
    queryKey: ['door-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('id, name, image_url')
        .eq('active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching door styles:', error);
        return [];
      }
      
      return data;
    },
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select door style (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None - Use customer selection</SelectItem>
        {doorStyles?.map((style) => (
          <SelectItem key={style.id} value={style.id}>
            <div className="flex items-center gap-2">
              {style.image_url && (
                <img
                  src={style.image_url}
                  alt={style.name}
                  className="w-6 h-6 object-cover rounded"
                />
              )}
              <span>{style.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Category Selector Component
interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name, display_name')
        .eq('active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      
      return data.map(cat => cat.name);
    },
  });

  // Combine database categories with default options as fallback
  const allCategories = [...new Set([
    ...(categories || []),
    'base',
    'wall', 
    'pantry',
    'panels'
  ])].sort();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {allCategories.map(category => (
          <SelectItem key={category} value={category}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Subcategory Selector Component
interface SubcategorySelectorProps {
  category: string;
  value: string;
  onChange: (value: string) => void;
}

const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({ category, value, onChange }) => {
  const { data: subcategories } = useQuery({
    queryKey: ['subcategories', category],
    queryFn: async () => {
      if (!category) return [];
      
      // First get the category_id for the selected category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .eq('active', true)
        .single();
        
      if (categoryError || !categoryData) {
        console.error('Category not found:', categoryError);
        return [];
      }
      
      // Then get subcategories for this category
      const { data, error } = await supabase
        .from('subcategories')
        .select('name, display_name')
        .eq('category_id', categoryData.id)
        .eq('active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching subcategories:', error);
        return [];
      }
      
      return data.map(sub => sub.name);
    },
    enabled: !!category,
  });

  // Category-specific subcategories as fallback
  const getDefaultSubcategoriesForCategory = (category: string) => {
    switch (category) {
      case 'base':
        return ['doors', 'drawers', 'bin_cabinets', 'corner_base'];
      case 'wall':
        return ['single_door', 'double_door', 'glass_door', 'open_shelf', 'corner_wall'];
      case 'pantry':
        return ['tall_single', 'tall_double', 'tall_drawers', 'larder'];
      case 'panels':
        return ['end_panels', 'filler_strips', 'plinths', 'cornices'];
      default:
        return ['doors', 'drawers'];
    }
  };

  const defaultSubcategories = getDefaultSubcategoriesForCategory(category);
  const allSubcategories = [...new Set([
    ...(subcategories || []),
    ...defaultSubcategories
  ])].sort();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select subcategory (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {allSubcategories.map(subcategory => (
          <SelectItem key={subcategory} value={subcategory}>
            {subcategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Price Ranges Tab Component
interface PriceRange {
  id?: string;
  label: string;
  min_width_mm: number;
  max_width_mm: number;
  sort_order: number;
}

interface PriceRangesTabProps {
  cabinetId: string;
}

const PriceRangesTab: React.FC<PriceRangesTabProps> = ({ cabinetId }) => {
  const [ranges, setRanges] = useState<PriceRange[]>([]);
  const [minWidth, setMinWidth] = useState(300);
  const [maxWidth, setMaxWidth] = useState(1200);
  const [increment, setIncrement] = useState(150);

  const { data: existingRanges, isLoading } = useQuery({
    queryKey: ['cabinet-price-ranges', cabinetId],
    queryFn: async () => {
      if (cabinetId === 'new') return [];
      
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('cabinet_type_id', cabinetId)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    },
    enabled: cabinetId !== 'new',
  });

  useEffect(() => {
    if (existingRanges) {
      setRanges(existingRanges);
    }
  }, [existingRanges]);

  const saveMutation = useMutation({
    mutationFn: async (rangesToSave: PriceRange[]) => {
      if (cabinetId === 'new') return;

      // Delete existing ranges
      await supabase
        .from('cabinet_type_price_ranges')
        .delete()
        .eq('cabinet_type_id', cabinetId);

      // Insert new ranges
      if (rangesToSave.length > 0) {
        const { error } = await supabase
          .from('cabinet_type_price_ranges')
          .insert(
            rangesToSave.map((range, index) => ({
              cabinet_type_id: cabinetId,
              label: range.label,
              min_width_mm: range.min_width_mm,
              max_width_mm: range.max_width_mm,
              sort_order: index,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Price ranges saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save price ranges');
      console.error(error);
    },
  });

  const autoGenerateRanges = () => {
    const newRanges: PriceRange[] = [];
    let currentMin = minWidth;

    while (currentMin < maxWidth) {
      const currentMax = Math.min(currentMin + increment - 1, maxWidth);
      
      newRanges.push({
        label: `${currentMin}mm - ${currentMax}mm`,
        min_width_mm: currentMin,
        max_width_mm: currentMax,
        sort_order: newRanges.length,
      });

      currentMin = currentMax + 1;
    }

    setRanges(newRanges);
  };

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const nextMin = lastRange ? lastRange.max_width_mm + 1 : minWidth;
    
    setRanges([...ranges, {
      label: `${nextMin}mm - ${nextMin + increment}mm`,
      min_width_mm: nextMin,
      max_width_mm: nextMin + increment,
      sort_order: ranges.length,
    }]);
  };

  const updateRange = (index: number, updates: Partial<PriceRange>) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], ...updates };
    setRanges(newRanges);
  };

  const removeRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    saveMutation.mutate(ranges);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Price Ranges
        </CardTitle>
        <CardDescription>
          Define width-based price tiers for this cabinet type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cabinetId === 'new' && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Save the cabinet first to configure price ranges.
            </p>
          </div>
        )}

        {cabinetId !== 'new' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minWidth">Start Width (mm)</Label>
                <Input
                  id="minWidth"
                  type="number"
                  value={minWidth}
                  onChange={(e) => setMinWidth(parseInt(e.target.value) || 300)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWidth">End Width (mm)</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value) || 1200)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="increment">Increment (mm)</Label>
                <Input
                  id="increment"
                  type="number"
                  value={increment}
                  onChange={(e) => setIncrement(parseInt(e.target.value) || 150)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={autoGenerateRanges} variant="outline">
                Auto Generate Ranges
              </Button>
              <Button onClick={addRange} variant="outline">
                Add Range
              </Button>
            </div>

            <div className="space-y-2">
              {ranges.map((range, index) => (
                <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                  <Input
                    placeholder="Label"
                    value={range.label}
                    onChange={(e) => updateRange(index, { label: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Min Width"
                    value={range.min_width_mm}
                    onChange={(e) => updateRange(index, { min_width_mm: parseInt(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max Width"
                    value={range.max_width_mm}
                    onChange={(e) => updateRange(index, { max_width_mm: parseInt(e.target.value) })}
                    className="w-24"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeRange(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full" 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Price Ranges
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};