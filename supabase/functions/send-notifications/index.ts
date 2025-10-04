import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  event: string;
  user_id?: string;
  order_id?: string;
  quote_id?: string;
  variables?: Record<string, any>;
  custom_message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, user_id, order_id, quote_id, variables, custom_message }: NotificationRequest = await req.json();

    console.log('Sending notification:', { event, user_id, order_id, quote_id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user and notification preferences
    let targetUserId = user_id;
    let userEmail = '';
    
    if (order_id && !user_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, billing_address')
        .eq('id', order_id)
        .single();
      
      targetUserId = order?.user_id;
      userEmail = order?.billing_address?.email;
    }

    // Check feature flags
    const { data: emailFlag } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('flag_key', 'notify.email')
      .single();

    if (!emailFlag?.is_enabled) {
      console.log('Email notifications disabled globally');
      return new Response(JSON.stringify({ success: false, reason: 'feature_disabled' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!userEmail) {
      console.log('No email found for notification');
      return new Response(JSON.stringify({ success: false, reason: 'no_email' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate email content
    const emailContent = await generateEmailContent(supabase, event, {
      order_id,
      quote_id,
      variables,
      custom_message
    });

    if (!emailContent) {
      throw new Error('Failed to generate email content');
    }

    // Skip email functionality for now
    console.log('Notifications system would send emails here');

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: null // emailResult would be available if actually sending emails 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function generateEmailContent(supabase: any, event: string, data: any) {
  const { order_id, quote_id, variables = {}, custom_message } = data;

  // Fetch related data based on event
  let contextData: any = {};
  
  if (order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, cabinet_types(name)),
        payment_schedules(*)
      `)
      .eq('id', order_id)
      .single();
    contextData.order = order;
  }

  if (quote_id) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('*, quote_items(*)')
      .eq('id', quote_id)
      .single();
    contextData.quote = quote;
  }

  // Generate email based on event type
  switch (event) {
    case 'payment.received':
      return {
        subject: `Payment Received - Order #${contextData.order?.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Received</h2>
            <p>Thank you! We've received your payment for Order #${contextData.order?.order_number}.</p>
            
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> $${variables.amount} ${variables.currency}</p>
              <p><strong>Method:</strong> ${variables.payment_method}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>Your order is now being processed. We'll keep you updated on the progress.</p>
          </div>
        `
      };

    case 'order.status_changed':
      return {
        subject: `Order Update - #${contextData.order?.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Status Update</h2>
            <p>Your order #${contextData.order?.order_number} status has been updated.</p>
            
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
              <h3>Current Status: ${variables.new_status}</h3>
              <p>${variables.status_message || 'Your order is progressing as scheduled.'}</p>
            </div>
          </div>
        `
      };

    default:
      return {
        subject: custom_message?.subject || 'Notification',
        html: custom_message?.html || '<p>You have a new notification.</p>'
      };
  }
}

serve(handler);