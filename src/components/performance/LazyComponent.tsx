import React, { lazy, Suspense, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Higher-order component for lazy loading with better error boundaries
export function withLazyLoading<T extends Record<string, any>>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: T) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
}

// Progressive enhancement wrapper
interface ProgressiveEnhancementProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  condition?: boolean;
}

export const ProgressiveEnhancement: React.FC<ProgressiveEnhancementProps> = ({
  children,
  fallback,
  condition = true
}) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

// Code splitting by feature
export const AdminComponents = {
  Dashboard: lazy(() => import('@/components/admin/AdminOverview')),
  Orders: lazy(() => import('@/components/admin/AdminOrders')),
  Production: lazy(() => import('@/pages/admin/Production')),
  Shipping: lazy(() => import('@/components/admin/AdminShipping')),
};

// Preload critical components
export const preloadAdminComponents = () => {
  // Preload components that are likely to be needed
  const preloadPromises = [
    import('@/components/admin/AdminOverview'),
    import('@/components/admin/ProductionBoard'),
  ];

  return Promise.all(preloadPromises);
};

// Component for managing multiple lazy imports
interface LazyRouteProps {
  component: ComponentType<any>;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  [key: string]: any;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({ 
  component: Component, 
  loading,
  error,
  ...props 
}) => {
  return (
    <Suspense fallback={loading || <LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
};