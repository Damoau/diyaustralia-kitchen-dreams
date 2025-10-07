import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const report = await req.json();
    
    console.log('CSP Violation Report:', JSON.stringify(report, null, 2));

    // Store CSP violation in database for security monitoring
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: 'csp_violation',
        severity: 'medium',
        details: report,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });

    if (error) {
      console.error('Error logging CSP violation:', error);
    }

    // Also log to audit trail
    await supabase.rpc('log_audit_event', {
      p_scope: 'security',
      p_action: 'csp_violation',
      p_after_data: JSON.stringify({
        blocked_uri: report['csp-report']?.['blocked-uri'] || report['blocked-uri'],
        violated_directive: report['csp-report']?.['violated-directive'] || report['violated-directive'],
        document_uri: report['csp-report']?.['document-uri'] || report['document-uri'],
        timestamp: new Date().toISOString()
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in csp-report function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
