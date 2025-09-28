import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Save, 
  Percent, 
  DollarSign, 
  Settings as SettingsIcon,
  Star,
  Package,
  AlertCircle
} from 'lucide-react';
import { HardwareSetConfigurator } from '@/components/admin/HardwareSetConfigurator';

export default function HardwareSettings() {
  const [activeTab, setActiveTab] = useState('pricing');
  const [hardwareSetCategory, setHardwareSetCategory] = useState<'hinge' | 'runner' | null>(null);
  const queryClient = useQueryClient();

  // Fetch global hardware settings
  const { data: globalSettings } = useQuery({
    queryKey: ['hardware-global-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'hardware_markup_percentage',
          'hardware_discount_percentage',
          'default_hinge_set_id',
          'default_runner_set_id'
        ]);
      
      if (error) throw error;
      
      const settings: any = {};
      data.forEach(item => {
        settings[item.setting_key] = item.setting_value;
      });
      
      return settings;
    },
  });

  // Fetch hardware sets for defaults selection
  const { data: hardwareSets } = useQuery({
    queryKey: ['hardware-sets-for-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brand_sets')
        .select(`
          *,
          hardware_brands (name)
        `)
        .order('category', { ascending: true })
        .order('set_name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Update global settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['hardware-global-settings'] });
      queryClient.invalidateQueries({ queryKey: ['hardware-pricing-settings'] });
      toast.success('Hardware settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating setting:', error);
      toast.error('Failed to update hardware settings');
    },
  });

  const handleSettingUpdate = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const currentMarkup = globalSettings?.hardware_markup_percentage || '35';
  const currentDiscount = globalSettings?.hardware_discount_percentage || '0';
  const defaultHingeSetId = globalSettings?.default_hinge_set_id;
  const defaultRunnerSetId = globalSettings?.default_runner_set_id;

  const hingeOptions = hardwareSets?.filter(set => set.category === 'hinge') || [];
  const runnerOptions = hardwareSets?.filter(set => set.category === 'runner') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Hardware Settings</h1>
          <p className="text-muted-foreground">
            Configure global hardware pricing, markups, and default sets
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing">Pricing & Markups</TabsTrigger>
          <TabsTrigger value="defaults">Default Sets</TabsTrigger>
          <TabsTrigger value="configure">Configure Sets</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Global Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Markup Percentage */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Hardware Markup Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={currentMarkup}
                      onChange={(e) => handleSettingUpdate('hardware_markup_percentage', e.target.value)}
                      className="flex-1"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Applied to base hardware costs to calculate final pricing
                  </p>
                </div>

                {/* Discount Percentage */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Hardware Discount Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={currentDiscount}
                      onChange={(e) => handleSettingUpdate('hardware_discount_percentage', e.target.value)}
                      className="flex-1"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Applied after markup to calculate final customer pricing
                  </p>
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing Calculation Preview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Base Cost</p>
                    <p className="font-mono">$100.00</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">+ Markup ({currentMarkup}%)</p>
                    <p className="font-mono text-green-600">+${(100 * (parseFloat(currentMarkup) / 100)).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">- Discount ({currentDiscount}%)</p>
                    <p className="font-mono text-red-600">-${((100 * (1 + parseFloat(currentMarkup) / 100)) * (parseFloat(currentDiscount) / 100)).toFixed(2)}</p>
                  </div>
                  <div className="border-l pl-4">
                    <p className="text-muted-foreground">Final Price</p>
                    <p className="font-mono font-bold text-primary">
                      ${(100 * (1 + parseFloat(currentMarkup) / 100) * (1 - parseFloat(currentDiscount) / 100)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Default Hardware Sets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default Hinge Set */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Default Hinge Set</Label>
                  <Select
                    value={defaultHingeSetId || ''}
                    onValueChange={(value) => handleSettingUpdate('default_hinge_set_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default hinge set..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hingeOptions.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          <div className="flex items-center gap-2">
                            <span>{set.hardware_brands.name} - {set.set_name}</span>
                            {set.is_default && (
                              <Badge variant="outline" className="text-xs">Current Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Used when no specific hinge set is selected for a cabinet
                  </p>
                </div>

                {/* Default Runner Set */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Default Runner Set</Label>
                  <Select
                    value={defaultRunnerSetId || ''}
                    onValueChange={(value) => handleSettingUpdate('default_runner_set_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default runner set..." />
                    </SelectTrigger>
                    <SelectContent>
                      {runnerOptions.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          <div className="flex items-center gap-2">
                            <span>{set.hardware_brands.name} - {set.set_name}</span>
                            {set.is_default && (
                              <Badge variant="outline" className="text-xs">Current Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Used when no specific drawer runner set is selected for a cabinet
                  </p>
                </div>
              </div>

              {(!hingeOptions.length || !runnerOptions.length) && (
                <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Missing Hardware Sets</p>
                    <p className="text-sm text-amber-800">
                      No hardware sets found. Use the "Configure Sets" tab to create hardware sets first.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Hardware Set Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setHardwareSetCategory('hinge')}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Package className="h-6 w-6" />
                  <span>Configure Hinge Sets</span>
                  <Badge variant="secondary" className="text-xs">
                    {hingeOptions.length} sets
                  </Badge>
                </Button>
                
                <Button
                  onClick={() => setHardwareSetCategory('runner')}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <Package className="h-6 w-6" />
                  <span>Configure Runner Sets</span>
                  <Badge variant="secondary" className="text-xs">
                    {runnerOptions.length} sets
                  </Badge>
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-900 mb-1">Hardware Sets Configuration:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Create brand-specific hardware sets (Blum, Titus, etc.)</li>
                  <li>• Define individual products and quantities per set</li>
                  <li>• Set base costs that get marked up using the pricing settings above</li>
                  <li>• Configure which sets are available to customers</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hardware Set Configuration Modal */}
      <HardwareSetConfigurator
        category={hardwareSetCategory || 'hinge'}
        isOpen={!!hardwareSetCategory}
        onClose={() => setHardwareSetCategory(null)}
      />
    </div>
  );
}