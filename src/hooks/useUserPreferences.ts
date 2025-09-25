import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserPreferences {
  preferredDoorStyleId?: string;
  preferredColorId?: string;
  preferredFinishId?: string;
  preferredAssemblyType?: 'carcass_only' | 'with_doors' | null;
}

const PREFERENCES_KEY = 'cabinet_user_preferences';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database (for authenticated users) or localStorage (for anonymous)
  const loadPreferences = async () => {
    try {
      if (user) {
        // Load from database for authenticated users
        const { data, error } = await supabase
          .from('user_cabinet_preferences')
          .select('preferred_door_style_id, preferred_color_id, preferred_finish_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading user preferences:', error);
        }

        if (data) {
          setPreferences({
            preferredDoorStyleId: data.preferred_door_style_id,
            preferredColorId: data.preferred_color_id,
            preferredFinishId: data.preferred_finish_id
          });
        } else {
          setPreferences({});
        }
        
        // Load assembly preference from localStorage for all users
        const assemblyPref = localStorage.getItem('cabinet_assembly_preference');
        if (assemblyPref && assemblyPref !== 'null') {
          setPreferences(prev => ({
            ...prev,
            preferredAssemblyType: assemblyPref as 'carcass_only' | 'with_doors'
          }));
        }
      } else {
        // Load from localStorage for anonymous users
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const key = 'anonymous';
          setPreferences(parsed[key] || {});
        }
        
        // Load assembly preference from localStorage for all users
        const assemblyPref = localStorage.getItem('cabinet_assembly_preference');
        if (assemblyPref && assemblyPref !== 'null') {
          setPreferences(prev => ({
            ...prev,
            preferredAssemblyType: assemblyPref as 'carcass_only' | 'with_doors'
          }));
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences({});
    } finally {
      setIsLoading(false);
    }
  };

  // Save preferences to database (for authenticated users) or localStorage (for anonymous)
  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      if (user) {
        // Save to database for authenticated users
        const { error } = await supabase
          .from('user_cabinet_preferences')
          .upsert({
            user_id: user.id,
            preferred_door_style_id: newPreferences.preferredDoorStyleId,
            preferred_color_id: newPreferences.preferredColorId,
            preferred_finish_id: newPreferences.preferredFinishId
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error saving user preferences:', error);
          return;
        }
      } else {
        // Save to localStorage for anonymous users
        const key = 'anonymous';
        const stored = localStorage.getItem(PREFERENCES_KEY);
        const allPreferences = stored ? JSON.parse(stored) : {};
        allPreferences[key] = { ...preferences, ...newPreferences };
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allPreferences));
      }

      // Save assembly preference to localStorage for all users
      if (newPreferences.preferredAssemblyType) {
        localStorage.setItem('cabinet_assembly_preference', newPreferences.preferredAssemblyType);
      } else if (newPreferences.preferredAssemblyType === null) {
        localStorage.removeItem('cabinet_assembly_preference');
      }

      // Update local state
      setPreferences(prev => ({ ...prev, ...newPreferences }));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Update individual preference
  const updatePreference = (key: keyof UserPreferences, value: string | 'carcass_only' | 'with_doors' | null) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  // Update multiple preferences at once
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    savePreferences(newPreferences);
  };

  // Update all style preferences at once (door style, color, finish)
  const updateStylePreferences = (doorStyleId: string, colorId: string, finishId: string) => {
    const newPreferences = {
      preferredDoorStyleId: doorStyleId,
      preferredColorId: colorId,
      preferredFinishId: finishId
    };
    savePreferences(newPreferences);
  };

  // Clear all preferences
  const clearPreferences = async () => {
    try {
      if (user) {
        // Delete from database for authenticated users
        const { error } = await supabase
          .from('user_cabinet_preferences')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error('Error clearing user preferences:', error);
          return;
        }
      } else {
        // Clear from localStorage for anonymous users
        const key = 'anonymous';
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (stored) {
          const allPreferences = JSON.parse(stored);
          delete allPreferences[key];
          localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allPreferences));
        }
      }

      setPreferences({});
    } catch (error) {
      console.error('Error clearing preferences:', error);
    }
  };

  // Load preferences when component mounts or user changes
  useEffect(() => {
    loadPreferences();
  }, [user]);

  return {
    preferences,
    isLoading,
    updatePreference,
    updatePreferences,
    updateStylePreferences,
    clearPreferences,
    // Convenience getters
    preferredDoorStyleId: preferences.preferredDoorStyleId,
    preferredColorId: preferences.preferredColorId,
    preferredFinishId: preferences.preferredFinishId,
    preferredAssemblyType: preferences.preferredAssemblyType
  };
};