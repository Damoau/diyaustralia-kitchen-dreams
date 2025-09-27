import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { resetBrowserState, validateRouteMatch, navigateWithCleanState } from '@/utils/navigationReset';

interface NavigationDebuggerProps {
  onClose?: () => void;
}

export const NavigationDebugger = ({ onClose }: NavigationDebuggerProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  const currentPath = location.pathname;
  const expectedRoutes = ['shop', 'portal', 'admin', 'home'];
  
  const routeValidation = expectedRoutes.map(route => ({
    route,
    isValid: validateRouteMatch(route, currentPath),
    matches: currentPath.startsWith(`/${route}`) || (route === 'home' && currentPath === '/')
  }));

  const handleResetState = async () => {
    setIsResetting(true);
    
    try {
      const resetSuccess = resetBrowserState();
      
      if (resetSuccess) {
        // Mark that we performed a reset
        localStorage.setItem('navigation_reset_performed', 'true');
        
        // Navigate to home with clean state
        setTimeout(() => {
          navigate('/', { replace: true });
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to reset navigation state:', error);
    } finally {
      setTimeout(() => setIsResetting(false), 1000);
    }
  };

  const handleDirectNavigation = (path: string) => {
    navigateWithCleanState(path);
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-destructive/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <CardTitle className="text-sm">Navigation Debug</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Current path: <code className="text-xs bg-muted px-1 rounded">{currentPath}</code>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-xs font-medium mb-2">Route Validation:</h4>
          <div className="grid grid-cols-2 gap-1">
            {routeValidation.map(({ route, isValid, matches }) => (
              <Badge 
                key={route} 
                variant={isValid ? 'default' : matches ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {route}: {isValid ? '✓' : matches ? '~' : '✗'}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium">Quick Actions:</h4>
          
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleResetState}
              disabled={isResetting}
              className="text-xs h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
              Reset Browser State
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDirectNavigation('/')}
              className="text-xs h-8"
            >
              <Home className="w-3 h-3 mr-1" />
              Go to Home (Clean)
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Use this when you see wrong content for the current URL.
        </div>
      </CardContent>
    </Card>
  );
};

// Hook to detect navigation mismatches
export const useNavigationMismatchDetector = () => {
  const location = useLocation();
  const [showDebugger, setShowDebugger] = useState(false);

  const currentPath = location.pathname;
  
  // Check if we're in a potentially problematic state
  const detectMismatch = () => {
    // Check for common mismatch patterns
    const hasQuoteInPath = currentPath.includes('QT-');
    const isOnShopRoute = currentPath.startsWith('/shop');
    const isOnPortalRoute = currentPath.startsWith('/portal');
    
    // If we see a quote ID but we're not on portal routes, there might be an issue
    if (hasQuoteInPath && !isOnPortalRoute) {
      console.warn('Navigation mismatch detected: Quote ID found in non-portal route');
      return true;
    }
    
    return false;
  };

  const hasMismatch = detectMismatch();

  return {
    hasMismatch,
    showDebugger,
    setShowDebugger,
    NavigationDebugger: () => showDebugger ? <NavigationDebugger onClose={() => setShowDebugger(false)} /> : null
  };
};