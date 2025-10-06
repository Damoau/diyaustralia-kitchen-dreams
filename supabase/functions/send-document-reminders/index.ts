import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SEND-DOCUMENT-REMINDERS] Cron job started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find documents that need reminders
    const { data: documentsNeedingReminders, error: findError } = await supabaseClient
      .from('order_documents')
      .select(`
        id,
        title,
        order_id,
        sent_at,
        orders!inner (
          id,
          order_number,
          user_id,
          profiles!inner (
            email
          )
        )
      `)
      .in('status', ['sent', 'viewed'])
      .not('sent_at', 'is', null);

    if (findError) throw findError;

    console.log(`[SEND-DOCUMENT-REMINDERS] Found ${documentsNeedingReminders?.length || 0} documents in sent/viewed status`);

    let remindersSent = 0;

    for (const doc of documentsNeedingReminders || []) {
      // Check if reminder is due
      const { data: reminderRecord } = await supabaseClient
        .from('document_reminders')
        .select('*')
        .eq('document_id', doc.id)
        .eq('status', 'scheduled')
        .single();

      const now = new Date();
      let shouldSendReminder = false;

      if (!reminderRecord) {
        // No reminder record exists, check if 3 days have passed since sent_at
        const sentDate = new Date(doc.sent_at);
        const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceSent >= 3) {
          shouldSendReminder = true;
          
          // Create initial reminder record
          await supabaseClient.from('document_reminders').insert({
            order_id: doc.order_id,
            document_id: doc.id,
            reminder_type: 'initial_notification',
            sent_at: now.toISOString(),
            next_reminder_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            reminder_count: 1,
            status: 'sent'
          });
        }
      } else {
        // Check if next_reminder_at has passed
        const nextReminderDate = new Date(reminderRecord.next_reminder_at);
        
        if (now >= nextReminderDate && reminderRecord.reminder_count < reminderRecord.max_reminders) {
          shouldSendReminder = true;
          const newCount = reminderRecord.reminder_count + 1;
          
          // Update reminder record
          await supabaseClient
            .from('document_reminders')
            .update({
              reminder_count: newCount,
              sent_at: now.toISOString(),
              next_reminder_at: newCount < reminderRecord.max_reminders 
                ? new Date(now.getTime() + reminderRecord.days_between_reminders * 24 * 60 * 60 * 1000).toISOString()
                : null,
              status: newCount >= reminderRecord.max_reminders ? 'completed' : 'sent',
              reminder_type: newCount >= reminderRecord.max_reminders ? 'urgent' : 'follow_up'
            })
            .eq('id', reminderRecord.id);
        }
      }

      if (shouldSendReminder) {
        const customerEmail = doc.orders.profiles.email;
        const orderNumber = doc.orders.order_number;
        const portalLink = `${Deno.env.get("SITE_URL")}/portal/orders/${doc.order_id}`;
        
        const reminderCount = reminderRecord ? reminderRecord.reminder_count + 1 : 1;
        const maxReminders = reminderRecord?.max_reminders || 5;

        console.log(`[SEND-DOCUMENT-REMINDERS] Sending reminder ${reminderCount}/${maxReminders} to ${customerEmail}`);

        // Send reminder email
        await resend.emails.send({
          from: "Custom Cabinets <noreply@your-domain.com>",
          to: [customerEmail],
          subject: reminderCount === 1 
            ? "📐 Your Kitchen Drawings Are Ready for Review"
            : `🔔 Reminder ${reminderCount}: Please Review Your Kitchen Drawings`,
          html: `
            <h1>${reminderCount === 1 ? 'Your Kitchen Drawings Are Ready!' : `Reminder: Please Review Your Drawings`}</h1>
            <p>Hi there,</p>
            
            ${reminderCount === 1 
              ? `<p>Great news! Your custom kitchen drawings are ready for your review.</p>`
              : `<p>We noticed you haven't approved your kitchen drawings yet. We're ready to start production as soon as you give us the green light!</p>`
            }
            
            <p><strong>Order:</strong> ${orderNumber}</p>
            <p><strong>Document:</strong> ${doc.title}</p>
            
            <p><a href="${portalLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">📐 Review Drawings Now</a></p>
            
            <p>What to check:</p>
            <ul>
              <li>✓ Cabinet dimensions and measurements</li>
              <li>✓ Door style and finishes</li>
              <li>✓ Hardware placement</li>
              <li>✓ Overall layout</li>
            </ul>
            
            ${reminderCount >= maxReminders 
              ? `<p style="color: #DC2626; font-weight: bold;">⚠️ This is our final reminder. Please contact us if you have any questions.</p>`
              : `<p>This is reminder ${reminderCount} of ${maxReminders}.</p>`
            }
            
            <p>Questions? Reply to this email or call us.</p>
            
            <p>Best regards,<br>The Custom Cabinets Team</p>
          `,
        });

        remindersSent++;
      }
    }

    console.log(`[SEND-DOCUMENT-REMINDERS] Sent ${remindersSent} reminders`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        totalDocumentsChecked: documentsNeedingReminders?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[SEND-DOCUMENT-REMINDERS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});