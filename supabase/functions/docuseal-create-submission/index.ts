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
    const { documentId, orderId, documentUrl, customerEmail, customerName } = await req.json();
    
    const DOCUSEAL_API_KEY = Deno.env.get("DOCUSEAL_API_KEY");
    if (!DOCUSEAL_API_KEY) {
      throw new Error("DOCUSEAL_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Creating DocuSeal submission for document:", documentId);

    // Create submission in DocuSeal
    const docusealResponse = await fetch("https://api.docuseal.co/submissions", {
      method: "POST",
      headers: {
        "X-Auth-Token": DOCUSEAL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: null, // Will upload document directly
        send_email: true,
        send_sms: false,
        submitters: [
          {
            email: customerEmail,
            name: customerName,
            role: "Customer",
          },
        ],
        documents: [
          {
            name: "Kitchen Drawing",
            url: documentUrl,
          },
        ],
        message: "Please review and sign your kitchen drawings",
      }),
    });

    if (!docusealResponse.ok) {
      const error = await docusealResponse.text();
      console.error("DocuSeal API error:", error);
      throw new Error(`DocuSeal API error: ${docusealResponse.status}`);
    }

    const docusealData = await docusealResponse.json();
    console.log("DocuSeal submission created:", docusealData.id);

    // Update document with DocuSeal info
    const { error: updateError } = await supabase
      .from("order_documents")
      .update({
        docuseal_submission_id: docusealData.id,
        signing_method: "docuseal",
        docuseal_status: "pending",
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) throw updateError;

    // Update order status
    await supabase
      .from("orders")
      .update({ drawings_status: "sent" })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        submission_id: docusealData.id,
        submission_url: docusealData.submission_url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating DocuSeal submission:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
