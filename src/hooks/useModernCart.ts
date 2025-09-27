import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCartRealtime } from './useCartRealtime';

export interface CartItem {
  id: string;
  cart_id: string;
  cabinet_type_id: string;
  door_style_id?: string;
  color_id?: string;
  finish_id?: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  configuration?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  cabinet_types?: {
    name: string;
    category: string;
    product_image_url?: string;
  };
  door_styles?: {
    name: string;
    image_url?: string;
  };
  colors?: {
    name: string;
    hex_code?: string;
  };
  finishes?: {
    name: string;
  };
}

export interface Cart {
  id: string;
  user_id?: string;
  session_id?: string;
  name: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

// Generate session ID for guest users
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

export const useModernCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Enable real-time updates
  useCartRealtime();

  // Query for cart data using TanStack Query with proper deduplication
  const cartQuery = useQuery({
    queryKey: ['cart', user?.id || getSessionId()],
    queryFn: async () => {
      let data;
      let error;

      if (user?.id) {
        // For authenticated users, prioritize user-based cart with items
        const { data: userCarts, error: userError } = await supabase
          .from('carts')
          .select(`
            id, user_id, session_id, name, total_amount, status, created_at, updated_at, source,
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
          .eq('status', 'active')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (userError) throw userError;

        // Find cart with items, or use the most recent one
        const cartWithItems = userCarts.find(cart => cart.cart_items && cart.cart_items.length > 0);
        data = cartWithItems ? [cartWithItems] : userCarts.slice(0, 1);

        // If we have multiple active carts, consolidate them
        if (userCarts.length > 1) {
          console.log(`Found ${userCarts.length} active carts, consolidating...`);
          supabase.functions.invoke('cart-consolidation', {}).catch(console.error);
        }
      } else {
        // For session users, use session-based cart
        const { data: sessionData, error: sessionError } = await supabase
          .from('carts')
          .select(`
            id, user_id, session_id, name, total_amount, status, created_at, updated_at, source,
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
          .eq('status', 'active')
          .eq('session_id', getSessionId())
          .order('updated_at', { ascending: false })
          .limit(1);

        data = sessionData;
        error = sessionError;
      }

      if (error) throw error;
      return data;
    },
    enabled: true,
    staleTime: 1000 * 60, // 1 minute - reduce frequent refetches
    refetchOnWindowFocus: false, // Prevent multiple cart creations on focus
    refetchOnReconnect: true,
    retry: 1, // Reduce retry attempts
  });

  // Process cart data
  const cart = useMemo(() => {
    const rawCart = cartQuery.data?.[0];
    if (!rawCart) return null;

    return {
      ...rawCart,
      items: rawCart.cart_items?.map((item: any) => ({
        ...item,
        cabinet_type: item.cabinet_types,
        door_style: item.door_styles,
        color: item.colors,
        finish: item.finishes
      })) || []
    } as Cart;
  }, [cartQuery.data]);

  // Initialize cart mutation with race condition prevention
  const initializeCartMutation = useMutation({
    mutationKey: ['initializeCart', user?.id || getSessionId()],
    mutationFn: async () => {
      // Double-check if cart already exists to prevent race conditions
      const { data: existingCarts, error: checkError } = await supabase
        .from('carts')
        .select('id, user_id, session_id, name, total_amount, status, created_at, updated_at, source')
        .eq('status', 'active')
        .eq(user?.id ? 'user_id' : 'session_id', user?.id || getSessionId())
        .order('updated_at', { ascending: false })
        .limit(1);

      if (checkError) throw checkError;
      
      if (existingCarts && existingCarts.length > 0) {
        console.log('Cart already exists, using existing cart:', existingCarts[0].id);
        return existingCarts[0];
      }

      console.log('Creating new cart for', user?.id ? `user ${user.id}` : `session ${getSessionId()}`);

      const cartData = user?.id 
        ? { 
            user_id: user.id,
            name: 'My Cabinet Quote',
            status: 'active',
            total_amount: 0,
            source: 'manual'
          }
        : {
            session_id: getSessionId(),
            name: 'My Cabinet Quote', 
            status: 'active',
            total_amount: 0,
            source: 'manual'
          };

      const { data, error } = await supabase
        .from('carts')
        .insert(cartData)
        .select(`
          id, user_id, session_id, name, total_amount, status, created_at, updated_at, source,
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

      if (error) throw error;
      console.log('New cart created:', data.id);
      return data;
    },
    onSuccess: () => {
      // Invalidate cart queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      console.error('Failed to initialize cart:', error);
      toast.error('Failed to initialize cart');
    }
  });

  // Add item to cart mutation with optimistic updates
  const addItemMutation = useMutation({
    mutationFn: async (newItem: Omit<CartItem, 'id' | 'cart_id' | 'created_at' | 'updated_at'>) => {
      // Ensure we have a cart
      let currentCart = cart;
      if (!currentCart) {
        const initResult = await initializeCartMutation.mutateAsync();
        currentCart = { ...initResult, items: [] } as Cart;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: currentCart.id,
          ...newItem
        })
        .select(`
          id, cart_id, cabinet_type_id, door_style_id, color_id, finish_id,
          width_mm, height_mm, depth_mm, quantity, unit_price, total_price,
          notes, configuration, created_at, updated_at,
          cabinet_types (name, category, product_image_url),
          door_styles (name, image_url),
          colors (name, hex_code),
          finishes (name)
        `)
        .single();

      if (error) throw error;

      // Update cart total
      const newTotal = currentCart.total_amount + newItem.total_price;
      await supabase
        .from('carts')
        .update({ 
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCart.id);

      return data;
    },
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData(['cart', user?.id || getSessionId()]);

      // Optimistically update cart
      if (cart) {
        const optimisticItem = {
          id: 'temp-' + Date.now(),
          cart_id: cart.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          cabinet_type: null,
          door_style: null,
          color: null,
          finish: null,
          ...newItem
        } as CartItem;

        const updatedCart = {
          ...cart,
          items: [...cart.items, optimisticItem],
          total_amount: cart.total_amount + newItem.total_price,
          updated_at: new Date().toISOString()
        };

        queryClient.setQueryData(['cart', user?.id || getSessionId()], [updatedCart]);
      }

      return { previousCart };
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', user?.id || getSessionId()], context.previousCart);
      }
      toast.error('Failed to add item to cart');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: () => {
      toast.success('Item added to cart');
      // Trigger cart update event for other components
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
  });

  // Update item quantity mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!cart) throw new Error('No cart found');

      const item = cart.items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      const newTotalPrice = item.unit_price * quantity;
      
      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          total_price: newTotalPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Update cart total
      const oldItemTotal = item.total_price;
      const newCartTotal = cart.total_amount - oldItemTotal + newTotalPrice;
      
      await supabase
        .from('carts')
        .update({ 
          total_amount: newCartTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id);

      return data;
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart', user?.id || getSessionId()]);

      if (cart) {
        const updatedItems = cart.items.map(item => 
          item.id === itemId 
            ? { ...item, quantity, total_price: item.unit_price * quantity }
            : item
        );
        
        const updatedCart = {
          ...cart,
          items: updatedItems,
          total_amount: updatedItems.reduce((sum, item) => sum + item.total_price, 0),
          updated_at: new Date().toISOString()
        };

        queryClient.setQueryData(['cart', user?.id || getSessionId()], [updatedCart]);
      }

      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', user?.id || getSessionId()], context.previousCart);
      }
      toast.error('Failed to update item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!cart) throw new Error('No cart found');

      const item = cart.items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update cart total
      const newCartTotal = cart.total_amount - item.total_price;
      await supabase
        .from('carts')
        .update({ 
          total_amount: newCartTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id);

      return itemId;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart', user?.id || getSessionId()]);

      if (cart) {
        const itemToRemove = cart.items.find(i => i.id === itemId);
        const updatedItems = cart.items.filter(item => item.id !== itemId);
        
        const updatedCart = {
          ...cart,
          items: updatedItems,
          total_amount: cart.total_amount - (itemToRemove?.total_price || 0),
          updated_at: new Date().toISOString()
        };

        queryClient.setQueryData(['cart', user?.id || getSessionId()], [updatedCart]);
      }

      return { previousCart };
    },
    onError: (err, itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', user?.id || getSessionId()], context.previousCart);
      }
      toast.error('Failed to remove item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: () => {
      toast.success('Item removed from cart');
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!cart) throw new Error('No cart found');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      await supabase
        .from('carts')
        .update({ 
          total_amount: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
      window.dispatchEvent(new CustomEvent('cart-updated'));
    },
    onError: () => {
      toast.error('Failed to clear cart');
    }
  });

  // Helper functions
  const getTotalItems = useCallback(() => {
    return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cart?.items]);

  const getTotalPrice = useCallback(() => {
    return cart?.total_amount || 0;
  }, [cart?.total_amount]);

  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'cart_id' | 'created_at' | 'updated_at'>) => {
    addItemMutation.mutate(item);
  }, [addItemMutation]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    updateItemMutation.mutate({ itemId, quantity });
  }, [updateItemMutation]);

  const removeFromCart = useCallback((itemId: string) => {
    removeItemMutation.mutate(itemId);
  }, [removeItemMutation]);

  const clearCart = useCallback(() => {
    clearCartMutation.mutate();
  }, [clearCartMutation]);

  return {
    cart,
    isLoading: cartQuery.isLoading || cartQuery.isFetching,
    error: cartQuery.error?.message || null,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    
    // Helpers
    getTotalItems,
    getTotalPrice,
    
    // Mutation states
    isAddingItem: addItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    
    // For compatibility with existing cart drawer
    updateItemOptimistically: updateQuantity,
    removeItemOptimistically: removeFromCart,
    refreshCart: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    invalidateCache: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  };
};