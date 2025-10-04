import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface QuoteListParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests for this endpoint
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limiting
    const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
      p_identifier: user.id,
      p_action: 'portal_quotes_view',
      p_max_attempts: 100,
      p_window_minutes: 15
    });

    if (!rateLimitCheck) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Input validation and sanitization
      const page = Math.max(1, Math.min(100, parseInt(url.searchParams.get('page') || '1')));
      const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '10')));
      const offset = (page - 1) * limit;
      
      // Sanitize search parameter
      const searchParam = url.searchParams.get('search');
      const search = searchParam ? searchParam.replace(/[^\w\s-]/g, '').substring(0, 100) : null;
      
      // Validate status parameter
      const statusParam = url.searchParams.get('status');
      const validStatuses = ['draft', 'sent', 'accepted', 'expired', 'cancelled'];
      const status = statusParam && validStatuses.includes(statusParam) ? statusParam : null;

      let query = supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            cabinet_type_id,
            quantity,
            unit_price,
            total_price,
            cabinet_types (name, category)
          ),
          files (
            id,
            filename,
            storage_url,
            mime_type
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`quote_number.ilike.%${search}%,notes.ilike.%${search}%`);
      }

      const { data: quotes, error: quotesError, count } = await query;

      if (quotesError) {
        throw quotesError;
      }

      return new Response(JSON.stringify({
        quotes,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-quotes:', error);
    
    // Log security event for suspicious activity
    try {
      await supabase.rpc('log_audit_event', {
        p_scope: 'portal_error',
        p_action: 'quotes_access_failed',
        p_after_data: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    // Return generic error message to prevent information disclosure
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});