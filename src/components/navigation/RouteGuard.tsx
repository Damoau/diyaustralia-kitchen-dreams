import { useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { validateRouteMatch } from '@/utils/navigationReset';

interface RouteGuardProps {
  children: ReactNode;
  expectedRoute: 'shop' | 'portal' | 'admin' | 'home';
  fallbackRoute?: string;
}

export const RouteGuard = ({ children, expectedRoute, fallbackRoute = '/' }: RouteGuardProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname;
    const isValidRoute = validateRouteMatch(expectedRoute, currentPath);
    
    if (!isValidRoute) {
      console.warn(`Route mismatch: Expected ${expectedRoute} route, but got ${currentPath}`);
      
      // If we're on a completely wrong route, redirect
      if (fallbackRoute && currentPath !== fallbackRoute) {
        console.log(`Redirecting from invalid route ${currentPath} to ${fallbackRoute}`);
        navigate(fallbackRoute, { replace: true });
        return;
      }
    }
    
    // Log successful route validation
    console.log(`Route guard passed: ${expectedRoute} route validated for ${currentPath}`);
  }, [location.pathname, expectedRoute, fallbackRoute, navigate]);

  return <>{children}</>;
};

// Higher-order component for route protection
export const withRouteGuard = (
  Component: React.ComponentType<any>, 
  expectedRoute: 'shop' | 'portal' | 'admin' | 'home',
  fallbackRoute?: string
) => {
  return (props: any) => (
    <RouteGuard expectedRoute={expectedRoute} fallbackRoute={fallbackRoute}>
      <Component {...props} />
    </RouteGuard>
  );
};