import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  navigateWithDebug: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPath: location.pathname,
    previousPath: '',
    breadcrumbs: [],
    canGoBack: false
  });
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<Array<{ path: string; label: string }>>([]);

  useEffect(() => {
    console.log('Navigation Debug: Route changing from', navigationState.currentPath, 'to', location.pathname);
    setNavigationState(prev => ({
      ...prev,
      previousPath: prev.currentPath,
      currentPath: location.pathname,
      canGoBack: prev.currentPath !== location.pathname && prev.currentPath !== ''
    }));
  }, [location.pathname]);

  const goBack = () => {
    if (navigationState.canGoBack && navigationState.previousPath) {
      console.log('Navigation Debug: Going back to', navigationState.previousPath);
      window.history.back();
    }
  };

  const navigateWithDebug = (path: string) => {
    console.log('Navigation Debug: Navigating to', path, 'from', location.pathname);
    navigate(path);
  };

  const isInWorkflow = (workflowPaths: string[]) => {
    return workflowPaths.some(path => navigationState.currentPath.includes(path));
  };

  const contextValue: NavigationContextType = {
    navigationState,
    goBack,
    setCustomBreadcrumbs,
    isInWorkflow,
    navigateWithDebug
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