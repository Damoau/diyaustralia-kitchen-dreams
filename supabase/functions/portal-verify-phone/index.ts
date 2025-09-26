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

interface VerifyPhoneRequest {
  phone_number: string;
}

interface ConfirmOtpRequest {
  phone_number: string;
  otp: string;
}

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isConfirm = url.pathname.includes('/confirm');
    
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
      if (isConfirm) {
        // POST /api/portal/verify/phone/confirm
        const { phone_number, otp }: ConfirmOtpRequest = await req.json();

        if (!phone_number || !otp) {
          throw new Error('Phone number and OTP are required');
        }

        // Verify OTP
        const { data: verification, error: verificationError } = await supabase
          .from('phone_verifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('phone_number', phone_number)
          .eq('otp', otp)
          .eq('verified', false)
          .gte('expires_at', new Date().toISOString())
          .single();

        if (verificationError || !verification) {
          throw new Error('Invalid or expired OTP');
        }

        // Mark as verified
        const { error: updateError } = await supabase
          .from('phone_verifications')
          .update({ 
            verified: true,
            verified_at: new Date().toISOString()
          })
          .eq('id', verification.id);

        if (updateError) {
          throw updateError;
        }

        // Update user profile with verified phone
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            phone_number: phone_number,
            phone_verified: true
          });

        if (profileError) {
          console.warn('Failed to update profile:', profileError);
        }

        // Log audit event
        await supabase.rpc('log_audit_event', {
          p_actor_id: user.id,
          p_scope: 'phone_verification',
          p_scope_id: user.id,
          p_action: 'verified',
          p_after_data: JSON.stringify({ phone_number })
        });

        return new Response(JSON.stringify({ 
          message: 'Phone number verified successfully',
          phone_number
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // POST /api/portal/verify/phone
        const { phone_number }: VerifyPhoneRequest = await req.json();

        if (!phone_number) {
          throw new Error('Phone number is required');
        }

        // Validate Australian phone number format
        const phoneRegex = /^(\+61|0)[2-9]\d{8}$/;
        if (!phoneRegex.test(phone_number)) {
          throw new Error('Invalid Australian phone number format');
        }

        // Generate OTP
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP
        const { error: otpError } = await supabase
          .from('phone_verifications')
          .insert({
            user_id: user.id,
            phone_number,
            otp,
            expires_at: expiresAt.toISOString(),
            verified: false
          });

        if (otpError) {
          throw otpError;
        }

        // In a real implementation, you would send SMS via Twilio, AWS SNS, etc.
        // For demo purposes, we'll just log the OTP
        console.log(`SMS OTP for ${phone_number}: ${otp}`);

        // Simulate SMS sending (replace with actual SMS provider)
        const smsSuccess = true; // Would be actual SMS API response

        if (!smsSuccess) {
          throw new Error('Failed to send SMS');
        }

        // Log audit event
        await supabase.rpc('log_audit_event', {
          p_actor_id: user.id,
          p_scope: 'phone_verification',
          p_scope_id: user.id,
          p_action: 'otp_sent',
          p_after_data: JSON.stringify({ phone_number })
        });

        return new Response(JSON.stringify({ 
          message: 'OTP sent successfully',
          phone_number,
          expires_in: 600 // 10 minutes in seconds
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portal-verify-phone:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});