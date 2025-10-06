import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Download, AlertCircle, FileText, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { PayPalPaymentButton } from '@/components/checkout/PayPalPaymentButton';
import { InvoiceDetailDialog } from './InvoiceDetailDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentScheduleItem {
  id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  invoice_url?: string | null;
  schedule_type?: string;
  payment_method?: string;
}

interface PaymentScheduleWidgetProps {
  orderId: string;
  schedule?: PaymentScheduleItem[];
  onPaymentComplete?: (data: any) => void;
}

export const PaymentScheduleWidget = ({ orderId, schedule, onPaymentComplete }: PaymentScheduleWidgetProps) => {
  const { toast } = useToast();
  const [actualSchedule, setActualSchedule] = useState<PaymentScheduleItem[]>(schedule || []);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  useEffect(() => {
    if (!schedule || schedule.length === 0) {
      loadPaymentSchedule();
    }
  }, [orderId, schedule]);

  const loadPaymentSchedule = async () => {
    setLoading(true);
    try {
      // Fetch payment schedules, invoices, and payments in parallel
      const [schedulesResult, invoicesResult, paymentsResult] = await Promise.all([
        supabase
          .from('payment_schedules')
          .select('*')
          .eq('order_id', orderId)
          .order('due_date', { ascending: true }),
        supabase
          .from('invoices')
          .select('*')
          .eq('order_id', orderId)
          .order('invoice_date', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
      ]);

      if (schedulesResult.error) throw schedulesResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      // Set invoices and payments
      setInvoices(invoicesResult.data || []);
      setPayments(paymentsResult.data || []);

      // Map payment schedules
      if (schedulesResult.data && schedulesResult.data.length > 0) {
        const mappedSchedule: PaymentScheduleItem[] = schedulesResult.data.map(item => ({
          id: item.id,
          amount: item.amount,
          due_date: item.due_date || new Date().toISOString(),
          status: item.status === 'paid' ? 'paid' as const : 
                  (item.due_date && new Date(item.due_date) < new Date() ? 'overdue' as const : 'pending' as const),
          invoice_url: null,
          schedule_type: item.schedule_type,
          payment_method: item.payment_method
        }));
        setActualSchedule(mappedSchedule);
      }
    } catch (error: any) {
      console.error('Error loading payment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (scheduleId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: {
          order_id: orderId,
          payment_schedule_id: scheduleId
        }
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU');
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed successfully.',
    });
    
    // Reload all payment data
    await loadPaymentSchedule();
    onPaymentComplete?.(paymentData);
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDialog(true);
  };

  // Calculate totals for invoices
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaidViaInvoices = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstandingInvoiceBalance = totalInvoiced - totalPaidViaInvoices;

  const currentSchedule = actualSchedule || schedule || [];
  const totalAmount = currentSchedule.reduce((sum, item) => sum + item.amount, 0);
  const paidAmount = currentSchedule
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0);
  const remainingAmount = totalAmount - paidAmount;

  const hasDuePayments = currentSchedule.some(
    item => item.status === 'pending' || item.status === 'overdue'
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading payment information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule & Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Amount:</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Paid:</span>
              <span className="font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Remaining:</span>
              <span>{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          {/* Invoices Section */}
          {invoices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Invoices</h3>
                <Badge variant="outline">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</Badge>
              </div>

              <div className="space-y-2">
                {invoices.map((invoice) => {
                  const paidForInvoice = payments
                    .filter(p => p.payment_schedule_id && p.payment_status === 'completed')
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                  const balance = invoice.total_amount - paidForInvoice;
                  const isPaid = invoice.status === 'paid' || balance <= 0;
                  
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{invoice.invoice_number}</span>
                          {isPaid ? (
                            <Badge variant="default" className="bg-green-600 text-xs">Paid</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {formatCurrency(balance)} due
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(invoice.invoice_date)}</span>
                          {invoice.milestone_type && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{invoice.milestone_type}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(invoice.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(invoice.due_date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />
            </div>
          )}

          {/* Payment History Timeline */}
          {payments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Payment History</h3>
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div key={payment.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        payment.payment_status === 'completed' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {payment.payment_status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      {index < payments.length - 1 && (
                        <div className="w-px h-full bg-border my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.payment_method?.toUpperCase() || 'Unknown method'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}
                            className={payment.payment_status === 'completed' ? 'bg-green-600' : ''}
                          >
                            {payment.payment_status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(payment.created_at).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
            </div>
          )}

        {/* Due Payments Alert */}
        {hasDuePayments && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have payments that are due. Please make your payment to avoid delays in processing.
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Items */}
        <div className="space-y-4">
          {currentSchedule.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No payment schedule available for this order.
            </p>
          ) : (
            currentSchedule.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Due: {formatDate(payment.due_date)}
                  </p>
                  {payment.schedule_type && (
                    <p className="text-xs text-muted-foreground">
                      {payment.schedule_type.charAt(0).toUpperCase() + payment.schedule_type.slice(1)} payment
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {payment.status === 'paid' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        const invoice = await generateInvoice(payment.id);
                        if (invoice?.pdf_content) {
                          // For now, open in new window. In production, you'd serve the actual PDF
                          const newWindow = window.open('', '_blank');
                          if (newWindow) {
                            newWindow.document.write(invoice.pdf_content);
                          }
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Invoice
                    </Button>
                  ) : (
                    <PayPalPaymentButton
                      amount={payment.amount}
                      scheduleId={payment.id}
                      description={`${payment.schedule_type || 'Payment'} for order`}
                      onSuccess={handlePaymentSuccess}
                      onError={(error) => {
                        console.error('PayPal payment error:', error);
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
            ))
          )}
        </div>

          {/* Payment Info */}
          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded">
            <p>• Payments are processed securely through PayPal</p>
            <p>• Invoices will be automatically generated after payment</p>
            <p>• All amounts include GST where applicable</p>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        onPaymentSuccess={() => handlePaymentSuccess(null)}
      />
    </>
  );
};