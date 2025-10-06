import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("DocuSeal webhook received:", payload.event_type);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const submissionId = payload.data?.id || payload.submission_id;

    switch (payload.event_type) {
      case "submission.completed":
        console.log("Submission completed:", submissionId);
        
        // Update document status
        const { error: updateError } = await supabase
          .from("order_documents")
          .update({
            docuseal_status: "completed",
            docuseal_completed_at: new Date().toISOString(),
            status: "approved",
            approved_at: new Date().toISOString(),
          })
          .eq("docuseal_submission_id", submissionId);

        if (updateError) throw updateError;

        // Get order ID and update order status
        const { data: doc } = await supabase
          .from("order_documents")
          .select("order_id")
          .eq("docuseal_submission_id", submissionId)
          .single();

        if (doc) {
          await supabase
            .from("orders")
            .update({ drawings_status: "approved" })
            .eq("id", doc.order_id);
        }
        break;

      case "submission.viewed":
        console.log("Submission viewed:", submissionId);
        
        await supabase
          .from("order_documents")
          .update({
            status: "viewed",
            last_viewed_at: new Date().toISOString(),
          })
          .eq("docuseal_submission_id", submissionId);
        break;

      case "submission.declined":
        console.log("Submission declined:", submissionId);
        
        await supabase
          .from("order_documents")
          .update({
            docuseal_status: "declined",
            status: "pending",
          })
          .eq("docuseal_submission_id", submissionId);
        break;

      case "submission.expired":
        console.log("Submission expired:", submissionId);
        
        await supabase
          .from("order_documents")
          .update({
            docuseal_status: "expired",
            status: "pending",
          })
          .eq("docuseal_submission_id", submissionId);
        break;

      default:
        console.log("Unhandled event type:", payload.event_type);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing DocuSeal webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
