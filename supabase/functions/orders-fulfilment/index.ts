import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateShipmentRequest {
  order_id: string;
  method: 'pickup' | 'depot' | 'door' | 'assembly';
  delivery_address?: any;
  packages?: any[];
  carrier?: string;
  notes?: string;
}

interface ShippingQuoteRequest {
  packages: any[];
  from_zone: string;
  to_zone: string;
  residential?: boolean;
  tail_lift?: boolean;
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

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orderId = segments[segments.length - 2];
    const action = segments[segments.length - 1];

    console.log('Fulfilment request:', { orderId, action, method: req.method });

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

    const hasAccess = roles?.some(r => ['admin', 'fulfilment'].includes(r.role));
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (req.method === 'GET') {
      // Get shipments for order
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          *,
          shipment_packages(*),
          exceptions(*)
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      return new Response(JSON.stringify({ shipments }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (req.method === 'POST') {
      if (action === 'quote') {
        const quoteRequest: ShippingQuoteRequest = await req.json();
        
        // Calculate shipping quote using database function
        const { data: quote, error } = await supabase.rpc('calculate_shipping_quote', {
          p_packages: quoteRequest.packages,
          p_from_zone: quoteRequest.from_zone,
          p_to_zone: quoteRequest.to_zone,
          p_residential: quoteRequest.residential || false,
          p_tail_lift: quoteRequest.tail_lift || false
        });

        if (error) throw error;

        return new Response(JSON.stringify(quote), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (action === 'shipments') {
        const shipmentRequest: CreateShipmentRequest = await req.json();
        
        // Verify order exists and is ready for fulfilment
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', shipmentRequest.order_id)
          .single();

        if (orderError || !order) {
          return new Response(
            JSON.stringify({ error: 'Order not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Create shipment
        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments')
          .insert({
            order_id: shipmentRequest.order_id,
            method: shipmentRequest.method,
            carrier: shipmentRequest.carrier,
            status: 'pending',
            notes: shipmentRequest.notes,
            delivery_address_id: shipmentRequest.delivery_address?.id,
            created_by: user.id
          })
          .select()
          .single();

        if (shipmentError) throw shipmentError;

        // Create packages if provided
        if (shipmentRequest.packages && shipmentRequest.packages.length > 0) {
          const packages = shipmentRequest.packages.map(pkg => ({
            ...pkg,
            shipment_id: shipment.id
          }));

          const { error: packagesError } = await supabase
            .from('shipment_packages')
            .insert(packages);

          if (packagesError) throw packagesError;
        }

        // Log audit event
        await supabase.rpc('log_audit_event', {
          p_actor_id: user.id,
          p_scope: 'shipment',
          p_scope_id: shipment.id,
          p_action: 'created',
          p_after_data: JSON.stringify(shipment)
        });

        // Create assembly job if shipment method is assembly
        if (shipmentRequest.method === 'assembly') {
          try {
            const { data: assemblyJob, error: assemblyError } = await supabase
              .from('assembly_jobs')
              .insert({
                order_id: shipmentRequest.order_id,
                shipment_id: shipment.id,
                components_included: 'All cabinet components',
                hours_estimated: 8, // Default estimate
                price_ex_gst: 500, // Default assembly price
                status: 'pending',
                created_by: user.id
              })
              .select()
              .single();

            if (assemblyError) {
              console.error('Failed to create assembly job:', assemblyError);
            } else {
              console.log('Assembly job created:', assemblyJob.id);
            }
          } catch (assemblyJobError) {
            console.error('Error creating assembly job:', assemblyJobError);
          }
        }

        // Send notification
        try {
          await supabase.functions.invoke('send-notifications', {
            body: {
              type: 'shipment_created',
              user_id: order.user_id,
              order_id: order.id,
              shipment_id: shipment.id
            }
          });
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          shipment,
          message: 'Shipment created successfully'
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    if (req.method === 'PUT') {
      // Update shipment status
      const updates = await req.json();
      const shipmentId = segments[segments.length - 1];

      const { data: shipment, error } = await supabase
        .from('shipments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'shipment',
        p_scope_id: shipmentId,
        p_action: 'updated',
        p_after_data: JSON.stringify(updates)
      });

      return new Response(JSON.stringify({ 
        success: true, 
        shipment,
        message: 'Shipment updated successfully'
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
    console.error('Error in fulfilment function:', error);
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