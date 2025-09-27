import React, { Suspense, memo } from 'react';
import { CartSkeleton } from '@/components/ui/cart-skeleton';
import { withPerformanceMonitoring } from './PerformanceOptimizer';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// Lazy load the optimized cart drawer for better code splitting
const OptimizedCartDrawer = React.lazy(() => import('@/components/cart/OptimizedCartDrawer'));

interface CartPerformanceWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const CartPerformanceWrapper = memo(({ 
  children, 
  fallback = <CartSkeleton /> 
}: CartPerformanceWrapperProps) => {
  // Monitor performance of cart wrapper
  usePerformanceMonitor('CartPerformanceWrapper');

  return (
    <Suspense fallback={fallback}>
      <OptimizedCartDrawer>
        {children}
      </OptimizedCartDrawer>
    </Suspense>
  );
});

CartPerformanceWrapper.displayName = 'CartPerformanceWrapper';

export default withPerformanceMonitoring(CartPerformanceWrapper, 'CartPerformanceWrapper');

// Performance-aware cart provider
interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider = memo(({ children }: CartProviderProps) => {
  usePerformanceMonitor('CartProvider');

  // Pre-warm the cart data in the background
  React.useEffect(() => {
    // Preload critical cart resources
    const preloadTimer = setTimeout(() => {
      import('@/hooks/useOptimizedCart');
      import('@/components/cart/OptimizedCartDrawer');
    }, 100);

    return () => clearTimeout(preloadTimer);
  }, []);

  return <>{children}</>;
});

CartProvider.displayName = 'CartProvider';