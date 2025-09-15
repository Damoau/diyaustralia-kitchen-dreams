import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calendar, DollarSign, Download } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { usePayPalPayment } from "@/hooks/usePayPalPayment";
import { useToast } from "@/hooks/use-toast";

interface PaymentScheduleItem {
  id: string;
  type: 'deposit' | 'progress' | 'final';
  amount: number;
  due_date: string;
  status: 'pending' | 'due' | 'paid' | 'overdue';
  paid_at: string | null;
  invoice_url: string | null;
}

interface PaymentScheduleWidgetProps {
  orderId: string;
  schedule: PaymentScheduleItem[];
  onPaymentComplete: () => void;
}

export function PaymentScheduleWidget({ orderId, schedule, onPaymentComplete }: PaymentScheduleWidgetProps) {
  const { toast } = useToast();
  const paypalPayment = usePayPalPayment();
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentScheduleItem | null>(null);

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      paid: { variant: "default" as const, text: "Paid", className: "bg-green-100 text-green-800" },
      due: { variant: "destructive" as const, text: "Due Now", className: "" },
      overdue: { variant: "destructive" as const, text: "Overdue", className: "" },
      pending: { variant: "outline" as const, text: "Pending", className: "" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant} className={config.className}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePaymentSuccess = async (details: any, scheduleId: string) => {
    try {
      toast({
        title: "Payment Successful!",
        description: `Your ${selectedPayment?.type} payment has been processed.`,
      });
      
      setSelectedPayment(null);
      onPaymentComplete();
    } catch (error: any) {
      console.error('Payment completion error:', error);
      toast({
        title: "Payment Error",
        description: "Payment was processed but there was an error updating the record. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const duePayments = schedule.filter(p => p.status === 'due' || p.status === 'overdue');
  const totalAmount = schedule.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = schedule.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Schedule
        </CardTitle>
        <CardDescription>
          Track and manage your payments for this order
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Payment Summary */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Order Value:</span>
            <span className="font-semibold">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Amount Paid:</span>
            <span className="font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span>Remaining Balance:</span>
            <span className="font-bold">{formatCurrency(totalAmount - paidAmount)}</span>
          </div>
        </div>

        {/* Due Payments Alert */}
        {duePayments.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              {duePayments.length} payment{duePayments.length > 1 ? 's' : ''} due
            </p>
            <p className="text-xs text-red-600">
              Total due: {formatCurrency(duePayments.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </div>
        )}

        <Separator />

        {/* Payment Schedule Items */}
        <div className="space-y-3">
          {schedule.map((payment, index) => (
            <div key={payment.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium capitalize">{payment.type} Payment</h4>
                  <p className="text-2xl font-bold">{formatCurrency(payment.amount)}</p>
                </div>
                {getPaymentStatusBadge(payment.status)}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due: {formatDate(payment.due_date)}
                </div>
                {payment.paid_at && (
                  <div className="text-green-600">
                    Paid: {formatDate(payment.paid_at)}
                  </div>
                )}
              </div>

              {/* Payment Actions */}
              {payment.status === 'due' || payment.status === 'overdue' ? (
                <div className="space-y-2">
                  <PayPalScriptProvider 
                    options={{
                      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                      currency: "AUD",
                      intent: "capture"
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "horizontal",
                        color: "gold",
                        shape: "rect",
                        label: "pay"
                      }}
                      createOrder={(data, actions) => {
                        return paypalPayment.createPayPalOrder({
                          amount: payment.amount,
                          currency: 'AUD',
                          description: `${payment.type} payment for order ${orderId}`,
                          orderId: orderId,
                          scheduleId: payment.id
                        });
                      }}
                      onApprove={async (data, actions) => {
                        const result = await paypalPayment.capturePayPalOrder(data.orderID!, orderId);
                        if (result.success) {
                          await handlePaymentSuccess(result, payment.id);
                        }
                      }}
                      onError={(err) => {
                        console.error('PayPal payment error:', err);
                        toast({
                          title: "Payment Error",
                          description: "There was an error processing your payment. Please try again.",
                          variant: "destructive",
                        });
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : payment.status === 'paid' && payment.invoice_url ? (
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Payment Methods Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded">
          <p>• Payments are processed securely via PayPal</p>
          <p>• Invoices are automatically generated after successful payments</p>
          <p>• GST is included in all quoted amounts</p>
        </div>
      </CardContent>
    </Card>
  );
}