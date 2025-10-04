import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ebf0769f-8814-47f0-bfb6-515c0f9cba2c.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateInvoiceRequest {
  order_id: string;
  payment_schedule_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, payment_schedule_id }: GenerateInvoiceRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get order details with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*,
          cabinet_types(name),
          colors(name),
          door_styles(name),
          finishes(name)
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError) throw orderError;

    // Calculate invoice amounts
    const subtotal = order.subtotal;
    const gstAmount = order.tax_amount;
    const totalAmount = order.total_amount;

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        order_id,
        payment_schedule_id,
        invoice_number: invoiceNumber,
        subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: payment_schedule_id ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'sent'
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Generate PDF content (simplified HTML for now)
    const pdfContent = generateInvoiceHTML(order, invoice);

    // For now, we'll return the HTML content
    // In a production environment, you'd use a PDF generation service
    const response = {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      pdf_content: pdfContent,
      download_url: `/api/invoice/${invoice.id}/pdf`
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function generateInvoiceHTML(order: any, invoice: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .totals { margin-top: 20px; text-align: right; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>INVOICE</h1>
            <h2>DIY Kitchen Cabinets Australia</h2>
        </div>
        
        <div class="invoice-details">
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Invoice Date:</strong> ${invoice.invoice_date}</p>
            <p><strong>Due Date:</strong> ${invoice.due_date || 'Upon receipt'}</p>
            <p><strong>Order Number:</strong> ${order.order_number}</p>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Dimensions</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.order_items.map((item: any) => `
                    <tr>
                        <td>${item.cabinet_types?.name || 'Cabinet'}</td>
                        <td>${item.quantity}</td>
                        <td>${item.width_mm}×${item.height_mm}×${item.depth_mm}mm</td>
                        <td>$${item.unit_price}</td>
                        <td>$${item.total_price}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <p><strong>Subtotal:</strong> $${invoice.subtotal}</p>
            <p><strong>GST:</strong> $${invoice.gst_amount}</p>
            <p><strong>Total Amount:</strong> $${invoice.total_amount}</p>
        </div>
    </body>
    </html>
  `;
}

serve(handler);