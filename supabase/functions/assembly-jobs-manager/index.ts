import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssemblyJobRequest {
  order_id: string;
  shipment_id?: string;
  components_included: string;
  hours_estimated?: number;
  price_ex_gst: number;
  customer_notes?: string;
  scheduled_for?: string;
  assigned_team?: string;
  status?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Assembly jobs request:', { method: req.method, url: req.url });

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check user permissions
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAccess = roles?.some(r => ['admin', 'fulfilment', 'assembly'].includes(r.role));
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (req.method === 'GET') {
      // Get all assembly jobs with order details
      const { data: jobs, error } = await supabase
        .from('assembly_jobs')
        .select(`
          *,
          orders!inner (
            order_number,
            customer_email
          ),
          shipments (
            tracking_number,
            delivery_address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ jobs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (req.method === 'POST') {
      const jobRequest: AssemblyJobRequest = await req.json();
      
      // Verify order exists
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', jobRequest.order_id)
        .single();

      if (orderError || !order) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Create assembly job
      const { data: job, error: jobError } = await supabase
        .from('assembly_jobs')
        .insert({
          order_id: jobRequest.order_id,
          shipment_id: jobRequest.shipment_id,
          components_included: jobRequest.components_included,
          hours_estimated: jobRequest.hours_estimated,
          price_ex_gst: jobRequest.price_ex_gst,
          customer_notes: jobRequest.customer_notes,
          scheduled_for: jobRequest.scheduled_for,
          assigned_team: jobRequest.assigned_team,
          status: jobRequest.status || 'pending',
          created_by: user.id
        })
        .select(`
          *,
          orders!inner (
            order_number
          )
        `)
        .single();

      if (jobError) throw jobError;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'assembly_job',
        p_scope_id: job.id,
        p_action: 'created',
        p_after_data: JSON.stringify(job)
      });

      return new Response(JSON.stringify({ 
        success: true, 
        job,
        message: 'Assembly job created successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (req.method === 'PUT') {
      // Update assembly job
      const url = new URL(req.url);
      const jobId = url.pathname.split('/').pop();
      const updates = await req.json();

      const { data: job, error } = await supabase
        .from('assembly_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select(`
          *,
          orders!inner (
            order_number
          )
        `)
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'assembly_job',
        p_scope_id: jobId,
        p_action: 'updated',
        p_after_data: JSON.stringify(updates)
      });

      return new Response(JSON.stringify({ 
        success: true, 
        job,
        message: 'Assembly job updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (req.method === 'DELETE') {
      // Delete assembly job
      const url = new URL(req.url);
      const jobId = url.pathname.split('/').pop();

      const { error } = await supabase
        .from('assembly_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'assembly_job',
        p_scope_id: jobId,
        p_action: 'deleted',
        p_after_data: JSON.stringify({ deleted_at: new Date().toISOString() })
      });

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Assembly job deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in assembly jobs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);