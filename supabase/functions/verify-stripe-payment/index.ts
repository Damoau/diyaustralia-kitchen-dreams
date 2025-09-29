import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-STRIPE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { sessionId, checkoutId } = await req.json();
    
    if (!sessionId || !checkoutId) {
      throw new Error("Missing required parameters: sessionId or checkoutId");
    }

    logStep("Request data received", { sessionId, checkoutId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email
    });

    if (session.payment_status === 'paid') {
      // Update checkout status to converted
      const { error: updateError } = await supabaseClient
        .from('checkouts')
        .update({ 
          status: 'converted',
          payment_method: 'stripe',
          payment_reference: sessionId,
          stripe_customer_id: session.customer,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkoutId);

      if (updateError) {
        logStep("Error updating checkout record", { error: updateError });
        throw updateError;
      }

      logStep("Checkout updated to converted status");

      return new Response(JSON.stringify({ 
        success: true,
        paymentStatus: 'paid',
        customerEmail: session.customer_details?.email,
        amount: session.amount_total
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false,
        paymentStatus: session.payment_status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-stripe-payment", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});