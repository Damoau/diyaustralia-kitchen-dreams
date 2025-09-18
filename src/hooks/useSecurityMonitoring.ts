import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  table_name: string;
  action: string;
  actor_id?: string;
  ip_address?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface SecurityMetrics {
  totalEvents: number;
  failedLogins: number;
  suspiciousIPs: string[];
  recentEvents: SecurityEvent[];
}

export const useSecurityMonitoring = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    failedLogins: 0,
    suspiciousIPs: [],
    recentEvents: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSecurityMetrics = async () => {
    try {
      // Get recent security events
      const { data: recentEvents, error: eventsError } = await supabase
        .from('audit_logs')
        .select('*')
        .in('table_name', ['auth_failed', 'webhook_error', 'admin_access'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Error fetching security events:', eventsError);
        return;
      }

      // Calculate metrics
      const failedLogins = recentEvents?.filter(event => 
        event.table_name === 'auth_failed'
      ).length || 0;

      const ipCounts = new Map<string, number>();
      recentEvents?.forEach(event => {
        if (event.ip_address) {
          const ip = event.ip_address.toString();
          ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
        }
      });

      // IPs with more than 10 events in recent history
      const suspiciousIPs = Array.from(ipCounts.entries())
        .filter(([, count]) => count > 10)
        .map(([ip]) => ip);

      setMetrics({
        totalEvents: recentEvents?.length || 0,
        failedLogins,
        suspiciousIPs,
        recentEvents: (recentEvents || []).map(event => ({
          id: event.id,
          table_name: event.table_name,
          action: event.action,
          actor_id: event.actor_id || undefined,
          ip_address: event.ip_address?.toString() || undefined,
          created_at: event.created_at,
          metadata: event.metadata as Record<string, any> || undefined
        }))
      });

    } catch (error) {
      console.error('Error fetching security metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logSecurityEvent = async (
    tableName: string, 
    action: string, 
    metadata?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase.rpc('log_audit_event', {
        p_scope: tableName,
        p_action: action,
        p_after_data: metadata ? JSON.stringify(metadata) : null,
        p_ip_address: null, // Will be filled by the function if available
        p_user_agent: navigator?.userAgent || null
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const blockIP = async (ipAddress: string, reason: string) => {
    try {
      // Log the IP blocking event
      await logSecurityEvent('security_action', 'ip_blocked', {
        blocked_ip: ipAddress,
        reason: reason,
        blocked_by: 'admin',
        timestamp: new Date().toISOString()
      });

      console.log(`IP ${ipAddress} blocked for reason: ${reason}`);
      // In a real implementation, you would update a firewall or IP blocking service
      
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchSecurityMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    isLoading,
    refreshMetrics: fetchSecurityMetrics,
    logSecurityEvent,
    blockIP
  };
};