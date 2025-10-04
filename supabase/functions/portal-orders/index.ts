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
    const orderId = pathSegments[pathSegments.length - 1];
    
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
      if (orderId && orderId !== 'orders') {
        // GET /api/portal/orders/{id} - Order detail
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
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
            payment_schedules (
              id,
              schedule_type,
              percentage,
              amount,
              due_date,
              status,
              paid_at,
              payment_reference
            ),
            customer_approvals (
              id,
              final_measurements_confirmed,
              final_measurements_confirmed_at,
              style_colour_finish_confirmed,
              style_colour_finish_confirmed_at,
              signature_required,
              signature_completed_at,
              all_approvals_completed_at,
              notes
            ),
            shipments (
              id,
              tracking_number,
              carrier,
              service_type,
              status,
              shipped_at,
              estimated_delivery,
              delivered_at
            ),
            production_updates (
              id,
              stage,
              status,
              notes,
              created_at,
              created_by
            )
          `)
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (orderError || !order) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get timeline events
        const { data: timeline, error: timelineError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('scope', 'order')
          .eq('scope_id', orderId)
          .order('created_at', { ascending: true });

        if (timelineError) {
          console.warn('Failed to fetch timeline:', timelineError);
        }

        return new Response(JSON.stringify({ 
          order,
          timeline: timeline || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // GET /api/portal/orders - Orders list
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const status = url.searchParams.get('status');
        const offset = (page - 1) * limit;

        let query = supabase
          .from('orders')
          .select(`
            *,
            payment_schedules (
              id,
              schedule_type,
              percentage,
              amount,
              due_date,
              status
            )
          `, { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data: orders, error: ordersError, count } = await query;

        if (ordersError) {
          throw ordersError;
        }

        return new Response(JSON.stringify({
          orders,
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
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-orders:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});