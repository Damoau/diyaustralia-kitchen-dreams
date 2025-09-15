import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
      // Generate verification token
      const verificationToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      const { error: tokenError } = await supabase
        .from('email_verifications')
        .insert({
          user_id: user.id,
          email: user.email,
          token: verificationToken,
          expires_at: expiresAt.toISOString()
        });

      if (tokenError) {
        throw tokenError;
      }

      // Send verification email
      const verificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-email-token?token=${verificationToken}`;

      const { data: emailResponse, error: emailError } = await resend.emails.send({
        from: 'Cabinets Portal <noreply@cabinetportal.com>',
        to: [user.email!],
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Email Verification</h1>
            
            <p>Hi there,</p>
            
            <p>Please verify your email address by clicking the link below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>This link will expire in 24 hours.</p>
            
            <p>If you didn't request this verification, you can safely ignore this email.</p>
            
            <p>Best regards,<br>
            Cabinet Portal Team</p>
          </div>
        `,
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        throw new Error('Failed to send verification email');
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_actor_id: user.id,
        p_scope: 'email_verification',
        p_scope_id: user.id,
        p_action: 'sent',
        p_after_data: JSON.stringify({ email: user.email })
      });

      return new Response(JSON.stringify({ 
        message: 'Verification email sent successfully',
        email: user.email
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-verify-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});