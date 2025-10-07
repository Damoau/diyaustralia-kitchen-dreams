import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateApprovalRequest {
  approval_id: string;
  field: 'final_measurements_confirmed' | 'style_colour_finish_confirmed';
  value: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { approval_id, field, value }: UpdateApprovalRequest = await req.json();

    console.log('Updating approval:', { approval_id, field, value });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    let userId = null;
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace("Bearer ", "")
        );
        userId = user?.id;
      } catch (error) {
        console.log("Could not get user from auth header:", error);
      }
    }

    // First, get the current approval to verify ownership
    const { data: approval, error: fetchError } = await supabase
      .from('customer_approvals')
      .select(`
        *,
        orders!inner(user_id, session_id)
      `)
      .eq('id', approval_id)
      .single();

    if (fetchError || !approval) {
      console.error('Approval not found:', fetchError);
      return new Response(
        JSON.stringify({ error: "Approval not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user has access to this approval
    const hasAccess = userId === approval.orders.user_id || 
                     (userId === null && approval.orders.session_id);

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Prepare update data
    const updateData: any = {
      [field]: value,
      [`${field}_at`]: value ? new Date().toISOString() : null,
      [`${field}_by`]: value ? userId : null,
      updated_at: new Date().toISOString()
    };

    // Update the approval
    const { data: updatedApproval, error: updateError } = await supabase
      .from('customer_approvals')
      .update(updateData)
      .eq('id', approval_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating approval:', updateError);
      throw updateError;
    }

    // Log the approval action
    await supabase.rpc('log_audit_event', {
      p_actor_id: userId,
      p_scope: 'customer_approval',
      p_scope_id: approval.order_id,
      p_action: value ? 'approval_confirmed' : 'approval_reset',
      p_before_data: JSON.stringify(approval),
      p_after_data: JSON.stringify(updatedApproval)
    });

    console.log('Approval updated successfully:', updatedApproval.id);

    // Check if all approvals are now complete
    const allComplete = updatedApproval.final_measurements_confirmed && 
                       updatedApproval.style_colour_finish_confirmed &&
                       (!updatedApproval.signature_required || updatedApproval.signature_completed_at);

    let productionStatus = null;
    if (allComplete && !updatedApproval.all_approvals_completed_at) {
      // Update order production status to approved
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ 
          production_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', approval.order_id);

      if (orderUpdateError) {
        console.error('Error updating order production status:', orderUpdateError);
      } else {
        productionStatus = 'approved';
        console.log('Order production status updated to approved');
      }
    } else if (!allComplete && approval.all_approvals_completed_at) {
      // Reset production status if approvals are unchecked
      const { error: orderResetError } = await supabase
        .from('orders')
        .update({ 
          production_status: 'awaiting_approval',
          updated_at: new Date().toISOString()
        })
        .eq('id', approval.order_id);

      if (orderResetError) {
        console.error('Error resetting order production status:', orderResetError);
      } else {
        productionStatus = 'awaiting_approval';
        console.log('Order production status reset to awaiting_approval');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      approval: updatedApproval,
      production_status: productionStatus,
      message: `${field.replace(/_/g, ' ')} has been ${value ? 'confirmed' : 'reset'}`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in update-customer-approval function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);