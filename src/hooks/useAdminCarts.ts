import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminCartData {
  id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  label: string;
  status: string;
  items_count: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  abandoned_at?: string;
  abandon_reason?: string;
  user_id?: string;
}

export const useAdminCarts = () => {
  const [carts, setCarts] = useState<AdminCartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCarts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('carts')
        .select(`
          id,
          name,
          status,
          total_amount,
          created_at,
          updated_at,
          abandoned_at,
          abandon_reason,
          user_id,
          cart_items (count)
        `)
        .in('status', ['active', 'saved', 'abandoned'])
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedCarts: AdminCartData[] = data?.map(cart => ({
        id: cart.id,
        customer_name: 'Customer',
        customer_email: cart.user_id || 'No email',
        customer_phone: undefined,
        label: cart.name || 'Untitled Cart',
        status: cart.status,
        items_count: cart.cart_items?.[0]?.count || 0,
        total_amount: cart.total_amount || 0,
        created_at: cart.created_at,
        updated_at: cart.updated_at,
        abandoned_at: cart.abandoned_at,
        abandon_reason: cart.abandon_reason,
        user_id: cart.user_id
      })) || [];

      setCarts(formattedCarts);
    } catch (err: any) {
      console.error('Error fetching carts:', err);
      setError(err.message);
      toast.error('Failed to load carts');
    } finally {
      setIsLoading(false);
    }
  };

  const sendFollowUpEmail = async (cartId: string, customerEmail: string, message: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-notifications', {
        body: {
          to: customerEmail,
          subject: 'Complete Your Kitchen Cabinet Quote',
          message: message,
          cart_id: cartId
        }
      });

      if (error) throw error;
      
      toast.success('Follow-up email sent successfully');
      return true;
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast.error('Failed to send follow-up email');
      return false;
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  return {
    carts,
    isLoading,
    error,
    fetchCarts,
    sendFollowUpEmail
  };
};