import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  amount: number;
  currency: string;
  description: string;
  checkout_id?: string;
  schedule_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency, description, checkout_id, schedule_id }: CreateOrderRequest = await req.json();

    console.log('Creating PayPal order:', { amount, currency, description, checkout_id, schedule_id });

    // PayPal API configuration
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const paypalApiUrl = Deno.env.get("PAYPAL_API_URL") || "https://api-m.sandbox.paypal.com"; // Use sandbox for development

    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    // Get access token
    const authResponse = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      console.error("PayPal auth error:", authData);
      throw new Error("Failed to authenticate with PayPal");
    }

    // Create order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description: description,
        custom_id: checkout_id || undefined,
      }],
      application_context: {
        brand_name: "Kitchen Cabinet Store",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${req.headers.get('origin')}/checkout/success`,
        cancel_url: `${req.headers.get('origin')}/checkout/cancel`,
      },
    };

    const orderResponse = await fetch(`${paypalApiUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authData.access_token}`,
      },
      body: JSON.stringify(orderData),
    });

    const orderResult = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("PayPal order creation error:", orderResult);
      throw new Error("Failed to create PayPal order");
    }

    console.log('PayPal order created successfully:', orderResult.id);

    return new Response(JSON.stringify({ 
      orderId: orderResult.id,
      status: orderResult.status 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in create-paypal-order function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);