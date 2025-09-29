import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useAnalytics } from '@/hooks/useAnalytics';

export interface CheckoutData {
  id: string;
  cart_id?: string;
  user_id?: string;
  session_id?: string;
  status: 'open' | 'abandoned' | 'converted';
  customer_email?: string;
  customer_phone?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_company?: string;
  customer_abn?: string;
  how_heard?: string;
  accept_terms: boolean;
  accept_privacy: boolean;
  marketing_opt_in: boolean;
  payment_method?: string;
  payment_reference?: string;
  stripe_session_id?: string;
  stripe_customer_id?: string;
  started_at: string;
  updated_at: string;
  expires_at: string;
}

export interface IdentifyPayload {
  mode: 'guest' | 'login' | 'register';
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  abn?: string;
  how_heard?: string;
  password?: string;
  consents: {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
  };
}

export const useCheckout = () => {
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { logEvent } = useAuditLog();
  const { trackCheckoutEvent } = useAnalytics();
  
  // Rate limiting for authentication attempts
  const authRateLimit = useRateLimit('checkout_auth', {
    maxAttempts: 5,
    windowMinutes: 15,
  });

  const startCheckout = async (cartId: string) => {
    setIsLoading(true);
    try {
      // Generate session ID for anonymous users
      const sessionId = session?.access_token || `anon_${Date.now()}_${Math.random()}`;
      
      const { data, error } = await supabase
        .from('checkouts')
        .insert({
          cart_id: cartId,
          user_id: user?.id || null,
          session_id: sessionId,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setCheckout(data as CheckoutData);
      
      // 6.8 Telemetry: Track checkout started
      trackCheckoutEvent('started', { 
        checkout_id: data.id,
        cart_id: cartId,
        user_authenticated: !!user?.id 
      });

      // 6.5 Security: Audit log checkout start
      await logEvent({
        actor_id: user?.id,
        scope: 'checkout',
        scope_id: data.id,
        action: 'checkout.started',
        after_data: { cart_id: cartId, session_id: sessionId }
      });

      return data;
    } catch (error: any) {
      console.error('Error starting checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const identifyCustomer = async (checkoutId: string, payload: IdentifyPayload) => {
    setIsLoading(true);
    try {
      let authResult = null;

      // Handle authentication based on mode
      if (payload.mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password!,
        });
        if (error) throw error;
        authResult = data;
      } else if (payload.mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password!,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: payload.first_name,
              last_name: payload.last_name,
            }
          }
        });
        if (error) throw error;
        authResult = data;

        // Create profile if user was created
        if (data.user) {
          await supabase.from('profiles').upsert({
            user_id: data.user.id,
            display_name: `${payload.first_name} ${payload.last_name}`,
            email: payload.email,
            phone: payload.phone,
          });
        }
      }

      // Update checkout with customer information
      const updateData: any = {
        customer_email: payload.email,
        customer_phone: payload.phone,
        customer_first_name: payload.first_name,
        customer_last_name: payload.last_name,
        customer_company: payload.company,
        customer_abn: payload.abn,
        how_heard: payload.how_heard,
        accept_terms: payload.consents.terms,
        accept_privacy: payload.consents.privacy,
        marketing_opt_in: payload.consents.marketing,
      };

      // If authenticated, link user to checkout
      if (authResult?.user) {
        updateData.user_id = authResult.user.id;
      }

      const { data: updatedCheckout, error: updateError } = await supabase
        .from('checkouts')
        .update(updateData)
        .eq('id', checkoutId)
        .select()
        .single();

      if (updateError) throw updateError;

      setCheckout(updatedCheckout as CheckoutData);

      // Check for existing quotes if user is authenticated
      const hasQuotes = authResult?.user ? await checkUserQuotes(authResult.user.id) : false;

      return {
        checkout_id: checkoutId,
        customer_id: authResult?.user?.id,
        auth_token: authResult?.session?.access_token,
        identity: {
          email: payload.email,
          phone: payload.phone,
          name: `${payload.first_name} ${payload.last_name}`.trim(),
        },
        has_quotes: hasQuotes,
        next_step: 'shipping'
      };
    } catch (error: any) {
      console.error('Error identifying customer:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to process customer information.';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserQuotes = async (userId: string) => {
    try {
      // This would check for quotes in a quotes table (to be implemented)
      // For now, return false
      return false;
    } catch (error) {
      console.error('Error checking user quotes:', error);
      return false;
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Australian phone number validation (basic)
    const phoneRegex = /^(\+61|0)[2-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  return {
    checkout,
    isLoading,
    startCheckout,
    identifyCustomer,
    validateEmail,
    validatePhone,
  };
};