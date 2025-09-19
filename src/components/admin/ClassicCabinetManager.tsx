import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Edit, Trash2, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CabinetDetails {
  id?: string;
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
  product_image_url?: string;
}

interface CategorySubcategory {
  category: string;
  subcategory?: string;
}

export const ClassicCabinetManager: React.FC = () => {
  const [selectedCabinet, setSelectedCabinet] = useState<CabinetDetails | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('base');
  const queryClient = useQueryClient();

  // Fetch distinct categories and subcategories
  const { data: categoryData } = useQuery({
    queryKey: ['cabinet-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('category, subcategory')
        .eq('active', true);
      
      if (error) throw error;
      
      const categories: CategorySubcategory[] = data || [];
      const categoryMap = new Map<string, Set<string>>();
      
      categories.forEach(item => {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, new Set());
        }
        if (item.subcategory) {
          categoryMap.get(item.category)?.add(item.subcategory);
        }
      });
      
      return Array.from(categoryMap.entries()).map(([category, subcategories]) => ({
        category,
        subcategories: Array.from(subcategories)
      }));
    },
  });

  // Fetch door styles
  const { data: doorStyles } = useQuery({
    queryKey: ['door-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch colors
  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch cabinets by category
  const { data: cabinets, isLoading } = useQuery({
    queryKey: ['classic-cabinets', activeCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('category', activeCategory)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as CabinetDetails[];
    },
  });

  // Save cabinet mutation
  const saveCabinetMutation = useMutation({
    mutationFn: async (cabinet: CabinetDetails) => {
      if (cabinet.id) {
        const { error } = await supabase
          .from('cabinet_types')
          .update(cabinet)
          .eq('id', cabinet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cabinet_types')
          .insert(cabinet);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classic-cabinets'] });
      queryClient.invalidateQueries({ queryKey: ['cabinet-categories'] });
      setEditDialogOpen(false);
      setSelectedCabinet(null);
      toast.success('Cabinet saved successfully');
    },
    onError: (error) => {
      console.error('Error saving cabinet:', error);
      toast.error('Failed to save cabinet');
    },
  });

  const handleEdit = (cabinet: CabinetDetails) => {
    setSelectedCabinet(cabinet);
    setEditDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedCabinet({
      name: '',
      category: activeCategory,
      subcategory: '',
      door_count: 0,
      drawer_count: 0,
      default_width_mm: 600,
      default_height_mm: 720,
      default_depth_mm: 560,
      min_width_mm: 300,
      max_width_mm: 1200,
      min_height_mm: 200,
      max_height_mm: 1000,
      min_depth_mm: 200,
      max_depth_mm: 800,
      base_price: 0,
      stock_quantity: 0,
      active: true,
    });
    setEditDialogOpen(true);
  };

  const availableCategories = categoryData?.map(c => c.category) || [];
  const selectedCategoryData = categoryData?.find(c => c.category === activeCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Classic Cabinet Manager</h2>
          <p className="text-muted-foreground">
            Configure cabinets with categories, subcategories, door styles, and colors
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Cabinet
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Label htmlFor="category-filter">Category:</Label>
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cabinets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cabinets?.map((cabinet) => (
          <Card key={cabinet.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{cabinet.name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(cabinet)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              {cabinet.subcategory && (
                <Badge variant="secondary" className="w-fit">
                  {cabinet.subcategory}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doors:</span>
                  <span>{cabinet.door_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drawers:</span>
                  <span>{cabinet.drawer_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span>{cabinet.default_width_mm}×{cabinet.default_height_mm}×{cabinet.default_depth_mm}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span>${cabinet.base_price || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {selectedCabinet?.id ? 'Edit Cabinet' : 'New Cabinet'}
            </DialogTitle>
            <DialogDescription>
              Configure cabinet specifications with categories, dimensions, and components
            </DialogDescription>
          </DialogHeader>

          {selectedCabinet && (
            <CabinetEditForm
              cabinet={selectedCabinet}
              categoryData={categoryData || []}
              doorStyles={doorStyles || []}
              colors={colors || []}
              onSave={(cabinet) => saveCabinetMutation.mutate(cabinet)}
              onCancel={() => setEditDialogOpen(false)}
              isLoading={saveCabinetMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CabinetEditFormProps {
  cabinet: CabinetDetails;
  categoryData: Array<{ category: string; subcategories: string[] }>;
  doorStyles: Array<{ id: string; name: string }>;
  colors: Array<{ id: string; name: string; hex_code?: string; door_style_id?: string }>;
  onSave: (cabinet: CabinetDetails) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CabinetEditForm: React.FC<CabinetEditFormProps> = ({
  cabinet,
  categoryData,
  doorStyles,
  colors,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CabinetDetails>(cabinet);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');

  const selectedCategoryData = categoryData.find(c => c.category === formData.category);
  const filteredColors = selectedDoorStyle 
    ? colors.filter(c => c.door_style_id === selectedDoorStyle || !c.door_style_id)
    : colors;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: keyof CabinetDetails, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Cabinet Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => {
                  updateField('category', value);
                  updateField('subcategory', ''); // Reset subcategory when category changes
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryData.map(({ category }) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select 
                value={formData.subcategory || ''} 
                onValueChange={(value) => updateField('subcategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {selectedCategoryData?.subcategories.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price ($)</Label>
              <Input
                id="base_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price || 0}
                onChange={(e) => updateField('base_price', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              value={formData.short_description || ''}
              onChange={(e) => updateField('short_description', e.target.value)}
              placeholder="Brief description for listings"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dimensions (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">Width</h4>
              <div className="space-y-2">
                <Label>Default *</Label>
                <Input
                  type="number"
                  value={formData.default_width_mm}
                  onChange={(e) => updateField('default_width_mm', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={formData.min_width_mm || 100}
                    onChange={(e) => updateField('min_width_mm', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={formData.max_width_mm || 1200}
                    onChange={(e) => updateField('max_width_mm', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Height</h4>
              <div className="space-y-2">
                <Label>Default *</Label>
                <Input
                  type="number"
                  value={formData.default_height_mm}
                  onChange={(e) => updateField('default_height_mm', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={formData.min_height_mm || 200}
                    onChange={(e) => updateField('min_height_mm', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={formData.max_height_mm || 1000}
                    onChange={(e) => updateField('max_height_mm', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Depth</h4>
              <div className="space-y-2">
                <Label>Default *</Label>
                <Input
                  type="number"
                  value={formData.default_depth_mm}
                  onChange={(e) => updateField('default_depth_mm', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={formData.min_depth_mm || 200}
                    onChange={(e) => updateField('min_depth_mm', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={formData.max_depth_mm || 800}
                    onChange={(e) => updateField('max_depth_mm', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components & Colors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Door Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.door_count}
                  onChange={(e) => updateField('door_count', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Drawer Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.drawer_count}
                  onChange={(e) => updateField('drawer_count', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={formData.stock_quantity || 0}
                onChange={(e) => updateField('stock_quantity', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => updateField('active', checked)}
              />
              <Label>Active (visible to customers)</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Door Styles & Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Door Style (for color filtering)</Label>
              <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select door style to filter colors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Door Styles</SelectItem>
                  {doorStyles.map(style => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Available Colors ({filteredColors.length})</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                {filteredColors.map(color => (
                  <div key={color.id} className="flex items-center gap-2 text-sm">
                    {color.hex_code && (
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color.hex_code }}
                      />
                    )}
                    <span>{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Cabinet
        </Button>
      </div>
    </form>
  );
};

export default ClassicCabinetManager;