import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cart, CartItem } from './useCart';

export const useSavedCarts = () => {
  const { user } = useAuth();
  const [savedCarts, setSavedCarts] = useState<Cart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedCarts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data: carts, error: fetchError } = await supabase
        .from('carts')
        .select(`
          id,
          user_id,
          session_id,
          name,
          total_amount,
          status,
          abandon_reason,
          abandoned_at,
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
        .eq('status', 'saved')
        .order('abandoned_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Format the cart data
      const formattedCarts: Cart[] = (carts || []).map(cart => ({
        ...cart,
        items: cart.cart_items?.map((item: any) => ({
          ...item,
          cabinet_type: item.cabinet_types,
          door_style: item.door_styles,
          color: item.colors,
          finish: item.finishes
        })) || []
      }));

      setSavedCarts(formattedCarts);
    } catch (err: any) {
      console.error('Error fetching saved carts:', err);
      setError(err.message);
      toast.error('Failed to load saved carts');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreCart = async (cartId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First, check if user has an active cart and save it if it has items
      const { data: activeCart } = await supabase
        .from('carts')
        .select('id, cart_items(id)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (activeCart && activeCart.cart_items && activeCart.cart_items.length > 0) {
        // Save the current active cart first
        await supabase
          .from('carts')
          .update({
            status: 'saved',
            abandon_reason: 'Auto-saved when restoring another cart',
            abandoned_at: new Date().toISOString()
          })
          .eq('id', activeCart.id);
      }

      // Restore the selected cart
      const { error } = await supabase
        .from('carts')
        .update({
          status: 'active',
          abandon_reason: null,
          abandoned_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);

      if (error) throw error;

      // Remove from saved carts list
      setSavedCarts(prev => prev.filter(cart => cart.id !== cartId));
      
      toast.success('Cart restored! You can now continue shopping.');
      
      // Trigger a page refresh to update the active cart
      window.location.href = '/cart';
    } catch (err: any) {
      console.error('Error restoring cart:', err);
      setError(err.message);
      toast.error('Failed to restore cart');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCart = async (cartId: string) => {
    setIsLoading(true);
    try {
      // Delete cart items first (foreign key constraint)
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      // Delete the cart
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('id', cartId);

      if (error) throw error;

      // Remove from saved carts list
      setSavedCarts(prev => prev.filter(cart => cart.id !== cartId));
      
      toast.success('Saved cart deleted');
    } catch (err: any) {
      console.error('Error deleting cart:', err);
      setError(err.message);
      toast.error('Failed to delete cart');
    } finally {
      setIsLoading(false);
    }
  };

  const getSavedCartsCount = () => {
    return savedCarts.length;
  };

  // Initialize saved carts when user changes
  useEffect(() => {
    if (user) {
      fetchSavedCarts();
    } else {
      setSavedCarts([]);
    }
  }, [user]);

  return {
    savedCarts,
    isLoading,
    error,
    restoreCart,
    deleteCart,
    getSavedCartsCount,
    refetch: fetchSavedCarts
  };
};