import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Settings, DollarSign, Package, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GlobalSetting {
  id?: string;
  setting_key: string;
  setting_value: string;
  description?: string;
}

export const MaterialsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const queryClient = useQueryClient();

  // Fetch all global settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      return data as GlobalSetting[];
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('global_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (error) => {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    },
  });

  // Add new setting mutation
  const addSettingMutation = useMutation({
    mutationFn: async (setting: GlobalSetting) => {
      const { error } = await supabase
        .from('global_settings')
        .insert(setting);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Setting added successfully');
    },
    onError: (error) => {
      console.error('Error adding setting:', error);
      toast.error('Failed to add setting');
    },
  });

  // Delete setting mutation
  const deleteSettingMutation = useMutation({
    mutationFn: async (settingKey: string) => {
      const { error } = await supabase
        .from('global_settings')
        .delete()
        .eq('setting_key', settingKey);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('Setting deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting setting:', error);
      toast.error('Failed to delete setting');
    },
  });

  // Group settings by category
  const materialSettings = settings?.filter(s => 
    s.setting_key.includes('material') || 
    s.setting_key.includes('board') ||
    s.setting_key.includes('sheet')
  ) || [];

  const hardwareSettings = settings?.filter(s => 
    s.setting_key.includes('hardware') || 
    s.setting_key.includes('hinge') ||
    s.setting_key.includes('handle')
  ) || [];

  const pricingSettings = settings?.filter(s => 
    s.setting_key.includes('price') || 
    s.setting_key.includes('cost') ||
    s.setting_key.includes('rate') ||
    s.setting_key.includes('markup') ||
    s.setting_key.includes('margin')
  ) || [];

  const generalSettings = settings?.filter(s => 
    !materialSettings.some(ms => ms.setting_key === s.setting_key) &&
    !hardwareSettings.some(hs => hs.setting_key === s.setting_key) &&
    !pricingSettings.some(ps => ps.setting_key === s.setting_key)
  ) || [];

  const handleUpdateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handleAddSetting = (setting: GlobalSetting) => {
    addSettingMutation.mutate(setting);
  };

  const handleDeleteSetting = (settingKey: string) => {
    if (confirm('Are you sure you want to delete this setting?')) {
      deleteSettingMutation.mutate(settingKey);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Materials & Pricing Settings</h2>
          <p className="text-muted-foreground">
            Configure global settings for materials, hardware, and pricing calculations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Material Settings
              </CardTitle>
              <CardDescription>
                Configure material costs, board specifications, and sheet pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsGrid 
                settings={materialSettings} 
                onUpdate={handleUpdateSetting}
                onAdd={handleAddSetting}
                onDelete={handleDeleteSetting}
                isLoading={updateSettingMutation.isPending || addSettingMutation.isPending}
                category="materials"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Hardware Settings
              </CardTitle>
              <CardDescription>
                Configure hardware costs, base charges, and component pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsGrid 
                settings={hardwareSettings} 
                onUpdate={handleUpdateSetting}
                onAdd={handleAddSetting}
                onDelete={handleDeleteSetting}
                isLoading={updateSettingMutation.isPending || addSettingMutation.isPending}
                category="hardware"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Settings
              </CardTitle>
              <CardDescription>
                Configure pricing formulas, markups, margins, and cost calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsGrid 
                settings={pricingSettings} 
                onUpdate={handleUpdateSetting}
                onAdd={handleAddSetting}
                onDelete={handleDeleteSetting}
                isLoading={updateSettingMutation.isPending || addSettingMutation.isPending}
                category="pricing"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Other system-wide configuration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsGrid 
                settings={generalSettings} 
                onUpdate={handleUpdateSetting}
                onAdd={handleAddSetting}
                onDelete={handleDeleteSetting}
                isLoading={updateSettingMutation.isPending || addSettingMutation.isPending}
                category="general"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface SettingsGridProps {
  settings: GlobalSetting[];
  onUpdate: (key: string, value: string) => void;
  onAdd: (setting: GlobalSetting) => void;
  onDelete: (settingKey: string) => void;
  isLoading: boolean;
  category: string;
}

const SettingsGrid: React.FC<SettingsGridProps> = ({ settings, onUpdate, onAdd, onDelete, isLoading, category }) => {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSetting, setNewSetting] = useState<GlobalSetting>({
    setting_key: '',
    setting_value: '',
    description: '',
  });

  // Initialize local values when settings load
  React.useEffect(() => {
    const values: Record<string, string> = {};
    settings.forEach(setting => {
      values[setting.setting_key] = setting.setting_value;
    });
    setLocalValues(values);
  }, [settings]);

  const handleInputChange = (key: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = localValues[key];
    if (value !== undefined) {
      onUpdate(key, value);
    }
  };

  const handleAddNew = () => {
    if (newSetting.setting_key && newSetting.setting_value) {
      onAdd(newSetting);
      setNewSetting({ setting_key: '', setting_value: '', description: '' });
      setShowAddForm(false);
    }
  };

  const handleDelete = (settingKey: string) => {
    onDelete(settingKey);
  };

  const formatLabel = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isNumericSetting = (key: string) => {
    return key.includes('cost') || 
           key.includes('price') || 
           key.includes('rate') ||
           key.includes('charge') ||
           key.includes('markup') ||
           key.includes('margin') ||
           key.includes('percentage');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New {category.charAt(0).toUpperCase() + category.slice(1)} Setting
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4 border-dashed">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Setting Key *</Label>
                <Input
                  value={newSetting.setting_key}
                  onChange={(e) => setNewSetting({ ...newSetting, setting_key: e.target.value })}
                  placeholder={`${category}_setting_name`}
                />
              </div>
              <div>
                <Label className="text-sm">Setting Value *</Label>
                <Input
                  value={newSetting.setting_value}
                  onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.target.value })}
                  placeholder="Enter value"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Input
                value={newSetting.description || ''}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                placeholder="Brief description of this setting"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddNew} size="sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Add Setting
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {settings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No settings found for this category. Add your first setting above.
        </div>
      ) : (
        settings.map((setting) => (
          <Card key={setting.setting_key} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium">
                  {formatLabel(setting.setting_key)}
                </Label>
                {setting.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {setting.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type={isNumericSetting(setting.setting_key) ? "number" : "text"}
                  value={localValues[setting.setting_key] || ''}
                  onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                  className="w-48"
                  step={isNumericSetting(setting.setting_key) ? "0.01" : undefined}
                  min={isNumericSetting(setting.setting_key) ? "0" : undefined}
                />
                
                <Button
                  size="sm"
                  onClick={() => handleSave(setting.setting_key)}
                  disabled={isLoading || localValues[setting.setting_key] === setting.setting_value}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(setting.setting_key)}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default MaterialsManager;