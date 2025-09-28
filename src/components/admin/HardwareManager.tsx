import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Edit, Trash2, Wrench, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HardwareBrand {
  id?: string;
  name: string;
  description?: string;
  website_url?: string;
  active: boolean;
}

interface HardwareType {
  id?: string;
  name: string;
  description?: string;
  category: string;
  active: boolean;
}

interface HardwareProduct {
  id?: string;
  name: string;
  hardware_brand_id: string;
  hardware_type_id: string;
  model_number?: string;
  cost_per_unit: number;
  markup_percentage?: number;
  description?: string;
  active: boolean;
}

export const HardwareManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('brands');
  const [editingBrand, setEditingBrand] = useState<HardwareBrand | null>(null);
  const [editingType, setEditingType] = useState<HardwareType | null>(null);
  const [editingProduct, setEditingProduct] = useState<HardwareProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch hardware brands
  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as HardwareBrand[];
    },
  });

  // Fetch hardware types
  const { data: types, isLoading: loadingTypes } = useQuery({
    queryKey: ['hardware-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_types')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as HardwareType[];
    },
  });

  // Fetch hardware products
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['hardware-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brands (name),
          hardware_types (name, category)
        `)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Save brand mutation
  const saveBrandMutation = useMutation({
    mutationFn: async (brand: HardwareBrand) => {
      if (brand.id) {
        const { error } = await supabase
          .from('hardware_brands')
          .update(brand)
          .eq('id', brand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hardware_brands')
          .insert(brand);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-brands'] });
      handleCloseDialog();
      toast.success('Hardware brand saved successfully');
    },
    onError: (error) => {
      console.error('Error saving hardware brand:', error);
      toast.error('Failed to save hardware brand');
    },
  });

  // Save type mutation
  const saveTypeMutation = useMutation({
    mutationFn: async (type: HardwareType) => {
      if (type.id) {
        const { error } = await supabase
          .from('hardware_types')
          .update(type)
          .eq('id', type.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hardware_types')
          .insert(type);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-types'] });
      handleCloseDialog();
      toast.success('Hardware type saved successfully');
    },
    onError: (error) => {
      console.error('Error saving hardware type:', error);
      toast.error('Failed to save hardware type');
    },
  });

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (product: HardwareProduct) => {
      // Filter out nested objects that come from joins
      const productData = {
        name: product.name,
        hardware_brand_id: product.hardware_brand_id,
        hardware_type_id: product.hardware_type_id,
        model_number: product.model_number,
        cost_per_unit: product.cost_per_unit,
        markup_percentage: product.markup_percentage,
        description: product.description,
        active: product.active,
      };

      if (product.id) {
        const { error } = await supabase
          .from('hardware_products')
          .update(productData)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hardware_products')
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-products'] });
      handleCloseDialog();
      toast.success('Hardware product saved successfully');
    },
    onError: (error) => {
      console.error('Error saving hardware product:', error);
      toast.error('Failed to save hardware product');
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('hardware_products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-products'] });
      toast.success('Hardware product deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting hardware product:', error);
      toast.error('Failed to delete hardware product');
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBrand(null);
    setEditingType(null);
    setEditingProduct(null);
  };

  const handleNewBrand = () => {
    setEditingBrand({
      name: '',
      description: '',
      website_url: '',
      active: true,
    });
    setDialogOpen(true);
  };

  const handleNewType = () => {
    setEditingType({
      name: '',
      description: '',
      category: 'hinges',
      active: true,
    });
    setDialogOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct({
      name: '',
      hardware_brand_id: brands?.[0]?.id || '',
      hardware_type_id: types?.[0]?.id || '',
      model_number: '',
      cost_per_unit: 0,
      markup_percentage: 0,
      description: '',
      active: true,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hardware Management</h2>
          <p className="text-muted-foreground">
            Manage hardware brands, types, and products for cabinet pricing
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hardware Brands</CardTitle>
                  <CardDescription>Manage hardware manufacturers and suppliers</CardDescription>
                </div>
                <Button onClick={handleNewBrand}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Brand
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBrands ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {brands?.map((brand) => (
                    <Card key={brand.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{brand.name}</CardTitle>
                          <div className="flex gap-1">
                            <Badge variant={brand.active ? "default" : "secondary"}>
                              {brand.active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBrand(brand);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {brand.description && (
                            <p className="text-muted-foreground">{brand.description}</p>
                          )}
                          {brand.website_url && (
                            <a
                              href={brand.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Visit Website
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hardware Types</CardTitle>
                  <CardDescription>Define categories of hardware components</CardDescription>
                </div>
                <Button onClick={handleNewType}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTypes ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {types?.map((type) => (
                    <Card key={type.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                          <div className="flex gap-1">
                            <Badge variant="outline">{type.category}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingType(type);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {type.description && (
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hardware Products</CardTitle>
                  <CardDescription>Manage specific hardware products and pricing</CardDescription>
                </div>
                <Button onClick={handleNewProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products?.map((product: any) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteProductMutation.mutate(product.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{product.hardware_brands?.name}</Badge>
                          <Badge variant="secondary">{product.hardware_types?.name}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {product.model_number && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Model:</span>
                              <span>{product.model_number}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price (ex GST):</span>
                            <span className="font-medium">${product.cost_per_unit}</span>
                          </div>
                          {product.markup_percentage !== undefined && product.markup_percentage > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Markup:</span>
                              <span className="font-medium">{product.markup_percentage}%</span>
                            </div>
                          )}
                          {product.description && (
                            <p className="text-muted-foreground">{product.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {editingBrand && (editingBrand.id ? 'Edit Brand' : 'New Brand')}
              {editingType && (editingType.id ? 'Edit Type' : 'New Type')}
              {editingProduct && (editingProduct.id ? 'Edit Product' : 'New Product')}
            </DialogTitle>
          </DialogHeader>

          {editingBrand && (
            <BrandEditForm
              brand={editingBrand}
              onSave={(brand) => saveBrandMutation.mutate(brand)}
              onCancel={handleCloseDialog}
              isLoading={saveBrandMutation.isPending}
            />
          )}

          {editingType && (
            <TypeEditForm
              type={editingType}
              onSave={(type) => saveTypeMutation.mutate(type)}
              onCancel={handleCloseDialog}
              isLoading={saveTypeMutation.isPending}
            />
          )}

          {editingProduct && (
            <ProductEditForm
              product={editingProduct}
              brands={brands || []}
              types={types || []}
              onSave={(product) => saveProductMutation.mutate(product)}
              onCancel={handleCloseDialog}
              isLoading={saveProductMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Brand Edit Form Component
interface BrandEditFormProps {
  brand: HardwareBrand;
  onSave: (brand: HardwareBrand) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const BrandEditForm: React.FC<BrandEditFormProps> = ({ brand, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<HardwareBrand>(brand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Brand Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Website URL</Label>
        <Input
          type="url"
          value={formData.website_url || ''}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label>Active</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
};

// Type Edit Form Component  
interface TypeEditFormProps {
  type: HardwareType;
  onSave: (type: HardwareType) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TypeEditForm: React.FC<TypeEditFormProps> = ({ type, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<HardwareType>(type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const categories = ['hinges', 'handles', 'drawer_slides', 'soft_close', 'mechanisms', 'accessories'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Type Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Category *</Label>
        <select
          className="w-full p-2 border rounded-md"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label>Active</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
};

// Product Edit Form Component
interface ProductEditFormProps {
  product: HardwareProduct;
  brands: HardwareBrand[];
  types: HardwareType[];
  onSave: (product: HardwareProduct) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({ 
  product, 
  brands, 
  types, 
  onSave, 
  onCancel, 
  isLoading 
}) => {
  const [formData, setFormData] = useState<HardwareProduct>(product);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Product Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand *</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.hardware_brand_id}
            onChange={(e) => setFormData({ ...formData, hardware_brand_id: e.target.value })}
            required
          >
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Type *</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.hardware_type_id}
            onChange={(e) => setFormData({ ...formData, hardware_type_id: e.target.value })}
            required
          >
            {types.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Model Number</Label>
          <Input
            value={formData.model_number || ''}
            onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Price (ex GST) *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.cost_per_unit}
            onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Markup Percentage
        </Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={formData.markup_percentage || 0}
          onChange={(e) => setFormData({ ...formData, markup_percentage: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
        <p className="text-sm text-muted-foreground">
          Individual markup percentage for this product (overrides global settings)
        </p>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label>Active</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
};

export default HardwareManager;