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

interface NotificationRequest {
  message_id: string;
  quote_id: string;
  message_type: 'change_request' | 'admin_reply';
  recipient_email?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: NotificationRequest = await req.json();
    const { message_id, quote_id, message_type, recipient_email } = body;

    if (!message_id || !quote_id || !message_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, quote_number, customer_email, customer_name, total_amount')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      return new Response(JSON.stringify({ error: 'Quote not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get message details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('message_text, created_at, user_id')
      .eq('id', message_id)
      .single();

    if (messageError || !message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine notification details based on message type
    let subject: string;
    let htmlContent: string;
    let recipientEmail: string;

    if (message_type === 'change_request') {
      // Customer sent a change request - notify admin
      subject = `Quote Change Request - ${quote.quote_number}`;
      recipientEmail = 'admin@yourcompany.com'; // Configure as needed
      htmlContent = `
        <h2>Quote Change Request</h2>
        <p>A customer has requested changes to quote <strong>${quote.quote_number}</strong>.</p>
        
        <h3>Customer Details:</h3>
        <ul>
          <li>Name: ${quote.customer_name || 'Not provided'}</li>
          <li>Email: ${quote.customer_email}</li>
          <li>Quote Total: $${quote.total_amount?.toLocaleString() || '0.00'}</li>
        </ul>
        
        <h3>Change Request:</h3>
        <p>${message.message_text}</p>
        
        <p><a href="${Deno.env.get('SITE_URL')}/admin/sales/quotes">View in Admin Panel</a></p>
      `;
    } else {
      // Admin sent a reply - notify customer
      subject = `Update on Your Quote - ${quote.quote_number}`;
      recipientEmail = quote.customer_email;
      htmlContent = `
        <h2>Quote Update</h2>
        <p>Hi ${quote.customer_name || 'there'},</p>
        
        <p>We've sent you an update regarding your quote <strong>${quote.quote_number}</strong>.</p>
        
        <h3>Message from our team:</h3>
        <p>${message.message_text}</p>
        
        <p><a href="${Deno.env.get('SITE_URL')}/portal/quotes/${quote_id}">View Quote Details</a></p>
        
        <hr>
        <p><small>If you have questions, please reply to this email or contact us directly.</small></p>
      `;
    }

    // Send email notification using existing notification system
    const { error: notificationError } = await supabase.functions.invoke('send-notifications', {
      body: {
        type: 'email',
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
        metadata: {
          quote_id: quote_id,
          message_id: message_id,
          message_type: message_type
        }
      }
    });

    if (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the entire request if notification fails
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_scope: 'message_notification',
      p_scope_id: message_id,
      p_action: 'notification_sent',
      p_after_data: JSON.stringify({
        quote_id,
        message_type,
        recipient: recipientEmail,
        timestamp: new Date().toISOString()
      })
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Notification sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending message notification:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});