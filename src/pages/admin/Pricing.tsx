import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/shared/DataTable';
import { DollarSign, Calculator, TrendingUp, Settings, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
}

interface CabinetType {
  id: string;
  name: string;
  category: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
}

export default function Pricing() {
  const [baseCabinetRate, setBaseCabinetRate] = useState('');
  const [laborRate, setLaborRate] = useState('');
  const [materialMarkup, setMaterialMarkup] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch global pricing settings
  const { data: globalSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['global-pricing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .in('setting_key', ['base_cabinet_rate_per_sqm', 'labor_rate_per_hour', 'material_markup_percentage']);
      
      if (error) throw error;
      return data as GlobalSetting[];
    }
  });

  // Fetch cabinet types for pricing overview
  const { data: cabinetTypes } = useQuery({
    queryKey: ['cabinet-types-pricing-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('id, name, category, default_width_mm, default_height_mm, default_depth_mm')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as CabinetType[];
    }
  });

  // Update global settings mutation
  const updateGlobalSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const { error } = await supabase
        .from('global_settings')
        .upsert({
          setting_key: key,
          setting_value: value
        }, {
          onConflict: 'setting_key'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-pricing-settings'] });
      toast.success('Pricing setting updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update pricing setting');
      console.error(error);
    }
  });

  // Initialize form values when settings load
  React.useEffect(() => {
    if (globalSettings) {
      const baseRate = globalSettings.find(s => s.setting_key === 'base_cabinet_rate_per_sqm');
      const laborRateSetting = globalSettings.find(s => s.setting_key === 'labor_rate_per_hour');
      const markupSetting = globalSettings.find(s => s.setting_key === 'material_markup_percentage');
      
      if (baseRate) setBaseCabinetRate(baseRate.setting_value);
      if (laborRateSetting) setLaborRate(laborRateSetting.setting_value);
      if (markupSetting) setMaterialMarkup(markupSetting.setting_value);
    }
  }, [globalSettings]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      await Promise.all([
        updateGlobalSetting.mutateAsync({
          key: 'base_cabinet_rate_per_sqm',
          value: baseCabinetRate
        }),
        updateGlobalSetting.mutateAsync({
          key: 'labor_rate_per_hour',
          value: laborRate
        }),
        updateGlobalSetting.mutateAsync({
          key: 'material_markup_percentage',
          value: materialMarkup
        })
      ]);
      
      toast.success('All pricing settings updated successfully');
    } catch (error) {
      toast.error('Failed to update some pricing settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate estimated price for a cabinet
  const calculateEstimatedPrice = (cabinetType: CabinetType) => {
    const baseRate = parseFloat(baseCabinetRate) || 150;
    const area = (cabinetType.default_width_mm * cabinetType.default_height_mm) / 1000000; // Convert to sqm
    return area * baseRate;
  };

  // Generate size ranges
  const generateSizeRanges = (minWidth: number = 100, maxWidth: number = 1200) => {
    const ranges = [];
    for (let width = minWidth; width < maxWidth; width += 50) {
      ranges.push(`${width}-${width + 49}mm`);
    }
    return ranges;
  };

  const cabinetColumns = [
    {
      key: 'name' as keyof CabinetType,
      label: 'Cabinet Name',
    },
    {
      key: 'category' as keyof CabinetType,
      label: 'Category',
      render: (value: string) => (
        <Badge variant="secondary">{value}</Badge>
      )
    },
    {
      key: 'default_width_mm' as keyof CabinetType,
      label: 'Default Size',
      render: (value: number, item: CabinetType) => (
        <span className="text-sm">
          {value}×{item.default_height_mm}×{item.default_depth_mm}mm
        </span>
      )
    },
    {
      key: 'id' as keyof CabinetType,
      label: 'Estimated Price',
      render: (value: string, item: CabinetType) => (
        <span className="font-semibold text-primary">
          ${calculateEstimatedPrice(item).toFixed(2)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">
            Configure global pricing settings and view pricing calculations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['global-pricing-settings'] })}
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

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Price Calculator
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Price Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Base Cabinet Rate
                </CardTitle>
                <CardDescription>
                  Base rate per square meter for cabinet pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="base_rate">Rate per m² (AUD)</Label>
                  <Input
                    id="base_rate"
                    type="number"
                    step="0.01"
                    value={baseCabinetRate}
                    onChange={(e) => setBaseCabinetRate(e.target.value)}
                    placeholder="150.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This rate is used as the base calculation for all cabinet pricing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Labor Rate
                </CardTitle>
                <CardDescription>
                  Hourly rate for labor and installation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="labor_rate">Rate per hour (AUD)</Label>
                  <Input
                    id="labor_rate"
                    type="number"
                    step="0.01"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    placeholder="85.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for calculating installation and assembly costs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Material Markup
                </CardTitle>
                <CardDescription>
                  Markup percentage on materials and hardware
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="material_markup">Markup percentage (%)</Label>
                  <Input
                    id="material_markup"
                    type="number"
                    step="0.1"
                    value={materialMarkup}
                    onChange={(e) => setMaterialMarkup(e.target.value)}
                    placeholder="25.0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Applied to hardware, hinges, handles, and other materials
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Calculator</CardTitle>
              <CardDescription>
                Calculate pricing for different cabinet configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="mx-auto h-12 w-12 mb-4" />
                <p>Interactive price calculator coming soon</p>
                <p className="text-sm mt-2">
                  This will allow you to calculate prices for different cabinet sizes, 
                  door styles, colors, and finishes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cabinet Pricing Overview</CardTitle>
              <CardDescription>
                Current estimated pricing for all cabinet types based on default dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cabinetTypes && cabinetTypes.length > 0 ? (
                <DataTable
                  data={cabinetTypes}
                  columns={cabinetColumns}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="mx-auto h-12 w-12 mb-4" />
                  <p>No cabinet types found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Size Ranges Example */}
          <Card>
            <CardHeader>
              <CardTitle>Standard Size Ranges</CardTitle>
              <CardDescription>
                Available width ranges for cabinet pricing (50mm increments)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {generateSizeRanges(100, 1200).slice(0, 12).map(range => (
                  <Badge key={range} variant="outline">
                    {range}
                  </Badge>
                ))}
                <Badge variant="secondary">+ more ranges</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}