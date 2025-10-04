import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
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
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const quoteId = pathSegments[pathSegments.length - 1];
    
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    if (req.method === 'GET') {
      // GET /api/portal/quotes/{id}
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            cabinet_type_id,
            quantity,
            unit_price,
            total_price,
            width_mm,
            height_mm,
            depth_mm,
            configuration,
            cabinet_types (name, category),
            door_styles (name),
            colors (name, hex_code),
            finishes (name)
          ),
          files (
            id,
            filename,
            storage_url,
            mime_type,
            file_size,
            created_at
          ),
          quote_versions (
            id,
            version_number,
            changes_requested,
            created_at,
            created_by,
            status
          ),
          payment_schedules (
            id,
            schedule_type,
            percentage,
            amount,
            due_date,
            status
          )
        `)
        .eq('id', quoteId)
        .eq('user_id', user.id)
        .single();

      if (quoteError) {
        throw quoteError;
      }

      if (!quote) {
        return new Response(JSON.stringify({ error: 'Quote not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ quote }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-quote-detail:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});