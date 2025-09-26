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

interface RequestChangeRequest {
  quote_id: string;
  message: string;
  change_type?: string;  
  file_ids?: string[];
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
      const { quote_id, message, file_ids }: RequestChangeRequest = await req.json();

      if (!quote_id) {
        throw new Error('Quote ID is required');
      }

      if (!message?.trim()) {
        throw new Error('Message is required');
      }

      // Verify quote exists and user has access
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('id, status, version_number')
        .eq('id', quote_id)
        .eq('user_id', user.id)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found or access denied');
      }

      if (quote.status === 'accepted') {
        throw new Error('Cannot request changes to accepted quote');
      }

      // Get current version number
      const { data: versions, error: versionsError } = await supabase
        .from('quote_versions')
        .select('version_number')
        .eq('quote_id', quote_id)
        .order('version_number', { ascending: false })
        .limit(1);

      const currentVersion = versions?.[0]?.version_number || 1;
      const newVersionNumber = currentVersion + 1;

      // Create new version
      const { data: newVersion, error: versionError } = await supabase
        .from('quote_versions')
        .insert({
          quote_id: quote_id,
          version_number: newVersionNumber,
          changes_requested: message,
          created_by: user.id,
          status: 'pending_review'
        })
        .select()
        .single();

      if (versionError) {
        throw versionError;
      }

      // Attach files if provided
      if (file_ids && file_ids.length > 0) {
        for (const fileId of file_ids) {
          await supabase.rpc('attach_file_to_scope', {
            p_file_id: fileId,
            p_scope: 'quote_version',
            p_scope_id: newVersion.id
          });
        }
      }

      // Update quote status
      const { error: updateQuoteError } = await supabase
        .from('quotes')
        .update({ 
          status: 'revision_requested',
          version_number: newVersionNumber
        })
        .eq('id', quote_id);

      if (updateQuoteError) {
        throw updateQuoteError;
      }

      // Create message entry
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          scope: 'quote',
          scope_id: quote_id,
          message_text: message,
          message_type: 'change_request',
          topic: `Quote change request`,
          extension: 'customer',
          file_ids: file_ids || []
        });

      if (messageError) {
        console.warn('Failed to create message entry:', messageError);
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'quote',
        p_scope_id: quote_id,
        p_action: 'change_requested',
        p_after_data: JSON.stringify({ 
          version_number: newVersionNumber,
          message,
          file_count: file_ids?.length || 0
        })
      });

      // Send notification to admin/sales team
      await supabase.functions.invoke('send-notifications', {
        body: {
          event: 'quote.change_requested',
          data: {
            quote_id: quote_id,
            user_id: user.id,
            version_number: newVersionNumber,
            message,
            file_ids
          }
        }
      });

      return new Response(JSON.stringify({ 
        version: newVersion,
        message: 'Change request submitted successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-quote-request-change:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});