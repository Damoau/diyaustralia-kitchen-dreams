import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { QuoteItem } from '@/hooks/useQuotes';
import { useMaterialSpecifications } from '@/hooks/useMaterialSpecifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Package, Ruler } from 'lucide-react';

interface QuoteItemEditorProps {
  item: QuoteItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (item: QuoteItem) => void;
}

export const QuoteItemEditor = ({ item, open, onOpenChange, onItemUpdated }: QuoteItemEditorProps) => {
  const [formData, setFormData] = useState<Partial<QuoteItem>>({});
  const [cabinetTypes, setCabinetTypes] = useState<any[]>([]);
  const [doorStyles, setDoorStyles] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [finishes, setFinishes] = useState<any[]>([]);
  const [productionOptions, setProductionOptions] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item && open) {
      setFormData(item);
      setSelectedOptions(item.configuration?.production_options || []);
      loadOptions();
    }
  }, [item, open]);

  const loadOptions = async () => {
    const [cabinetRes, doorRes, colorRes, finishRes] = await Promise.all([
      supabase.from('cabinet_types').select('*').eq('active', true),
      supabase.from('door_styles').select('*').eq('active', true),
      supabase.from('colors').select('*').eq('active', true),
      supabase.from('finishes').select('*').eq('active', true)
    ]);

    if (cabinetRes.data) setCabinetTypes(cabinetRes.data);
    if (doorRes.data) setDoorStyles(doorRes.data);
    if (colorRes.data) setColors(colorRes.data);
    if (finishRes.data) setFinishes(finishRes.data);

    // Load production options for the current cabinet type
    if (formData.cabinet_type_id) {
      loadProductionOptions(formData.cabinet_type_id);
    }
  };

  const loadProductionOptions = async (cabinetTypeId: string) => {
    // TODO: Load from cabinet_production_options table once migration is approved
    setProductionOptions([]);
  };

  const { getDefaultMaterialRate } = useMaterialSpecifications();

  const calculatePrice = () => {
    const width = (formData.width_mm || 0) / 1000;
    const height = (formData.height_mm || 0) / 1000;
    const area = width * height;

    let basePrice = 0;
    const cabinetType = cabinetTypes.find(ct => ct.id === formData.cabinet_type_id);
    const doorStyle = doorStyles.find(ds => ds.id === formData.door_style_id);
    const color = colors.find(c => c.id === formData.color_id);
    const finish = finishes.find(f => f.id === formData.finish_id);

    if (cabinetType) {
      // Material cost using dynamic material rate
      basePrice += area * getDefaultMaterialRate();
      
      // Door cost using combined rate (door style + color + finish)
      if (doorStyle && cabinetType.door_count > 0) {
        const doorRate = (doorStyle.base_rate_per_sqm || 120) + 
                        (color?.surcharge_rate_per_sqm || 0) + 
                        (finish?.rate_per_sqm || 0);
        basePrice += area * doorRate * cabinetType.door_count;
      }

      // Base cabinet cost
      basePrice += cabinetType.base_price || 0;
    }

    // Add production options cost
    const optionsCost = productionOptions
      .filter(opt => selectedOptions.includes(opt.id))
      .reduce((sum, opt) => sum + (opt.additional_cost || 0), 0);

    const unitPrice = basePrice + optionsCost;
    const totalPrice = unitPrice * (formData.quantity || 1);

    return { unitPrice, totalPrice };
  };

  const handleSave = () => {
    const { unitPrice, totalPrice } = calculatePrice();
    
    const updatedItem: QuoteItem = {
      ...formData,
      unit_price: unitPrice,
      total_price: totalPrice,
      configuration: {
        ...formData.configuration,
        production_options: selectedOptions,
        pricing_breakdown: {
          base: unitPrice - productionOptions
            .filter(opt => selectedOptions.includes(opt.id))
            .reduce((sum, opt) => sum + (opt.additional_cost || 0), 0),
          options: productionOptions
            .filter(opt => selectedOptions.includes(opt.id))
            .reduce((sum, opt) => sum + (opt.additional_cost || 0), 0)
        }
      }
    } as QuoteItem;

    onItemUpdated(updatedItem);
    onOpenChange(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Load production options when cabinet type changes
    if (field === 'cabinet_type_id' && value) {
      loadProductionOptions(value);
      setSelectedOptions([]);
    }
  };

  const toggleProductionOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const { unitPrice, totalPrice } = calculatePrice();

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Cabinet Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabinet Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Cabinet Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cabinet Type</Label>
                  <Select
                    value={formData.cabinet_type_id}
                    onValueChange={(value) => handleFieldChange('cabinet_type_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cabinet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabinetTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Door Style</Label>
                  <Select
                    value={formData.door_style_id}
                    onValueChange={(value) => handleFieldChange('door_style_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select door style" />
                    </SelectTrigger>
                    <SelectContent>
                      {doorStyles.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color</Label>
                  <Select
                    value={formData.color_id}
                    onValueChange={(value) => handleFieldChange('color_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map(color => (
                        <SelectItem key={color.id} value={color.id}>
                          <div className="flex items-center gap-2">
                            {color.hex_code && (
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: color.hex_code }}
                              />
                            )}
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Finish</Label>
                  <Select
                    value={formData.finish_id}
                    onValueChange={(value) => handleFieldChange('finish_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select finish" />
                    </SelectTrigger>
                    <SelectContent>
                      {finishes.map(finish => (
                        <SelectItem key={finish.id} value={finish.id}>
                          {finish.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Dimensions & Quantity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Width (mm)</Label>
                  <Input
                    type="number"
                    value={formData.width_mm}
                    onChange={(e) => handleFieldChange('width_mm', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Height (mm)</Label>
                  <Input
                    type="number"
                    value={formData.height_mm}
                    onChange={(e) => handleFieldChange('height_mm', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Depth (mm)</Label>
                  <Input
                    type="number"
                    value={formData.depth_mm}
                    onChange={(e) => handleFieldChange('depth_mm', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Options */}
          {productionOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Production Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {productionOptions.map(option => (
                  <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={() => toggleProductionOption(option.id)}
                      />
                      <div>
                        <label htmlFor={option.id} className="font-medium cursor-pointer">
                          {option.option_name}
                        </label>
                        {option.description && (
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      +${option.additional_cost?.toFixed(2) || '0.00'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Add any special notes or instructions for this cabinet..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>${unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{formData.quantity || 1}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};