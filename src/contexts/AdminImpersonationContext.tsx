import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminImpersonationContextType {
  isImpersonating: boolean;
  impersonatedCustomerEmail: string | null;
  currentQuoteId: string | null;
  sessionToken: string | null;
  cartHasUnsavedChanges: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  startImpersonation: (customerEmail: string, quoteId: string) => Promise<boolean>;
  endImpersonation: (force?: boolean) => Promise<boolean>;
  redirectToFrontend: () => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  setCartHasUnsavedChanges: (hasChanges: boolean) => void;
}

const AdminImpersonationContext = createContext<AdminImpersonationContextType | undefined>(undefined);

export function AdminImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedCustomerEmail, setImpersonatedCustomerEmail] = useState<string | null>(null);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [cartHasUnsavedChanges, setCartHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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

  // Add beforeunload protection for unsaved changes
  useEffect(() => {
    if (!isImpersonating) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cartHasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in the customer cart. Are you sure you want to leave?';
        return 'You have unsaved changes in the customer cart. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isImpersonating, cartHasUnsavedChanges]);

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

  const endImpersonation = async (force: boolean = false): Promise<boolean> => {
    // Check for unsaved changes unless force is true
    if (!force && cartHasUnsavedChanges) {
      return false; // Let the UI handle the confirmation dialog
    }

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
      setCartHasUnsavedChanges(false);
      setSaveStatus('idle');

      toast({
        title: "Impersonation Ended",
        description: "Returned to admin mode",
      });

      return true;
    } catch (error) {
      console.error('Error ending impersonation:', error);
      return false;
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
    cartHasUnsavedChanges,
    saveStatus,
    startImpersonation,
    endImpersonation,
    redirectToFrontend,
    setSaveStatus,
    setCartHasUnsavedChanges,
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