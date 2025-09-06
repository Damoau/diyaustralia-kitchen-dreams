import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, Cart, CabinetConfiguration } from '@/types/cabinet';
import { generateCutlist, PricingSettings } from '@/lib/pricing';
import { useToast } from '@/hooks/use-toast';

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get or create cart
  const getOrCreateCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let cartQuery;

      if (user) {
        // Authenticated user
        cartQuery = supabase
          .from('carts')
          .select('*')
          .eq('user_id', user.id)
          .single();
      } else {
        // Guest user - use session storage
        const sessionId = sessionStorage.getItem('guest_cart_id') || 
          `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('guest_cart_id', sessionId);
        
        cartQuery = supabase
          .from('carts')
          .select('*')
          .eq('session_id', sessionId)
          .single();
      }

      const { data: existingCart } = await cartQuery;

      if (existingCart) {
        setCart(existingCart);
        return existingCart;
      }

      // Create new cart
      const newCartData = user 
        ? { user_id: user.id, name: 'My Cabinet Quote' }
        : { session_id: sessionStorage.getItem('guest_cart_id'), name: 'My Cabinet Quote' };

      const { data: newCart, error } = await supabase
        .from('carts')
        .insert([newCartData])
        .select()
        .single();

      if (error) throw error;

      setCart(newCart);
      return newCart;
    } catch (error) {
      console.error('Error getting/creating cart:', error);
      toast({
        title: "Error",
        description: "Failed to initialize cart",
        variant: "destructive",
      });
      return null;
    }
  };

  // Load cart items
  const loadCartItems = async (cartId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          cabinet_type:cabinet_types(*),
          finish:finishes(*),
          color:colors(*),
          door_style:door_styles(*)
        `)
        .eq('cart_id', cartId);

      if (error) throw error;

      setCartItems((data || []) as CartItem[]);
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  // Add item to cart
  const addToCart = async (
    configuration: CabinetConfiguration,
    cabinetParts: any[],
    settings: PricingSettings
  ) => {
    try {
      setIsLoading(true);
      const currentCart = cart || await getOrCreateCart();
      if (!currentCart) return;

      const cutlist = generateCutlist(configuration, cabinetParts, settings);

      const cartItemData = {
        cart_id: currentCart.id,
        cabinet_type_id: configuration.cabinetType.id,
        width_mm: configuration.width,
        height_mm: configuration.height,
        depth_mm: configuration.depth,
        quantity: configuration.quantity,
        finish_id: configuration.finish?.id || null,
        color_id: configuration.color?.id || null,
        door_style_id: configuration.doorStyle?.id || null,
        unit_price: cutlist.totalCost / configuration.quantity,
        total_price: cutlist.totalCost,
        configuration: JSON.stringify({
          parts: cutlist.parts,
          carcassCost: cutlist.carcassCost,
          doorCost: cutlist.doorCost,
          hardwareCost: cutlist.hardwareCost,
        }),
      };

      const { error } = await supabase
        .from('cart_items')
        .insert([cartItemData]);

      if (error) throw error;

      // Reload cart items
      await loadCartItems(currentCart.id);
      
      toast({
        title: "Added to Cart",
        description: `${configuration.cabinetType.name} added successfully`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Removed from Cart",
        description: "Item removed successfully",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    try {
      const item = cartItems.find(i => i.id === itemId);
      if (!item) return;

      const newTotalPrice = item.unit_price * quantity;

      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          total_price: newTotalPrice 
        })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, quantity, total_price: newTotalPrice }
          : i
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  // Initialize cart on mount
  useEffect(() => {
    getOrCreateCart().then(cart => {
      if (cart) {
        loadCartItems(cart.id);
      }
    });
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);

  return {
    cart,
    cartItems,
    isLoading,
    totalItems,
    totalAmount,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getOrCreateCart,
  };
}