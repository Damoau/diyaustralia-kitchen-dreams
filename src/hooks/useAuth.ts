import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'customer' | 'sales_rep' | 'fulfilment';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
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
          checkUserRoles(session.user!.id).finally(() => {
            setRoleKnown(true);
            setIsLoading(false);
          });
        }, 0);
      } else {
        setIsAdmin(false);
        setUserRoles([]);
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
  }, []);

  const checkUserRoles = async (userId: string) => {
    try {
      console.log('Checking user roles for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      console.log('User roles query result:', data, 'error:', error);
      if (data && !error) {
        const roles = data.map(r => r.role as UserRole);
        setUserRoles(roles);
        setIsAdmin(roles.includes('admin'));
      } else {
        setUserRoles([]);
        setIsAdmin(false);
      }
    } catch (error) {
      console.log('Error checking user roles:', error);
      setUserRoles([]);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
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
    hasRole,
    isAuthenticated: !!user
  };
};