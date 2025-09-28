import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CabinetOptionValuesManager } from '@/components/admin/CabinetOptionValuesManager';
import { HardwareSetConfigurator } from '@/components/admin/HardwareSetConfigurator';
import { HardwareBrandSelector } from '@/components/admin/HardwareBrandSelector';
import { Plus, Trash2, Edit2, GripVertical, List, Settings, DollarSign, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useHardwarePricing } from '@/hooks/useHardwarePricing';

interface CabinetProductOption {
  id: string;
  option_name: string;
  display_name?: string;
  option_type: string;
  display_order: number;
  required: boolean;
  description?: string;
  active: boolean;
  option_values?: CabinetOptionValue[];
}

interface CabinetOptionValue {
  id: string;
  value: string;
  display_text: string;
  display_order: number;
  active: boolean;
  price_adjustment?: number;
  card_display_position?: number;
}

interface CabinetProductOptionsManagerProps {
  cabinetTypeId: string;
  cabinetTypeName: string;
}

export const CabinetProductOptionsManager: React.FC<CabinetProductOptionsManagerProps> = ({
  cabinetTypeId,
  cabinetTypeName
}) => {
  const [options, setOptions] = useState<CabinetProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOption, setEditingOption] = useState<CabinetProductOption | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [valuesManagerOption, setValuesManagerOption] = useState<{ id: string; name: string } | null>(null);
  const [hardwareSetCategory, setHardwareSetCategory] = useState<'hinge' | 'runner' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOptions();
  }, [cabinetTypeId]);

  const loadOptions = async () => {
    try {
      const { data: optionsData, error } = await supabase
        .from('cabinet_product_options')
        .select(`
          *,
          cabinet_option_values (*)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .order('display_order');

      if (error) throw error;
      setOptions(optionsData || []);
    } catch (error) {
      console.error('Error loading product options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product options',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveOption = async (optionData: Partial<CabinetProductOption>) => {
    try {
      if (editingOption?.id) {
        // Update existing option
        const { error } = await supabase
          .from('cabinet_product_options')
          .update({
            option_name: optionData.option_name,
            display_name: optionData.display_name,
            option_type: optionData.option_type,
            display_order: optionData.display_order,
            required: optionData.required,
            description: optionData.description,
            active: optionData.active
          })
          .eq('id', editingOption.id);

        if (error) throw error;
      } else {
        // Create new option
        const { error } = await supabase
          .from('cabinet_product_options')
          .insert({
            cabinet_type_id: cabinetTypeId,
            option_name: optionData.option_name,
            display_name: optionData.display_name,
            option_type: optionData.option_type,
            display_order: optionData.display_order || 0,
            required: optionData.required || false,
            description: optionData.description,
            active: optionData.active ?? true
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Product option ${editingOption?.id ? 'updated' : 'created'} successfully`
      });

      setIsDialogOpen(false);
      setEditingOption(null);
      loadOptions();
    } catch (error) {
      console.error('Error saving option:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product option',
        variant: 'destructive'
      });
    }
  };

  const deleteOption = async (optionId: string) => {
    try {
      const { error } = await supabase
        .from('cabinet_product_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product option deleted successfully'
      });

      loadOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product option',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (option?: CabinetProductOption) => {
    setEditingOption(option || null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="p-4">Loading product options...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Options for {cabinetTypeName}</CardTitle>
          <Button onClick={() => openEditDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {options.length === 0 ? (
          <p className="text-muted-foreground">
            No product options configured. Add options to customize what customers can select for this cabinet type.
          </p>
        ) : (
          <div className="space-y-4">
            {options.map((option) => (
              <div key={option.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{option.display_name || option.option_name}</h4>
                      <Badge variant={option.active ? 'default' : 'secondary'}>
                        {option.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {option.required && <Badge variant="destructive">Required</Badge>}
                      <Badge variant="outline">{option.option_type}</Badge>
                    </div>
                    {option.description && (
                      <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                    )}
                    {option.option_type === 'select' && option.option_values && (
                      <div className="flex flex-wrap gap-1">
                        {option.option_values
                          .filter(v => v.active)
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((value) => (
                            <Badge key={value.id} variant="outline" className="text-xs">
                              {value.display_text}
                              {value.price_adjustment && value.price_adjustment !== 0 && (
                                <span className="ml-1 text-green-600">
                                  ({value.price_adjustment > 0 ? '+' : ''}${value.price_adjustment})
                                </span>
                              )}
                            </Badge>
                          ))}
                      </div>
                    )}
                    {option.option_type === 'brand_model_attachment' && (
                      <div className="text-sm text-muted-foreground">
                        Allows customers to specify brand, model, and upload attachments
                      </div>
                    )}
                    {option.option_type === 'card_sentence' && (
                      <div className="text-sm text-muted-foreground">
                        Text that appears on the product card
                      </div>
                    )}
                    {(option.option_type === 'hinge_brand_set' || option.option_type === 'runner_brand_set') && (
                      <div className="text-sm text-muted-foreground">
                        Customer selects from predefined {option.option_type === 'hinge_brand_set' ? 'hinge' : 'runner'} brand sets with pricing
                      </div>
                    )}
                    {option.option_type === 'plastic_legs' && (
                      <div className="text-sm text-muted-foreground">
                        Titus plastic legs with configurable quantity and pricing
                      </div>
                    )}
                    {option.option_type === 'hinge_side' && (
                      <div className="flex flex-wrap gap-1">
                        {option.option_values && option.option_values
                          .filter(v => v.active)
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((value) => (
                            <Badge key={value.id} variant="outline" className="text-xs">
                              {value.display_text}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(option)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {option.option_type === 'select' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setValuesManagerOption({ id: option.id, name: option.option_name })}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    )}
                    {(option.option_type === 'hinge_brand_set' || option.option_type === 'runner_brand_set') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHardwareSetCategory(option.option_type === 'hinge_brand_set' ? 'hinge' : 'runner')}
                        title="Configure Hardware Sets"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    {option.option_type === 'plastic_legs' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(option)}
                        title="Configure Plastic Legs"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteOption(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <OptionEditDialog
          option={editingOption}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingOption(null);
          }}
          onSave={saveOption}
        />

        <CabinetOptionValuesManager
          optionId={valuesManagerOption?.id || ''}
          optionName={valuesManagerOption?.name || ''}
          isOpen={!!valuesManagerOption}
          onClose={() => setValuesManagerOption(null)}
        />

        <HardwareSetConfigurator
          category={hardwareSetCategory || 'hinge'}
          isOpen={!!hardwareSetCategory}
          onClose={() => setHardwareSetCategory(null)}
        />
      </CardContent>
    </Card>
  );
};

interface OptionEditDialogProps {
  option: CabinetProductOption | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (option: Partial<CabinetProductOption>) => void;
}

const OptionEditDialog: React.FC<OptionEditDialogProps> = ({
  option,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    option_name: '',
    display_name: '',
    option_type: undefined as string | undefined, // Changed to undefined to ensure proper Select behavior
    display_order: 0,
    required: false,
    description: '',
    active: true
  });

  const [optionValues, setOptionValues] = useState<Array<{ value: string; display_text: string; price_adjustment: number }>>([
    { value: '', display_text: '', price_adjustment: 0 }
  ]);

  // Hinge side configuration state
  const [hingeSideOptions, setHingeSideOptions] = useState({
    firstOption: '',
    secondOption: ''
  });

  // Hardware brand configuration state
  const [hardwareBrands, setHardwareBrands] = useState<Array<{ 
    brandId: string; 
    quantity: number; 
    isDefault: boolean; 
    manualQuantity?: boolean;
  }>>([]);

  const { getHardwareOptions, calculateHardwareSetCost } = useHardwarePricing();

  useEffect(() => {
    if (option) {
      setFormData({
        option_name: option.option_name,
        display_name: option.display_name || option.option_name,
        option_type: option.option_type,
        display_order: option.display_order,
        required: option.required,
        description: option.description || '',
        active: option.active
      });
      
      // Load existing option values if they exist
      if (option.option_values && option.option_values.length > 0) {
        setOptionValues(option.option_values.map(v => ({
          value: v.value,
          display_text: v.display_text,
          price_adjustment: v.price_adjustment || 0
        })));
      } else {
        setOptionValues([{ value: '', display_text: '', price_adjustment: 0 }]);
      }

      // Reset hardware brands for new option
      setHardwareBrands([]);

      // Load existing hinge side options if they exist
      if (option.option_type === 'hinge_side' && option.option_values && option.option_values.length >= 2) {
        setHingeSideOptions({
          firstOption: option.option_values[0]?.display_text || '',
          secondOption: option.option_values[1]?.display_text || ''
        });
      } else {
        setHingeSideOptions({ firstOption: '', secondOption: '' });
      }
      
    } else {
      setFormData({
        option_name: '',
        display_name: '',
        option_type: undefined, // Changed from empty string to undefined
        display_order: 0,
        required: false,
        description: '',
        active: true
      });
      setOptionValues([{ value: '', display_text: '', price_adjustment: 0 }]);
      setHardwareBrands([]);
      setHingeSideOptions({ firstOption: '', secondOption: '' });
    }
  }, [option]);

  // Reset hardware brands when option type changes
  useEffect(() => {
    if (formData.option_type !== 'hinge_brand_set' && formData.option_type !== 'runner_brand_set' && formData.option_type !== 'plastic_legs') {
      setHardwareBrands([]);
    }
    if (formData.option_type !== 'hinge_side') {
      setHingeSideOptions({ firstOption: '', secondOption: '' });
    }
  }, [formData.option_type]);

  const addOptionValue = () => {
    setOptionValues([...optionValues, { value: '', display_text: '', price_adjustment: 0 }]);
  };

  const removeOptionValue = (index: number) => {
    if (optionValues.length > 1) {
      setOptionValues(optionValues.filter((_, i) => i !== index));
    }
  };

  const updateOptionValue = (index: number, field: string, value: string | number) => {
    const updated = [...optionValues];
    updated[index] = { ...updated[index], [field]: value };
    setOptionValues(updated);
  };

  const handleSave = async () => {
    if (!formData.option_name.trim() || !formData.display_name.trim()) return;
    
    // First save the option
    await onSave(formData);
    
    // If it's a select option and we have values, we need to save those too
    if (formData.option_type === 'select' && optionValues.some(v => v.value.trim() && v.display_text.trim())) {
      // The parent component will need to handle saving option values
      // For now, we'll include them in a callback
      if (option?.id) {
        // Update existing option values
        await saveOptionValues(option.id);
      }
    }

    // If it's a hinge_side option, save the two options
    if (formData.option_type === 'hinge_side' && hingeSideOptions.firstOption.trim() && hingeSideOptions.secondOption.trim()) {
      if (option?.id) {
        await saveHingeSideValues(option.id);
      }
    }
  };

  const saveHingeSideValues = async (optionId: string) => {
    try {
      // Delete existing values first
      await supabase
        .from('cabinet_option_values')
        .delete()
        .eq('cabinet_option_id', optionId);

      // Insert the two hinge side values
      const valuesToInsert = [
        {
          cabinet_option_id: optionId,
          value: hingeSideOptions.firstOption.toLowerCase().replace(/\s+/g, '_'),
          display_text: hingeSideOptions.firstOption,
          price_adjustment: 0,
          display_order: 0,
          active: true
        },
        {
          cabinet_option_id: optionId,
          value: hingeSideOptions.secondOption.toLowerCase().replace(/\s+/g, '_'),
          display_text: hingeSideOptions.secondOption,
          price_adjustment: 0,
          display_order: 1,
          active: true
        }
      ];

      const { error } = await supabase
        .from('cabinet_option_values')
        .insert(valuesToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving hinge side values:', error);
    }
  };

  const saveOptionValues = async (optionId: string) => {
    try {
      // Delete existing values first
      await supabase
        .from('cabinet_option_values')
        .delete()
        .eq('cabinet_option_id', optionId);

      // Insert new values
      const validValues = optionValues.filter(v => v.value.trim() && v.display_text.trim());
      if (validValues.length > 0) {
        const valuesToInsert = validValues.map((value, index) => ({
          cabinet_option_id: optionId,
          value: value.value,
          display_text: value.display_text,
          price_adjustment: value.price_adjustment || 0,
          display_order: index,
          active: true
        }));

        const { error } = await supabase
          .from('cabinet_option_values')
          .insert(valuesToInsert);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving option values:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onWheel={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {option ? 'Edit Product Option' : 'Add Product Option'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="option_name">Option Name (Internal)</Label>
            <Input
              id="option_name"
              value={formData.option_name}
              onChange={(e) => setFormData(prev => ({ ...prev, option_name: e.target.value }))}
              placeholder="e.g., hinge_configuration"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Internal name used in the system (no spaces, lowercase)
            </p>
          </div>

          <div>
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="e.g., Hinge Configuration"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Name shown to customers
            </p>
          </div>

          <div>
            <Label htmlFor="option_type">Option Type</Label>
            <Select
              value={formData.option_type || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, option_type: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose option type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select (Dropdown)</SelectItem>
                <SelectItem value="hinge_side">Hinge Side</SelectItem>
                <SelectItem value="hinge_brand_set">Hinge Brand</SelectItem>
                <SelectItem value="runner_brand_set">Runner Brand</SelectItem>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="file_upload">File Upload</SelectItem>
                <SelectItem value="brand_model_attachment">Brand/Model/Attachment</SelectItem>
                <SelectItem value="card_sentence">Product Card Sentence</SelectItem>
                <SelectItem value="plastic_legs">Plastic Legs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Help text for customers"
            />
          </div>

          {/* Option Values - Only show for select type */}
          {formData.option_type === 'select' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Option Values</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOptionValue}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Value
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {optionValues.map((value, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-center p-2 border rounded">
                    <Input
                      placeholder="Value"
                      value={value.value}
                      onChange={(e) => updateOptionValue(index, 'value', e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Display Text"
                      value={value.display_text}
                      onChange={(e) => updateOptionValue(index, 'display_text', e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="$0"
                      value={value.price_adjustment}
                      onChange={(e) => updateOptionValue(index, 'price_adjustment', parseFloat(e.target.value) || 0)}
                      className="text-xs"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOptionValue(index)}
                      disabled={optionValues.length === 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Add options like "Left", "Right", "Center", etc. that customers can choose from.
              </p>
            </div>
           )}

          {/* Hinge Side Configuration - Show for hinge_side */}
          {formData.option_type === 'hinge_side' && (
            <div className="space-y-3">
              <Label>Hinge Side Configuration</Label>
              <div className="p-4 border rounded-lg space-y-3">
                <div>
                  <Label htmlFor="first_option">First Option</Label>
                  <Input
                    id="first_option"
                    value={hingeSideOptions.firstOption}
                    onChange={(e) => setHingeSideOptions(prev => ({ ...prev, firstOption: e.target.value }))}
                    placeholder="e.g., Left Side, Left-Left Side"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    First dropdown option shown to customers
                  </p>
                </div>
                <div>
                  <Label htmlFor="second_option">Second Option</Label>
                  <Input
                    id="second_option"
                    value={hingeSideOptions.secondOption}
                    onChange={(e) => setHingeSideOptions(prev => ({ ...prev, secondOption: e.target.value }))}
                    placeholder="e.g., Right Side, Right-Right-Left"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Second dropdown option shown to customers
                  </p>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                  These will become the two options in the hinge side dropdown on the frontend
                </div>
              </div>
            </div>
          )}

          {/* Hardware Brand Configuration - Show for hinge_brand_set and runner_brand_set */}
          {(formData.option_type === 'hinge_brand_set' || formData.option_type === 'runner_brand_set') && (
            <HardwareBrandSelector
              category={formData.option_type === 'hinge_brand_set' ? 'hinge' : 'runner'}
              brands={hardwareBrands}
              onBrandsChange={setHardwareBrands}
            />
          )}

          {/* Plastic Legs Configuration - Show for plastic_legs */}
          {formData.option_type === 'plastic_legs' && (
            <div className="space-y-3">
              <Label>Plastic Legs Configuration</Label>
              <div className="p-4 border rounded-lg space-y-3">
                <div>
                  <Label htmlFor="legs_quantity">Default Quantity</Label>
                  <Input
                    id="legs_quantity"
                    type="number"
                    placeholder="4"
                    min="1"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of plastic legs for this cabinet type
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="legs_display" />
                  <Label htmlFor="legs_display">Display to customers</Label>
                </div>
                <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                  Uses Titus Plastic Legs pricing from global settings
                </div>
              </div>
            </div>
          )}

          {/* Show helpful text when no option type is selected */}
          {!formData.option_type && (
            <div className="p-4 border-2 border-dashed rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Select an option type above to configure its settings
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
              />
              <Label htmlFor="required">Required</Label>
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

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.option_name.trim() || !formData.display_name.trim()}>
              {option ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// The old HardwareBrandConfiguration component has been replaced with HardwareBrandSelector
// which implements the improved workflow: select brand → plus button → add hardware → quantity → save