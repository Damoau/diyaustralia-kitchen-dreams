import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetentionRule {
  table: string;
  retention_days: number;
  date_column: string;
  conditions?: string;
  cascade_deletes?: string[];
}

const RETENTION_RULES: RetentionRule[] = [
  // Audit logs - Keep for 7 years for compliance
  {
    table: 'audit_logs',
    retention_days: 2555, // 7 years
    date_column: 'created_at'
  },
  
  // Session data - Keep for 90 days
  {
    table: 'admin_sessions',
    retention_days: 90,
    date_column: 'expires_at',
    conditions: `status = 'expired'`
  },
  
  // Cart data - Keep for 30 days after abandonment
  {
    table: 'carts',
    retention_days: 30,
    date_column: 'updated_at',
    conditions: `status = 'abandoned'`,
    cascade_deletes: ['cart_items']
  },
  
  // Temporary files - Keep for 7 days
  {
    table: 'files',
    retention_days: 7,
    date_column: 'created_at',
    conditions: `scope = 'temp'`
  },
  
  // Email logs - Keep for 1 year
  {
    table: 'notification_logs',
    retention_days: 365,
    date_column: 'sent_at',
    conditions: `status = 'delivered'`
  },
  
  // Order history snapshots - Keep for 7 years
  {
    table: 'order_history',
    retention_days: 2555,
    date_column: 'created_at'
  },
  
  // Payment logs - Keep for 7 years for tax compliance
  {
    table: 'payment_logs',
    retention_days: 2555,
    date_column: 'created_at'
  },
  
  // Analytics data - Keep for 2 years
  {
    table: 'analytics_events',
    retention_days: 730,
    date_column: 'timestamp'
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];
    let totalDeleted = 0;

    console.log(`Starting data retention job at ${new Date().toISOString()}`);

    for (const rule of RETENTION_RULES) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - rule.retention_days);
        
        console.log(`Processing ${rule.table}: Deleting records older than ${cutoffDate.toISOString()}`);

        // Build delete query
        let query = `DELETE FROM ${rule.table} WHERE ${rule.date_column} < '${cutoffDate.toISOString()}'`;
        
        if (rule.conditions) {
          query += ` AND ${rule.conditions}`;
        }

        // Handle cascade deletes first
        if (rule.cascade_deletes) {
          for (const cascadeTable of rule.cascade_deletes) {
            const cascadeQuery = `
              DELETE FROM ${cascadeTable} 
              WHERE ${rule.table.slice(0, -1)}_id IN (
                SELECT id FROM ${rule.table} 
                WHERE ${rule.date_column} < '${cutoffDate.toISOString()}'
                ${rule.conditions ? `AND ${rule.conditions}` : ''}
              )
            `;
            
            const { error: cascadeError } = await supabaseClient.rpc('exec_sql', {
              sql: cascadeQuery
            });

            if (cascadeError) {
              console.error(`Error deleting from ${cascadeTable}:`, cascadeError);
            }
          }
        }

        // Execute main delete
        const { data, error } = await supabaseClient.rpc('exec_sql', {
          sql: query + ' RETURNING id'
        });

        if (error) {
          console.error(`Error deleting from ${rule.table}:`, error);
          results.push({
            table: rule.table,
            status: 'error',
            error: error.message,
            deleted_count: 0
          });
          continue;
        }

        const deletedCount = Array.isArray(data) ? data.length : 0;
        totalDeleted += deletedCount;

        console.log(`Deleted ${deletedCount} records from ${rule.table}`);

        results.push({
          table: rule.table,
          status: 'success',
          deleted_count: deletedCount,
          cutoff_date: cutoffDate.toISOString(),
          retention_days: rule.retention_days
        });

        // Log the retention action
        await supabaseClient.rpc('log_audit_event', {
          p_scope: 'data_retention',
          p_action: 'automated_purge',
          p_after_data: JSON.stringify({
            table: rule.table,
            deleted_count: deletedCount,
            cutoff_date: cutoffDate.toISOString()
          })
        });

      } catch (tableError) {
        console.error(`Error processing ${rule.table}:`, tableError);
        results.push({
          table: rule.table,
          status: 'error',
          error: tableError instanceof Error ? tableError.message : String(tableError),
          deleted_count: 0
        });
      }
    }

    // Generate summary report
    const summary = {
      job_id: `retention_${Date.now()}`,
      execution_time: new Date().toISOString(),
      total_tables_processed: RETENTION_RULES.length,
      total_records_deleted: totalDeleted,
      rules_applied: results,
      next_run: getNextRunTime()
    };

    console.log('Data retention job completed:', summary);

    // Store execution log
    await supabaseClient.from('retention_job_logs').insert({
      job_id: summary.job_id,
      execution_time: summary.execution_time,
      total_deleted: totalDeleted,
      results: summary,
      status: 'completed'
    });

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Data retention job failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Data retention job failed', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function getNextRunTime(): string {
  const next = new Date();
  next.setDate(next.getDate() + 1); // Daily execution
  next.setHours(2, 0, 0, 0); // 2 AM AEDT
  return next.toISOString();
}

// Utility function to validate retention rules
export function validateRetentionRules(rules: RetentionRule[]): string[] {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.table || !rule.date_column || !rule.retention_days) {
      errors.push(`Invalid rule for table ${rule.table}: missing required fields`);
    }
    
    if (rule.retention_days < 1) {
      errors.push(`Invalid retention period for ${rule.table}: must be at least 1 day`);
    }
  }
  
  return errors;
}
