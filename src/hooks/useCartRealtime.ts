import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCartRealtime = (identifier: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!identifier) return;

    console.log('Setting up real-time cart updates for:', identifier);

    // Subscribe to cart changes
    const cartChannel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carts',
          filter: user?.id ? `user_id=eq.${user.id}` : `session_id=eq.${identifier}`
        },
        (payload) => {
          console.log('Cart changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['cart', identifier] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items'
        },
        (payload) => {
          console.log('Cart items changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['cart', identifier] });
        }
      )
      .subscribe((status) => {
        console.log('Cart realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up cart realtime subscription');
      supabase.removeChannel(cartChannel);
    };
  }, [identifier, user?.id, queryClient]);
};