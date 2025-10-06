import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, CreditCard, FileText } from 'lucide-react';
import { PayPalPaymentButton } from '@/components/checkout/PayPalPaymentButton';
import { useToast } from '@/hooks/use-toast';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  paid_amount?: number;
  balance_due?: number;
  milestone_type?: string;
  terms?: string;
  notes?: string;
  items?: InvoiceItem[];
}

interface InvoiceDetailDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

export const InvoiceDetailDialog = ({
  invoice,
  open,
  onOpenChange,
  onPaymentSuccess,
}: InvoiceDetailDialogProps) => {
  const { toast } = useToast();

  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const balanceDue = invoice.balance_due ?? (invoice.total_amount - (invoice.paid_amount ?? 0));
  const isPaid = invoice.status.toLowerCase() === 'paid' || balanceDue <= 0;
  const isOverdue = !isPaid && new Date(invoice.due_date) < new Date();

  const handleDownloadPDF = async () => {
    toast({
      title: 'Generating PDF',
      description: 'Your invoice is being prepared for download...',
    });
    // TODO: Implement actual PDF generation
  };

  const handlePaymentComplete = (paymentData?: any) => {
    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed successfully.',
    });
    onPaymentSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Invoice {invoice.invoice_number}</DialogTitle>
              <DialogDescription>
                {invoice.milestone_type && (
                  <span className="capitalize">{invoice.milestone_type} Payment - </span>
                )}
                Due {formatDate(invoice.due_date)}
              </DialogDescription>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                {formatDate(invoice.due_date)}
                {isOverdue && ' (Overdue)'}
              </p>
            </div>
          </div>

          {/* Balance Overview */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-semibold">Balance Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Invoice Amount:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.paid_amount !== undefined && invoice.paid_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid:</span>
                  <span>-{formatCurrency(invoice.paid_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Balance Due:</span>
                <span className={balanceDue > 0 ? 'text-primary' : 'text-green-600'}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items (if available) */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Invoice Details</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Description</th>
                      <th className="text-right p-3 text-sm font-medium">Qty</th>
                      <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                      <th className="text-right p-3 text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 text-sm">{item.description}</td>
                        <td className="p-3 text-sm text-right">{item.quantity}</td>
                        <td className="p-3 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals Breakdown */}
          <div className="space-y-2 ml-auto max-w-xs">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST (10%):</span>
              <span>{formatCurrency(invoice.gst_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          {(invoice.terms || invoice.notes) && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              {invoice.terms && (
                <div>
                  <p className="text-sm font-medium mb-1">Payment Terms</p>
                  <p className="text-sm text-muted-foreground">{invoice.terms}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            
            {!isPaid && balanceDue > 0 && (
              <PayPalPaymentButton
                amount={balanceDue}
                description={`Invoice ${invoice.invoice_number}`}
                onSuccess={handlePaymentComplete}
                onError={(error) => {
                  console.error('Payment error:', error);
                  toast({
                    title: 'Payment Error',
                    description: 'There was an issue processing your payment. Please try again.',
                    variant: 'destructive',
                  });
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
