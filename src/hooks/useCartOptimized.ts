import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCartRealtime } from './useCartRealtime';

export interface CartItem {
  id: string;
  cart_id: string;
  cabinet_type_id: string;
  cabinet_type?: {
    name: string;
    category: string;
    product_image_url?: string;
  };
  door_style_id?: string;
  door_style?: {
    name: string;
    image_url?: string;
  };
  color_id?: string;
  color?: {
    name: string;
    hex_code?: string;
  };
  finish_id?: string;
  finish?: {
    name: string;
  };
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
}

export interface Cart {
  id: string;
  user_id?: string;
  session_id?: string;
  name: string;
  total_amount: number;
  status: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

// Generate stable session ID for guest users
// CRITICAL: Use localStorage (not sessionStorage) so ID persists across page loads
const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('cart_session_id', sessionId);
    console.log('🆕 Created new session ID:', sessionId);
  } else {
    console.log('♻️ Reusing existing session ID:', sessionId);
  }
  return sessionId;
};

export const useCartOptimized = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const identifier = user?.id || getSessionId();
  
  // Enable real-time updates
  useCartRealtime(identifier);
  
  // Optimized cart query with proper stale time and caching
  const { data: cart, isLoading, error, refetch } = useQuery({
    queryKey: ['cart', identifier],
    queryFn: async () => {
      const sessionId = getSessionId();
      const filter = user?.id 
        ? { user_id: user.id }
        : { session_id: sessionId };
      
      console.log('🛒 Cart query:', { 
        filter, 
        userId: user?.id, 
        sessionId: !user?.id ? sessionId : 'N/A (authenticated)' 
      });
      
      // CRITICAL FIX: First try to find cart WITH items (total_amount > 0)
      // This prevents selecting empty carts that were created during navigation
      let { data, error } = await supabase
        .from('carts')
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
        `)
        .match(filter)
        .eq('status', 'active')
        .gt('total_amount', 0)  // PRIORITY: Carts with items
        .order('updated_at', { ascending: false })  // Most recently used
        .limit(1)
        .maybeSingle();
      
      // If no cart with items found, fallback to any active cart
      if (!data && !error) {
        console.log('⚠️ No cart with items found, checking for empty carts');
        const fallbackResult = await supabase
          .from('carts')
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
          `)
          .match(filter)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }
      
      console.log('📦 Cart query result:', { 
        cartId: data?.id, 
        itemCount: data?.cart_items?.length || 0,
        totalAmount: data?.total_amount || 0,
        error: error?.message 
      });

      if (error) throw error;
      
      if (!data) {
        console.log('🆕 Creating new cart');
        // Create new cart
        const cartData = user 
          ? { 
              user_id: user.id,
              name: 'My Cabinet Quote',
              status: 'active',
              total_amount: 0
            }
          : {
              session_id: sessionId,
              name: 'My Cabinet Quote', 
              status: 'active',
              total_amount: 0
            };
        
        console.log('💾 Cart data to insert:', cartData);

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
          `)
          .single();

        if (createError) throw createError;
        return newCart;
      }
      
      return data;
    },
    staleTime: 10 * 1000, // 10 seconds - reduced for better checkout reliability
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always refetch on mount to ensure fresh data for checkout
    refetchOnReconnect: true,
  });

  // Format cart data
  const formattedCart: Cart | null = useMemo(() => {
    if (!cart) return null;
    
    return {
      ...cart,
      items: cart.cart_items?.map((item: any) => ({
        ...item,
        cabinet_type: item.cabinet_types,
        door_style: item.door_styles,
        color: item.colors,
        finish: item.finishes
      })) || []
    };
  }, [cart]);

  // Helper functions
  const getTotalItems = useCallback(() => {
    return formattedCart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }, [formattedCart?.items]);

  const getTotalPrice = useCallback(() => {
    return formattedCart?.items?.reduce((total, item) => total + item.total_price, 0) || 0;
  }, [formattedCart?.items]);

  // Mutations for cart operations
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          total_price: quantity * (formattedCart?.items?.find(item => item.id === itemId)?.unit_price || 0)
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', identifier] });
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (newItem: {
      cabinet_type_id: string;
      door_style_id: string;
      color_id: string;
      finish_id: string;
      width_mm: number;
      height_mm: number;
      depth_mm: number;
      quantity: number;
      unit_price: number;
      total_price: number;
      configuration?: any;
      notes?: string;
    }) => {
      console.log('Adding item to cart:', newItem);
      
      if (!formattedCart?.id) {
        console.error('No active cart found:', formattedCart);
        throw new Error('No active cart found - please refresh the page');
      }

      // Validate required fields
      if (!newItem.cabinet_type_id || !newItem.door_style_id || !newItem.color_id || !newItem.finish_id) {
        throw new Error('Missing required item configuration');
      }

      if (!newItem.width_mm || !newItem.height_mm || !newItem.depth_mm) {
        throw new Error('Invalid item dimensions');
      }

      const itemData = {
        cart_id: formattedCart.id,
        cabinet_type_id: newItem.cabinet_type_id,
        door_style_id: newItem.door_style_id,
        color_id: newItem.color_id,
        finish_id: newItem.finish_id,
        width_mm: newItem.width_mm,
        height_mm: newItem.height_mm,
        depth_mm: newItem.depth_mm,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        total_price: newItem.total_price,
        configuration: newItem.configuration || {},
        notes: newItem.notes || ''
      };

      console.log('Inserting item data:', itemData);

      const { data, error } = await supabase
        .from('cart_items')
        .insert(itemData)
        .select('*');

      if (error) {
        console.error('Database error adding item:', error);
        throw new Error(`Failed to add item: ${error.message}`);
      }

      console.log('Item added successfully:', data);
      return data;
    },
    retry: 2,
    onSuccess: (data) => {
      console.log('Item add success, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['cart', identifier] });
      toast.success('Item added to cart successfully');
    },
    onError: (error: any) => {
      console.error('Error adding item to cart:', error);
      toast.error(error.message || 'Failed to add item to cart');
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', identifier] });
      toast.success('Item removed from cart');
    },
    onError: (error) => {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  });

  return {
    cart: formattedCart,
    isLoading,
    error: error?.message || null,
    getTotalItems,
    getTotalPrice,
    refreshCart: refetch,
    addToCart: (item: {
      cabinet_type_id: string;
      door_style_id: string;
      color_id: string;
      finish_id: string;
      width_mm: number;
      height_mm: number;
      depth_mm: number;
      quantity: number;
      unit_price: number;
      total_price: number;
      configuration?: any;
      notes?: string;
    }) => {
      addItemMutation.mutate(item);
    },
    updateItemOptimistically: (itemId: string, quantity: number) => {
      updateItemMutation.mutate({ itemId, quantity });
    },
    removeItemOptimistically: (itemId: string) => {
      removeItemMutation.mutate(itemId);
    },
    invalidateCache: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', identifier] });
    }
  };
};