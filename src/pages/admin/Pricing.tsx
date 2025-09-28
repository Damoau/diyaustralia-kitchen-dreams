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

interface MaterialSettings {
  mat_rate_per_sqm: string;
  default_weight_multiplier: string;
  thickness_adjustment_factor: string;
  heavy_material_rate: string;
  hardware_markup_percentage: string;
  hardware_discount_percentage: string;
}

export default function Pricing() {
  const [materialSettings, setMaterialSettings] = useState<MaterialSettings>({
    mat_rate_per_sqm: '',
    default_weight_multiplier: '1.20',
    thickness_adjustment_factor: '0.95',
    heavy_material_rate: '150',
    hardware_markup_percentage: '35',
    hardware_discount_percentage: '0'
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch all material settings
  const { data: globalSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['global-material-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .in('setting_key', [
          'mat_rate_per_sqm',
          'default_weight_multiplier', 
          'thickness_adjustment_factor',
          'heavy_material_rate',
          'hardware_markup_percentage',
          'hardware_discount_percentage'
        ]);
      
      if (error) throw error;
      return data as GlobalSetting[];
    }
  });

  // Update global settings mutation
  const updateGlobalSettings = useMutation({
    mutationFn: async (settings: Array<{ key: string, value: string, description: string }>) => {
      const { error } = await supabase
        .from('global_settings')
        .upsert(
          settings.map(s => ({
            setting_key: s.key,
            setting_value: s.value,
            description: s.description
          })),
          { onConflict: 'setting_key' }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-material-settings'] });
      toast.success('Material settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update material settings');
      console.error(error);
    }
  });

  // Initialize form values when settings load
  React.useEffect(() => {
    if (globalSettings && globalSettings.length > 0) {
      const newSettings = { ...materialSettings };
      
      globalSettings.forEach(setting => {
        if (setting.setting_key in newSettings) {
          (newSettings as any)[setting.setting_key] = setting.setting_value;
        }
      });
      
      setMaterialSettings(newSettings);
    }
  }, [globalSettings]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      const settingsToUpdate = [
        {
          key: 'mat_rate_per_sqm',
          value: materialSettings.mat_rate_per_sqm,
          description: 'Materials rate per square meter for cabinet formulas'
        },
        {
          key: 'default_weight_multiplier',
          value: materialSettings.default_weight_multiplier,
          description: 'Default weight multiplier applied to base material calculations'
        },
        {
          key: 'thickness_adjustment_factor',
          value: materialSettings.thickness_adjustment_factor,
          description: 'Weight adjustment factor based on material thickness'
        },
        {
          key: 'heavy_material_rate',
          value: materialSettings.heavy_material_rate,
          description: 'Heavy Material Rate (HMR) for dense materials per square meter'
        },
        {
          key: 'hardware_markup_percentage',
          value: materialSettings.hardware_markup_percentage,
          description: 'Default markup percentage applied to hardware costs'
        },
        {
          key: 'hardware_discount_percentage',
          value: materialSettings.hardware_discount_percentage,
          description: 'Default discount percentage applied to hardware after markup'
        }
      ];
      
      await updateGlobalSettings.mutateAsync(settingsToUpdate);
      
      toast.success('Material settings updated successfully');
    } catch (error) {
      toast.error('Failed to update material settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Settings</h1>
          <p className="text-muted-foreground">
            Configure global material rates and hardware pricing for cabinet formulas
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

      {/* Material Settings Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Standard Material Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Material Rate (mat_rate_per_sqm)
            </CardTitle>
            <CardDescription>
              Price per square meter for standard materials used in cabinet pricing formulas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material_rate">Rate per m² (AUD)</Label>
              <Input
                id="material_rate"
                type="number"
                step="0.01"
                value={materialSettings.mat_rate_per_sqm}
                onChange={(e) => setMaterialSettings({
                  ...materialSettings,
                  mat_rate_per_sqm: e.target.value
                })}
                placeholder="85.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Referenced as <code className="bg-muted px-2 py-1 rounded text-xs">mat_rate_per_sqm</code> in formulas
            </p>
          </CardContent>
        </Card>

        {/* Heavy Material Rate (HMR) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Heavy Material Rate (HMR)
            </CardTitle>
            <CardDescription>
              Rate for dense materials like stone, thick timber, or heavy composites
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heavy_material_rate">HMR per m² (AUD)</Label>
              <Input
                id="heavy_material_rate"
                type="number"
                step="0.01"
                value={materialSettings.heavy_material_rate}
                onChange={(e) => setMaterialSettings({
                  ...materialSettings,
                  heavy_material_rate: e.target.value
                })}
                placeholder="150.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Referenced as <code className="bg-muted px-2 py-1 rounded text-xs">heavy_material_rate</code> in formulas
            </p>
          </CardContent>
        </Card>

        {/* Weight Multiplier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Default Weight Multiplier
            </CardTitle>
            <CardDescription>
              Multiplier applied to base material weight calculations for shipping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight_multiplier">Weight Multiplier</Label>
              <Input
                id="weight_multiplier"
                type="number"
                step="0.01"
                value={materialSettings.default_weight_multiplier}
                onChange={(e) => setMaterialSettings({
                  ...materialSettings,
                  default_weight_multiplier: e.target.value
                })}
                placeholder="1.20"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Applied to base weight calculations (e.g., 1.20 = 20% increase for packaging)
            </p>
          </CardContent>
        </Card>

        {/* Thickness Adjustment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Thickness Adjustment Factor
            </CardTitle>
            <CardDescription>
              Weight adjustment based on material thickness variations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thickness_adjustment">Adjustment Factor</Label>
              <Input
                id="thickness_adjustment"
                type="number"
                step="0.01"
                value={materialSettings.thickness_adjustment_factor}
                onChange={(e) => setMaterialSettings({
                  ...materialSettings,
                  thickness_adjustment_factor: e.target.value
                })}
                placeholder="0.95"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Factor applied for material thickness variations (0.95 = 5% weight reduction)
            </p>
          </CardContent>
        </Card>

        {/* Hardware Markup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Hardware Markup
            </CardTitle>
            <CardDescription>
              Default markup percentage applied to hardware costs before customer pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hardware_markup">Markup Percentage (%)</Label>
              <Input
                id="hardware_markup"
                type="number"
                step="0.1"
                value={materialSettings.hardware_markup_percentage}
                onChange={(e) => setMaterialSettings({
                  ...materialSettings,
                  hardware_markup_percentage: e.target.value
                })}
                placeholder="35"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Applied to hardware set base costs (e.g., 35% markup on supplier costs)
            </p>
          </CardContent>
        </Card>

        {/* Hardware Discount */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Hardware Discount
            </CardTitle>
            <CardDescription>
              Default discount percentage applied to hardware after markup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hardware_discount">Discount Percentage (%)</Label>
              <Input
                id="hardware_discount"
                type="number"
                step="0.1"
                value={materialSettings.hardware_discount_percentage}
                onChange={(e) => setMaterialSettings({
                  ...materialSettings,
                  hardware_discount_percentage: e.target.value
                })}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Volume or special pricing discounts (0% = no discount)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}