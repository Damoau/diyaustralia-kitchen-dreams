import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface UnlockRequest {
  orderId: string;
  triggerEvent: 'deposit_paid' | 'drawings_approved' | 'production_complete' | 'ready_for_delivery';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[UNLOCK-PAYMENT-MILESTONE] Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body: UnlockRequest = await req.json();
    const { orderId, triggerEvent } = body;

    console.log("[UNLOCK-PAYMENT-MILESTONE] Unlocking milestone:", triggerEvent, "for order:", orderId);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, profiles!inner(email)')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Handle different trigger events
    switch (triggerEvent) {
      case 'deposit_paid':
        // Set drawings status to pending_upload
        await supabaseClient
          .from('orders')
          .update({ 
            drawings_status: 'pending_upload',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        console.log("[UNLOCK-PAYMENT-MILESTONE] Order status updated to pending_upload");

        // TODO: Send notification to admin to upload drawings
        break;

      case 'drawings_approved':
        // Find and unlock 30% progress payment
        const { data: progressPayment, error: progressError } = await supabaseClient
          .from('payment_schedules')
          .select('*')
          .eq('order_id', orderId)
          .eq('trigger_event', 'drawings_approved')
          .is('unlocked_at', null)
          .single();

        if (progressError) {
          console.log("[UNLOCK-PAYMENT-MILESTONE] No progress payment to unlock or already unlocked");
          break;
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 14 days from now

        await supabaseClient
          .from('payment_schedules')
          .update({
            unlocked_at: new Date().toISOString(),
            due_date: dueDate.toISOString(),
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', progressPayment.id);

        console.log("[UNLOCK-PAYMENT-MILESTONE] Progress payment unlocked");

        // Send payment notification email
        const portalLink = `${Deno.env.get("SITE_URL")}/portal/orders/${orderId}`;
        
        await resend.emails.send({
          from: "Custom Cabinets <noreply@your-domain.com>",
          to: [order.profiles.email],
          subject: "✅ Drawings Approved! Next Payment Now Available",
          html: `
            <h1>Thank You for Approving Your Drawings!</h1>
            <p>Hi there,</p>
            
            <p>Great news! Your kitchen drawings have been approved and we're excited to start production.</p>
            
            <h2>Next Step: Progress Payment</h2>
            <p><strong>Amount Due:</strong> $${(progressPayment.amount / 100).toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            
            <p><a href="${portalLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">💳 Make Payment Now</a></p>
            
            <p>Production will begin as soon as we receive this payment.</p>
            
            <p>Best regards,<br>The Custom Cabinets Team</p>
          `,
        });

        console.log("[UNLOCK-PAYMENT-MILESTONE] Payment notification sent");
        break;

      case 'production_complete':
        // Unlock 50% final payment
        const finalDueDate = new Date();
        finalDueDate.setDate(finalDueDate.getDate() + 7); // 7 days before delivery

        await supabaseClient
          .from('payment_schedules')
          .update({
            unlocked_at: new Date().toISOString(),
            due_date: finalDueDate.toISOString(),
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .eq('trigger_event', 'ready_for_delivery')
          .is('unlocked_at', null);

        console.log("[UNLOCK-PAYMENT-MILESTONE] Final payment unlocked");
        break;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId,
        triggerEvent,
        message: `Milestone ${triggerEvent} processed successfully`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[UNLOCK-PAYMENT-MILESTONE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});