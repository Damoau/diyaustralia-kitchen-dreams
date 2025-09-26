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

interface ApprovalsRequest {
  final_measurements?: boolean;
  style_colour_finish?: boolean;
  signature_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const orderId = pathSegments[pathSegments.indexOf('orders') + 1];
    
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
      const { final_measurements, style_colour_finish, signature_id }: ApprovalsRequest = await req.json();

      // Verify order ownership
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, status')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found or access denied');
      }

      // Get or create customer approval record
      let { data: approval, error: approvalError } = await supabase
        .from('customer_approvals')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (approvalError && approvalError.code === 'PGRST116') {
        // No approval record exists, create one
        const { data: newApproval, error: createError } = await supabase
          .from('customer_approvals')
          .insert({
            order_id: orderId,
            final_measurements_confirmed: false,
            style_colour_finish_confirmed: false,
            signature_required: false
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }
        approval = newApproval;
      } else if (approvalError) {
        throw approvalError;
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Handle final measurements approval
      if (final_measurements !== undefined) {
        updateData.final_measurements_confirmed = final_measurements;
        if (final_measurements) {
          updateData.final_measurements_confirmed_at = new Date().toISOString();
          updateData.final_measurements_confirmed_by = user.id;
        } else {
          updateData.final_measurements_confirmed_at = null;
          updateData.final_measurements_confirmed_by = null;
        }
      }

      // Handle style/colour/finish approval
      if (style_colour_finish !== undefined) {
        updateData.style_colour_finish_confirmed = style_colour_finish;
        if (style_colour_finish) {
          updateData.style_colour_finish_confirmed_at = new Date().toISOString();
          updateData.style_colour_finish_confirmed_by = user.id;
        } else {
          updateData.style_colour_finish_confirmed_at = null;
          updateData.style_colour_finish_confirmed_by = null;
        }
      }

      // Handle signature
      if (signature_id) {
        // Verify signature file ownership
        const { data: signatureFile, error: sigError } = await supabase
          .from('files')
          .select('id, kind')
          .eq('id', signature_id)
          .eq('owner_user_id', user.id)
          .eq('kind', 'signature')
          .single();

        if (sigError || !signatureFile) {
          throw new Error('Invalid signature file');
        }

        updateData.signature_data = { file_id: signature_id };
        updateData.signature_completed_at = new Date().toISOString();
      }

      // Update approval record
      const { data: updatedApproval, error: updateError } = await supabase
        .from('customer_approvals')
        .update(updateData)
        .eq('id', approval.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Check if all required approvals are completed (handled by trigger)
      // The check_approvals_completed trigger will automatically update the order status

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'customer_approval',
        p_scope_id: approval.id,
        p_action: 'updated',
        p_after_data: JSON.stringify({
          order_id: orderId,
          final_measurements,
          style_colour_finish,
          signature_provided: !!signature_id
        })
      });

      // Send notification if approvals completed
      if (updatedApproval.final_measurements_confirmed && updatedApproval.style_colour_finish_confirmed) {
        await supabase.functions.invoke('send-notifications', {
          body: {
            event: 'order.approvals_completed',
            data: {
              order_id: orderId,
              user_id: user.id,
              completed_at: updatedApproval.all_approvals_completed_at
            }
          }
        });
      }

      return new Response(JSON.stringify({
        approval: updatedApproval,
        message: 'Approvals updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in orders-approvals:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});