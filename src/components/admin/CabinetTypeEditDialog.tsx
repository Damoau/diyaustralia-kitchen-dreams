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
import { Loader2, Save, Package, Palette, DollarSign } from 'lucide-react';

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
      const { error } = await supabase
        .from('cabinet_types')
        .update(updates)
        .eq('id', cabinetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-type-details'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cabinets'] });
      toast.success('Cabinet updated successfully');
    },
    onError: (error) => {
      console.error('Error updating cabinet:', error);
      toast.error('Failed to update cabinet');
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
            Edit Cabinet: {cabinet.name}
          </DialogTitle>
          <DialogDescription>
            Modify cabinet specifications, dimensions, and pricing
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab cabinet={cabinet} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="dimensions">
            <DimensionsTab cabinet={cabinet} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="components">
            <ComponentsTab cabinet={cabinet} onSave={handleSave} />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingTab cabinet={cabinet} onSave={handleSave} />
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
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              placeholder="Optional subcategory"
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
            <Label htmlFor="product_image_url">Product Image URL</Label>
            <Input
              id="product_image_url"
              value={formData.product_image_url}
              onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
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