import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationState {
  currentPath: string;
  previousPath: string;
  breadcrumbs: Array<{ path: string; label: string }>;
  canGoBack: boolean;
}

interface NavigationContextType {
  navigationState: NavigationState;
  goBack: () => void;
  setCustomBreadcrumbs: (breadcrumbs: Array<{ path: string; label: string }>) => void;
  isInWorkflow: (workflowPaths: string[]) => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const location = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPath: location.pathname,
    previousPath: '',
    breadcrumbs: [],
    canGoBack: false
  });
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<Array<{ path: string; label: string }>>([]);

  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      previousPath: prev.currentPath,
      currentPath: location.pathname,
      canGoBack: prev.currentPath !== location.pathname && prev.currentPath !== ''
    }));
  }, [location.pathname]);

  const goBack = () => {
    if (navigationState.canGoBack && navigationState.previousPath) {
      window.history.back();
    }
  };

  const isInWorkflow = (workflowPaths: string[]) => {
    return workflowPaths.some(path => navigationState.currentPath.includes(path));
  };

  const contextValue: NavigationContextType = {
    navigationState,
    goBack,
    setCustomBreadcrumbs,
    isInWorkflow
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};