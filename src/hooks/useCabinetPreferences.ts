import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CabinetPreferences {
  preferred_door_style_id?: string;
  preferred_color_id?: string;
  preferred_finish_id?: string;
}

export const useCabinetPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<CabinetPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user preferences
  const loadPreferences = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_cabinet_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setPreferences({
          preferred_door_style_id: data.preferred_door_style_id,
          preferred_color_id: data.preferred_color_id,
          preferred_finish_id: data.preferred_finish_id
        });
      }
    } catch (err: any) {
      console.error('Error loading cabinet preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save user preferences
  const savePreferences = async (newPreferences: CabinetPreferences) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_cabinet_preferences')
        .upsert({
          user_id: user.id,
          preferred_door_style_id: newPreferences.preferred_door_style_id,
          preferred_color_id: newPreferences.preferred_color_id,
          preferred_finish_id: newPreferences.preferred_finish_id
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setPreferences(newPreferences);
      toast.success('Cabinet preferences saved');
    } catch (err: any) {
      console.error('Error saving cabinet preferences:', err);
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  // Update specific preference
  const updatePreference = (key: keyof CabinetPreferences, value: any) => {
    if (!preferences) {
      const newPrefs = { [key]: value };
      setPreferences(newPrefs as CabinetPreferences);
      savePreferences(newPrefs as CabinetPreferences);
      return;
    }
    
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    savePreferences(updated);
  };

  // Load preferences when user changes
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(null);
    }
  }, [user]);

  return {
    preferences,
    isLoading,
    savePreferences,
    updatePreference,
    loadPreferences
  };
};