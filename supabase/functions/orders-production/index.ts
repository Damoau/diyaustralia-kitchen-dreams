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

interface ProductionUpdateRequest {
  stage: string;
  note?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const orderId = pathSegments[pathSegments.indexOf('orders') + 1];
    
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

    // Check if user has admin/production role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      throw roleError;
    }

    const hasProductionAccess = userRoles?.some(r => 
      ['admin', 'production', 'fulfilment'].includes(r.role)
    );

    if (req.method === 'GET') {
      // GET /api/orders/{id}/production - Anyone can view production status
      const { data: productionUpdates, error: productionError } = await supabase
        .from('production_updates')
        .select(`
          *,
          created_by_user:profiles!inner(
            id,
            first_name,
            last_name
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (productionError) {
        throw productionError;
      }

      // Get current order status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('production_status, status')
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw orderError;
      }

      return new Response(JSON.stringify({
        current_status: order.production_status,
        order_status: order.status,
        updates: productionUpdates
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // POST /api/orders/{id}/production - Only production staff
      if (!hasProductionAccess) {
        throw new Error('Access denied - production role required');
      }

      const { stage, note }: ProductionUpdateRequest = await req.json();

      if (!stage) {
        throw new Error('Stage is required');
      }

      // Validate stage values
      const validStages = [
        'awaiting_approval',
        'approved',
        'cutting',
        'assembly',
        'finishing',
        'quality_check',
        'packaging',
        'ready_for_shipping',
        'shipped',
        'delivered',
        'completed'
      ];

      if (!validStages.includes(stage)) {
        throw new Error('Invalid production stage');
      }

      // Verify order exists
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, production_status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      // Create production update
      const { data: update, error: updateError } = await supabase
        .from('production_updates')
        .insert({
          order_id: orderId,
          stage,
          status: 'in_progress',
          notes: note,
          created_by: user.id
        })
        .select(`
          *,
          created_by_user:profiles!inner(
            id,
            first_name,
            last_name
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update order production status
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ 
          production_status: stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        throw orderUpdateError;
      }

      // Update main order status for key stages
      let newOrderStatus = null;
      if (stage === 'ready_for_shipping') {
        newOrderStatus = 'ready_for_dispatch';
      } else if (stage === 'shipped') {
        newOrderStatus = 'shipped';
      } else if (stage === 'delivered') {
        newOrderStatus = 'delivered';
      } else if (stage === 'completed') {
        newOrderStatus = 'completed';
      }

      if (newOrderStatus) {
        await supabase
          .from('orders')
          .update({ status: newOrderStatus })
          .eq('id', orderId);
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'production',
        p_scope_id: orderId,
        p_action: 'status_updated',
        p_after_data: JSON.stringify({
          stage,
          previous_status: order.production_status,
          note
        })
      });

      // Send notification for status changes
      await supabase.functions.invoke('send-notifications', {
        body: {
          event: 'production.status_changed',
          data: {
            order_id: orderId,
            from: order.production_status,
            to: stage,
            note,
            updated_by: user.id,
            at: new Date().toISOString()
          }
        }
      });

      return new Response(JSON.stringify({
        update,
        message: `Production status updated to ${stage}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in orders-production:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});