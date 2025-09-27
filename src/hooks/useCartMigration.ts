import { useEffect, useState } from 'react';
import { useCart } from './useCart';
import { useOptimizedCart } from './useOptimizedCart';

// Migration hook to gradually switch from old cart to optimized cart
export const useCartMigration = () => {
  const [useOptimized, setUseOptimized] = useState(false);
  
  // Feature flag for gradual rollout
  useEffect(() => {
    // Enable optimized cart for new sessions or based on feature flag
    const isOptimizedEnabled = 
      localStorage.getItem('cart_optimization_enabled') === 'true' ||
      Math.random() < 0.5; // 50% rollout
    
    setUseOptimized(isOptimizedEnabled);
    
    if (isOptimizedEnabled) {
      localStorage.setItem('cart_optimization_enabled', 'true');
    }
  }, []);

  const legacyCart = useCart();
  const optimizedCart = useOptimizedCart();

  // Performance comparison logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Cart Migration] Using', useOptimized ? 'optimized' : 'legacy', 'cart implementation');
    }
  }, [useOptimized]);

  return useOptimized ? optimizedCart : legacyCart;
};

// Hook for A/B testing cart performance
export const useCartPerformanceTest = () => {
  const [testGroup, setTestGroup] = useState<'control' | 'optimized' | null>(null);
  
  useEffect(() => {
    // Assign user to test group (sticky session)
    let group = localStorage.getItem('cart_performance_test_group') as 'control' | 'optimized';
    
    if (!group) {
      // Randomly assign to test group
      group = Math.random() < 0.5 ? 'control' : 'optimized';
      localStorage.setItem('cart_performance_test_group', group);
    }
    
    setTestGroup(group);
  }, []);

  const legacyCart = useCart();
  const optimizedCart = useOptimizedCart();

  return {
    cart: testGroup === 'optimized' ? optimizedCart : legacyCart,
    testGroup,
  };
};