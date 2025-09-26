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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { quote_id } = await req.json();

    if (!quote_id) {
      return new Response(JSON.stringify({ error: 'Quote ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get quote details with items
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          *,
          cabinet_types (name, category),
          door_styles (name),
          colors (name, hex_code),
          finishes (name)
        )
      `)
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      return new Response(JSON.stringify({ error: 'Quote not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check access permissions
    if (quote.user_id !== user.id && quote.customer_email !== user.email) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate PDF HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quote ${quote.quote_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .quote-details { margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>QUOTE</h1>
          <h2>${quote.quote_number}</h2>
        </div>
        
        <div class="quote-details">
          <p><strong>Customer:</strong> ${quote.customer_name || 'Customer'}</p>
          <p><strong>Email:</strong> ${quote.customer_email}</p>
          ${quote.customer_phone ? `<p><strong>Phone:</strong> ${quote.customer_phone}</p>` : ''}
          ${quote.customer_company ? `<p><strong>Company:</strong> ${quote.customer_company}</p>` : ''}
          <p><strong>Quote Date:</strong> ${new Date(quote.created_at).toLocaleDateString()}</p>
          <p><strong>Valid Until:</strong> ${quote.valid_until}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Dimensions</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(quote.quote_items || []).map((item: any) => `
              <tr>
                <td>
                  <strong>${item.cabinet_types?.name || 'Cabinet'}</strong><br>
                  ${item.door_styles?.name || ''} ${item.colors?.name || ''} ${item.finishes?.name || ''}
                </td>
                <td>${item.width_mm}×${item.height_mm}×${item.depth_mm}mm</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price?.toLocaleString()}</td>
                <td>$${item.total_price?.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal:</strong> $${quote.subtotal?.toLocaleString() || '0.00'}</p>
          <p><strong>GST (10%):</strong> $${quote.tax_amount?.toLocaleString() || '0.00'}</p>
          <h3><strong>Total:</strong> $${quote.total_amount?.toLocaleString() || '0.00'}</h3>
        </div>

        ${quote.notes ? `<div style="margin-top: 30px;"><p><strong>Notes:</strong></p><p>${quote.notes}</p></div>` : ''}
        
        <div class="footer">
          <p>Thank you for choosing our services!</p>
          <p>This quote is valid until ${quote.valid_until}</p>
        </div>
      </body>
      </html>
    `;

    // For now, return the HTML content
    // In a production environment, you would use a PDF generation library
    // like Puppeteer or similar to convert HTML to PDF
    
    return new Response(JSON.stringify({ 
      success: true,
      pdf_url: null, // Would contain PDF URL in production
      html_content: htmlContent,
      message: 'PDF generation placeholder - HTML content returned'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating quote PDF:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});