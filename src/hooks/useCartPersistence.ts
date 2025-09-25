import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  cabinetType: any;
  selectedOptions: {
    doorStyleId?: string;
    colorId?: string;
    finishId?: string;
    assemblyEnabled?: boolean;
    postcode?: string;
    shippingEstimate?: any;
    assemblyEstimate?: any;
  };
  pricing: {
    basePrice: number;
    shippingCost: number;
    assemblyCost: number;
    totalPrice: number;
  };
  addedAt: string;
}

interface UseCartPersistenceReturn {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  restoreUserPreferences: (newItem: CartItem) => void;
}

const CART_STORAGE_KEY = 'lovable-cabinet-cart';
const PREFERENCES_STORAGE_KEY = 'lovable-cabinet-preferences';

export const useCartPersistence = (): UseCartPersistenceReturn => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cartItems]);

  // Save user preferences (door style, color, finish, assembly) for future use
  const saveUserPreferences = (options: CartItem['selectedOptions']) => {
    try {
      const preferences = {
        doorStyleId: options.doorStyleId,
        colorId: options.colorId,
        finishId: options.finishId,
        assemblyEnabled: options.assemblyEnabled,
        postcode: options.postcode,
        lastUsed: new Date().toISOString()
      };
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  // Restore user preferences for new items
  const restoreUserPreferences = (newItem: CartItem): CartItem => {
    try {
      const savedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        
        // Apply saved preferences if the new item doesn't have these options set
        return {
          ...newItem,
          selectedOptions: {
            doorStyleId: newItem.selectedOptions.doorStyleId || preferences.doorStyleId,
            colorId: newItem.selectedOptions.colorId || preferences.colorId,
            finishId: newItem.selectedOptions.finishId || preferences.finishId,
            assemblyEnabled: newItem.selectedOptions.assemblyEnabled ?? preferences.assemblyEnabled,
            postcode: newItem.selectedOptions.postcode || preferences.postcode,
            ...newItem.selectedOptions // Keep any explicitly set options
          }
        };
      }
    } catch (error) {
      console.error('Failed to restore user preferences:', error);
    }
    return newItem;
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'addedAt'>) => {
    const newItem: CartItem = {
      ...item,
      id: `${item.cabinetType.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString()
    };

    // Restore user preferences and save new preferences
    const itemWithPreferences = restoreUserPreferences(newItem);
    saveUserPreferences(itemWithPreferences.selectedOptions);

    setCartItems(prev => [...prev, itemWithPreferences]);
    toast.success(`${item.cabinetType.name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      const filtered = prev.filter(item => item.id !== id);
      
      if (itemToRemove) {
        toast.success(`${itemToRemove.cabinetType.name} removed from cart`);
      }
      
      return filtered;
    });
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.pricing.totalPrice, 0);
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartTotal,
    restoreUserPreferences
  };
};