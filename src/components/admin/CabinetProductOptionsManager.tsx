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
import { Plus, Trash2, Edit2, GripVertical, List } from 'lucide-react';

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
                      <h4 className="font-medium">{option.option_name}</h4>
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
    option_type: 'select',
    display_order: 0,
    required: false,
    description: '',
    active: true
  });

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
    } else {
      setFormData({
        option_name: '',
        display_name: '',
        option_type: 'select',
        display_order: 0,
        required: false,
        description: '',
        active: true
      });
    }
  }, [option]);

  const handleSave = () => {
    if (!formData.option_name.trim() || !formData.display_name.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
              value={formData.option_type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, option_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100000]">
                <SelectItem value="select">Select (Dropdown)</SelectItem>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="file_upload">File Upload</SelectItem>
                <SelectItem value="brand_model_attachment">Brand/Model/Attachment</SelectItem>
                <SelectItem value="card_sentence">Product Card Sentence</SelectItem>
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