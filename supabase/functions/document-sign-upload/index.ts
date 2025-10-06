import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadRequest {
  filename: string;
  contentType: string;
  fileSize: number;
  orderId: string;
  documentType: 'drawing' | 'specification' | 'contract' | 'invoice' | 'other';
  title: string;
  description?: string;
  requiresSignature?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[DOCUMENT-SIGN-UPLOAD] Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    if (!userData.user) throw new Error("User not authenticated");

    console.log("[DOCUMENT-SIGN-UPLOAD] User authenticated:", userData.user.id);

    const body: UploadRequest = await req.json();
    const { filename, contentType, fileSize, orderId, documentType, title, description, requiresSignature } = body;

    // Validate file type (PDF only)
    if (contentType !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Validate file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    console.log("[DOCUMENT-SIGN-UPLOAD] Validations passed, creating document record");

    // Generate unique file path
    const fileId = crypto.randomUUID();
    const storagePath = `${orderId}/${fileId}_${filename}`;

    // Create signed upload URL (valid for 1 hour)
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (uploadError) throw uploadError;

    console.log("[DOCUMENT-SIGN-UPLOAD] Signed upload URL created");

    // Get current max version for this order and document type
    const { data: existingDocs } = await supabaseClient
      .from('order_documents')
      .select('version')
      .eq('order_id', orderId)
      .eq('document_type', documentType)
      .order('version', { ascending: false })
      .limit(1);

    const version = existingDocs && existingDocs.length > 0 ? existingDocs[0].version + 1 : 1;

    // Create document record
    const { data: documentRecord, error: docError } = await supabaseClient
      .from('order_documents')
      .insert({
        order_id: orderId,
        document_type: documentType,
        title: title,
        description: description,
        version: version,
        storage_url: storagePath,
        file_size: fileSize,
        mime_type: contentType,
        status: 'pending',
        requires_signature: requiresSignature || false,
        uploaded_by: userData.user.id
      })
      .select()
      .single();

    if (docError) throw docError;

    console.log("[DOCUMENT-SIGN-UPLOAD] Document record created:", documentRecord.id);

    // Log audit event
    await supabaseClient.from('audit_logs').insert({
      actor_id: userData.user.id,
      scope: 'order_documents',
      scope_id: documentRecord.id,
      action: 'document_uploaded',
      after_data: {
        order_id: orderId,
        document_type: documentType,
        title: title,
        version: version
      }
    });

    return new Response(
      JSON.stringify({
        documentId: documentRecord.id,
        uploadUrl: uploadData.signedUrl,
        uploadToken: uploadData.token,
        storagePath: storagePath,
        version: version
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[DOCUMENT-SIGN-UPLOAD] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});