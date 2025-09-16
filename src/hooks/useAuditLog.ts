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
      const { error } = await supabase.rpc('log_audit_event', {
        p_actor_id: entry.actor_id || null,
        p_scope: entry.scope,
        p_scope_id: entry.scope_id || null,
        p_action: entry.action,
        p_before_data: entry.before_data ? JSON.stringify(entry.before_data) : null,
        p_after_data: entry.after_data ? JSON.stringify(entry.after_data) : null,
        p_ip_address: entry.ip_address,
        p_user_agent: entry.user_agent || navigator?.userAgent
      });

      if (error) console.error('Audit logging error:', error);
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  };

  const getAuditLogs = async (filters: any = {}) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50);
      
      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  };

  return { logEvent, getAuditLogs };
};