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
  abandon_reason?: string;
  abandoned_at?: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export const useCart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate or get session ID for guest users
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  // Get or create cart (for both authenticated and guest users) with consolidation logic
  const initializeCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let existingCart = null;

      if (user) {
        // Authenticated user - first check for user cart, then handle session cart consolidation
        const { data: userCart, error: userError } = await supabase
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
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userError) throw userError;

        // Check for session-based cart that needs consolidation
        const sessionId = getSessionId();
        const { data: sessionCart, error: sessionError } = await supabase
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
          .eq('session_id', sessionId)
          .eq('status', 'active')
          .is('user_id', null)
          .limit(1)
          .maybeSingle();

        if (sessionError) console.error('Session cart fetch error:', sessionError);

        // Consolidate carts if both exist
        if (userCart && sessionCart && sessionCart.cart_items?.length > 0) {
          console.log('Consolidating session cart into user cart');
          
          // Move session cart items to user cart
          const { error: moveError } = await supabase
            .from('cart_items')
            .update({ cart_id: userCart.id })
            .eq('cart_id', sessionCart.id);

          if (moveError) {
            console.error('Error moving cart items:', moveError);
          } else {
            // Deactivate the session cart
            await supabase
              .from('carts')
              .update({ status: 'consolidated' })
              .eq('id', sessionCart.id);

            // Recalculate user cart total
            const { data: updatedItems } = await supabase
              .from('cart_items')
              .select('total_price')
              .eq('cart_id', userCart.id);

            const newTotal = updatedItems?.reduce((sum, item) => sum + item.total_price, 0) || 0;
            
            await supabase
              .from('carts')
              .update({ total_amount: newTotal })
              .eq('id', userCart.id);

            console.log('Cart consolidation completed - session cart merged into user cart');
          }
        } else if (!userCart && sessionCart) {
          // Convert session cart to user cart
          console.log('Converting session cart to user cart');
          
          const { error: convertError } = await supabase
            .from('carts')
            .update({ 
              user_id: user.id,
              session_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionCart.id);

          if (convertError) {
            console.error('Error converting session cart:', convertError);
          } else {
            existingCart = { ...sessionCart, user_id: user.id, session_id: null };
            console.log('Session cart converted to user cart');
          }
        }

        // Get final user cart state
        if (!existingCart) {
          const { data: finalCart, error: finalError } = await supabase
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
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (finalError) throw finalError;
          existingCart = finalCart;
        }

        // Deactivate any other active session carts to prevent conflicts
        await supabase
          .from('carts')
          .update({ status: 'abandoned' })
          .eq('session_id', sessionId)
          .eq('status', 'active')
          .is('user_id', null);

      } else {
        // Guest user - search by session_id
        const sessionId = getSessionId();
        const { data, error } = await supabase
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
          .eq('session_id', sessionId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (error) throw error;
        existingCart = data;
      }

      // If no active cart exists, create one
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

      console.log('Cart initialized:', {
        cartId: formattedCart.id,
        itemsCount: formattedCart.items.length,
        items: formattedCart.items.map(item => ({
          id: item.id,
          notes: item.notes,
          hasNotes: !!item.notes
        }))
      });

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
      // Try to initialize cart first
      await initializeCart();
      if (!cart) {
        toast.error('Unable to initialize cart. Please try again.');
        return;
      }
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

      // Update local cart state immediately for better UX
      const updatedItems = [...cart.items, formattedItem];
      const newCartTotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);
      
      const updatedCart = {
        ...cart,
        items: updatedItems,
        total_amount: newCartTotal
      };

      setCart(updatedCart);

      // Update cart total in database (real-time subscription will handle the update)
      await supabase
        .from('carts')
        .update({ 
          total_amount: newCartTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id);

      toast.success('Item added to cart');
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
        .update({ 
          total_amount: newCartTotal,
          updated_at: new Date().toISOString()
        })
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
        .update({ 
          total_amount: newCartTotal,
          updated_at: new Date().toISOString()
        })
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
        .update({ 
          total_amount: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id);

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

  // Save cart for later
  const saveCart = async (reason?: string) => {
    if (!cart) return;

    setIsLoading(true);
    try {
      await supabase
        .from('carts')
        .update({
          status: 'saved',
          abandon_reason: reason || 'Customer saved cart for later',
          abandoned_at: new Date().toISOString()
        })
        .eq('id', cart.id);

      toast.success('Cart saved successfully');
    } catch (err: any) {
      console.error('Error saving cart:', err);
      setError(err.message);
      toast.error('Failed to save cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Get total item count
  const getItemCount = () => {
    return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  // Initialize cart when component mounts or user changes
  useEffect(() => {
    initializeCart();
  }, [user?.id]);

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveCart,
    getItemCount,
    initializeCart
  };
};