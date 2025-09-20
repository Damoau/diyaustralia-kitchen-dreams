import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
}

export default function Pricing() {
  const [materialRate, setMaterialRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch global material rate setting
  const { data: globalSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['global-material-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .eq('setting_key', 'mat_rate_per_sqm');
      
      if (error) throw error;
      return data as GlobalSetting[];
    }
  });

  // Update global settings mutation
  const updateGlobalSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const { error } = await supabase
        .from('global_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: 'Materials rate per square meter for cabinet formulas'
        }, {
          onConflict: 'setting_key'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-material-settings'] });
      toast.success('Material rate updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update material rate');
      console.error(error);
    }
  });

  // Initialize form values when settings load
  React.useEffect(() => {
    if (globalSettings && globalSettings.length > 0) {
      const materialRateSetting = globalSettings.find(s => s.setting_key === 'mat_rate_per_sqm');
      if (materialRateSetting) {
        setMaterialRate(materialRateSetting.setting_value);
      }
    }
  }, [globalSettings]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      await updateGlobalSetting.mutateAsync({
        key: 'mat_rate_per_sqm',
        value: materialRate
      });
      
      toast.success('Material rate setting updated successfully');
    } catch (error) {
      toast.error('Failed to update material rate setting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materials Settings</h1>
          <p className="text-muted-foreground">
            Configure global material rate for cabinet pricing formulas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['global-material-settings'] })}
            disabled={loadingSettings}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Material Rate Setting */}
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Material Rate (mat_rate_per_sqm)
            </CardTitle>
            <CardDescription>
              Price per square meter for materials used in cabinet pricing formulas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material_rate">Rate per m² (AUD)</Label>
              <Input
                id="material_rate"
                type="number"
                step="0.01"
                value={materialRate}
                onChange={(e) => setMaterialRate(e.target.value)}
                placeholder="120.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This rate can be referenced as <code className="bg-muted px-2 py-1 rounded text-xs">mat_rate_per_sqm</code> in cabinet pricing formulas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}