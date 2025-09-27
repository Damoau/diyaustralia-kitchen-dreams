import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Generate session ID for guest users
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

export const useCartRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const identifier = user?.id || getSessionId();
    
    // Subscribe to cart changes
    const cartSubscription = supabase
      .channel(`cart-changes-${identifier}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carts',
          filter: user?.id ? `user_id=eq.${user.id}` : `session_id=eq.${getSessionId()}`
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
      .subscribe();

    return () => {
      supabase.removeChannel(cartSubscription);
    };
  }, [user?.id, queryClient]);
};