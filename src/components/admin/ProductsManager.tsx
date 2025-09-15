import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Edit, Package, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductGenerator } from './ProductGenerator';

interface Product {
  id: string;
  title: string;
  handle: string;
  product_type: string;
  status: string;
  vendor: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
}

interface ProductOption {
  id: string;
  name: string;
  display_type: string;
  position: number;
  option_values: OptionValue[];
}

interface OptionValue {
  id: string;
  value: string;
  code: string;
  swatch_hex?: string;
  sort_order: number;
  is_active: boolean;
}

export function ProductsManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductOptions(selectedProduct.id);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const fetchProductOptions = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_options')
        .select(`
          *,
          option_values (*)
        `)
        .eq('product_id', productId)
        .order('position');

      if (error) throw error;
      if (data) {
        const optionsWithValues = data.map(option => ({
          ...option,
          option_values: option.option_values.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }));
        setProductOptions(optionsWithValues);
      }
    } catch (error) {
      console.error('Error fetching product options:', error);
      toast({
        title: "Error",
        description: "Failed to load product options",
        variant: "destructive",
      });
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      if (selectedProduct?.id === id) {
        setSelectedProduct(prev => prev ? { ...prev, ...updates } : null);
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      // First delete related data (variants, options, etc.)
      const { error: variantError } = await supabase
        .from('variants')
        .delete()
        .eq('product_id', id);

      if (variantError) console.error('Error deleting variants:', variantError);

      // Delete product options and their values
      const { error: optionError } = await supabase
        .from('product_options')
        .delete()
        .eq('product_id', id);

      if (optionError) console.error('Error deleting options:', optionError);

      // Finally delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
        setProductOptions([]);
      }

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Manage Products
          </TabsTrigger>
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generate Products
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({products.length})
                </CardTitle>
              </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border rounded cursor-pointer hover:bg-muted/50 ${
                    selectedProduct?.id === product.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.title}</h4>
                      <p className="text-sm text-muted-foreground">{product.handle}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.product_type}
                        </Badge>
                        <Badge 
                          variant={product.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {product.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(product.id);
                      }}
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedProduct ? 'Product Details' : 'Select a Product'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={selectedProduct.title}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSelectedProduct(prev => prev ? { ...prev, title: newValue } : null);
                    }}
                    onBlur={(e) => {
                      updateProduct(selectedProduct.id, { title: e.target.value });
                    }}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedProduct.status}
                    onValueChange={(value) => updateProduct(selectedProduct.id, { status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedProduct.description || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSelectedProduct(prev => prev ? { ...prev, description: newValue } : null);
                    }}
                    onBlur={(e) => {
                      updateProduct(selectedProduct.id, { description: e.target.value });
                    }}
                    placeholder="Product description..."
                  />
                </div>

                {/* Product Options */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Product Options ({productOptions.length})</h4>
                  {productOptions.map((option) => (
                    <div key={option.id} className="p-3 border rounded bg-muted/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{option.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {option.display_type}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {option.option_values?.map((value) => (
                          <div key={value.id} className="flex items-center gap-2 text-sm">
                            {value.swatch_hex && (
                              <div
                                className="w-3 h-3 rounded border"
                                style={{ backgroundColor: value.swatch_hex }}
                              />
                            )}
                            <span>{value.value}</span>
                            {!value.is_active && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a product to view and edit details</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="generator" className="mt-6">
          <ProductGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}