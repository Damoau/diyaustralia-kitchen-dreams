import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save } from 'lucide-react';
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
}

export function CabinetHardwareSetup({ cabinetTypeId }: CabinetHardwareSetupProps) {
  const [requirements, setRequirements] = useState<HardwareRequirement[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
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

  const { data: existingRequirements } = useQuery({
    queryKey: ['cabinet-hardware-requirements', cabinetTypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(name, category)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true);
      if (error) throw error;
      return data;
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
    try {
      // Delete existing requirements
      await supabase
        .from('cabinet_hardware_requirements')
        .delete()
        .eq('cabinet_type_id', cabinetTypeId);

      // Insert new requirements
      const newRequirements = requirements
        .filter(req => req.hardware_type_id && req.units_per_scope > 0)
        .map(req => ({
          cabinet_type_id: cabinetTypeId,
          hardware_type_id: req.hardware_type_id,
          units_per_scope: req.units_per_scope,
          unit_scope: req.unit_scope,
          notes: req.notes || '',
          active: true
        }));

      if (newRequirements.length > 0) {
        const { error } = await supabase
          .from('cabinet_hardware_requirements')
          .insert(newRequirements);
        
        if (error) throw error;
      }

      // Invalidate cache and refetch
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware-requirements'] });
      
      toast({
        title: "Success",
        description: "Hardware requirements saved successfully!"
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
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Hardware Requirement #{index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
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
                </CardContent>
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