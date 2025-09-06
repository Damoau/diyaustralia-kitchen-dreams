import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleKnown, setRoleKnown] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST (sync-only callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Start loading until role is checked
        setIsLoading(true);
        // Defer Supabase call to avoid deadlocks
        setTimeout(() => {
          checkAdminRole(session.user!.id).finally(() => {
            setRoleKnown(true);
            setIsLoading(false);
          });
        }, 0);
      } else {
        setIsAdmin(false);
        setRoleKnown(true);
        setIsLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setIsLoading(true);
        checkAdminRole(session.user.id).finally(() => {
          setRoleKnown(true);
          setIsLoading(false);
        });
      } else {
        setRoleKnown(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      console.log('Checking admin role for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      console.log('Admin role query result:', data, 'error:', error);
      setIsAdmin(!!data && !error);
    } catch (error) {
      console.log('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return {
    user,
    session,
    isLoading,
    isAdmin,
    roleKnown,
    signOut,
    isAuthenticated: !!user
  };
};