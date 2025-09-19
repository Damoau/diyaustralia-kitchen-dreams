import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, Cart, CabinetConfiguration } from '@/types/cabinet';
import { generateCutlist, PricingSettings } from '@/lib/pricing';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cart: Cart | null;
  cartItems: CartItem[];
  isLoading: boolean;
  totalItems: number;
  totalAmount: number;
  addToCart: (configuration: CabinetConfiguration, cabinetParts: any[], settings: PricingSettings) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  getOrCreateCart: () => Promise<Cart | null>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get or create cart
  const getOrCreateCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Authenticated user - use RLS-protected query
        const { data: existingCart } = await supabase
          .from('carts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingCart) {
          setCart(existingCart);
          return existingCart;
        }

        // Create new cart for authenticated user
        const { data: newCart, error } = await supabase
          .from('carts')
          .insert([{ user_id: user.id, name: 'My Cabinet Quote' }])
          .select()
          .single();

        if (error) throw error;
        setCart(newCart);
        return newCart;
      } else {
        // Guest user - handle locally without RLS queries
        const sessionId = sessionStorage.getItem('guest_cart_id') || 
          `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('guest_cart_id', sessionId);
        
        // For guest users, we'll use a local cart representation
        const guestCart = {
          id: sessionId,
          session_id: sessionId,
          name: 'My Cabinet Quote',
          user_id: null,
          total_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCart(guestCart as any);
        return guestCart as any;
      }
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Authenticated user - use database
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
      } else {
        // Guest user - use localStorage
        const guestCartItems = JSON.parse(localStorage.getItem(`guest_cart_items_${cartId}`) || '[]');
        setCartItems(guestCartItems);
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      setCartItems([]);
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

      const { data: { user } } = await supabase.auth.getUser();

      let cutlist;
      let unitPrice;
      let totalPrice;

      // Check if this is using the new product system
      if ((configuration as any).productVariant) {
        // New product-based system
        const productConfig = configuration as any;
        
        try {
          const { calculateCabinetPrice } = await import('@/lib/dynamicPricing');
          
          const { data: cabinetParts } = await supabase
            .from('cabinet_parts')
            .select('*')
            .eq('cabinet_type_id', configuration.cabinetType.id);
          
          const { data: globalSettings } = await supabase
            .from('global_settings')
            .select('*');
          
          if (cabinetParts && globalSettings) {
            const basePrice = configuration.cabinetType.base_price || 299;
            const area = (configuration.width / 1000) * (configuration.height / 1000);
            unitPrice = basePrice + (area * 100);
            totalPrice = unitPrice * configuration.quantity;
            
            cutlist = {
              parts: [],
              carcassCost: unitPrice * 0.8,
              doorCost: unitPrice * 0.15,
              hardwareCost: unitPrice * 0.05,
              totalCost: unitPrice
            };
          } else {
            unitPrice = configuration.cabinetType.base_price || 299;
            totalPrice = unitPrice * configuration.quantity;
            
            cutlist = {
              parts: [],
              carcassCost: unitPrice * 0.8,
              doorCost: unitPrice * 0.15,
              hardwareCost: unitPrice * 0.05,
              totalCost: unitPrice
            };
          }
        } catch (error) {
          console.error('Error calculating product price:', error);
          unitPrice = configuration.cabinetType.base_price || 299;
          totalPrice = unitPrice * configuration.quantity;
          
          cutlist = {
            parts: [],
            carcassCost: unitPrice * 0.8,
            doorCost: unitPrice * 0.15,
            hardwareCost: unitPrice * 0.05,
            totalCost: unitPrice
          };
        }
      } else {
        // Legacy system
        cutlist = generateCutlist(configuration, cabinetParts, settings);
        unitPrice = cutlist.totalCost / configuration.quantity;
        totalPrice = cutlist.totalCost;
      }

      const isProductBased = !!(configuration as any).productVariant;
      const productConfig = configuration as any;
      
      const cartItemData = {
        id: user ? undefined : `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cart_id: currentCart.id,
        cabinet_type_id: configuration.cabinetType.id,
        width_mm: configuration.width,
        height_mm: configuration.height,
        depth_mm: configuration.depth,
        quantity: configuration.quantity,
        finish_id: (configuration as any).finish?.id || null,
        color_id: (configuration as any).color?.id || null,
        door_style_id: (configuration as any).doorStyle?.id || null,
        unit_price: unitPrice,
        total_price: totalPrice,
        configuration: JSON.stringify({
          cabinetType: configuration.cabinetType,
          finish: (configuration as any).finish || null,
          color: (configuration as any).color || null,
          doorStyle: (configuration as any).doorStyle || null,
          parts: cutlist.parts,
          carcassCost: cutlist.carcassCost,
          doorCost: cutlist.doorCost,
          hardwareCost: cutlist.hardwareCost,
          hardwareBrandId: (configuration as any).hardwareBrand?.id,
          productVariant: productConfig.productVariant,
          productOptions: productConfig.productOptions,
          isProductBased: isProductBased,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .insert([cartItemData]);

        if (error) throw error;
      } else {
        const existingItems = JSON.parse(localStorage.getItem(`guest_cart_items_${currentCart.id}`) || '[]');
        existingItems.push(cartItemData);
        localStorage.setItem(`guest_cart_items_${currentCart.id}`, JSON.stringify(existingItems));
      }

      // Force immediate cart state update
      await loadCartItems(currentCart.id);
      
      console.log('🔄 Cart context updated after adding item');
      
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
      } else {
        if (cart) {
          const existingItems = JSON.parse(localStorage.getItem(`guest_cart_items_${cart.id}`) || '[]');
          const filteredItems = existingItems.filter((item: any) => item.id !== itemId);
          localStorage.setItem(`guest_cart_items_${cart.id}`, JSON.stringify(filteredItems));
        }
      }

      // Update local state immediately
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      
      console.log('🗑️ Item removed from cart context');
      
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
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .update({ 
            quantity,
            total_price: newTotalPrice 
          })
          .eq('id', itemId);

        if (error) throw error;
      } else {
        if (cart) {
          const existingItems = JSON.parse(localStorage.getItem(`guest_cart_items_${cart.id}`) || '[]');
          const updatedItems = existingItems.map((cartItem: any) => 
            cartItem.id === itemId 
              ? { ...cartItem, quantity, total_price: newTotalPrice, updated_at: new Date().toISOString() }
              : cartItem
          );
          localStorage.setItem(`guest_cart_items_${cart.id}`, JSON.stringify(updatedItems));
        }
      }

      // Update local state immediately
      setCartItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, quantity, total_price: newTotalPrice }
          : i
      ));
      
      console.log('📊 Cart quantity updated in context');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  // Force refresh cart items
  const refreshCart = async () => {
    if (cart) {
      await loadCartItems(cart.id);
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

  // Debug logging for cart state changes
  useEffect(() => {
    console.log('🛒 Cart context state updated:', {
      cartItemsLength: cartItems.length,
      totalItems,
      totalAmount,
      cartItems: cartItems.map(item => ({
        id: item.id,
        name: item.cabinet_type?.name,
        quantity: item.quantity
      }))
    });
  }, [cartItems, totalItems, totalAmount]);

  const value: CartContextType = {
    cart,
    cartItems,
    isLoading,
    totalItems,
    totalAmount,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getOrCreateCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}