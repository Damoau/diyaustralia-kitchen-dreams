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
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  // Rate limiting configuration
  const MAX_LOGIN_ATTEMPTS = 5;
  const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    // Check for existing blocks
    const blockData = localStorage.getItem('auth_block');
    if (blockData) {
      const { until, attempts } = JSON.parse(blockData);
      if (Date.now() < until) {
        setIsBlocked(true);
        setLoginAttempts(attempts);
        const remainingTime = Math.ceil((until - Date.now()) / 1000 / 60);
        toast({
          variant: "destructive",
          title: "Account Temporarily Locked",
          description: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        });
      } else {
        localStorage.removeItem('auth_block');
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Reset login attempts on successful login
        localStorage.removeItem('auth_block');
        localStorage.removeItem('login_attempts');
        setLoginAttempts(0);
        setIsBlocked(false);
        
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
    if (isBlocked) {
      toast({
        variant: "destructive",
        title: "Account Locked",
        description: "Too many failed attempts. Please wait before trying again.",
      });
      return { error: { message: "Account temporarily locked" } };
    }

    // Input validation
    if (!email || !password) {
      return { error: { message: "Email and password are required" } };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: { message: "Invalid email format" } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Handle failed login attempt
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        localStorage.setItem('login_attempts', newAttempts.toString());
        
        // Log failed attempt
        logSecurityEvent('login_failure', {
          email,
          attempts: newAttempts,
          timestamp: new Date().toISOString()
        });

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const blockUntil = Date.now() + BLOCK_DURATION_MS;
          localStorage.setItem('auth_block', JSON.stringify({
            until: blockUntil,
            attempts: newAttempts
          }));
          setIsBlocked(true);
          
          toast({
            variant: "destructive",
            title: "Account Locked",
            description: `Too many failed attempts. Account locked for 15 minutes.`,
          });

          // Log account lock
          logSecurityEvent('suspicious_activity', {
            action: 'account_locked',
            email,
            attempts: newAttempts,
            timestamp: new Date().toISOString()
          });
        }
        
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
    localStorage.removeItem('login_attempts');
    localStorage.removeItem('auth_block');
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
    loginAttempts,
    isBlocked,
    signOut,
    secureSignIn,
    secureSignUp,
    hasRole,
    isAuthenticated: !!user
  };
};