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

interface CreateMessageRequest {
  scope: 'quote' | 'order';
  scope_id: string;
  text: string;
  file_ids?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
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

    if (req.method === 'GET') {
      // GET /api/portal/messages
      const scope = url.searchParams.get('scope');
      const scopeId = url.searchParams.get('scope_id');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('messages')
        .select(`
          *,
          files (
            id,
            filename,
            storage_url,
            mime_type,
            file_size
          ),
          sender:profiles!inner(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (scope) {
        query = query.eq('scope', scope);
      }

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      }

      const { data: messages, error: messagesError, count } = await query;

      if (messagesError) {
        throw messagesError;
      }

      return new Response(JSON.stringify({
        messages,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // POST /api/portal/messages
      const { scope, scope_id, text, file_ids }: CreateMessageRequest = await req.json();

      if (!text?.trim()) {
        throw new Error('Message text is required');
      }

      if (!scope || !scope_id) {
        throw new Error('Scope and scope_id are required');
      }

      // Verify user has access to the scope
      let accessQuery;
      if (scope === 'quote') {
        accessQuery = supabase
          .from('quotes')
          .select('id')
          .eq('id', scope_id)
          .eq('user_id', user.id);
      } else if (scope === 'order') {
        accessQuery = supabase
          .from('orders')
          .select('id')
          .eq('id', scope_id)
          .eq('user_id', user.id);
      } else {
        throw new Error('Invalid scope');
      }

      const { data: scopeData, error: scopeError } = await accessQuery.single();

      if (scopeError || !scopeData) {
        throw new Error('Access denied to this scope');
      }

      // Verify file ownership if files provided
      if (file_ids && file_ids.length > 0) {
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('id')
          .eq('owner_user_id', user.id)
          .in('id', file_ids);

        if (filesError || files.length !== file_ids.length) {
          throw new Error('One or more files not found or access denied');
        }
      }

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          scope,
          scope_id,
          message_text: text,
          message_type: 'customer_message',
          file_ids: file_ids || []
        })
        .select(`
          *,
          files (
            id,
            filename,
            storage_url,
            mime_type,
            file_size
          )
        `)
        .single();

      if (messageError) {
        throw messageError;
      }

      // Attach files to message if provided
      if (file_ids && file_ids.length > 0) {
        for (const fileId of file_ids) {
          await supabase.rpc('attach_file_to_scope', {
            p_file_id: fileId,
            p_scope: 'message',
            p_scope_id: message.id
          });
        }
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'message',
        p_scope_id: message.id,
        p_action: 'created',
        p_after_data: JSON.stringify({
          scope,
          scope_id,
          message_length: text.length,
          file_count: file_ids?.length || 0
        })
      });

      // Send notification to admin/staff
      await supabase.functions.invoke('send-notifications', {
        body: {
          event: 'message.created',
          data: {
            message_id: message.id,
            user_id: user.id,
            scope,
            scope_id,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            file_count: file_ids?.length || 0
          }
        }
      });

      return new Response(JSON.stringify({ message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-messages:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});