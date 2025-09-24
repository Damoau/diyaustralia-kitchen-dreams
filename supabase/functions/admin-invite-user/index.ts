import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    const { email, role }: InviteRequest = await req.json();

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

    // Send invitation email
    const roleLabels = {
      admin: 'Administrator',
      sales_rep: 'Sales Representative', 
      fulfilment: 'Fulfilment Team',
      customer: 'Customer'
    };

    console.log('Attempting to send email to:', email);
    console.log('Using Resend API key exists:', !!Deno.env.get('RESEND_API_KEY'));
    console.log('Reset link generated:', !!resetData?.properties.action_link);

    const { error: emailError } = await resend.emails.send({
      from: 'Cabinet Factory Admin <onboarding@resend.dev>',
      to: [email],
      subject: `You've been invited as ${roleLabels[role]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Cabinet Factory!</h1>
          <p>You've been invited to join our system as a <strong>${roleLabels[role]}</strong>.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Account Details:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${roleLabels[role]}</p>
          </div>

          <p>To set up your password and activate your account, click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetData?.properties.action_link || `${Deno.env.get('SITE_URL')}/auth`}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Set Up Your Password
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you have any questions, please contact your administrator.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('RESEND EMAIL ERROR:', JSON.stringify(emailError, null, 2));
      // Don't fail the entire operation if email fails, but log it clearly
    } else {
      console.log('Email sent successfully to:', email);
    }

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
        error: error.message || 'Internal server error'
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