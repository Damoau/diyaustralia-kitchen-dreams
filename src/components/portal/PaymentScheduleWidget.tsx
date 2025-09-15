import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, AlertCircle, FileText } from 'lucide-react';
import { PayPalPaymentButton } from '@/components/checkout/PayPalPaymentButton';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schedule || schedule.length === 0) {
      loadPaymentSchedule();
    }
  }, [orderId, schedule]);

  const loadPaymentSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('order_id', orderId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedSchedule: PaymentScheduleItem[] = data.map(item => ({
          id: item.id,
          amount: item.amount,
          due_date: item.due_date || new Date().toISOString(),
          status: item.status === 'paid' ? 'paid' as const : 
                  (item.due_date && new Date(item.due_date) < new Date() ? 'overdue' as const : 'pending' as const),
          invoice_url: null, // Will be generated when needed
          schedule_type: item.schedule_type,
          payment_method: item.payment_method
        }));
        setActualSchedule(mappedSchedule);
      }
    } catch (error: any) {
      console.error('Error loading payment schedule:', error);
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
    
    // Reload the payment schedule
    await loadPaymentSchedule();
    onPaymentComplete?.(paymentData);
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Payment Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
  );
};