import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Settings2, Plus } from 'lucide-react';

interface HardwareProduct {
  id: string;
  name: string;
  model_number?: string;
  cost_per_unit: number;
  hardware_brand?: {
    name: string;
  };
}

interface HardwareSelectionProps {
  cabinetTypeId: string;
  onHardwareChange: (selections: { [key: string]: HardwareProduct | null }) => void;
}

export const HardwareSelection: React.FC<HardwareSelectionProps> = ({
  cabinetTypeId,
  onHardwareChange
}) => {
  const [hingeOptions, setHingeOptions] = useState<HardwareProduct[]>([]);
  const [drawerRunnerOptions, setDrawerRunnerOptions] = useState<HardwareProduct[]>([]);
  const [selectedHinge, setSelectedHinge] = useState<HardwareProduct | null>(null);
  const [selectedDrawerRunner, setSelectedDrawerRunner] = useState<HardwareProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHardwareOptions();
  }, [cabinetTypeId]);

  useEffect(() => {
    onHardwareChange({
      hinges: selectedHinge,
      drawer_runners: selectedDrawerRunner
    });
  }, [selectedHinge, selectedDrawerRunner, onHardwareChange]);

  const loadHardwareOptions = async () => {
    try {
      setLoading(true);
      
      // Load hinge options
      const { data: hinges, error: hingesError } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brands(name),
          hardware_types!hardware_products_hardware_type_id_fkey(category)
        `)
        .eq('active', true)
        .in('hardware_types.category', ['hinges']);

      if (hingesError) throw hingesError;

      // Load drawer runner options
      const { data: runners, error: runnersError } = await supabase
        .from('hardware_products')
        .select(`
          *,
          hardware_brands(name),
          hardware_types!hardware_products_hardware_type_id_fkey(category)
        `)
        .eq('active', true)
        .in('hardware_types.category', ['drawer_runners', 'slides']);

      if (runnersError) throw runnersError;

      setHingeOptions(hinges || []);
      setDrawerRunnerOptions(runners || []);
    } catch (error) {
      console.error('Error loading hardware options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHingeSelection = (value: string) => {
    if (value === 'none') {
      setSelectedHinge(null);
      return;
    }
    const hinge = hingeOptions.find(h => h.id === value);
    setSelectedHinge(hinge || null);
  };

  const handleDrawerRunnerSelection = (value: string) => {
    if (value === 'none') {
      setSelectedDrawerRunner(null);
      return;
    }
    const runner = drawerRunnerOptions.find(r => r.id === value);
    setSelectedDrawerRunner(runner || null);
  };

  if (loading) {
    return (
      <Card className="shadow-md border-0 bg-gradient-to-br from-background to-secondary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 font-semibold">
            <Settings2 className="w-5 h-5 text-primary" />
            Hardware Options
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4 text-muted-foreground">
            Loading hardware options...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0 bg-gradient-to-br from-background to-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 font-semibold">
          <Settings2 className="w-5 h-5 text-primary" />
          Hardware Options
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        {/* Hinges Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground">Hinges</h4>
            {selectedHinge && (
              <Badge variant="secondary" className="text-xs">
                +${selectedHinge.cost_per_unit.toFixed(2)} per unit
              </Badge>
            )}
          </div>
          <Select onValueChange={handleHingeSelection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose hinge option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No upgrade (standard hinges included)</SelectItem>
              {hingeOptions.map((hinge) => (
                <SelectItem key={hinge.id} value={hinge.id}>
                  <div className="flex justify-between items-center w-full">
                    <span>
                      {hinge.hardware_brand?.name} {hinge.name}
                      {hinge.model_number && ` - ${hinge.model_number}`}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      +${hinge.cost_per_unit.toFixed(2)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drawer Runners Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground">Drawer Runners</h4>
            {selectedDrawerRunner && (
              <Badge variant="secondary" className="text-xs">
                +${selectedDrawerRunner.cost_per_unit.toFixed(2)} per pair
              </Badge>
            )}
          </div>
          <Select onValueChange={handleDrawerRunnerSelection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose drawer runner option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No upgrade (standard runners included)</SelectItem>
              {drawerRunnerOptions.map((runner) => (
                <SelectItem key={runner.id} value={runner.id}>
                  <div className="flex justify-between items-center w-full">
                    <span>
                      {runner.hardware_brand?.name} {runner.name}
                      {runner.model_number && ` - ${runner.model_number}`}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      +${runner.cost_per_unit.toFixed(2)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(selectedHinge || selectedDrawerRunner) && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Hardware upgrades will be calculated based on your cabinet specifications and quantity.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};