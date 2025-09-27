import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { debounce } from '@/lib/performance';
import { usePerformanceMonitor } from './usePerformanceMonitor';

// Re-export types from original useCart
export type { CartItem, Cart } from './useCart';

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// Memoized query builder for cart data
const buildCartQuery = () => {
  return supabase.from('carts').select(`
    id,
    user_id,
    session_id,
    name,
    total_amount,
    status,
    created_at,
    updated_at,
    cart_items (
      id,
      cart_id,
      cabinet_type_id,
      door_style_id,
      color_id,
      finish_id,
      width_mm,
      height_mm,
      depth_mm,
      quantity,
      unit_price,
      total_price,
      notes,
      configuration,
      created_at,
      updated_at,
      cabinet_types (
        name,
        category,
        product_image_url
      ),
      door_styles (
        name,
        image_url
      ),
      colors (
        name,
        hex_code
      ),
      finishes (
        name
      )
    )
  `);
};

// Optimized cart hook with performance improvements
export const useOptimizedCart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Performance and state management
  const initializingRef = useRef(false);
  const cartCacheRef = useRef<{ [key: string]: any }>({});
  const lastFetchTime = useRef<number>(0);
  const invalidationRef = useRef(false);
  const CACHE_DURATION = 30000; // 30 seconds
  
  // Performance monitoring
  usePerformanceMonitor('OptimizedCart');

  // Generate session ID for guest users
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Cache key for current user context
  const cacheKey = useMemo(() => {
    return user?.id ? `user_${user.id}` : `session_${getSessionId()}`;
  }, [user?.id, getSessionId]);

  // Deduplicated API request wrapper
  const deduplicatedRequest = useCallback(async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
    if (requestCache.has(key)) {
      console.log(`Using deduplicated request for: ${key}`);
      return requestCache.get(key) as Promise<T>;
    }

    const promise = requestFn();
    requestCache.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clear from cache after request completes
      setTimeout(() => requestCache.delete(key), 1000);
    }
  }, []);

  // Optimized cart initialization with caching and deduplication
  const initializeCart = useCallback(async () => {
    if (initializingRef.current) {
      console.log('Cart initialization already in progress, skipping...');
      return;
    }

    // Check cache validity - but ignore if this is an invalidation request
    const now = Date.now();
    const cachedCart = cartCacheRef.current[cacheKey];
    if (cachedCart && (now - lastFetchTime.current) < CACHE_DURATION && !invalidationRef.current) {
      console.log('Using cached cart (still valid)');
      setCart(cachedCart);
      return;
    }

    // Reset invalidation flag
    invalidationRef.current = false;
    
    initializingRef.current = true;
    setIsLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      let existingCart = null;

      if (user) {
        // Authenticated user flow with deduplication
        console.log('Fetching cart for authenticated user:', user.id);
        existingCart = await deduplicatedRequest(`user_cart_${user.id}`, async () => {
          // First try to find existing user cart
          const { data: userCart, error: userError } = await buildCartQuery()
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (userError && userError.code !== 'PGRST116') {
            console.error('Error fetching user cart:', userError);
            throw userError;
          }

          if (userCart) {
            console.log('Found existing user cart:', userCart.id);
            return userCart;
          }

          // No user cart found, check for session cart to convert
          const sessionId = getSessionId();
          console.log('No user cart found, checking session cart:', sessionId);
          
          const { data: sessionCart, error: sessionError } = await buildCartQuery()
            .eq('session_id', sessionId)
            .eq('status', 'active')
            .is('user_id', null)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!sessionError && sessionCart) {
            console.log('Converting session cart to user cart:', sessionCart.id);
            // Convert session cart to user cart
            const { data: updatedCart, error: convertError } = await supabase
              .from('carts')
              .update({ 
                user_id: user.id,
                session_id: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', sessionCart.id)
              .select(`
                id, user_id, session_id, name, total_amount, status, created_at, updated_at,
                cart_items (
                  id, cart_id, cabinet_type_id, door_style_id, color_id, finish_id,
                  width_mm, height_mm, depth_mm, quantity, unit_price, total_price,
                  notes, configuration, created_at, updated_at,
                  cabinet_types (name, category, product_image_url),
                  door_styles (name, image_url),
                  colors (name, hex_code),
                  finishes (name)
                )
              `)
              .single();

            if (!convertError && updatedCart) {
              console.log('Successfully converted session cart to user cart');
              return updatedCart;
            }
          }

          return null;
        });
      } else {
        // Guest user flow with deduplication
        const sessionId = getSessionId();
        console.log('Fetching cart for guest session:', sessionId);
        existingCart = await deduplicatedRequest(`session_cart_${sessionId}`, async () => {
          const { data, error } = await buildCartQuery()
            .eq('session_id', sessionId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching session cart:', error);
            throw error;
          }
          
          console.log('Session cart result:', data?.id || 'none found');
          return data;
        });
      }

      // Create new cart if none exists
      if (!existingCart) {
        const cartData = user 
          ? { 
              user_id: user.id,
              name: 'My Cabinet Quote',
              status: 'active',
              total_amount: 0
            }
          : {
              session_id: getSessionId(),
              name: 'My Cabinet Quote', 
              status: 'active',
              total_amount: 0
            };

        existingCart = await deduplicatedRequest(`create_cart_${cacheKey}`, async () => {
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert(cartData)
            .select(`
              id,
              user_id,
              session_id,
              name,
              total_amount,
              status,
              created_at,
              updated_at,
              cart_items (
                id,
                cart_id,
                cabinet_type_id,
                door_style_id,
                color_id,
                finish_id,
                width_mm,
                height_mm,
                depth_mm,
                quantity,
                unit_price,
                total_price,
                notes,
                configuration,
                created_at,
                updated_at,
                cabinet_types (name, category, product_image_url),
                door_styles (name, image_url),
                colors (name, hex_code),
                finishes (name)
              )
            `)
            .single();

          if (createError) throw createError;
          return newCart;
        });
      }

      // Format cart data
      const formattedCart = {
        ...existingCart,
        items: existingCart.cart_items?.map((item: any) => ({
          ...item,
          cabinet_type: item.cabinet_types,
          door_style: item.door_styles,
          color: item.colors,
          finish: item.finishes
        })) || []
      };

      // Update cache
      cartCacheRef.current[cacheKey] = formattedCart;
      lastFetchTime.current = now;

      const endTime = performance.now();
      console.log(`Optimized cart initialized in ${(endTime - startTime).toFixed(2)}ms:`, {
        cartId: formattedCart.id,
        itemsCount: formattedCart.items.length,
        cached: false,
        cacheKey
      });

      setCart(formattedCart);

    } catch (err: any) {
      console.error('Error initializing cart:', err);
      setError(err.message);
      toast.error('Failed to load cart');
      // Clear cache on error
      delete cartCacheRef.current[cacheKey];
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [user?.id, cacheKey, getSessionId, deduplicatedRequest]);

  // Remove debounced initialization as it's causing infinite re-renders

  // Initialize cart on mount and user change - STABLE VERSION
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeCart();
    }, 100); // Small delay to prevent rapid calls
    
    return () => clearTimeout(timer);
  }, [user?.id]); // Only depend on user ID change

  // Add a separate effect to handle cart refresh when cache is cleared
  useEffect(() => {
    if (cart === null && !isLoading && !initializingRef.current && invalidationRef.current) {
      console.log('Cart invalidated, reinitializing...');
      const timer = setTimeout(() => {
        initializeCart();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [cart, isLoading]);

  // Optimized helper functions
  const getTotalItems = useCallback(() => {
    return cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  }, [cart?.items]);

  const getTotalPrice = useCallback(() => {
    return cart?.items?.reduce((sum: number, item: any) => sum + item.total_price, 0) || 0;
  }, [cart?.items]);

  const invalidateCache = useCallback(() => {
    console.log('Invalidating cart cache for:', cacheKey);
    delete cartCacheRef.current[cacheKey];
    lastFetchTime.current = 0;
    requestCache.clear();
    invalidationRef.current = true;
    // Trigger refresh by calling initializeCart directly instead of setting cart to null
    setTimeout(() => {
      initializeCart();
    }, 50);
  }, [cacheKey, initializeCart]);

  // Add optimistic update functions
  const updateCartOptimistically = useCallback((updater: (cart: any) => any) => {
    setCart(prevCart => {
      if (!prevCart) return prevCart;
      const updatedCart = updater(prevCart);
      // Update cache as well
      cartCacheRef.current[cacheKey] = updatedCart;
      return updatedCart;
    });
  }, [cacheKey]);

  const removeItemOptimistically = useCallback((itemId: string) => {
    updateCartOptimistically(cart => ({
      ...cart,
      items: cart.items.filter((item: any) => item.id !== itemId),
      total_amount: cart.items
        .filter((item: any) => item.id !== itemId)
        .reduce((sum: number, item: any) => sum + item.total_price, 0)
    }));
  }, [updateCartOptimistically]);

  const updateItemOptimistically = useCallback((itemId: string, newQuantity: number) => {
    updateCartOptimistically(cart => ({
      ...cart,
      items: cart.items.map((item: any) => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
          : item
      ),
      total_amount: cart.items
        .map((item: any) => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
            : item
        )
        .reduce((sum: number, item: any) => sum + item.total_price, 0)
    }));
  }, [updateCartOptimistically]);

  return {
    cart,
    isLoading,
    error,
    getTotalItems,
    getTotalPrice,
    invalidateCache,
    refreshCart: initializeCart,
    updateItemOptimistically,
    removeItemOptimistically
  };
};