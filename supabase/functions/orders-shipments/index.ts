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

interface CreateShipmentRequest {
  carrier: string;
  service: string;
  pallets: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  shipping_address?: {
    name: string;
    line1: string;
    line2?: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    phone?: string;
  };
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

    // Check if user has shipping/admin role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      throw roleError;
    }

    const hasShippingAccess = userRoles?.some(r => 
      ['admin', 'fulfilment', 'shipping'].includes(r.role)
    );

    if (!hasShippingAccess) {
      throw new Error('Access denied - shipping role required');
    }

    if (req.method === 'POST') {
      const { carrier, service, pallets, dimensions, shipping_address }: CreateShipmentRequest = await req.json();

      if (!carrier || !service || !pallets || !dimensions) {
        throw new Error('carrier, service, pallets, and dimensions are required');
      }

      // Verify order exists and is ready for shipping
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          shipping_address
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      if (!['ready_for_dispatch', 'approved'].includes(order.production_status)) {
        throw new Error('Order is not ready for shipping');
      }

      // Use provided shipping address or fall back to order's shipping address
      const finalShippingAddress = shipping_address || order.shipping_address;
      
      if (!finalShippingAddress) {
        throw new Error('No shipping address available');
      }

      // Generate tracking number (in real implementation, this would come from carrier API)
      const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Create shipment record
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          order_id: orderId,
          tracking_number: trackingNumber,
          carrier: carrier.toUpperCase(),
          service_type: service,
          status: 'preparing',
          pallet_count: pallets,
          dimensions: dimensions,
          shipping_address: finalShippingAddress,
          created_by: user.id,
          estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days
        })
        .select()
        .single();

      if (shipmentError) {
        throw shipmentError;
      }

      // Update order status
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ 
          status: 'preparing_shipment',
          production_status: 'ready_for_shipping',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        throw orderUpdateError;
      }

      // In a real implementation, you would integrate with shipping carriers:
      // - Australia Post API
      // - TNT API
      // - StarTrack API
      // - Toll IPEC API
      // etc.

      // Simulate carrier integration response
      const carrierResponse = {
        label_url: `https://api.${carrier.toLowerCase()}.com/labels/${trackingNumber}.pdf`,
        tracking_url: `https://track.${carrier.toLowerCase()}.com/${trackingNumber}`,
        service_cost: calculateShippingCost(carrier, service, dimensions, pallets),
        estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Update shipment with carrier response
      const { data: updatedShipment, error: updateShipmentError } = await supabase
        .from('shipments')
        .update({
          label_url: carrierResponse.label_url,
          tracking_url: carrierResponse.tracking_url,
          shipping_cost: carrierResponse.service_cost,
          estimated_delivery: carrierResponse.estimated_delivery
        })
        .eq('id', shipment.id)
        .select()
        .single();

      if (updateShipmentError) {
        throw updateShipmentError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'shipment',
        p_scope_id: shipment.id,
        p_action: 'created',
        p_after_data: JSON.stringify({
          order_id: orderId,
          tracking_number: trackingNumber,
          carrier,
          service,
          pallets
        })
      });

      // Send notification
      await supabase.functions.invoke('send-notifications', {
        body: {
          event: 'shipment.created',
          data: {
            order_id: orderId,
            tracking_number: trackingNumber,
            carrier,
            service,
            estimated_delivery: carrierResponse.estimated_delivery,
            created_by: user.id
          }
        }
      });

      return new Response(JSON.stringify({
        shipment: updatedShipment,
        carrier_response: carrierResponse,
        message: 'Shipment created successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in orders-shipments:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to calculate shipping cost (simplified)
function calculateShippingCost(
  carrier: string, 
  service: string, 
  dimensions: any, 
  pallets: number
): number {
  // Simplified cost calculation - in real implementation, use carrier APIs
  const baseCost = 50;
  const palletCost = pallets * 25;
  const weightCost = (dimensions.weight || 100) * 0.5;
  const serviceCost = service.includes('express') ? 50 : 0;
  
  return baseCost + palletCost + weightCost + serviceCost;
}