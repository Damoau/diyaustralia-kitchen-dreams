import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-cert-id, paypal-auth-algo, paypal-transmission-sig",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log('Received PayPal webhook:', {
      headers: {
        'paypal-transmission-id': headers['paypal-transmission-id'],
        'paypal-cert-id': headers['paypal-cert-id'],
        'paypal-auth-algo': headers['paypal-auth-algo']
      }
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event = JSON.parse(payload);
    const eventType = event.event_type;
    const eventId = event.id;

    console.log('Processing PayPal webhook event:', eventType, eventId);

    // Store webhook event
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'paypal',
        event_type: eventType,
        event_id: eventId,
        payload: event,
        processed: false
      });

    // Process different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(supabase, event);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await handlePaymentFailed(supabase, event);
        break;
        
      case 'CHECKOUT.ORDER.APPROVED':
        console.log('Order approved, waiting for capture');
        break;
        
      default:
        console.log('Unhandled PayPal webhook event type:', eventType);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('event_id', eventId)
      .eq('provider', 'paypal');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error processing PayPal webhook:", error);
    
    // Try to mark webhook as failed
    try {
      const event = JSON.parse(await req.text());
      await createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      )
      .from('webhook_events')
      .update({ 
        error_message: error.message,
        retry_count: 1
      })
      .eq('event_id', event.id)
      .eq('provider', 'paypal');
    } catch (auditError) {
      console.error('Failed to update webhook error:', auditError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function handlePaymentCompleted(supabase: any, event: any) {
  const resource = event.resource;
  const captureId = resource.id;
  const amount = parseFloat(resource.amount.value);
  const currency = resource.amount.currency_code;
  const customId = resource.custom_id;

  console.log('Payment completed:', { captureId, amount, currency, customId });

  // Find payment record by PayPal transaction ID
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*, payment_schedules(id, order_id)')
    .eq('external_payment_id', captureId)
    .single();

  if (paymentError || !payment) {
    console.error('Payment record not found for capture:', captureId);
    return;
  }

  // If this is a schedule payment, update the schedule
  if (payment.payment_schedule_id) {
    await supabase
      .from('payment_schedules')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.payment_schedule_id);

    // Generate invoice
    try {
      await supabase.functions.invoke('generate-invoice-pdf', {
        body: { payment_schedule_id: payment.payment_schedule_id }
      });
    } catch (invoiceError) {
      console.error('Failed to generate invoice:', invoiceError);
    }

    // Send notification
    try {
      await supabase.functions.invoke('send-notifications', {
        body: {
          event: 'payment.received',
          order_id: payment.order_id,
          variables: {
            amount: amount,
            currency: currency,
            payment_method: 'PayPal'
          }
        }
      });
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
  }

  console.log('Payment completed successfully processed');
}

async function handlePaymentFailed(supabase: any, event: any) {
  const resource = event.resource;
  const captureId = resource.id;
  const failureReason = resource.status_details?.reason || 'Unknown';

  console.log('Payment failed:', { captureId, failureReason });

  // Find and update payment record
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      payment_status: 'failed',
      payment_data: { ...resource, failure_reason: failureReason },
      updated_at: new Date().toISOString()
    })
    .eq('external_payment_id', captureId);

  if (updateError) {
    console.error('Failed to update payment record:', updateError);
  }

  // Reset payment schedule to pending if applicable
  const { data: payment } = await supabase
    .from('payments')
    .select('payment_schedule_id')
    .eq('external_payment_id', captureId)
    .single();

  if (payment?.payment_schedule_id) {
    await supabase
      .from('payment_schedules')
      .update({
        status: 'pending',
        payment_reference: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.payment_schedule_id);
  }

  console.log('Payment failure processed');
}

serve(handler);