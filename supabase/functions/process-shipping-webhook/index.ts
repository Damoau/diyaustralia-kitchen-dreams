import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingWebhookData {
  tracking_number: string;
  status: string;
  event_description: string;
  event_date: string;
  location?: string;
  carrier: string;
  order_reference?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData: ShippingWebhookData = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Processing shipping webhook:', webhookData);

    // Find the order by tracking number or order reference
    let order_id: string | null = null;
    
    if (webhookData.order_reference) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', webhookData.order_reference)
        .single();
      
      order_id = order?.id || null;
    }

    // Create shipment event record
    const { data: shipmentEvent, error: shipmentError } = await supabase
      .from('shipment_events')
      .insert({
        order_id,
        tracking_number: webhookData.tracking_number,
        carrier: webhookData.carrier,
        status: webhookData.status,
        event_description: webhookData.event_description,
        event_date: new Date(webhookData.event_date).toISOString(),
        location: webhookData.location
      })
      .select()
      .single();

    if (shipmentError) throw shipmentError;

    // Update order shipping status if we found the order
    if (order_id) {
      await supabase
        .from('orders')
        .update({
          status: getOrderStatusFromShippingStatus(webhookData.status),
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      // Get order user for notification
      const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', order_id)
        .single();

      // Send notification if user exists
      if (order?.user_id) {
        await supabase.functions.invoke('send-notifications', {
          body: {
            type: 'shipping_update',
            user_id: order.user_id,
            order_id: order_id,
            shipment_id: shipmentEvent.id
          }
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      shipment_event_id: shipmentEvent.id,
      order_updated: !!order_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error processing shipping webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function getOrderStatusFromShippingStatus(shippingStatus: string): string {
  const statusMap: Record<string, string> = {
    'picked_up': 'shipped',
    'in_transit': 'shipped',
    'out_for_delivery': 'shipped',
    'delivered': 'delivered',
    'exception': 'shipping_issue',
    'returned': 'returned'
  };

  return statusMap[shippingStatus.toLowerCase()] || 'shipped';
}

serve(handler);