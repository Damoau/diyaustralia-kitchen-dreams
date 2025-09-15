import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description?: string;
  is_enabled: boolean;
  environment: string;
  config: Record<string, any>;
}

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_key, is_enabled')
        .eq('is_enabled', true);

      if (error) throw error;

      const flagsMap = data?.reduce((acc, flag) => {
        acc[flag.flag_key] = flag.is_enabled;
        return acc;
      }, {} as Record<string, boolean>) || {};

      setFlags(flagsMap);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (flagKey: string): boolean => {
    return flags[flagKey] === true;
  };

  const refreshFlags = () => {
    loadFeatureFlags();
  };

  return {
    flags,
    isEnabled,
    loading,
    refreshFlags,
  };
};