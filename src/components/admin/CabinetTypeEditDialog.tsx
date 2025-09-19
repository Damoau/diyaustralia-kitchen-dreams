import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Package, Palette, DollarSign, Plus, Trash2, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageDropzone } from './ImageDropzone';
import { CabinetComponentsTab } from './CabinetComponentsTab';
import { CabinetDoorStyleTab } from './CabinetDoorStyleTab';
import { CategoriesManager } from './CategoriesManager';

interface CabinetTypeDetails {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  short_description?: string;
  long_description?: string;
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
}

interface CabinetTypeEditDialogProps {
  cabinetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CabinetTypeEditDialog: React.FC<CabinetTypeEditDialogProps> = ({
  cabinetId,
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const queryClient = useQueryClient();

  const { data: cabinet, isLoading } = useQuery({
    queryKey: ['cabinet-type-details', cabinetId],
    queryFn: async () => {
      if (cabinetId === 'new') {
        // Return default values for new cabinet
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

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<CabinetTypeDetails>) => {
      if (cabinetId === 'new') {
        // Create new cabinet - ensure required fields are present
        const { error } = await supabase
          .from('cabinet_types')
          .insert(updates as any); // Cast to any to handle partial type
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
      toast.success(cabinetId === 'new' ? 'Cabinet created successfully' : 'Cabinet updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error saving cabinet:', error);
      toast.error(cabinetId === 'new' ? 'Failed to create cabinet' : 'Failed to update cabinet');
    },
  });

  const handleSave = (updates: Partial<CabinetTypeDetails>) => {
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!cabinet) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {cabinetId === 'new' ? 'Create New Cabinet' : `Edit Cabinet: ${cabinet.name}`}
          </DialogTitle>
          <DialogDescription>
            {cabinetId === 'new' 
              ? 'Create a new cabinet with custom specifications and pricing'
              : 'Modify cabinet specifications, dimensions, and pricing'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="price-ranges">Price Ranges</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab cabinet={cabinet} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="dimensions">
            <DimensionsTab cabinet={cabinet} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="components">
            <CabinetComponentsTab cabinetId={cabinet.id} />
          </TabsContent>

          <TabsContent value="pricing">
            <CabinetDoorStyleTab cabinetId={cabinet.id} />
          </TabsContent>

          <TabsContent value="price-ranges">
            <PriceRangesTab cabinetId={cabinet.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const BasicInfoTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onSave: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onSave }) => {
  const [formData, setFormData] = useState({
    name: cabinet.name,
    category: cabinet.category,
    subcategory: cabinet.subcategory || '',
    short_description: cabinet.short_description || '',
    long_description: cabinet.long_description || '',
    active: cabinet.active,
    product_image_url: cabinet.product_image_url || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Cabinet name, category, and descriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Cabinet Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <CategorySelector
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value, subcategory: '' })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <SubcategorySelector
              category={formData.category}
              value={formData.subcategory || ''}
              onChange={(value) => setFormData({ ...formData, subcategory: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Brief description for listings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="long_description">Long Description</Label>
            <Textarea
              id="long_description"
              value={formData.long_description}
              onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
              placeholder="Detailed description for product pages"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_image_url">Product Image</Label>
            <ImageDropzone
              value={formData.product_image_url}
              onChange={(url) => setFormData({ ...formData, product_image_url: url })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Active (visible to customers)</Label>
          </div>

          <Button type="submit" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Basic Info
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const DimensionsTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onSave: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onSave }) => {
  const [formData, setFormData] = useState({
    default_width_mm: cabinet.default_width_mm,
    default_height_mm: cabinet.default_height_mm,
    default_depth_mm: cabinet.default_depth_mm,
    min_width_mm: cabinet.min_width_mm || 100,
    max_width_mm: cabinet.max_width_mm || 1200,
    min_height_mm: cabinet.min_height_mm || 200,
    max_height_mm: cabinet.max_height_mm || 1000,
    min_depth_mm: cabinet.min_depth_mm || 200,
    max_depth_mm: cabinet.max_depth_mm || 800,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dimensions</CardTitle>
        <CardDescription>Default and allowable dimensions in millimeters</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">Width (mm)</h4>
              <div className="space-y-2">
                <Label htmlFor="default_width">Default *</Label>
                <Input
                  id="default_width"
                  type="number"
                  value={formData.default_width_mm}
                  onChange={(e) => setFormData({ ...formData, default_width_mm: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_width">Minimum</Label>
                <Input
                  id="min_width"
                  type="number"
                  value={formData.min_width_mm}
                  onChange={(e) => setFormData({ ...formData, min_width_mm: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_width">Maximum</Label>
                <Input
                  id="max_width"
                  type="number"
                  value={formData.max_width_mm}
                  onChange={(e) => setFormData({ ...formData, max_width_mm: parseInt(e.target.value) })}
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
                  value={formData.default_height_mm}
                  onChange={(e) => setFormData({ ...formData, default_height_mm: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_height">Minimum</Label>
                <Input
                  id="min_height"
                  type="number"
                  value={formData.min_height_mm}
                  onChange={(e) => setFormData({ ...formData, min_height_mm: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_height">Maximum</Label>
                <Input
                  id="max_height"
                  type="number"
                  value={formData.max_height_mm}
                  onChange={(e) => setFormData({ ...formData, max_height_mm: parseInt(e.target.value) })}
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
                  value={formData.default_depth_mm}
                  onChange={(e) => setFormData({ ...formData, default_depth_mm: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_depth">Minimum</Label>
                <Input
                  id="min_depth"
                  type="number"
                  value={formData.min_depth_mm}
                  onChange={(e) => setFormData({ ...formData, min_depth_mm: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_depth">Maximum</Label>
                <Input
                  id="max_depth"
                  type="number"
                  value={formData.max_depth_mm}
                  onChange={(e) => setFormData({ ...formData, max_depth_mm: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Dimensions
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const ComponentsTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onSave: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onSave }) => {
  const [formData, setFormData] = useState({
    door_count: cabinet.door_count,
    drawer_count: cabinet.drawer_count,
    backs_qty: cabinet.backs_qty || 1,
    bottoms_qty: cabinet.bottoms_qty || 1,
    sides_qty: cabinet.sides_qty || 2,
    door_qty: cabinet.door_qty || cabinet.door_count,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Components</CardTitle>
        <CardDescription>Specify the number of each component for this cabinet</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="door_count">Door Count *</Label>
              <Input
                id="door_count"
                type="number"
                min="0"
                value={formData.door_count}
                onChange={(e) => setFormData({ ...formData, door_count: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drawer_count">Drawer Count *</Label>
              <Input
                id="drawer_count"
                type="number"
                min="0"
                value={formData.drawer_count}
                onChange={(e) => setFormData({ ...formData, drawer_count: parseInt(e.target.value) })}
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
                  value={formData.backs_qty}
                  onChange={(e) => setFormData({ ...formData, backs_qty: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bottoms_qty">Bottom Panels</Label>
                <Input
                  id="bottoms_qty"
                  type="number"
                  min="0"
                  value={formData.bottoms_qty}
                  onChange={(e) => setFormData({ ...formData, bottoms_qty: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sides_qty">Side Panels</Label>
                <Input
                  id="sides_qty"
                  type="number"
                  min="0"
                  value={formData.sides_qty}
                  onChange={(e) => setFormData({ ...formData, sides_qty: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="door_qty">Door Panels</Label>
                <Input
                  id="door_qty"
                  type="number"
                  min="0"
                  value={formData.door_qty}
                  onChange={(e) => setFormData({ ...formData, door_qty: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Components
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const PricingTab: React.FC<{
  cabinet: CabinetTypeDetails;
  onSave: (updates: Partial<CabinetTypeDetails>) => void;
}> = ({ cabinet, onSave }) => {
  const [formData, setFormData] = useState({
    base_price: cabinet.base_price || 0,
    stock_quantity: cabinet.stock_quantity || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing & Inventory
        </CardTitle>
        <CardDescription>Base pricing and stock management</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price (AUD)</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
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
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
            />
          </div>

          <Button type="submit" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Pricing
          </Button>
        </form>
      </CardContent>
    </Card>
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

  // Category-specific subcategories
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
  const [increment, setIncrement] = useState(50);
  const queryClient = useQueryClient();

  // Fetch existing price ranges
  const { data: priceRanges, isLoading } = useQuery({
    queryKey: ['cabinet-price-ranges', cabinetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('cabinet_type_id', cabinetId)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      return data as PriceRange[];
    },
  });

  // Initialize ranges when data loads
  React.useEffect(() => {
    if (priceRanges) {
      setRanges(priceRanges);
    }
  }, [priceRanges]);

  // Save ranges mutation
  const saveRangesMutation = useMutation({
    mutationFn: async (rangesToSave: PriceRange[]) => {
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
            rangesToSave.map(range => ({
              cabinet_type_id: cabinetId,
              label: range.label,
              min_width_mm: range.min_width_mm,
              max_width_mm: range.max_width_mm,
              sort_order: range.sort_order,
              active: true,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-price-ranges'] });
      toast.success('Price ranges saved successfully');
    },
    onError: (error) => {
      console.error('Error saving price ranges:', error);
      toast.error('Failed to save price ranges');
    },
  });

  const addRange = () => {
    const newRange: PriceRange = {
      label: `Range ${ranges.length + 1}`,
      min_width_mm: ranges.length > 0 ? ranges[ranges.length - 1].max_width_mm + 1 : 300,
      max_width_mm: ranges.length > 0 ? ranges[ranges.length - 1].max_width_mm + 50 : 350,
      sort_order: ranges.length,
    };
    setRanges([...ranges, newRange]);
  };

  const updateRange = (index: number, field: keyof PriceRange, value: any) => {
    const updatedRanges = ranges.map((range, i) => 
      i === index ? { ...range, [field]: value } : range
    );
    setRanges(updatedRanges);
  };

  const removeRange = (index: number) => {
    const updatedRanges = ranges.filter((_, i) => i !== index)
      .map((range, i) => ({ ...range, sort_order: i }));
    setRanges(updatedRanges);
  };

  const generateCustomRanges = () => {
    const customRanges: PriceRange[] = [];

    for (let min = minWidth; min < maxWidth; min += increment) {
      const max = Math.min(min + increment - 1, maxWidth);
      customRanges.push({
        label: `${min} - ${max}mm`,
        min_width_mm: min,
        max_width_mm: max,
        sort_order: customRanges.length,
      });
    }

    setRanges(customRanges);
  };

  const generateStandardRanges = () => {
    setMinWidth(300);
    setMaxWidth(1200);
    setIncrement(50);
    
    const standardRanges: PriceRange[] = [];
    for (let min = 300; min < 1200; min += 50) {
      const max = Math.min(min + 50 - 1, 1200);
      standardRanges.push({
        label: `${min} - ${max}mm`,
        min_width_mm: min,
        max_width_mm: max,
        sort_order: standardRanges.length,
      });
    }

    setRanges(standardRanges);
  };

  const handleSave = () => {
    saveRangesMutation.mutate(ranges);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price List Ranges</CardTitle>
        <CardDescription>
          Define size ranges for price list display. These ranges will be used to generate price lists with specific increments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Range Generator */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Auto-Generate Ranges</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Min Width (mm)</Label>
                  <Input
                    type="number"
                    value={minWidth}
                    onChange={(e) => setMinWidth(parseInt(e.target.value) || 0)}
                    placeholder="300"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Width (mm)</Label>
                  <Input
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(parseInt(e.target.value) || 0)}
                    placeholder="1200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Increment (mm)</Label>
                  <Input
                    type="number"
                    value={increment}
                    onChange={(e) => setIncrement(parseInt(e.target.value) || 1)}
                    placeholder="50"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={generateCustomRanges} variant="default" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Ranges
                </Button>
                <Button onClick={generateStandardRanges} variant="outline" size="sm">
                  Use Standard (300-1200mm, 50mm)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={addRange} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Single Range
          </Button>
        </div>

        {ranges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No price ranges defined. Add ranges to generate price lists.
          </div>
        ) : (
          <div className="space-y-3">
            {ranges.map((range, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={range.label}
                      onChange={(e) => updateRange(index, 'label', e.target.value)}
                      placeholder="Range label"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min Width (mm)</Label>
                    <Input
                      type="number"
                      value={range.min_width_mm}
                      onChange={(e) => updateRange(index, 'min_width_mm', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Width (mm)</Label>
                    <Input
                      type="number"
                      value={range.max_width_mm}
                      onChange={(e) => updateRange(index, 'max_width_mm', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRange(index)}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saveRangesMutation.isPending}>
            {saveRangesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Price Ranges
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};