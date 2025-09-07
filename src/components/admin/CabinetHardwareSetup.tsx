import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Save, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CabinetHardwareSetupProps {
  cabinetTypeId: string;
}

interface HardwareRequirement {
  id?: string;
  hardware_type_id: string;
  units_per_scope: number;
  unit_scope: string;
  notes?: string;
  hardware_type?: {
    name: string;
    category: string;
  };
  options?: HardwareOption[];
}

interface HardwareOption {
  id?: string;
  requirement_id: string;
  hardware_brand_id: string;
  hardware_product_id: string;
  active: boolean;
  hardware_brand?: {
    name: string;
  };
  hardware_product?: {
    name: string;
    cost_per_unit: number;
  };
}

export function CabinetHardwareSetup({ cabinetTypeId }: CabinetHardwareSetupProps) {
  const [requirements, setRequirements] = useState<HardwareRequirement[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedRequirement, setExpandedRequirement] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hardwareTypes } = useQuery({
    queryKey: ['hardware-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_types')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: hardwareBrands } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: hardwareProducts } = useQuery({
    queryKey: ['hardware-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brand:hardware_brands(name),
          hardware_type:hardware_types(name)
        `)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: existingRequirements } = useQuery({
    queryKey: ['cabinet-hardware-requirements', cabinetTypeId],
    queryFn: async () => {
      // Fetch requirements with their options
      const { data: reqs, error: reqError } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(name, category)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true);
      
      if (reqError) throw reqError;
      
      // Fetch options for each requirement
      const { data: options, error: optError } = await supabase
        .from('cabinet_hardware_options')
        .select(`
          *,
          hardware_brand:hardware_brands(name),
          hardware_product:hardware_products(name, cost_per_unit)
        `)
        .eq('active', true);
      
      if (optError) throw optError;
      
      // Combine requirements with their options
      const requirementsWithOptions = reqs?.map(req => ({
        ...req,
        options: options?.filter(opt => opt.requirement_id === req.id) || []
      })) || [];
      
      return requirementsWithOptions;
    },
  });

  useEffect(() => {
    if (existingRequirements) {
      setRequirements(existingRequirements);
      setHasChanges(false);
    }
  }, [existingRequirements]);

  const addRequirement = () => {
    setRequirements([
      ...requirements,
      {
        hardware_type_id: '',
        units_per_scope: 1,
        unit_scope: 'per_cabinet',
        notes: ''
      }
    ]);
    setHasChanges(true);
  };

  const updateRequirement = (index: number, field: keyof HardwareRequirement, value: any) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
    setHasChanges(true);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const saveRequirements = async () => {
    console.log('Saving requirements for cabinet type:', cabinetTypeId);
    console.log('Requirements to save:', requirements);
    try {
      // Delete existing requirements and options
      const { data: existingReqs } = await supabase
        .from('cabinet_hardware_requirements')
        .select('id')
        .eq('cabinet_type_id', cabinetTypeId);
      
      if (existingReqs && existingReqs.length > 0) {
        // Delete options first
        await supabase
          .from('cabinet_hardware_options')
          .delete()
          .in('requirement_id', existingReqs.map(r => r.id));
        
        // Then delete requirements
        await supabase
          .from('cabinet_hardware_requirements')
          .delete()
          .eq('cabinet_type_id', cabinetTypeId);
      }

      // Insert new requirements and their options
      for (const req of requirements.filter(r => r.hardware_type_id && r.units_per_scope > 0)) {
        // Insert requirement
        const { data: newReq, error: reqError } = await supabase
          .from('cabinet_hardware_requirements')
          .insert({
            cabinet_type_id: cabinetTypeId,
            hardware_type_id: req.hardware_type_id,
            units_per_scope: req.units_per_scope,
            unit_scope: req.unit_scope,
            notes: req.notes || '',
            active: true
          })
          .select()
          .single();
        
        if (reqError) throw reqError;
        
        // Insert options for this requirement
        if (req.options && req.options.length > 0) {
          const optionsToInsert = req.options.map(opt => ({
            requirement_id: newReq.id,
            hardware_brand_id: opt.hardware_brand_id,
            hardware_product_id: opt.hardware_product_id,
            active: true
          }));
          
          const { error: optError } = await supabase
            .from('cabinet_hardware_options')
            .insert(optionsToInsert);
          
          if (optError) throw optError;
        }
      }

      // Invalidate cache and refetch
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware-requirements'] });
      
      toast({
        title: "Success",
        description: "Hardware requirements and options saved successfully!"
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving hardware requirements:', error);
      toast({
        title: "Error",
        description: "Failed to save hardware requirements",
        variant: "destructive"
      });
    }
  };

  const addOptionToRequirement = (requirementIndex: number) => {
    const updated = [...requirements];
    if (!updated[requirementIndex].options) {
      updated[requirementIndex].options = [];
    }
    updated[requirementIndex].options!.push({
      requirement_id: '',
      hardware_brand_id: '',
      hardware_product_id: '',
      active: true
    });
    setRequirements(updated);
    setHasChanges(true);
  };

  const updateOption = (requirementIndex: number, optionIndex: number, field: keyof HardwareOption, value: any) => {
    const updated = [...requirements];
    if (updated[requirementIndex].options) {
      updated[requirementIndex].options![optionIndex] = {
        ...updated[requirementIndex].options![optionIndex],
        [field]: value
      };
      setRequirements(updated);
      setHasChanges(true);
    }
  };

  const removeOption = (requirementIndex: number, optionIndex: number) => {
    const updated = [...requirements];
    if (updated[requirementIndex].options) {
      updated[requirementIndex].options!.splice(optionIndex, 1);
      setRequirements(updated);
      setHasChanges(true);
    }
  };

  const unitScopeOptions = [
    { value: 'per_cabinet', label: 'Per Cabinet' },
    { value: 'per_door', label: 'Per Door' },
    { value: 'per_drawer', label: 'Per Drawer' },
    { value: 'custom', label: 'Custom Quantity' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Hardware Requirements</h3>
          <p className="text-sm text-muted-foreground">
            Specify the exact quantities of hardware needed for this cabinet type
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addRequirement} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Hardware
          </Button>
          {hasChanges && (
            <Button onClick={saveRequirements} size="sm" variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {requirements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No hardware requirements defined</p>
            <Button onClick={addRequirement} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Hardware Requirement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requirements.map((requirement, index) => {
            const selectedType = hardwareTypes?.find(t => t.id === requirement.hardware_type_id);
            
            return (
              <Card key={index} className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader 
                  className="pb-3"
                  onClick={() => setExpandedRequirement(expandedRequirement === `req-${index}` ? null : `req-${index}`)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      Hardware Requirement #{index + 1}
                      {selectedType && (
                        <Badge variant="outline" className="text-xs">
                          {selectedType.name}
                        </Badge>
                      )}
                      {expandedRequirement !== `req-${index}` && requirement.options && requirement.options.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {requirement.options.length} brand options
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRequirement(expandedRequirement === `req-${index}` ? null : `req-${index}`);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRequirement(index);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Compact summary when collapsed */}
                {expandedRequirement !== `req-${index}` && selectedType && (
                  <CardContent className="pt-0 pb-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>
                          {requirement.units_per_scope} × {selectedType.name}
                          {requirement.unit_scope === 'per_door' && ' per door'}
                          {requirement.unit_scope === 'per_drawer' && ' per drawer'}
                          {requirement.unit_scope === 'per_cabinet' && ' per cabinet'}
                        </span>
                      </div>
                      {requirement.notes && (
                        <p className="text-xs mt-1 text-muted-foreground/80">
                          Note: {requirement.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}

                {/* Full editing form when expanded */}
                {expandedRequirement === `req-${index}` && (
                  <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hardware Type */}
                    <div>
                      <Label>Hardware Type</Label>
                      <Select
                        value={requirement.hardware_type_id}
                        onValueChange={(value) => updateRequirement(index, 'hardware_type_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hardware type" />
                        </SelectTrigger>
                        <SelectContent>
                          {hardwareTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <span>{type.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {type.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unit Scope */}
                    <div>
                      <Label>Calculation Method</Label>
                      <Select
                        value={requirement.unit_scope}
                        onValueChange={(value) => updateRequirement(index, 'unit_scope', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitScopeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quantity */}
                    <div>
                      <Label>
                        Quantity 
                        {requirement.unit_scope === 'per_door' && ' (per door)'}
                        {requirement.unit_scope === 'per_drawer' && ' (per drawer)'}
                        {requirement.unit_scope === 'per_cabinet' && ' (total per cabinet)'}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={requirement.units_per_scope}
                        onChange={(e) => updateRequirement(index, 'units_per_scope', parseInt(e.target.value) || 1)}
                        placeholder="Enter quantity"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Input
                        value={requirement.notes || ''}
                        onChange={(e) => updateRequirement(index, 'notes', e.target.value)}
                        placeholder="e.g., European hinges, soft-close"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {selectedType && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm">
                        <strong>Preview:</strong> This cabinet will need {' '}
                        <span className="font-semibold text-primary">
                          {requirement.units_per_scope} × {selectedType.name}
                        </span>
                        {requirement.unit_scope === 'per_door' && ' per door'}
                        {requirement.unit_scope === 'per_drawer' && ' per drawer'}
                        {requirement.unit_scope === 'per_cabinet' && ' total'}
                        {requirement.notes && (
                          <span className="text-muted-foreground ml-2">({requirement.notes})</span>
                        )}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Hardware Brand Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Available Brand Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOptionToRequirement(index)}
                        disabled={!requirement.hardware_type_id}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Brand Option
                      </Button>
                    </div>

                    {requirement.options && requirement.options.length > 0 ? (
                      <div className="space-y-2">
                        {requirement.options.map((option, optionIndex) => {
                          const availableProducts = hardwareProducts?.filter(p => 
                            p.hardware_type_id === requirement.hardware_type_id &&
                            p.hardware_brand_id === option.hardware_brand_id
                          ) || [];

                          return (
                            <div key={optionIndex} className="flex items-center gap-2 p-2 border rounded">
                              <Select
                                value={option.hardware_brand_id}
                                onValueChange={(value) => {
                                  updateOption(index, optionIndex, 'hardware_brand_id', value);
                                  // Reset product when brand changes
                                  updateOption(index, optionIndex, 'hardware_product_id', '');
                                }}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  {hardwareBrands?.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                      {brand.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={option.hardware_product_id}
                                onValueChange={(value) => updateOption(index, optionIndex, 'hardware_product_id', value)}
                                disabled={!option.hardware_brand_id}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      <div className="flex justify-between items-center w-full">
                                        <span>{product.name}</span>
                                        <Badge variant="secondary" className="ml-2">
                                          ${product.cost_per_unit}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index, optionIndex)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-lg text-center">
                        No brand options added. Users won't be able to select hardware for this type.
                      </div>
                    )}
                  </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Example Section */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base text-blue-900 dark:text-blue-100">
            Example: 4 Door Base Cabinet
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <ul className="space-y-1">
            <li>• <strong>Hinges:</strong> 2 per door = 8 total hinges</li>
            <li>• <strong>Handles:</strong> 1 per door = 4 total handles</li>
            <li>• <strong>Shelf Pins:</strong> 12 per cabinet = 12 total pins</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}