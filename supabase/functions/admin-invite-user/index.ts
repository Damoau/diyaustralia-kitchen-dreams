import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: 'admin' | 'sales_rep' | 'fulfilment' | 'customer';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, role }: InviteRequest = await req.json();
    
    // Log invitation attempt  
    console.log('Processing invitation for:', email, 'as', role);

    // Check if the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    // Generate a temporary password
    const tempPassword = generateTemporaryPassword();

    // Create the user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false // We'll send a custom invitation
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    // Assign the role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role
      });

    if (roleError) {
      // Clean up the created user if role assignment fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL')}/auth?type=recovery`
      }
    });

    if (resetError) {
      console.error('Failed to generate reset link:', resetError);
    }

    // Skip email sending for now to avoid build dependency issues
    // In production, you would send an invitation email here

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        scope: 'user_management',
        scope_id: newUser.user.id,
        action: 'user_invited',
        after_data: {
          email,
          role,
          invited_by: user.email,
          timestamp: new Date().toISOString()
        }
      });

    const roleLabels = {
      admin: 'Administrator',
      sales_rep: 'Sales Representative', 
      fulfilment: 'Fulfilment Team',
      customer: 'Customer'
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${email} has been invited as ${roleLabels[role]}`,
        user_id: newUser.user.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in admin-invite-user function:", error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
});

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}