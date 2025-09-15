import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  actor_id?: string;
  scope: string;
  scope_id?: string;
  action: string;
  before_data?: any;
  after_data?: any;
  ip_address?: string;
  user_agent?: string;
}

export const useAuditLog = () => {
  const logEvent = async (entry: AuditLogEntry) => {
    try {
      // Get client IP and user agent if available
      const clientInfo = {
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || navigator?.userAgent || null,
      };

      // Use RPC function to insert audit log to bypass type issues
      const { error } = await supabase.rpc('log_audit_event', {
        p_actor_id: entry.actor_id || null,
        p_scope: entry.scope,
        p_scope_id: entry.scope_id || null,
        p_action: entry.action,
        p_before_data: entry.before_data ? JSON.stringify(entry.before_data) : null,
        p_after_data: entry.after_data ? JSON.stringify(entry.after_data) : null,
        p_ip_address: clientInfo.ip_address,
        p_user_agent: clientInfo.user_agent
      });

      if (error) {
        console.error('Failed to log audit event:', error);
        // Fallback - just log to console in development
        console.log('Audit Event:', entry);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Fallback - just log to console
      console.log('Audit Event (fallback):', entry);
    }
  };

  return { logEvent };
};