import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Send, Eye, Clock, CheckCircle, AlertTriangle, Upload, ChevronDown, ChevronUp, Edit, FileSignature, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { OrderDetailView } from './OrderDetailView';
import { OrderDocumentManager } from './OrderDocumentManager';
import { PDFSignatureEditor } from './PDFSignatureEditor';

export function DocumentApprovalDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [uploadDialogOrderId, setUploadDialogOrderId] = useState<string | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState<'drawing' | 'customer_plan'>('drawing');
  const [editSignaturesDocId, setEditSignaturesDocId] = useState<string | null>(null);
  const [editSignaturesDocUrl, setEditSignaturesDocUrl] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
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
          shipping_address,
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
          ),
          order_items (
            id,
            quantity,
            width_mm,
            height_mm,
            depth_mm,
            drawing_approved,
            drawing_approved_by,
            drawing_approved_at,
            cabinet_types (
              name,
              product_image_url
            ),
            door_styles (name),
            colors (name),
            finishes (name)
          )
        `)
        .in('drawings_status', ['pending_upload', 'sent', 'under_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Document approvals loaded:', data?.length || 0, 'orders');
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error loading document approvals:', error);
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

  const getDocumentProgress = (order: any) => {
    const docs = order.order_documents || [];
    const approved = docs.filter((d: any) => d.status === 'approved').length;
    return { approved, total: docs.length };
  };

  const getCabinetProgress = (order: any) => {
    const items = order.order_items || [];
    const approved = items.filter((item: any) => item.drawing_approved).length;
    return { approved, total: items.length };
  };

  const toggleCabinetApproval = async (itemId: string, currentlyApproved: boolean) => {
    try {
      const { error } = await supabase.rpc('approve_cabinet_drawing', {
        p_order_item_id: itemId,
        p_approved: !currentlyApproved
      });

      if (error) throw error;

      toast({
        title: currentlyApproved ? 'Cabinet unapproved' : 'Cabinet approved',
        description: 'Drawing approval status updated'
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: 'Error updating approval',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleUploadDocument = (orderId: string, docType: 'drawing' | 'customer_plan') => {
    setUploadDialogOrderId(orderId);
    setUploadDocumentType(docType);
  };

  const handleEditSignatures = async (documentId: string, orderId: string) => {
    try {
      // Construct storage path - typically stored as {order_id}/{document_id}.pdf
      const storagePath = `${orderId}/${documentId}.pdf`;

      // Get signed URL
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600);

      if (urlError) throw urlError;

      setEditSignaturesDocId(documentId);
      setEditSignaturesDocUrl(signedUrlData.signedUrl);
      setUploadDialogOrderId(orderId); // Need this for PDFSignatureEditor
    } catch (error: any) {
      toast({
        title: 'Failed to load document',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteDocument = async (documentId: string, orderId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      // Archive the document instead of deleting
      const { error } = await supabase
        .from('order_documents')
        .update({ status: 'archived' })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Document archived',
        description: 'You can now upload a new version'
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: 'Failed to delete document',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getDocuSealButtonVariant = (order: any) => {
    if (order.drawings_status === 'pending_upload') return 'default';
    const pendingDocs = order.order_documents?.filter((d: any) => d.status !== 'approved' && d.status !== 'archived') || [];
    if (pendingDocs.length > 0 && pendingDocs[0].status === 'pending') return 'default';
    if (order.drawings_status === 'sent' || order.drawings_status === 'under_review') return 'outline';
    return 'outline';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-4 w-4" />
            Document Approval Dashboard
          </CardTitle>
          <CardDescription className="text-sm">
            Track customer drawing approvals and send reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No orders awaiting document approval
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const pendingDocs = order.order_documents?.filter((d: any) => d.status !== 'approved') || [];
                const firstSentDoc = order.order_documents?.find((d: any) => d.sent_at);
                const daysWaiting = firstSentDoc ? getDaysWaiting(firstSentDoc.sent_at) : 0;
                const cabinetProgress = getCabinetProgress(order);
                const isExpanded = expandedOrders.has(order.id);
                
                return (
                  <Card key={order.id} className="border-l-4" style={{
                    borderLeftColor: daysWaiting > 7 ? 'hsl(var(--destructive))' : 
                                     daysWaiting > 3 ? 'hsl(var(--warning))' : 
                                     'hsl(var(--muted))'
                  }}>
        <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="link"
                              className="h-auto p-0 font-semibold text-sm"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              {order.order_number}
                            </Button>
                            <Badge variant={getStatusColor(order.drawings_status, daysWaiting)} className="text-xs py-0">
                              {order.drawings_status === 'pending_upload' && <Clock className="h-3 w-3 mr-1" />}
                              {order.drawings_status === 'sent' && <Send className="h-3 w-3 mr-1" />}
                              {order.drawings_status === 'under_review' && <Eye className="h-3 w-3 mr-1" />}
                              {order.drawings_status}
                            </Badge>
                            <Badge variant="outline" className="text-xs py-0">
                              {getDocumentProgress(order).approved}/{getDocumentProgress(order).total} docs
                            </Badge>
                            <Badge variant="outline" className="text-xs py-0">
                              {cabinetProgress.approved}/{cabinetProgress.total} cabinets ✓
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.shipping_address?.name} • {order.shipping_address?.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {daysWaiting > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              {daysWaiting > 7 ? (
                                <AlertTriangle className="h-3 w-3 text-destructive" />
                              ) : (
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className={daysWaiting > 7 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                                {daysWaiting}d
                              </span>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => toggleOrderExpanded(order.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>

                          {/* Unified DocuSeal Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant={getDocuSealButtonVariant(order)}
                                className="h-7 px-2 text-xs gap-1"
                              >
                                <FileSignature className="h-3 w-3" />
                                DocuSeal
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {/* No document uploaded or pending_upload status */}
                              {(order.drawings_status === 'pending_upload' || 
                                order.order_documents?.length === 0 ||
                                order.order_documents?.every((d: any) => d.status === 'archived')) && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUploadDocument(order.id, 'drawing')}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Drawing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUploadDocument(order.id, 'customer_plan')}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Customer Plan
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Document uploaded, no signatures (pending status) */}
                              {pendingDocs.length > 0 && pendingDocs[0].status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditSignatures(pendingDocs[0].id, order.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Add Signature Fields
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteDocument(pendingDocs[0].id, order.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete & Re-upload
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Document sent or viewed */}
                              {(order.drawings_status === 'sent' || order.drawings_status === 'under_review') && 
                               pendingDocs.length > 0 && 
                               (pendingDocs[0].status === 'sent' || pendingDocs[0].status === 'viewed') && (
                                <>
                                  <DropdownMenuItem onClick={() => setSelectedOrderId(order.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Document
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditSignatures(pendingDocs[0].id, order.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Signatures
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUploadDocument(order.id, 'drawing')}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Re-upload New Version
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => sendReminder(order.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Reminder
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Expandable Cabinet List */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Cabinet Approvals:</p>
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex items-start gap-2 text-xs p-2 bg-muted/50 rounded">
                              <Checkbox
                                checked={item.drawing_approved}
                                onCheckedChange={() => toggleCabinetApproval(item.id, item.drawing_approved)}
                                className="mt-0.5"
                              />
                              {item.cabinet_types?.product_image_url && (
                                <img 
                                  src={item.cabinet_types.product_image_url} 
                                  alt={item.cabinet_types?.name || 'Cabinet'}
                                  className="w-12 h-12 object-cover rounded border flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">
                                  {item.cabinet_types?.name || 'Cabinet'} 
                                  {item.quantity > 1 && ` (×${item.quantity})`}
                                </p>
                                <p className="text-muted-foreground">
                                  {item.width_mm}W × {item.height_mm}H × {item.depth_mm}D mm
                                </p>
                                {(item.door_styles?.name || item.colors?.name) && (
                                  <p className="text-muted-foreground">
                                    {item.door_styles?.name}
                                    {item.door_styles?.name && item.colors?.name && ' • '}
                                    {item.colors?.name}
                                  </p>
                                )}
                                {item.drawing_approved_at && (
                                  <p className="text-muted-foreground italic mt-1">
                                    ✓ Approved {formatDistanceToNow(new Date(item.drawing_approved_at), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrderId && <OrderDetailView orderId={selectedOrderId} />}
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={!!uploadDialogOrderId} onOpenChange={(open) => !open && setUploadDialogOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          {uploadDialogOrderId && (
            <OrderDocumentManager 
              orderId={uploadDialogOrderId}
              documentType={uploadDocumentType}
              onDocumentUploaded={() => {
                loadOrders();
                setUploadDialogOrderId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Signatures Dialog */}
      {editSignaturesDocId && editSignaturesDocUrl && uploadDialogOrderId && (
        <PDFSignatureEditor
          documentId={editSignaturesDocId}
          orderId={uploadDialogOrderId}
          documentUrl={editSignaturesDocUrl}
          onClose={() => {
            setEditSignaturesDocId(null);
            setEditSignaturesDocUrl(null);
            setUploadDialogOrderId(null);
          }}
          onSent={() => {
            setEditSignaturesDocId(null);
            setEditSignaturesDocUrl(null);
            setUploadDialogOrderId(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
}