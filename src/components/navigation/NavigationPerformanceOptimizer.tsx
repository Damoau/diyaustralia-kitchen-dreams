import React, { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationPerformanceOptimizerProps {
  children: React.ReactNode;
  preloadRoutes?: string[];
  cacheTimeout?: number;
}

// Route preloading cache
const routeCache = new Map<string, Promise<any>>();
const routeComponents = new Map<string, React.ComponentType<any>>();

// Common routes that can be preloaded
const commonRoutes = [
  '/shop',
  '/portal',
  '/admin',
  '/get-quote',
  '/products',
  '/price-list'
];

// Route to component mapping for preloading
const routeComponentMap: Record<string, () => Promise<any>> = {
  '/shop': () => import('@/pages/Shop'),
  '/portal': () => import('@/pages/Portal'),
  '/admin': () => import('@/pages/Admin'),
  '/get-quote': () => import('@/pages/GetQuote'),
  '/products': () => import('@/pages/Products'),
  '/price-list': () => import('@/pages/PriceList'),
  '/admin/orders': () => import('@/pages/admin/Production'),
  '/admin/production': () => import('@/pages/admin/Production'),
  '/admin/configuration-migration': () => import('@/pages/admin/ConfigurationMigration'),
};

export const NavigationPerformanceOptimizer = ({
  children,
  preloadRoutes = commonRoutes,
  cacheTimeout = 300000 // 5 minutes
}: NavigationPerformanceOptimizerProps) => {
  const location = useLocation();

  // Preload route component
  const preloadRoute = useCallback(async (route: string) => {
    if (routeCache.has(route)) {
      return routeCache.get(route);
    }

    const componentLoader = routeComponentMap[route];
    if (!componentLoader) return;

    const promise = componentLoader().then(module => {
      routeComponents.set(route, module.default);
      // Cache cleanup after timeout
      setTimeout(() => {
        routeCache.delete(route);
        routeComponents.delete(route);
      }, cacheTimeout);
      
      return module.default;
    }).catch(error => {
      console.warn(`Failed to preload route ${route}:`, error);
      routeCache.delete(route);
    });

    routeCache.set(route, promise);
    return promise;
  }, [cacheTimeout]);

  // Preload routes on mount and location change
  useEffect(() => {
    // Preload specified routes
    preloadRoutes.forEach(route => {
      // Don't preload current route
      if (route !== location.pathname) {
        preloadRoute(route);
      }
    });
  }, [location.pathname, preloadRoutes, preloadRoute]);

  // Intersection Observer for link preloading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href && routeComponentMap[href]) {
              preloadRoute(href);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observe all internal links
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => observer.observe(link));

    return () => observer.disconnect();
  }, [preloadRoute]);

  // Add performance monitoring
  useEffect(() => {
    const navigationStart = performance.now();
    
    return () => {
      if (typeof window !== 'undefined' && 'gtag' in window) {
        const duration = performance.now() - navigationStart;
        // Track navigation performance
        (window as any).gtag('event', 'navigation_performance', {
          event_category: 'Performance',
          event_label: location.pathname,
          value: Math.round(duration)
        });
      }
    };
  }, [location.pathname]);

  return <>{children}</>;
};

// Hook for accessing preloaded components
export const usePreloadedComponent = (route: string) => {
  return routeComponents.get(route);
};

// Utility function to manually preload a route
export const preloadRoute = (route: string): Promise<React.ComponentType<any> | undefined> => {
  const componentLoader = routeComponentMap[route];
  if (!componentLoader) {
    return Promise.resolve(undefined);
  }

  if (routeCache.has(route)) {
    return routeCache.get(route)!;
  }

  const promise = componentLoader().then(module => {
    routeComponents.set(route, module.default);
    return module.default;
  });

  routeCache.set(route, promise);
  return promise;
};