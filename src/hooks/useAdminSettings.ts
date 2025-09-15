import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminSettings {
  allow_guest_checkout: boolean;
  allow_guest_with_existing_email: boolean;
  require_phone_number: boolean;
  auth_methods: string[];
  marketing_opt_in_default: boolean;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'allow_guest_checkout',
          'allow_guest_with_existing_email', 
          'require_phone_number',
          'auth_methods',
          'marketing_opt_in_default'
        ]);

      if (error) throw error;

      // Convert array to settings object with defaults
      const defaultSettings: AdminSettings = {
        allow_guest_checkout: true,
        allow_guest_with_existing_email: true,
        require_phone_number: true,
        auth_methods: ['password', 'magic_link'],
        marketing_opt_in_default: false,
      };

      const settingsObj = data.reduce((acc, item) => {
        let value = item.setting_value;
        
        // Parse JSON values
        try {
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (value.startsWith('[') || value.startsWith('{')) {
            value = JSON.parse(value);
          }
        } catch {
          // Keep as string if not valid JSON
        }
        
        acc[item.setting_key as keyof AdminSettings] = value;
        return acc;
      }, defaultSettings);

      setSettings(settingsObj);
    } catch (error: any) {
      console.error('Error fetching admin settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof AdminSettings, value: any) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      const { error } = await supabase
        .from('global_settings')
        .upsert({ 
          setting_key: key,
          setting_value: stringValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      // Update local state
      setSettings(prev => prev ? { ...prev, [key]: value } : null);

      toast({
        title: 'Success',
        description: `${key} setting updated successfully`,
      });
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: 'Error',
        description: `Failed to update ${key} setting`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    refetch: fetchSettings,
  };
};
