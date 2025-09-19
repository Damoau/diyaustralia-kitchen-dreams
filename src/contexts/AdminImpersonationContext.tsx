import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminImpersonationContextType {
  isImpersonating: boolean;
  impersonatedCustomerEmail: string | null;
  currentQuoteId: string | null;
  sessionToken: string | null;
  startImpersonation: (customerEmail: string, quoteId: string) => Promise<boolean>;
  endImpersonation: () => Promise<void>;
  redirectToFrontend: () => void;
}

const AdminImpersonationContext = createContext<AdminImpersonationContextType | undefined>(undefined);

export function AdminImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedCustomerEmail, setImpersonatedCustomerEmail] = useState<string | null>(null);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for existing impersonation session on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('admin_impersonation_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (new Date(session.expiresAt) > new Date()) {
          setIsImpersonating(true);
          setImpersonatedCustomerEmail(session.customerEmail);
          setCurrentQuoteId(session.quoteId);
          setSessionToken(session.token);
        } else {
          localStorage.removeItem('admin_impersonation_session');
        }
      } catch (error) {
        console.error('Error parsing impersonation session:', error);
        localStorage.removeItem('admin_impersonation_session');
      }
    }
  }, []);

  const startImpersonation = async (customerEmail: string, quoteId: string): Promise<boolean> => {
    try {
      const sessionToken = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      // Create impersonation session record
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('admin_impersonation_sessions')
        .insert({
          admin_user_id: user?.id,
          impersonated_customer_email: customerEmail,
          quote_id: quoteId,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Error creating impersonation session:', error);
        return false;
      }

      // Store session locally
      const sessionData = {
        customerEmail,
        quoteId,
        token: sessionToken,
        expiresAt: expiresAt.toISOString()
      };
      
      localStorage.setItem('admin_impersonation_session', JSON.stringify(sessionData));
      
      setIsImpersonating(true);
      setImpersonatedCustomerEmail(customerEmail);
      setCurrentQuoteId(quoteId);
      setSessionToken(sessionToken);

      toast({
        title: "Impersonation Started",
        description: `Now acting as ${customerEmail} for quote building`,
      });

      return true;
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast({
        title: "Error",
        description: "Failed to start impersonation session",
        variant: "destructive"
      });
      return false;
    }
  };

  const endImpersonation = async () => {
    try {
      if (sessionToken) {
        // Mark session as ended
        await supabase
          .from('admin_impersonation_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('session_token', sessionToken);
      }

      localStorage.removeItem('admin_impersonation_session');
      
      setIsImpersonating(false);
      setImpersonatedCustomerEmail(null);
      setCurrentQuoteId(null);
      setSessionToken(null);

      toast({
        title: "Impersonation Ended",
        description: "Returned to admin mode",
      });
    } catch (error) {
      console.error('Error ending impersonation:', error);
    }
  };

  const redirectToFrontend = () => {
    // Redirect to the main shop page where admin can start adding products
    window.location.href = '/shop';
  };

  const value: AdminImpersonationContextType = {
    isImpersonating,
    impersonatedCustomerEmail,
    currentQuoteId,
    sessionToken,
    startImpersonation,
    endImpersonation,
    redirectToFrontend,
  };

  return (
    <AdminImpersonationContext.Provider value={value}>
      {children}
    </AdminImpersonationContext.Provider>
  );
}

export function useAdminImpersonation() {
  const context = useContext(AdminImpersonationContext);
  if (context === undefined) {
    throw new Error('useAdminImpersonation must be used within an AdminImpersonationProvider');
  }
  return context;
}