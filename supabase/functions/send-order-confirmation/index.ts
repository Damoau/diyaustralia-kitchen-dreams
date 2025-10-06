import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId } = await req.json();

    console.log('Sending order confirmation for:', orderId);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          cabinet_types (name),
          door_styles (name),
          colors (name)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Build email HTML
    const itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${item.cabinet_types?.name || 'Cabinet'}<br>
          <small style="color: #6b7280;">
            ${item.door_styles?.name || ''} ${item.colors?.name || ''}<br>
            ${item.width_mm}W × ${item.height_mm}H × ${item.depth_mm}D mm
          </small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.total_price.toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
    <h1 style="color: #1e40af; margin: 0 0 10px 0;">Order Confirmed!</h1>
    <p style="font-size: 18px; margin: 0; color: #6b7280;">Thank you for your order</p>
  </div>

  <div style="background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; font-size: 16px; color: #6b7280;">Order Details</h2>
    <p style="font-size: 24px; font-weight: bold; margin: 0; color: #1e40af;">${order.order_number}</p>
    <p style="color: #6b7280; margin: 10px 0 0 0;">Placed on ${new Date(order.created_at).toLocaleDateString()}</p>
  </div>

  <div style="background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px;">Order Items</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
          <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Subtotal:</td>
          <td style="padding: 12px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">GST (10%):</td>
          <td style="padding: 12px; text-align: right;">$${order.gst_amount.toFixed(2)}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">$${order.total_amount.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="margin: 0 0 10px 0; color: #1e40af;">What happens next?</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li>Our team will review your order within 1 business day</li>
      <li>We'll contact you to confirm delivery details</li>
      <li>Manufacturing will begin after final approval</li>
      <li>You'll receive tracking updates via email</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 20px; color: #6b7280;">
    <p>Questions? Contact us at info@diyaustralia.com</p>
    <p style="margin-top: 20px;">
      <a href="${supabaseUrl.replace('.supabase.co', '')}/portal/orders/${order.id}" 
         style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        View Order in Portal
      </a>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
    <p>DIY Kitchens Australia<br>This is an automated email, please do not reply directly.</p>
  </div>
</body>
</html>
    `;

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'DIY Kitchens <onboarding@resend.dev>',
      to: [order.customer_email],
      subject: `Order Confirmation - ${order.order_number}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Confirmation email sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
