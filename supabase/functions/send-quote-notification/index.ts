import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  quote_id: string;
  customer_email: string;
  customer_name: string;
  quote_number?: string;
  total_amount?: number;
  notification_type?: 'created' | 'updated' | 'reminder';
  custom_subject?: string;
  custom_content?: string;
  template_id?: string;
  attachments?: Array<{ id: string; name: string; url: string }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      quote_id, 
      customer_email, 
      customer_name, 
      quote_number, 
      total_amount,
      notification_type = 'created',
      custom_subject,
      custom_content,
      template_id,
      attachments = []
    }: NotificationRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get quote details if not provided
    let quoteData = { quote_number, total_amount };
    if (!quote_number || !total_amount) {
      const { data: quote, error } = await supabase
        .from('quotes')
        .select('quote_number, total_amount, valid_until')
        .eq('id', quote_id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch quote: ${error.message}`);
      }

      quoteData = quote;
    }

    // Check if user exists by trying to list users with email filter
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users.users?.find(user => user.email === customer_email);
    let isNewUser = false;
    let temporaryPassword = '';

    if (!existingUser) {
      isNewUser = true;
      temporaryPassword = generateTemporaryPassword();
      
      // Create user account
      const { error: createError } = await supabase.auth.admin.createUser({
        email: customer_email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: customer_name }
      });

      if (createError && !createError.message.includes('already been registered')) {
        console.error('Failed to create user:', createError);
        // Continue without user creation - they can still view the quote
        isNewUser = false;
      }
    }

    // Generate email content
    const { subject, html } = custom_subject && custom_content 
      ? { subject: custom_subject, html: custom_content }
      : generateEmailContent(
          notification_type,
          customer_name,
          quoteData.quote_number,
          quoteData.total_amount,
          isNewUser,
          temporaryPassword,
          quote_id
        );

    // Removed testing mode restriction - emails can now be sent to any customer

    // Prepare email attachments
    const emailAttachments = attachments?.length > 0 
      ? await Promise.all(attachments.map(async (att) => {
          try {
            const response = await fetch(att.url);
            const buffer = await response.arrayBuffer();
            return {
              filename: att.name,
              content: new Uint8Array(buffer)
            };
          } catch (error) {
            console.error('Failed to fetch attachment:', error);
            return null;
          }
        })).then(results => results.filter(Boolean))
      : [];

    // Send email using Resend (in testing mode, send to verified email)
    const testRecipient = 'damianorwin@gmail.com'; // Testing mode recipient
    const { error: emailError } = await resend.emails.send({
      from: 'DIY Kitchens <onboarding@resend.dev>',
      to: [testRecipient],
      subject: `[TEST] ${subject} (Originally for: ${customer_email})`,
      html: html.replace(customer_email, testRecipient), // Update email content for testing
      ...(emailAttachments.length > 0 && { attachments: emailAttachments })
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Log notification
    await supabase
      .from('quote_notifications')
      .insert({
        quote_id,
        notification_type,
        sent_to: customer_email,
        status: 'sent',
        template_used: template_id || `quote_${notification_type}`,
        metadata: {
          quote_number: quoteData.quote_number,
          total_amount: quoteData.total_amount,
          is_new_user: isNewUser,
          custom_template: !!custom_subject,
          attachments_count: attachments?.length || 0
        }
      });

    // Update quote status if it was just created
    if (notification_type === 'created') {
      await supabase
        .from('quotes')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', quote_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Quote notification sent successfully',
      is_new_user: isNewUser 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-quote-notification:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateEmailContent(
  type: string, 
  customerName: string, 
  quoteNumber: string, 
  totalAmount: number,
  isNewUser: boolean,
  temporaryPassword: string,
  quoteId: string
) {
  // Use the correct Lovable project URL
  const portalUrl = `https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com/portal/quotes/${quoteId}`;
  
  let subject = '';
  let html = '';

  switch (type) {
    case 'created':
      subject = `Your Kitchen Quote ${quoteNumber} - ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(totalAmount)}`;
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Your Kitchen Quote</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Your Kitchen Quote is Ready!</h1>
                <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Quote ${quoteNumber}</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <p style="margin: 0 0 20px; font-size: 16px;">Hi ${customerName},</p>
                
                <p style="margin: 0 0 20px; font-size: 16px;">Thank you for your interest in our kitchen cabinets! We've prepared a custom quote for you:</p>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #667eea;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: 600; color: #667eea;">Quote Number:</span>
                    <span style="font-weight: 600;">${quoteNumber}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #667eea;">Total Amount:</span>
                    <span style="font-size: 18px; font-weight: 700; color: #2d3748;">${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(totalAmount)}</span>
                  </div>
                </div>

                ${isNewUser ? `
                  <div style="background: #e6fffa; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #81e6d9;">
                    <h3 style="margin: 0 0 15px; color: #234e52; font-size: 16px;">🔐 Your Customer Portal Access</h3>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #234e52;">We've created a secure portal account for you to view and manage your quotes.</p>
                    <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
                      <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> ${customer_email}</p>
                      <p style="margin: 5px 0 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #f7fafc; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${temporaryPassword}</code></p>
                    </div>
                    <p style="margin: 10px 0 0; font-size: 12px; color: #2d3748; font-style: italic;">Please change your password after your first login.</p>
                  </div>
                ` : ''}

                <div style="text-align: center; margin: 35px 0;">
                  <a href="${portalUrl}" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Your Quote</a>
                </div>

                <div style="background: #fffbeb; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #f59e0b;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>What's Next?</strong></p>
                  <ul style="margin: 10px 0 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                    <li>Review your quote details and specifications</li>
                    <li>Request changes if needed</li>
                    <li>Accept your quote and proceed with your order</li>
                  </ul>
                </div>

                <p style="margin: 30px 0 0; font-size: 14px; color: #64748b;">If you have any questions about your quote, please don't hesitate to contact us.</p>
                
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">Best regards,<br><strong>Sydney Trade Machines Team</strong></p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      break;

    case 'updated':
      subject = `Quote ${quoteNumber} has been updated`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Quote Updated</h2>
          <p>Hi ${customerName},</p>
          <p>Your quote ${quoteNumber} has been updated with new information.</p>
          <p><strong>Total Amount:</strong> ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(totalAmount)}</p>
          <a href="${portalUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Updated Quote</a>
        </div>
      `;
      break;

    default:
      subject = `Quote ${quoteNumber} - Sydney Trade Machines`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Quote Notification</h2>
          <p>Hi ${customerName},</p>
          <p>You have a notification regarding quote ${quoteNumber}.</p>
          <a href="${portalUrl}">View Quote</a>
        </div>
      `;
  }

  return { subject, html };
}

serve(handler);