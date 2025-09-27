import { useEffect, useState } from 'react';
import { useCart } from './useCart';
import { useOptimizedCart } from './useOptimizedCart';
import { useModernCart } from './useModernCart';

// Migration hook to gradually switch from old cart to modern TanStack Query implementation
export const useCartMigration = () => {
  const [useModern, setUseModern] = useState(false);
  
  // Feature flag for modern cart rollout
  useEffect(() => {
    // Enable modern cart implementation
    setUseModern(true);
    localStorage.setItem('cart_modern_enabled', 'true');
  }, []);

  const legacyCart = useCart();
  const optimizedCart = useOptimizedCart();
  const modernCart = useModernCart();

  // Performance comparison logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Cart Migration] Using', useModern ? 'modern' : 'legacy', 'cart implementation');
    }
  }, [useModern]);

  return useModern ? modernCart : optimizedCart;
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