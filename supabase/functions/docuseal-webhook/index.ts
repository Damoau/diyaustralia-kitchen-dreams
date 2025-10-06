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

    const { event_type, data } = payload;
    const submissionId = data?.id;

    if (!submissionId) {
      throw new Error("No submission ID in webhook payload");
    }

    // Find document by DocuSeal submission ID
    const { data: document, error: docError } = await supabase
      .from("order_documents")
      .select("*, orders(id, user_id)")
      .eq("docuseal_submission_id", submissionId)
      .single();

    if (docError || !document) {
      console.error("Document not found for submission:", submissionId);
      throw new Error("Document not found");
    }

    // Handle different event types
    switch (event_type) {
      case "submission.completed":
        console.log("Processing completed submission:", submissionId);
        
        // Download signed document from DocuSeal if URL provided
        const signedDocUrl = data?.documents?.[0]?.url;
        let signatureUrl = null;
        
        if (signedDocUrl) {
          try {
            const docResponse = await fetch(signedDocUrl);
            const docBlob = await docResponse.blob();
            
            const signedFileName = `${document.order_id}/${document.id}_signed.pdf`;
            const { error: uploadError } = await supabase.storage
              .from("documents")
              .upload(signedFileName, docBlob, { 
                upsert: true,
                contentType: 'application/pdf'
              });

            if (!uploadError) {
              signatureUrl = signedFileName;
              console.log("Signed document uploaded:", signedFileName);
            }
          } catch (error) {
            console.error("Error processing signed document:", error);
          }
        }

        // Update document status
        await supabase
          .from("order_documents")
          .update({
            status: "completed",
            approved_at: new Date().toISOString(),
            docuseal_status: "completed",
            docuseal_completed_at: new Date().toISOString(),
            signature_url: signatureUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", document.id);

        // Update order status
        await supabase
          .from("orders")
          .update({ 
            drawings_status: "approved",
            drawings_approved_at: new Date().toISOString()
          })
          .eq("id", document.order_id);

        console.log("Document completed and approved");
        break;

      case "submission.viewed":
        console.log("Submission viewed:", submissionId);
        await supabase
          .from("order_documents")
          .update({
            status: "viewed",
            docuseal_status: "viewed",
            last_viewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", document.id);
        break;

      case "submission.declined":
        console.log("Submission declined:", submissionId);
        await supabase
          .from("order_documents")
          .update({
            status: "declined",
            docuseal_status: "declined",
            updated_at: new Date().toISOString(),
          })
          .eq("id", document.id);

        await supabase
          .from("orders")
          .update({ drawings_status: "pending" })
          .eq("id", document.order_id);
        break;

      case "submission.expired":
        console.log("Submission expired:", submissionId);
        await supabase
          .from("order_documents")
          .update({
            status: "expired",
            docuseal_status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", document.id);
        break;

      default:
        console.log("Unhandled event type:", event_type);
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
