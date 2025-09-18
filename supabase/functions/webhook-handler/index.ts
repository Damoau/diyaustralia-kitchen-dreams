import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 30, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const key = ip;
  const windowData = rateLimitStore.get(key);
  
  if (!windowData || windowData.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (windowData.count >= limit) {
    return false;
  }
  
  windowData.count++;
  return true;
}

function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  try {
    // In production, implement proper HMAC-SHA256 signature verification
    // For now, basic validation that signature exists and has reasonable length
    return signature.length > 10;
  } catch (error) {
    console.error('Signature validation failed:', error);
    return false;
  }
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Webhook event schemas
interface QuoteAcceptedEvent {
  event: 'quote.accepted';
  data: {
    quote_id: string;
    order_id: string;
    user_id: string;
    total: number;
    deposit_amount: number;
  };
}

interface OrderStatusChangedEvent {
  event: 'order.status_changed';
  data: {
    order_id: string;
    from: string;
    to: string;
    at: string;
  };
}

interface ShipmentUpdatedEvent {
  event: 'shipment.updated';
  data: {
    order_id: string;
    tracking: string;
    status: string;
    event: string;
    at: string;
  };
}

type WebhookEvent = QuoteAcceptedEvent | OrderStatusChangedEvent | ShipmentUpdatedEvent;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const event: WebhookEvent = await req.json();

      console.log('Processing webhook event:', event.event, event.data);

      switch (event.event) {
        case 'quote.accepted':
          await handleQuoteAccepted(event.data);
          break;
        case 'order.status_changed':
          await handleOrderStatusChanged(event.data);
          break;
        case 'shipment.updated':
          await handleShipmentUpdated(event.data);
          break;
        default:
          console.warn('Unknown webhook event:', event.event);
      }

      // Log webhook processing
      await supabase.rpc('log_audit_event', {
        p_scope: 'webhook',
        p_action: 'processed',
        p_after_data: JSON.stringify({ event: event.event, timestamp: new Date().toISOString() })
      });

      return new Response(JSON.stringify({ 
        success: true,
        event: event.event,
        processed_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleQuoteAccepted(data: QuoteAcceptedEvent['data']) {
  // Send confirmation email to customer
  // Update internal systems
  // Trigger order fulfillment workflow
  
  console.log(`Quote ${data.quote_id} accepted, order ${data.order_id} created for $${data.total}`);
  
  // Example: Send to external systems
  // await notifyERP(data);
  // await updateCRM(data);
}

async function handleOrderStatusChanged(data: OrderStatusChangedEvent['data']) {
  // Notify customer of status change
  // Update tracking systems
  // Trigger next workflow step
  
  console.log(`Order ${data.order_id} status changed from ${data.from} to ${data.to}`);
  
  // Example: Customer notification
  // await sendCustomerStatusUpdate(data);
}

async function handleShipmentUpdated(data: ShipmentUpdatedEvent['data']) {
  // Update order with shipping info
  // Notify customer of tracking updates
  
  console.log(`Shipment for order ${data.order_id}: ${data.event} - ${data.status}`);
  
  // Example: Update order status based on shipping events
  // await updateOrderFromShipment(data);
}