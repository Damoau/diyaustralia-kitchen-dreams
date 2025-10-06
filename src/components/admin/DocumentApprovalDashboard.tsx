import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Send, Eye, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DocumentApprovalDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('document-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_documents'
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          drawings_status,
          drawings_approved_at,
          created_at,
          order_documents (
            id,
            title,
            status,
            sent_at,
            last_viewed_at,
            view_count,
            approved_at
          )
        `)
        .in('drawings_status', ['pending_upload', 'sent', 'under_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading orders',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (orderId: string) => {
    try {
      // Get documents for this order
      const { data: documents } = await supabase
        .from('order_documents')
        .select('id')
        .eq('order_id', orderId)
        .in('status', ['sent', 'viewed']);

      if (!documents || documents.length === 0) {
        toast({
          title: 'No documents to remind about',
          description: 'All documents are either pending or approved',
          variant: 'destructive'
        });
        return;
      }

      // Invoke reminder function
      const { error } = await supabase.functions.invoke('send-document-reminders');

      if (error) throw error;

      toast({
        title: 'Reminder sent',
        description: 'Customer will receive an email reminder'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send reminder',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getDaysWaiting = (sentAt: string | null) => {
    if (!sentAt) return 0;
    const daysDiff = Math.floor((Date.now() - new Date(sentAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const getStatusColor = (status: string, daysWaiting: number) => {
    if (status === 'approved') return 'default';
    if (status === 'pending_upload') return 'secondary';
    if (daysWaiting > 7) return 'destructive';
    if (daysWaiting > 3) return 'outline';
    return 'secondary';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Approval Dashboard
          </CardTitle>
          <CardDescription>
            Track customer drawing approvals and send reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No orders awaiting document approval
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const pendingDocs = order.order_documents?.filter((d: any) => d.status !== 'approved') || [];
                const firstSentDoc = order.order_documents?.find((d: any) => d.sent_at);
                const daysWaiting = firstSentDoc ? getDaysWaiting(firstSentDoc.sent_at) : 0;
                
                return (
                  <Card key={order.id} className="border-l-4" style={{
                    borderLeftColor: daysWaiting > 7 ? 'hsl(var(--destructive))' : 
                                     daysWaiting > 3 ? 'hsl(var(--warning))' : 
                                     'hsl(var(--muted))'
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{order.order_number}</p>
                            <Badge variant={getStatusColor(order.drawings_status, daysWaiting)}>
                              {order.drawings_status === 'pending_upload' && (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {order.drawings_status === 'sent' && (
                                <Send className="h-3 w-3 mr-1" />
                              )}
                              {order.drawings_status === 'under_review' && (
                                <Eye className="h-3 w-3 mr-1" />
                              )}
                              {order.drawings_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.customer_email}
                          </p>
                          
                          {pendingDocs.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {pendingDocs.map((doc: any) => (
                                <div key={doc.id} className="flex items-center gap-2 text-sm">
                                  <FileText className="h-3 w-3" />
                                  <span>{doc.title}</span>
                                  {doc.status === 'viewed' && (
                                    <Badge variant="secondary" className="text-xs">
                                      {doc.view_count} views
                                    </Badge>
                                  )}
                                  {doc.last_viewed_at && (
                                    <span className="text-muted-foreground text-xs">
                                      Last viewed {formatDistanceToNow(new Date(doc.last_viewed_at), { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {daysWaiting > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              {daysWaiting > 7 ? (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={daysWaiting > 7 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                                {daysWaiting} days waiting
                              </span>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendReminder(order.id)}
                            disabled={order.drawings_status === 'pending_upload'}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}