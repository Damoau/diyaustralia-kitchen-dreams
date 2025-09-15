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

      // For now, just log to console since RPC function may not be available in types yet
      console.log('Audit Event:', {
        ...entry,
        ...clientInfo,
        timestamp: new Date().toISOString()
      });

      // TODO: Replace with actual database insert once types are updated
      // This is a temporary fallback until the Supabase types are regenerated
      
    } catch (error) {
      console.error('Audit logging error:', error);
      // Fallback - just log to console
      console.log('Audit Event (fallback):', entry);
    }
  };

  return { logEvent };
};