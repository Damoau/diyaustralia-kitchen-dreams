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
    
    // Reset state if we're navigating to a completely different section
    const currentSection = location.pathname.split('/')[1];
    const previousSection = navigationState.currentPath.split('/')[1];
    
    if (currentSection !== previousSection && previousSection) {
      console.log('Navigation Debug: Section change detected, resetting navigation state');
      setCustomBreadcrumbs([]);
    }
    
    setNavigationState(prev => ({
      ...prev,
      previousPath: prev.currentPath,
      currentPath: location.pathname,
      canGoBack: prev.currentPath !== location.pathname && prev.currentPath !== ''
    }));
    
    // Store current path in sessionStorage for recovery
    sessionStorage.setItem('last_valid_route', location.pathname);
  }, [location.pathname]);

  const goBack = () => {
    if (navigationState.canGoBack && navigationState.previousPath) {
      console.log('Navigation Debug: Going back to', navigationState.previousPath);
      
      // Validate that the previous path is still valid
      const previousSection = navigationState.previousPath.split('/')[1];
      const validSections = ['shop', 'portal', 'admin', ''];
      
      if (validSections.includes(previousSection)) {
        window.history.back();
      } else {
        console.warn('Navigation Debug: Invalid previous path, going to home instead');
        navigate('/');
      }
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