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

interface AttachFileRequest {
  scope: 'quote' | 'order' | 'message' | 'quote_version';
  scope_id: string;
  file_id: string;
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
      const { scope, scope_id, file_id }: AttachFileRequest = await req.json();

      if (!scope || !scope_id || !file_id) {
        throw new Error('scope, scope_id, and file_id are required');
      }

      // Verify file ownership
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', file_id)
        .eq('owner_user_id', user.id)
        .single();

      if (fileError || !file) {
        throw new Error('File not found or access denied');
      }

      // Verify scope access
      let scopeAccessQuery;
      switch (scope) {
        case 'quote':
          scopeAccessQuery = supabase
            .from('quotes')
            .select('id')
            .eq('id', scope_id)
            .eq('user_id', user.id);
          break;
        case 'order':
          scopeAccessQuery = supabase
            .from('orders')
            .select('id')
            .eq('id', scope_id)
            .eq('user_id', user.id);
          break;
        case 'message':
          scopeAccessQuery = supabase
            .from('messages')
            .select('id')
            .eq('id', scope_id)
            .eq('user_id', user.id);
          break;
        case 'quote_version':
          // For quote versions, check through the quote
          scopeAccessQuery = supabase
            .from('quote_versions')
            .select(`
              id,
              quotes!inner(id, user_id)
            `)
            .eq('id', scope_id)
            .eq('quotes.user_id', user.id);
          break;
        default:
          throw new Error('Invalid scope');
      }

      const { data: scopeData, error: scopeError } = await scopeAccessQuery.single();

      if (scopeError || !scopeData) {
        throw new Error('Access denied to scope');
      }

      // Check if file is already attached
      const { data: existingAttachment } = await supabase
        .from('file_attachments')
        .select('id')
        .eq('file_id', file_id)
        .eq('scope', scope)
        .eq('scope_id', scope_id)
        .single();

      if (existingAttachment) {
        return new Response(JSON.stringify({ 
          message: 'File already attached',
          attachment_id: existingAttachment.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create attachment
      const { data: attachment, error: attachError } = await supabase
        .from('file_attachments')
        .insert({
          file_id,
          scope,
          scope_id,
          attached_by: user.id
        })
        .select(`
          *,
          files (
            id,
            filename,
            mime_type,
            file_size,
            storage_url
          )
        `)
        .single();

      if (attachError) {
        throw attachError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'file_attachment',
        p_scope_id: attachment.id,
        p_action: 'created',
        p_after_data: JSON.stringify({
          file_id,
          scope,
          scope_id,
          filename: file.filename
        })
      });

      return new Response(JSON.stringify({
        attachment,
        message: 'File attached successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in files-attach:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});