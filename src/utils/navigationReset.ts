// Utility to reset navigation and browser state
export const resetNavigationState = () => {
  // Clear localStorage items that might interfere with navigation
  const navigationKeys = [
    'navigation_state',
    'route_history',
    'last_visited_route',
    'browser_navigation_state'
  ];
  
  navigationKeys.forEach(key => localStorage.removeItem(key));
  
  // Clear sessionStorage navigation data
  sessionStorage.removeItem('navigation_state');
  sessionStorage.removeItem('route_context');
  
  console.log('Navigation state reset completed');
};

// Utility to clear browser cache and force clean navigation
export const resetBrowserState = () => {
  try {
    // Clear localStorage except essential auth data
    const preserveKeys = ['supabase.auth.token', 'auth_state'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!preserveKeys.some(preserve => key.includes(preserve))) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reset navigation state
    resetNavigationState();
    
    console.log('Browser state reset completed');
    return true;
  } catch (error) {
    console.error('Failed to reset browser state:', error);
    return false;
  }
};

// Navigate directly to a URL with clean state
export const navigateWithCleanState = (url: string) => {
  resetNavigationState();
  
  // Use replace to avoid adding to history
  window.history.replaceState({}, '', url);
  
  // Reload to ensure clean component mounting
  window.location.reload();
};

// Check if current URL matches the expected route pattern
export const validateRouteMatch = (expectedPattern: string, currentPath: string): boolean => {
  const patterns = {
    shop: /^\/shop(\/[^\/]+)*(\/[^\/]+)*$/,
    portal: /^\/portal(\/[^\/]+)*$/,
    admin: /^\/admin(\/[^\/]+)*$/,
    home: /^\/$/,
  };
  
  const pattern = patterns[expectedPattern as keyof typeof patterns];
  return pattern ? pattern.test(currentPath) : false;
};