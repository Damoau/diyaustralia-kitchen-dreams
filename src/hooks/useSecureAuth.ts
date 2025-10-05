import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type UserRole = 'admin' | 'customer' | 'sales_rep' | 'fulfilment';

interface SecurityEvent {
  type: 'login_attempt' | 'login_failure' | 'suspicious_activity';
  details: Record<string, any>;
}

export const useSecureAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roleKnown, setRoleKnown] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Log successful login
        logSecurityEvent('login_attempt', {
          success: true,
          user_id: session.user.id,
          timestamp: new Date().toISOString()
        });

        setIsLoading(true);
        setTimeout(() => {
          checkUserRoles(session.user!.id).finally(() => {
            setRoleKnown(true);
            setIsLoading(false);
          });
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setUserRoles([]);
        setRoleKnown(true);
        setIsLoading(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setIsLoading(true);
        checkUserRoles(session.user.id).finally(() => {
          setRoleKnown(true);
          setIsLoading(false);
        });
      } else {
        setRoleKnown(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const logSecurityEvent = async (type: SecurityEvent['type'], details: SecurityEvent['details']) => {
    try {
      await supabase.rpc('log_audit_event', {
        p_scope: 'auth_security',
        p_action: type,
        p_after_data: JSON.stringify(details)
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const checkUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (data && !error) {
        const roles = data.map(r => r.role as UserRole);
        setUserRoles(roles);
        setIsAdmin(roles.includes('admin'));
      } else {
        setUserRoles([]);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
      setUserRoles([]);
      setIsAdmin(false);
    }
  };

  const secureSignIn = async (email: string, password: string) => {
    // Input validation
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Email and password are required"
      });
      return { error: { message: "Email and password are required" } };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address"
      });
      return { error: { message: "Invalid email format" } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Log failed attempt (server-side rate limiting via Supabase Auth)
        logSecurityEvent('login_failure', {
          email,
          timestamp: new Date().toISOString()
        });

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials. Please try again."
        });
        
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: "Authentication service unavailable" } };
    }
  };

  const secureSignUp = async (email: string, password: string) => {
    // Input validation
    if (!email || !password) {
      return { error: { message: "Email and password are required" } };
    }

    // Password strength validation
    if (password.length < 8) {
      return { error: { message: "Password must be at least 8 characters long" } };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: { message: "Invalid email format" } };
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (data && !error) {
        // Log successful signup
        logSecurityEvent('login_attempt', {
          action: 'signup',
          success: true,
          email,
          timestamp: new Date().toISOString()
        });
      }

      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: { message: "Registration service unavailable" } };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    
    // Log sign out
    if (user) {
      logSecurityEvent('login_attempt', {
        action: 'logout',
        user_id: user.id,
        timestamp: new Date().toISOString()
      });
    }
    
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserRoles([]);
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.includes(role);
  };

  return {
    user,
    session,
    isLoading,
    isAdmin,
    userRoles,
    roleKnown,
    signOut,
    secureSignIn,
    secureSignUp,
    hasRole,
    isAuthenticated: !!user
  };
};