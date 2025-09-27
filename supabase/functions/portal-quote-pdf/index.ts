import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Parse request body
    const { quote_id } = await req.json();
    
    if (!quote_id) {
      return new Response('Quote ID is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Fetch quote details with items
    const { data: quote, error: quoteError } = await supabaseClient
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

    if (quoteError) {
      console.error('Error fetching quote:', quoteError);
      return new Response('Quote not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Check if user has access to this quote
    if (quote.user_id !== user.id) {
      return new Response('Unauthorized', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    // Generate HTML content for PDF
    const htmlContent = generateQuoteHTML(quote);

    // Use a simplified approach for PDF generation using HTML-to-PDF service
    // In production, you might want to use a more robust solution
    try {
      const response = await fetch('https://api.html-pdf-node.com/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          options: {
            format: 'A4',
            border: {
              top: '1cm',
              right: '1cm',
              bottom: '1cm',
              left: '1cm'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('PDF generation service failed');
      }

      const pdfBuffer = await response.arrayBuffer();

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="quote-${quote.quote_number}.pdf"`
        }
      });
    } catch (pdfError) {
      console.error('PDF generation failed, returning HTML:', pdfError);
      
      // Fallback: Return HTML content that can be printed as PDF by browser
      return new Response(htmlContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html'
        }
      });
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

function generateQuoteHTML(quote: any): string {
  const items = quote.quote_items || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quote ${quote.quote_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        .header {
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .quote-number {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .customer-info {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .item-name {
          font-size: 18px;
          font-weight: bold;
        }
        .item-reference {
          color: #2563eb;
          font-weight: 500;
          margin-bottom: 5px;
        }
        .item-price {
          font-size: 18px;
          font-weight: bold;
          color: #059669;
        }
        .item-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 10px 0;
        }
        .detail-item {
          font-size: 14px;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
        }
        .hardware-section {
          background-color: #f1f5f9;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }
        .notes-section {
          background-color: #fef3c7;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }
        .totals {
          border-top: 2px solid #333;
          padding-top: 20px;
          margin-top: 30px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .total-final {
          font-size: 20px;
          font-weight: bold;
          border-top: 1px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="quote-number">Quote #${quote.quote_number}</div>
        <div>Date: ${new Date(quote.created_at).toLocaleDateString()}</div>
        ${quote.valid_until ? `<div>Valid Until: ${new Date(quote.valid_until).toLocaleDateString()}</div>` : ''}
      </div>

      <div class="customer-info">
        <h3>Customer Information</h3>
        <div><strong>Name:</strong> ${quote.customer_name || 'N/A'}</div>
        <div><strong>Email:</strong> ${quote.customer_email}</div>
        ${quote.customer_phone ? `<div><strong>Phone:</strong> ${quote.customer_phone}</div>` : ''}
        ${quote.customer_company ? `<div><strong>Company:</strong> ${quote.customer_company}</div>` : ''}
        ${quote.customer_abn ? `<div><strong>ABN:</strong> ${quote.customer_abn}</div>` : ''}
      </div>

      <h3>Quote Items</h3>
      ${items.map((item: any) => `
        <div class="item">
          <div class="item-header">
            <div>
              <div class="item-name">${item.item_name || item.cabinet_types?.name || 'Cabinet'}</div>
              ${item.job_reference ? `<div class="item-reference">${item.job_reference}</div>` : ''}
              <div style="font-size: 14px; color: #6b7280;">
                ${item.width_mm}mm × ${item.height_mm}mm × ${item.depth_mm}mm (Qty: ${item.quantity})
              </div>
            </div>
            <div class="item-price">$${item.total_price?.toFixed(2) || '0.00'}</div>
          </div>

          <div class="item-details">
            ${item.door_styles ? `
              <div class="detail-item">
                <div class="detail-label">Door Style</div>
                <div>${item.door_styles.name}</div>
              </div>
            ` : ''}
            ${item.colors ? `
              <div class="detail-item">
                <div class="detail-label">Color</div>
                <div>${item.colors.name}</div>
              </div>
            ` : ''}
            ${item.finishes ? `
              <div class="detail-item">
                <div class="detail-label">Finish</div>
                <div>${item.finishes.name}</div>
              </div>
            ` : ''}
          </div>

          ${item.hardware_selections && Object.keys(item.hardware_selections).length > 0 ? `
            <div class="hardware-section">
              <div class="detail-label">Hardware:</div>
              ${Object.entries(item.hardware_selections).map(([type, selection]: [string, any]) => 
                `<div style="font-size: 12px;">${type.charAt(0).toUpperCase() + type.slice(1)}: ${selection.name || 'Standard'}</div>`
              ).join('')}
            </div>
          ` : ''}

          ${(item.enhanced_notes || item.notes) ? `
            <div class="notes-section">
              <div class="detail-label">Notes:</div>
              <div style="font-size: 12px;">${item.enhanced_notes || item.notes}</div>
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${quote.subtotal?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="total-row">
          <span>GST (10%):</span>
          <span>$${quote.tax_amount?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="total-row total-final">
          <span>Total:</span>
          <span>$${quote.total_amount?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      ${quote.notes ? `
        <div style="margin-top: 30px;">
          <h4>Quote Notes</h4>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
            ${quote.notes}
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>This quote is valid for ${quote.valid_until ? 'until the date specified above' : '30 days from the date of issue'}.</p>
        <p>All prices include GST unless otherwise specified.</p>
      </div>
    </body>
    </html>
  `;
}