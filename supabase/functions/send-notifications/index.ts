import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'order_status' | 'payment_reminder' | 'quote_update' | 'shipping_update';
  user_id: string;
  order_id?: string;
  quote_id?: string;
  payment_schedule_id?: string;
  shipment_id?: string;
  custom_message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, user_id, order_id, quote_id, payment_schedule_id, shipment_id, custom_message }: NotificationRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user profile and notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('user_id', user_id)
      .single();

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!profile?.email || !preferences?.email_enabled) {
      return new Response(JSON.stringify({ message: 'Email notifications disabled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if this notification type is enabled
    const notificationEnabled = checkNotificationEnabled(type, preferences);
    if (!notificationEnabled) {
      return new Response(JSON.stringify({ message: 'Notification type disabled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate email content based on type
    const emailContent = await generateEmailContent(type, {
      order_id,
      quote_id,
      payment_schedule_id,
      shipment_id,
      custom_message,
      supabase
    });

    // Send email
    const emailResponse = await resend.emails.send({
      from: "DIY Kitchen Cabinets <notifications@resend.dev>",
      to: [profile.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('Notification sent:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function checkNotificationEnabled(type: string, preferences: any): boolean {
  switch (type) {
    case 'order_status':
      return preferences.order_updates;
    case 'payment_reminder':
      return preferences.payment_reminders;
    case 'quote_update':
      return preferences.quote_updates;
    case 'shipping_update':
      return preferences.order_updates;
    default:
      return true;
  }
}

async function generateEmailContent(type: string, context: any) {
  const { supabase, order_id, quote_id, payment_schedule_id, shipment_id, custom_message } = context;

  switch (type) {
    case 'order_status':
      const { data: order } = await supabase
        .from('orders')
        .select('order_number, status, production_status')
        .eq('id', order_id)
        .single();

      return {
        subject: `Order Update - ${order?.order_number}`,
        html: `
          <h2>Order Status Update</h2>
          <p>Your order ${order?.order_number} has been updated.</p>
          <p><strong>Status:</strong> ${order?.status}</p>
          <p><strong>Production Status:</strong> ${order?.production_status}</p>
          ${custom_message ? `<p>${custom_message}</p>` : ''}
          <p>View your order details in your <a href="${Deno.env.get('SUPABASE_URL')}/portal/orders/${order_id}">customer portal</a>.</p>
        `
      };

    case 'payment_reminder':
      const { data: schedule } = await supabase
        .from('payment_schedules')
        .select('amount, due_date, schedule_type')
        .eq('id', payment_schedule_id)
        .single();

      return {
        subject: 'Payment Reminder - Kitchen Cabinet Order',
        html: `
          <h2>Payment Reminder</h2>
          <p>This is a friendly reminder that your ${schedule?.schedule_type} payment is due.</p>
          <p><strong>Amount Due:</strong> $${schedule?.amount}</p>
          <p><strong>Due Date:</strong> ${schedule?.due_date}</p>
          <p>You can make your payment through your <a href="${Deno.env.get('SUPABASE_URL')}/portal">customer portal</a>.</p>
        `
      };

    case 'quote_update':
      return {
        subject: 'Quote Update - Kitchen Cabinets',
        html: `
          <h2>Quote Update</h2>
          <p>Your kitchen cabinet quote has been updated.</p>
          ${custom_message ? `<p>${custom_message}</p>` : ''}
          <p>View your updated quote in your <a href="${Deno.env.get('SUPABASE_URL')}/portal/quotes/${quote_id}">customer portal</a>.</p>
        `
      };

    case 'shipping_update':
      const { data: shipment } = await supabase
        .from('shipment_events')
        .select('status, event_description, tracking_number')
        .eq('id', shipment_id)
        .single();

      return {
        subject: 'Shipping Update - Your Kitchen Cabinets',
        html: `
          <h2>Shipping Update</h2>
          <p>Your kitchen cabinet order has a shipping update.</p>
          <p><strong>Status:</strong> ${shipment?.status}</p>
          <p><strong>Details:</strong> ${shipment?.event_description}</p>
          ${shipment?.tracking_number ? `<p><strong>Tracking Number:</strong> ${shipment.tracking_number}</p>` : ''}
          <p>Track your order in your <a href="${Deno.env.get('SUPABASE_URL')}/portal/orders">customer portal</a>.</p>
        `
      };

    default:
      return {
        subject: 'Notification - DIY Kitchen Cabinets',
        html: `
          <h2>Notification</h2>
          <p>${custom_message || 'You have a new notification.'}</p>
        `
      };
  }
}

serve(handler);