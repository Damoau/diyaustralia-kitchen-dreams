import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEnhancedInvoiceRequest {
  order_id: string;
  milestone_type?: 'deposit' | 'progress' | 'final';
  payment_schedule_id?: string;
  include_line_items?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, milestone_type, payment_schedule_id, include_line_items = true }: GenerateEnhancedInvoiceRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details with items and customer info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          cabinet_types (name, category),
          door_styles (name),
          colors (name)
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Get or create contact
    let contact = null;
    if (order.user_id) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', order.user_id)
        .single();

      if (!existingContact) {
        // Create contact from order billing address
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            user_id: order.user_id,
            name: `${order.billing_address?.name || 'Customer'}`,
            email: order.billing_address?.email,
            phone: order.billing_address?.phone,
            billing_address: order.billing_address,
            shipping_address: order.shipping_address
          })
          .select()
          .single();
        contact = newContact;
      } else {
        contact = existingContact;
      }
    }

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');

    // Calculate amounts based on milestone type
    let invoiceAmount = order.total_amount;
    let milestonePercentage = 100;
    
    if (milestone_type) {
      switch (milestone_type) {
        case 'deposit':
          invoiceAmount = Math.round(order.total_amount * 0.20 * 100) / 100;
          milestonePercentage = 20;
          break;
        case 'progress':
          invoiceAmount = Math.round(order.total_amount * 0.30 * 100) / 100;
          milestonePercentage = 30;
          break;
        case 'final':
          invoiceAmount = Math.round(order.total_amount * 0.50 * 100) / 100;
          milestonePercentage = 50;
          break;
      }
    }

    // Calculate GST (Australian 10% GST)
    const subtotalExGST = Math.round((invoiceAmount / 1.10) * 100) / 100;
    const gstAmount = invoiceAmount - subtotalExGST;

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        order_id,
        contact_id: contact?.id,
        invoice_number: invoiceNumber,
        status: 'draft',
        subtotal: subtotalExGST,
        gst_amount: gstAmount,
        total_amount: invoiceAmount,
        currency: 'AUD',
        milestone_type,
        milestone_percentage: milestonePercentage,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        payment_schedule_id
      })
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Create invoice line items if requested
    if (include_line_items && order.order_items) {
      const lineItems = order.order_items.map((item: any, index: number) => {
        const itemAmount = milestone_type ? 
          Math.round(item.total_price * (milestonePercentage / 100) * 100) / 100 :
          item.total_price;
        
        const itemSubtotal = Math.round((itemAmount / 1.10) * 100) / 100;
        const itemGST = itemAmount - itemSubtotal;

        return {
          invoice_id: invoice.id,
          line_number: index + 1,
          item_code: item.cabinet_types?.name || 'CABINET',
          description: `${item.cabinet_types?.name || 'Cabinet'} - ${item.width_mm}W x ${item.height_mm}H x ${item.depth_mm}D${item.door_styles?.name ? ` - ${item.door_styles.name}` : ''}${item.colors?.name ? ` - ${item.colors.name}` : ''}`,
          quantity: item.quantity,
          unit_price_ex_gst: Math.round((itemSubtotal / item.quantity) * 100) / 100,
          unit_price_inc_gst: Math.round((itemAmount / item.quantity) * 100) / 100,
          line_amount_ex_gst: itemSubtotal,
          line_amount_inc_gst: itemAmount,
          tax_rate: 0.10,
          tax_amount: itemGST,
          tax_code: 'GST',
          account_code: '200', // Sales - Cabinets
          tracking_category_1: 'Sydney', // Default location
          tracking_category_2: 'Kitchens', // Default product line
          cabinet_type_id: item.cabinet_type_id,
          order_item_id: item.id
        };
      });

      await supabase.from('invoice_lines').insert(lineItems);
    }

    // Generate enhanced invoice HTML
    const invoiceHTML = generateEnhancedInvoiceHTML(order, invoice, contact, order.order_items || []);

    return new Response(JSON.stringify({
      success: true,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        milestone_type: invoice.milestone_type,
        milestone_percentage: invoice.milestone_percentage,
        status: invoice.status,
        due_date: invoice.due_date
      },
      html: invoiceHTML
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in generate-enhanced-invoice function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

function generateEnhancedInvoiceHTML(order: any, invoice: any, contact: any, items: any[]): string {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-AU');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .invoice-header {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          padding: 40px;
          position: relative;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .invoice-title {
          font-size: 48px;
          font-weight: 300;
          margin: 20px 0 10px 0;
          opacity: 0.9;
        }
        .invoice-number {
          font-size: 18px;
          opacity: 0.8;
        }
        .invoice-body {
          padding: 40px;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .detail-section h3 {
          color: #2563eb;
          margin-bottom: 15px;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .detail-section p {
          margin: 5px 0;
          font-size: 14px;
        }
        .milestone-badge {
          display: inline-block;
          background: #fbbf24;
          color: #92400e;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          margin-bottom: 20px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .items-table thead {
          background: #f8fafc;
        }
        .items-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table tbody tr:hover {
          background: #f9fafb;
        }
        .totals-section {
          background: #f8fafc;
          padding: 30px;
          border-radius: 8px;
          margin-top: 30px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
        }
        .total-row.final {
          border-top: 2px solid #2563eb;
          font-weight: bold;
          font-size: 18px;
          color: #2563eb;
          margin-top: 20px;
          padding-top: 15px;
        }
        .payment-terms {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 30px 0;
        }
        .payment-terms h4 {
          margin: 0 0 10px 0;
          color: #92400e;
        }
        .footer {
          text-align: center;
          padding: 30px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 14px;
        }
        .gst-notice {
          font-style: italic;
          color: #6b7280;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-name">DIY Australia</div>
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">${invoice.invoice_number}</div>
        </div>
        
        <div class="invoice-body">
          ${invoice.milestone_type ? `
            <div class="milestone-badge">
              ${invoice.milestone_type.toUpperCase()} PAYMENT - ${invoice.milestone_percentage}%
            </div>
          ` : ''}
          
          <div class="invoice-details">
            <div class="detail-section">
              <h3>Bill To</h3>
              <p><strong>${contact?.name || order.billing_address?.name || 'Customer'}</strong></p>
              ${contact?.company_name ? `<p>${contact.company_name}</p>` : ''}
              ${contact?.email || order.billing_address?.email ? `<p>${contact?.email || order.billing_address?.email}</p>` : ''}
              ${contact?.phone || order.billing_address?.phone ? `<p>${contact?.phone || order.billing_address?.phone}</p>` : ''}
              ${contact?.abn ? `<p>ABN: ${contact.abn}</p>` : ''}
            </div>
            
            <div class="detail-section">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Date:</strong> ${formatDate(invoice.created_at)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
              <p><strong>Order Number:</strong> ${order.order_number}</p>
              <p><strong>Currency:</strong> ${invoice.currency}</p>
              ${invoice.purchase_order ? `<p><strong>PO Number:</strong> ${invoice.purchase_order}</p>` : ''}
            </div>
          </div>

          ${items.length > 0 ? `
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>GST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => {
                  const itemAmount = invoice.milestone_type ? 
                    Math.round(item.total_price * (invoice.milestone_percentage / 100) * 100) / 100 :
                    item.total_price;
                  const unitPrice = Math.round((itemAmount / item.quantity) * 100) / 100;
                  
                  return `
                    <tr>
                      <td>
                        <strong>${item.cabinet_types?.name || 'Cabinet'}</strong><br>
                        <small>${item.width_mm}W x ${item.height_mm}H x ${item.depth_mm}D</small>
                        ${item.door_styles?.name ? `<br><small>Style: ${item.door_styles.name}</small>` : ''}
                        ${item.colors?.name ? `<br><small>Color: ${item.colors.name}</small>` : ''}
                      </td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(unitPrice)}</td>
                      <td>10%</td>
                      <td>${formatCurrency(itemAmount)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
              <p>${invoice.milestone_type ? 
                `${invoice.milestone_type.charAt(0).toUpperCase() + invoice.milestone_type.slice(1)} payment (${invoice.milestone_percentage}%) for Order ${order.order_number}` : 
                `Payment for Order ${order.order_number}`
              }</p>
            </div>
          `}

          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal (ex GST):</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="total-row">
              <span>GST (10%):</span>
              <span>${formatCurrency(invoice.gst_amount)}</span>
            </div>
            <div class="total-row final">
              <span>TOTAL (inc GST):</span>
              <span>${formatCurrency(invoice.total_amount)}</span>
            </div>
            <div class="gst-notice">
              * GST inclusive pricing as per Australian tax requirements
            </div>
          </div>

          <div class="payment-terms">
            <h4>Payment Terms</h4>
            <p>Payment is due within 7 days of invoice date. Late payments may incur additional charges.</p>
            <p>Please reference invoice number ${invoice.invoice_number} with your payment.</p>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing DIY Australia</p>
          <p>For any queries regarding this invoice, please contact our accounts team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);