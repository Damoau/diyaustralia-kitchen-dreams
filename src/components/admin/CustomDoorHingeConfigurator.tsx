import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, DoorOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CustomDoorHingeConfiguratorProps {
  cabinetTypeId: string;
  doorCount: number;
  onConfigurationAdded?: () => void;
}

interface DoorConfiguration {
  doorNumber: number;
  hingeSide: 'Left' | 'Right';
}

export const CustomDoorHingeConfigurator: React.FC<CustomDoorHingeConfiguratorProps> = ({
  cabinetTypeId,
  doorCount,
  onConfigurationAdded
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [doors, setDoors] = useState<DoorConfiguration[]>(() =>
    Array.from({ length: doorCount }, (_, i) => ({
      doorNumber: i + 1,
      hingeSide: 'Left' as const
    }))
  );
  const [saving, setSaving] = useState(false);

  const handleDoorHingeChange = useCallback((doorNumber: number, hingeSide: 'Left' | 'Right') => {
    setDoors(prev => prev.map(door => 
      door.doorNumber === doorNumber 
        ? { ...door, hingeSide }
        : door
    ));
  }, []);

  const generateConfigurationName = useCallback(() => {
    return doors.map(door => door.hingeSide).join('-');
  }, [doors]);

  const saveCustomConfiguration = async () => {
    if (!customName.trim()) {
      toast.error('Please enter a name for this configuration');
      return;
    }

    setSaving(true);
    
    try {
      // Get the hinge configuration option for this cabinet
      const { data: option, error: optionError } = await supabase
        .from('cabinet_product_options')
        .select('id')
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('option_name', 'Door Hinge Configuration')
        .single();

      if (optionError) throw optionError;

      const configurationValue = generateConfigurationName();
      
      // Check if this combination already exists
      const { data: existingValue, error: checkError } = await supabase
        .from('cabinet_option_values')
        .select('id')
        .eq('cabinet_option_id', option.id)
        .eq('value', configurationValue)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingValue) {
        toast.error('This configuration already exists');
        return;
      }

      // Get the highest display order
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('cabinet_option_values')
        .select('display_order')
        .eq('cabinet_option_id', option.id)
        .order('display_order', { ascending: false })
        .limit(1);

      if (maxOrderError) throw maxOrderError;

      const nextDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

      // Add the new configuration
      const { error: insertError } = await supabase
        .from('cabinet_option_values')
        .insert({
          cabinet_option_id: option.id,
          value: configurationValue,
          display_text: customName.trim(),
          display_order: nextDisplayOrder,
          active: true
        });

      if (insertError) throw insertError;

      toast.success('Custom hinge configuration added successfully');
      setIsOpen(false);
      setCustomName('');
      
      // Reset doors to default
      setDoors(Array.from({ length: doorCount }, (_, i) => ({
        doorNumber: i + 1,
        hingeSide: 'Left' as const
      })));

      onConfigurationAdded?.();

    } catch (error) {
      console.error('Error saving custom configuration:', error);
      toast.error('Failed to save custom configuration');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPattern = () => {
    return generateConfigurationName();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            Custom Door Hinge Configuration
          </DialogTitle>
          <DialogDescription>
            Create a custom hinge configuration for this cabinet type by specifying the hinge side for each door.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Configuration Name Input */}
          <div>
            <Label htmlFor="config-name">Configuration Name</Label>
            <Input
              id="config-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`e.g., "Custom ${getCurrentPattern()}" or "Kitchen Island Config"`}
            />
          </div>

          {/* Current Pattern Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current Pattern:</h4>
            <Badge variant="outline" className="text-sm">
              {getCurrentPattern()}
            </Badge>
          </div>

          {/* Door Configuration Grid */}
          <div className="space-y-4">
            <h4 className="font-medium">Configure Each Door:</h4>
            <div className="grid gap-4">
              {doors.map((door) => (
                <Card key={door.doorNumber} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{door.doorNumber}</span>
                      </div>
                      <Label>Door {door.doorNumber}</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Select
                          value={door.hingeSide}
                          onValueChange={(value: 'Left' | 'Right') => 
                            handleDoorHingeChange(door.doorNumber, value)
                          }
                        >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[1000000]">
                          <SelectItem value="Left">
                            <div className="flex items-center gap-2">
                              <ArrowLeft className="h-4 w-4" />
                              Left
                            </div>
                          </SelectItem>
                          <SelectItem value="Right">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4" />
                              Right
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Badge 
                        variant={door.hingeSide === 'Left' ? 'default' : 'secondary'}
                        className="min-w-[50px] justify-center"
                      >
                        {door.hingeSide}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveCustomConfiguration}
              disabled={!customName.trim() || saving}
            >
              {saving ? 'Saving...' : 'Add Configuration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};