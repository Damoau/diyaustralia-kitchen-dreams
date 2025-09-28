import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Package } from 'lucide-react';

interface HardwareBrand {
  id: string;
  name: string;
  active: boolean;
}

interface HardwareProduct {
  id: string;
  name: string;
  hardware_brand_id: string;
  hardware_type_id: string;
  cost_per_unit: number;
  model_number?: string;
  active: boolean;
  hardware_brands: { name: string };
  hardware_types: { name: string; category: string };
}

interface HardwareBrandSet {
  id?: string;
  hardware_brand_id: string;
  category: string;
  set_name: string;
  is_default: boolean;
  hardware_brand?: { name: string };
  hardware_set_items?: HardwareSetItem[];
}

interface HardwareSetItem {
  id?: string;
  hardware_set_id?: string;
  hardware_product_id: string;
  quantity: number;
  display_name?: string;
  created_at?: string;
  hardware_products?: HardwareProduct;
}

interface HardwareSetConfiguratorProps {
  category: 'hinge' | 'runner';
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareSetConfigurator: React.FC<HardwareSetConfiguratorProps> = ({
  category,
  isOpen,
  onClose
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [setName, setSetName] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [setItems, setSetItems] = useState<HardwareSetItem[]>([]);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch hardware brands
  const { data: brands } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as HardwareBrand[];
    },
  });

  // Fetch hardware products for the category
  const { data: products } = useQuery({
    queryKey: ['hardware-products', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brands (name),
          hardware_types (name, category)
        `)
        .eq('hardware_types.category', category === 'hinge' ? 'hinges' : 'runners')
        .eq('active', true);
      if (error) throw error;
      return data as HardwareProduct[];
    },
  });

  // Fetch existing hardware sets
  const { data: existingSets } = useQuery({
    queryKey: ['hardware-sets', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brand_sets')
        .select(`
          *,
          hardware_brands (name),
          hardware_set_items (
            *,
            hardware_products (
              *,
              hardware_brands (name),
              hardware_types (name, category)
            )
          )
        `)
        .eq('category', category)
        .order('set_name');
      if (error) throw error;
      return data as any[];
    },
  });

  // Save hardware set mutation
  const saveSetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBrandId || !setName.trim() || setItems.length === 0) {
        throw new Error('Please fill in all required fields and add at least one item');
      }

      let setId = editingSetId;

      if (editingSetId) {
        // Update existing set
        const { error } = await supabase
          .from('hardware_brand_sets')
          .update({
            hardware_brand_id: selectedBrandId,
            set_name: setName,
            is_default: isDefault
          })
          .eq('id', editingSetId);
        if (error) throw error;

        // Delete existing items
        await supabase
          .from('hardware_set_items')
          .delete()
          .eq('hardware_set_id', editingSetId);
      } else {
        // Create new set
        const { data, error } = await supabase
          .from('hardware_brand_sets')
          .insert({
            hardware_brand_id: selectedBrandId,
            category: category,
            set_name: setName,
            is_default: isDefault
          })
          .select()
          .single();
        if (error) throw error;
        setId = data.id;
      }

      // Insert set items
      const itemsToInsert = setItems
        .filter(item => item.hardware_product_id && item.quantity > 0)
        .map(item => ({
          hardware_set_id: setId,
          hardware_product_id: item.hardware_product_id,
          quantity: item.quantity,
          display_name: item.display_name
        }));

      if (itemsToInsert.length > 0) {
        const { error } = await supabase
          .from('hardware_set_items')
          .insert(itemsToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-sets'] });
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} set saved successfully`);
      resetForm();
    },
    onError: (error) => {
      console.error('Error saving hardware set:', error);
      toast.error(`Failed to save ${category} set`);
    },
  });

  // Delete set mutation
  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase
        .from('hardware_brand_sets')
        .delete()
        .eq('id', setId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-sets'] });
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} set deleted successfully`);
    },
    onError: (error) => {
      console.error('Error deleting hardware set:', error);
      toast.error(`Failed to delete ${category} set`);
    },
  });

  const resetForm = () => {
    setSelectedBrandId('');
    setSetName('');
    setIsDefault(false);
    setSetItems([]);
    setEditingSetId(null);
  };

  const addSetItem = () => {
    setSetItems([...setItems, { hardware_product_id: '', quantity: 1, display_name: '' }]);
  };

  const removeSetItem = (index: number) => {
    setSetItems(setItems.filter((_, i) => i !== index));
  };

  const updateSetItem = (index: number, field: keyof HardwareSetItem, value: any) => {
    const updated = [...setItems];
    updated[index] = { ...updated[index], [field]: value };
    setSetItems(updated);
  };

  const editSet = (set: any) => {
    setEditingSetId(set.id || null);
    setSelectedBrandId(set.hardware_brand_id);
    setSetName(set.set_name);
    setIsDefault(set.is_default);
    setSetItems(set.hardware_set_items?.map((item: any) => ({
      hardware_product_id: item.hardware_product_id,
      quantity: item.quantity,
      display_name: item.display_name || ''
    })) || []);
  };

  const calculateTotalPrice = () => {
    return setItems.reduce((total, item) => {
      const product = products?.find(p => p.id === item.hardware_product_id);
      return total + (product ? product.cost_per_unit * item.quantity : 0);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000001]">
      <div className="bg-background rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            {category.charAt(0).toUpperCase() + category.slice(1)} Brand Sets Configuration
          </h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>{editingSetId ? 'Edit Set' : 'Create New Set'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hardware Brand</Label>
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Set Name</Label>
                <Input
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder={`e.g., ${category === 'hinge' ? 'Standard Hinge Set' : 'Premium Runner Set'}`}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="is-default">Set as default for this category</Label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Set Items</Label>
                  <Button onClick={addSetItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {setItems.map((item, index) => (
                    <div key={index} className="border rounded-md p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Item {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSetItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Select
                        value={item.hardware_product_id}
                        onValueChange={(value) => updateSetItem(index, 'hardware_product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.hardware_brands.name} - {product.name} (${product.cost_per_unit})
                            </SelectItem>
                          ))
                          }
                        </SelectContent>
                      </Select>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateSetItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Display Name (Optional)</Label>
                          <Input
                            value={item.display_name || ''}
                            onChange={(e) => updateSetItem(index, 'display_name', e.target.value)}
                            placeholder="Custom name"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                  }
                </div>
              </div>

              {setItems.length > 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Price (ex GST):</span>
                    <span className="text-lg font-bold">${calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => saveSetMutation.mutate()}
                  disabled={saveSetMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingSetId ? 'Update Set' : 'Save Set'}
                </Button>
                {editingSetId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Existing Sets Section */}
          <Card>
            <CardHeader>
              <CardTitle>Existing {category.charAt(0).toUpperCase() + category.slice(1)} Sets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingSets?.map((set: any) => (
                  <div key={set.id} className="border rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{set.set_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Brand: {set.hardware_brand?.name}
                        </p>
                        {set.is_default && (
                          <Badge variant="default" className="mt-1">Default</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editSet(set)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSetMutation.mutate(set.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {set.hardware_set_items && set.hardware_set_items.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Items:</p>
                        {set.hardware_set_items.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs bg-muted/50 rounded px-2 py-1">
                            {item.quantity}x {item.hardware_products?.name} 
                            {item.hardware_products?.cost_per_unit && 
                              ` - $${(item.hardware_products.cost_per_unit * item.quantity).toFixed(2)}`
                            }
                          </div>
                        ))
                        }
                        <div className="text-sm font-medium pt-1 border-t">
                          Total: ${set.hardware_set_items.reduce((total: number, item: any) => 
                            total + (item.hardware_products?.cost_per_unit || 0) * item.quantity, 0
                          ).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))
                }
                
                {(!existingSets || existingSets.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No {category} sets configured yet. Create your first set using the form.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
