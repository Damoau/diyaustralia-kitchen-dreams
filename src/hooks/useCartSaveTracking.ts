import { useEffect } from 'react';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';

/**
 * Hook to automatically track cart save status during impersonation
 */
export const useCartSaveTracking = () => {
  const { 
    isImpersonating, 
    setSaveStatus, 
    setCartHasUnsavedChanges 
  } = useAdminImpersonation();

  const markAsUnsaved = () => {
    if (isImpersonating) {
      setCartHasUnsavedChanges(true);
      setSaveStatus('idle');
    }
  };

  const markAsSaving = () => {
    if (isImpersonating) {
      setSaveStatus('saving');
    }
  };

  const markAsSaved = () => {
    if (isImpersonating) {
      setCartHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Reset to idle after a few seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const markAsError = () => {
    if (isImpersonating) {
      setSaveStatus('error');
      
      // Reset to idle after showing error
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  };

  return {
    isImpersonating,
    markAsUnsaved,
    markAsSaving,
    markAsSaved,
    markAsError,
  };
};