import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, sessionData, interactionData } = await req.json();
    console.log('Recording user action:', action, { sessionData, interactionData });

    if (action === 'start_session') {
      // Create or update user session
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({
          session_id: sessionData.sessionId,
          user_id: sessionData.userId || null,
          user_agent: sessionData.userAgent,
          ip_address: sessionData.ipAddress,
          referrer: sessionData.referrer,
          device_type: sessionData.deviceType,
          browser_info: sessionData.browserInfo,
          started_at: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        });

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      console.log('Session created/updated:', data);
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'record_interaction') {
      // Record user interaction
      const { data, error } = await supabase
        .from('user_interactions')
        .insert({
          session_id: interactionData.sessionId,
          user_id: interactionData.userId || null,
          action_type: interactionData.actionType,
          target_element: interactionData.targetElement,
          page_url: interactionData.pageUrl,
          metadata: interactionData.metadata || {},
          mouse_x: interactionData.mouseX,
          mouse_y: interactionData.mouseY,
          viewport_width: interactionData.viewportWidth,
          viewport_height: interactionData.viewportHeight,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording interaction:', error);
        throw error;
      }

      console.log('Interaction recorded:', data);
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'end_session') {
      // End user session
      const { error } = await supabase.rpc('end_user_session', {
        p_session_id: sessionData.sessionId
      });

      if (error) {
        console.error('Error ending session:', error);
        throw error;
      }

      console.log('Session ended:', sessionData.sessionId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in record-user-session:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});