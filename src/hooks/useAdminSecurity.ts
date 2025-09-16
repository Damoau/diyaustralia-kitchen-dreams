import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';

interface AdminSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  last_active_at?: string | null;
  two_fa_verified?: boolean;
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_ip' | 'multiple_sessions' | 'session_expired';
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
  resolved: boolean;
}

export const useAdminSecurity = () => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { logEvent } = useAuditLog();

  useEffect(() => {
    if (user) {
      loadSecurityData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load admin sessions
      const { data: sessionsData } = await supabase
        .from('admin_sessions')
        .select('*')
        .order('last_active_at', { ascending: false });

      if (sessionsData) {
        setSessions(sessionsData as AdminSession[]);
      }

      // TODO: Load security alerts from a dedicated table
      // For now, generate mock alerts based on sessions
      const mockAlerts: SecurityAlert[] = [];
      setAlerts(mockAlerts);

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to admin sessions changes
    const sessionsSubscription = supabase
      .channel('admin_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_sessions'
      }, () => {
        loadSecurityData();
      })
      .subscribe();

    return () => {
      sessionsSubscription.unsubscribe();
    };
  };

  const createAdminSession = async () => {
    if (!user) return null;

    try {
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      const { data, error } = await supabase
        .from('admin_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          two_fa_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      // Log the session creation
      await logEvent({
        actor_id: user.id,
        scope: 'admin_session',
        scope_id: data.id,
        action: 'session_created',
        after_data: { session_id: data.id, expires_at: expiresAt }
      });

      return data;
    } catch (error) {
      console.error('Error creating admin session:', error);
      return null;
    }
  };

  const updateSessionActivity = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('admin_sessions')
        .update({ 
          last_active_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('admin_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // Log the session revocation
      await logEvent({
        actor_id: user?.id,
        scope: 'admin_session',
        scope_id: sessionId,
        action: 'session_revoked',
        after_data: { revoked_at: new Date().toISOString() }
      });

      loadSecurityData();
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const revokeAllSessions = async (excludeCurrentSession?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('admin_sessions')
        .delete()
        .eq('user_id', user.id);

      if (excludeCurrentSession) {
        query = query.neq('id', excludeCurrentSession);
      }

      const { error } = await query;
      if (error) throw error;

      // Log the bulk revocation
      await logEvent({
        actor_id: user.id,
        scope: 'admin_session',
        action: 'all_sessions_revoked',
        after_data: { 
          revoked_at: new Date().toISOString(),
          excluded_session: excludeCurrentSession 
        }
      });

      loadSecurityData();
    } catch (error) {
      console.error('Error revoking all sessions:', error);
    }
  };

  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not fetch client IP:', error);
      return null;
    }
  };

  const checkSuspiciousActivity = async () => {
    // This would typically run on the backend, but for demo purposes:
    const newAlerts: SecurityAlert[] = [];

    // Check for multiple active sessions
    const activeSessions = sessions.filter(s => new Date(s.expires_at) > new Date());
    if (activeSessions.length > 3) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'multiple_sessions',
        message: `User has ${activeSessions.length} active sessions`,
        severity: 'medium',
        created_at: new Date().toISOString(),
        resolved: false
      });
    }

    // Check for sessions from different IPs
    const uniqueIPs = new Set(sessions.map(s => s.ip_address).filter(Boolean));
    if (uniqueIPs.size > 2) {
      newAlerts.push({
        id: crypto.randomUUID(),
        type: 'suspicious_ip',
        message: `Sessions detected from ${uniqueIPs.size} different IP addresses`,
        severity: 'high',
        created_at: new Date().toISOString(),
        resolved: false
      });
    }

    setAlerts(prev => [...prev, ...newAlerts]);
  };

  return {
    sessions,
    alerts,
    loading,
    createAdminSession,
    updateSessionActivity,
    revokeSession,
    revokeAllSessions,
    checkSuspiciousActivity,
    refreshData: loadSecurityData
  };
};