import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Re-export types from original useCart
export type { CartItem, Cart } from './useCart';

// Simple cart hook without complex caching to prevent infinite re-renders
export const useOptimizedCart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate session ID for guest users
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Simple cart initialization without complex caching
  const initializeCart = useCallback(async () => {
    if (isLoading) {
      console.log('Cart initialization skipped - already loading');
      return;
    }
    
    console.log('Starting cart initialization for user:', user?.id || 'guest');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading cart for user:', user?.id || 'guest');
      
      let existingCart = null;

      if (user?.id) {
        // For authenticated users, try to find user cart first
        const { data: userCart, error: userError } = await supabase
          .from('carts')
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
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        if (userCart) {
          existingCart = userCart;
          console.log('Found user cart:', userCart.id);
        } else {
          // Try to convert session cart to user cart
          const sessionId = getSessionId();
          const { data: sessionCart } = await supabase
            .from('carts')
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
            .eq('session_id', sessionId)
            .eq('status', 'active')
            .is('user_id', null)
            .maybeSingle();

          if (sessionCart) {
            // Convert session cart to user cart
            const { data: convertedCart, error: convertError } = await supabase
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

            if (!convertError) {
              existingCart = convertedCart;
              console.log('Converted session cart to user cart');
            }
          }
        }
      } else {
        // For guest users, find session cart
        const sessionId = getSessionId();
        const { data: sessionCart } = await supabase
          .from('carts')
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
          .eq('session_id', sessionId)
          .eq('status', 'active')
          .maybeSingle();

        existingCart = sessionCart;
      }

      // Create new cart if none exists
      if (!existingCart) {
        const cartData = user?.id 
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

        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert(cartData)
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

        if (createError) throw createError;
        existingCart = newCart;
        console.log('Created new cart:', newCart.id);
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

      setCart(formattedCart);
      console.log('Cart loaded successfully:', {
        cartId: formattedCart.id,
        itemsCount: formattedCart.items.length,
        totalAmount: formattedCart.total_amount
      });

    } catch (err: any) {
      console.error('Error loading cart:', err);
      setError(err.message);
      toast.error('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getSessionId, isLoading]);

  // Initialize cart only once when user changes or when forced refresh event occurs
  useEffect(() => {
    // Check if we need to refresh due to recent cart updates
    const cartUpdated = localStorage.getItem('cart_updated');
    const shouldForceRefresh = cartUpdated && (Date.now() - parseInt(cartUpdated)) < 5000; // 5 seconds
    
    if (!cart || shouldForceRefresh) {
      if (shouldForceRefresh) {
        console.log('🔄 Force refreshing cart due to recent update');
        localStorage.removeItem('cart_updated');
      }
      initializeCart();
    }
  }, [user?.id]); // Only depend on user ID change

  // Separate effect for cart update events to avoid dependency issues
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('🔄 Cart update event received - force refreshing cart data');
      setCart(null);  // Clear current cart
      setIsLoading(false);  // Reset loading state
      // Force immediate re-initialization
      setTimeout(() => {
        console.log('🔄 Re-initializing cart after update event');
        initializeCart();
      }, 50);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart_updated') {
        console.log('🔄 Storage cart update detected');
        handleCartUpdate();
      }
    };

    // Listen for both custom events and storage events
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initializeCart]);

  // Helper functions
  const getTotalItems = useCallback(() => {
    return cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  }, [cart?.items]);

  const getTotalPrice = useCallback(() => {
    return cart?.items?.reduce((sum: number, item: any) => sum + item.total_price, 0) || 0;
  }, [cart?.items]);

  const refreshCart = useCallback(() => {
    setCart(null);
    initializeCart();
  }, [initializeCart]);

  const updateItemOptimistically = useCallback((itemId: string, newQuantity: number) => {
    setCart((prevCart: any) => {
      if (!prevCart) return prevCart;
      
      const updatedItems = prevCart.items.map((item: any) => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
          : item
      );
      
      return {
        ...prevCart,
        items: updatedItems,
        total_amount: updatedItems.reduce((sum: number, item: any) => sum + item.total_price, 0)
      };
    });
  }, []);

  const removeItemOptimistically = useCallback((itemId: string) => {
    setCart((prevCart: any) => {
      if (!prevCart) return prevCart;
      
      const filteredItems = prevCart.items.filter((item: any) => item.id !== itemId);
      
      return {
        ...prevCart,
        items: filteredItems,
        total_amount: filteredItems.reduce((sum: number, item: any) => sum + item.total_price, 0)
      };
    });
  }, []);

  return {
    cart,
    isLoading,
    error,
    getTotalItems: getTotalItems || (() => 0),
    getTotalPrice: getTotalPrice || (() => 0),
    refreshCart,
    updateItemOptimistically: updateItemOptimistically || (() => {}),
    removeItemOptimistically: removeItemOptimistically || (() => {}),
    invalidateCache: refreshCart // Alias for compatibility
  };
};