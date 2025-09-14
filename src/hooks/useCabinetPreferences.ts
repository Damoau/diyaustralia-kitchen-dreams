import { useState, useEffect } from 'react';

export interface CabinetPreferences {
  height?: number;
  depth?: number;
  doorStyleId?: string;
  colorId?: string;
  hardwareBrandId?: string;
}

export interface PreferenceLocks {
  height: boolean;
  depth: boolean;
  doorStyle: boolean;
  color: boolean;
  hardware: boolean;
}

const STORAGE_KEY = 'cabinet-preferences';
const LOCKS_KEY = 'cabinet-preference-locks';

export function useCabinetPreferences() {
  const [preferences, setPreferences] = useState<CabinetPreferences>({});
  const [locks, setLocks] = useState<PreferenceLocks>({
    height: false,
    depth: false,
    doorStyle: false,
    color: false,
    hardware: false,
  });

  // Load preferences and locks from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(STORAGE_KEY);
      const savedLocks = localStorage.getItem(LOCKS_KEY);
      
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
      
      if (savedLocks) {
        setLocks(JSON.parse(savedLocks));
      }
    } catch (error) {
      console.error('Failed to load cabinet preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: CabinetPreferences) => {
    try {
      setPreferences(newPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Failed to save cabinet preferences:', error);
    }
  };

  // Save locks to localStorage
  const saveLocks = (newLocks: PreferenceLocks) => {
    try {
      setLocks(newLocks);
      localStorage.setItem(LOCKS_KEY, JSON.stringify(newLocks));
    } catch (error) {
      console.error('Failed to save cabinet preference locks:', error);
    }
  };

  // Update a specific preference
  const updatePreference = (key: keyof CabinetPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  // Toggle lock for a specific preference
  const toggleLock = (key: keyof PreferenceLocks) => {
    const newLocks = { ...locks, [key]: !locks[key] };
    saveLocks(newLocks);
  };

  // Get locked preferences for initial values
  const getLockedPreferences = () => {
    const locked: Partial<CabinetPreferences> = {};
    
    if (locks.height && preferences.height) {
      locked.height = preferences.height;
    }
    if (locks.depth && preferences.depth) {
      locked.depth = preferences.depth;
    }
    if (locks.doorStyle && preferences.doorStyleId) {
      locked.doorStyleId = preferences.doorStyleId;
    }
    if (locks.color && preferences.colorId) {
      locked.colorId = preferences.colorId;
    }
    if (locks.hardware && preferences.hardwareBrandId) {
      locked.hardwareBrandId = preferences.hardwareBrandId;
    }
    
    return locked;
  };

  // Clear all preferences
  const clearPreferences = () => {
    try {
      setPreferences({});
      setLocks({
        height: false,
        depth: false,
        doorStyle: false,
        color: false,
        hardware: false,
      });
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LOCKS_KEY);
    } catch (error) {
      console.error('Failed to clear cabinet preferences:', error);
    }
  };

  return {
    preferences,
    locks,
    updatePreference,
    toggleLock,
    getLockedPreferences,
    clearPreferences,
  };
}