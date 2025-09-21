import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface UserPreferences {
  preferredDoorStyleId?: string;
  preferredColorId?: string;
  preferredFinishId?: string;
}

const PREFERENCES_KEY = 'cabinet_user_preferences';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage
  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If user is logged in, use user-specific preferences
        const key = user?.id || 'anonymous';
        setPreferences(parsed[key] || {});
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences({});
    } finally {
      setIsLoading(false);
    }
  };

  // Save preferences to localStorage
  const savePreferences = (newPreferences: UserPreferences) => {
    try {
      const key = user?.id || 'anonymous';
      
      // Get existing preferences
      const stored = localStorage.getItem(PREFERENCES_KEY);
      const allPreferences = stored ? JSON.parse(stored) : {};
      
      // Update preferences for current user/session
      allPreferences[key] = { ...preferences, ...newPreferences };
      
      // Save back to localStorage
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allPreferences));
      
      // Update local state
      setPreferences(allPreferences[key]);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Update individual preference
  const updatePreference = (key: keyof UserPreferences, value: string) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  // Update all style preferences at once (door style, color, finish)
  const updateStylePreferences = (doorStyleId: string, colorId: string, finishId: string) => {
    const newPreferences = {
      ...preferences,
      preferredDoorStyleId: doorStyleId,
      preferredColorId: colorId,
      preferredFinishId: finishId
    };
    savePreferences(newPreferences);
  };

  // Clear all preferences
  const clearPreferences = () => {
    try {
      const key = user?.id || 'anonymous';
      const stored = localStorage.getItem(PREFERENCES_KEY);
      
      if (stored) {
        const allPreferences = JSON.parse(stored);
        delete allPreferences[key];
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allPreferences));
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
    updateStylePreferences,
    clearPreferences,
    // Convenience getters
    preferredDoorStyleId: preferences.preferredDoorStyleId,
    preferredColorId: preferences.preferredColorId,
    preferredFinishId: preferences.preferredFinishId
  };
};