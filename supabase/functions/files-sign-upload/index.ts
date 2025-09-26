import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface SignUploadRequest {
  filename: string;
  content_type: string;
  file_size: number;
  kind: 'document' | 'image' | 'attachment';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    if (req.method === 'POST') {
      const { filename, content_type, file_size, kind }: SignUploadRequest = await req.json();

      if (!filename || !content_type || !file_size || !kind) {
        throw new Error('filename, content_type, file_size, and kind are required');
      }

      // Validate file size (max 10MB)
      if (file_size > 10 * 1024 * 1024) {
        throw new Error('File size cannot exceed 10MB');
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ];

      if (!allowedTypes.includes(content_type)) {
        throw new Error('File type not supported');
      }

      // Generate unique file ID and path
      const fileId = crypto.randomUUID();
      const fileExtension = filename.split('.').pop();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${user.id}/${fileId}_${sanitizedFilename}`;

      // Determine bucket based on file kind
      const bucket = kind === 'image' ? 'images' : 'documents';

      // Create signed URL for upload
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(storagePath);

      if (urlError) {
        throw urlError;
      }

      // Create file record
      const { data: file, error: fileError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          owner_user_id: user.id,
          created_by: user.id,
          filename: sanitizedFilename,
          mime_type: content_type,
          file_size,
          kind,
          storage_url: `${bucket}/${storagePath}`,
          visibility: 'private'
        })
        .select()
        .single();

      if (fileError) {
        throw fileError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'file',
        p_scope_id: fileId,
        p_action: 'upload_initiated',
        p_after_data: JSON.stringify({ 
          filename: sanitizedFilename,
          content_type,
          file_size,
          kind
        })
      });

      return new Response(JSON.stringify({
        file_id: fileId,
        signed_url: signedUrlData.signedUrl,
        upload_token: signedUrlData.token,
        expires_in: 3600, // 1 hour
        file: file
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in files-sign-upload:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});