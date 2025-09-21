import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useCart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get or create user's active cart
  const initializeCart = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // First try to find existing active cart (get the most recent one)
      let { data: existingCarts, error: fetchError } = await supabase
        .from('carts')
        .select(`
          *,
          cart_items (
            *,
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
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      let existingCart = existingCarts?.[0];

      // If no active cart exists, create one
      if (!existingCart) {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            name: 'My Cabinet Quote',
            status: 'active',
            total_amount: 0
          })
          .select(`
            *,
            cart_items (
              *,
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
        existingCart = newCart;
      }

      // Format the cart data
      const formattedCart: Cart = {
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
    } catch (err: any) {
      console.error('Error initializing cart:', err);
      setError(err.message);
      toast.error('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (item: {
    cabinet_type_id: string;
    door_style_id?: string;
    color_id?: string;
    finish_id?: string;
    width_mm: number;
    height_mm: number;
    depth_mm: number;
    quantity: number;
    unit_price: number;
    notes?: string;
    configuration?: any;
  }) => {
    if (!cart) {
      toast.error('Cart not initialized');
      return;
    }

    setIsLoading(true);
    try {
      const total_price = item.unit_price * item.quantity;

      const { data: newItem, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          ...item,
          total_price
        })
        .select(`
          *,
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
        `)
        .single();

      if (error) throw error;

      // Format the new item
      const formattedItem: CartItem = {
        ...newItem,
        cabinet_type: newItem.cabinet_types,
        door_style: newItem.door_styles,
        color: newItem.colors,
        finish: newItem.finishes
      };

      // Update local cart state
      const updatedCart = {
        ...cart,
        items: [...cart.items, formattedItem],
        total_amount: cart.total_amount + total_price
      };

      setCart(updatedCart);

      // Update cart total in database
      await supabase
        .from('carts')
        .update({ total_amount: updatedCart.total_amount })
        .eq('id', cart.id);

      toast.success('Added to cart');
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setError(err.message);
      toast.error('Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!cart) return;

    setIsLoading(true);
    try {
      const item = cart.items.find(i => i.id === itemId);
      if (!item) return;

      const newTotalPrice = item.unit_price * newQuantity;

      const { error } = await supabase
        .from('cart_items')
        .update({
          quantity: newQuantity,
          total_price: newTotalPrice
        })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      const updatedItems = cart.items.map(i =>
        i.id === itemId
          ? { ...i, quantity: newQuantity, total_price: newTotalPrice }
          : i
      );

      const newCartTotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);

      const updatedCart = {
        ...cart,
        items: updatedItems,
        total_amount: newCartTotal
      };

      setCart(updatedCart);

      // Update cart total in database
      await supabase
        .from('carts')
        .update({ total_amount: newCartTotal })
        .eq('id', cart.id);

    } catch (err: any) {
      console.error('Error updating quantity:', err);
      setError(err.message);
      toast.error('Failed to update quantity');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    if (!cart) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      const updatedItems = cart.items.filter(i => i.id !== itemId);
      const newCartTotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);

      const updatedCart = {
        ...cart,
        items: updatedItems,
        total_amount: newCartTotal
      };

      setCart(updatedCart);

      // Update cart total in database
      await supabase
        .from('carts')
        .update({ total_amount: newCartTotal })
        .eq('id', cart.id);

      toast.success('Item removed from cart');
    } catch (err: any) {
      console.error('Error removing from cart:', err);
      setError(err.message);
      toast.error('Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!cart) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      // Update cart total
      await supabase
        .from('carts')
        .update({ total_amount: 0 })
        .eq('id', cart.id);

      // Update local state
      setCart({
        ...cart,
        items: [],
        total_amount: 0
      });

      toast.success('Cart cleared');
    } catch (err: any) {
      console.error('Error clearing cart:', err);
      setError(err.message);
      toast.error('Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Get cart item count
  const getItemCount = () => {
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  // Initialize cart when user changes
  useEffect(() => {
    if (user) {
      initializeCart();
    } else {
      setCart(null);
    }
  }, [user]);

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemCount,
    initializeCart
  };
};