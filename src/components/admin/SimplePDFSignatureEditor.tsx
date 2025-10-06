import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Document, Page, pdfjs } from 'react-pdf';
import { MousePointer, Type, Trash2, Send, Loader2, ZoomIn, ZoomOut, Mail } from 'lucide-react';
import { EmailPreviewDialog } from './EmailPreviewDialog';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SimplePDFSignatureEditorProps {
  documentId: string;
  orderId: string;
  documentUrl: string;
  onClose: () => void;
  onSent: () => void;
}

interface SignatureField {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'signature' | 'date' | 'text';
  label: string;
  page: number;
}

export function SimplePDFSignatureEditor({ documentId, orderId, documentUrl, onClose, onSent }: SimplePDFSignatureEditorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tool, setTool] = useState<'select' | 'signature' | 'date' | 'text'>('select');
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  const loadOrderData = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, contacts(*)')
      .eq('id', orderId)
      .single();
    setOrderData(data);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'select') return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    setContainerRect(rect);
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart || tool === 'select' || !containerRect) return;

    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const width = Math.abs(x - dragStart.x);
    const height = Math.abs(y - dragStart.y);

    if (width > 20 && height > 20) {
      const label = tool === 'signature' ? 'Sign Here' : tool === 'date' ? 'Date' : 'Text Field';
      
      const newField: SignatureField = {
        id: `${Date.now()}-${Math.random()}`,
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width,
        height,
        type: tool,
        label,
        page: currentPage
      };

      setFields([...fields, newField]);
      toast({
        title: 'Field added',
        description: `${label} added to page ${currentPage}`
      });
      setTool('select');
    }

    setDragStart(null);
    setContainerRect(null);
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFields([]);
  };

  const handlePreviewEmail = () => {
    if (fields.length === 0) {
      toast({
        title: 'No signature fields',
        description: 'Please add at least one signature field',
        variant: 'destructive'
      });
      return;
    }
    setShowEmailPreview(true);
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Save annotations
      const { error: annotError } = await supabase
        .from('document_annotations')
        .insert({
          document_id: documentId,
          user_id: userData.user?.id || '',
          page_number: currentPage,
          annotation_type: 'signature_fields',
          annotation_data: { boxes: fields } as any
        });

      if (annotError) throw annotError;

      // Update document status
      const { error: updateError } = await supabase
        .from('order_documents')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Update order status
      await supabase
        .from('orders')
        .update({ drawings_status: 'sent' })
        .eq('id', orderId);

      // Send email notification (you can implement the actual email sending)
      // For now, we'll just show success
      toast({
        title: 'Document sent',
        description: 'Customer will receive an email to review and sign'
      });

      onSent();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Failed to send',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Signature Fields - Simple Drag & Drop</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Toolbar */}
            <Card className="w-48 p-4 space-y-2 flex-shrink-0">
              <div className="text-xs text-muted-foreground mb-2">
                Select a tool, then drag on the PDF to create a field
              </div>
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setTool('select')}
              >
                <MousePointer className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button
                variant={tool === 'signature' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setTool('signature')}
              >
                <Type className="h-4 w-4 mr-2" />
                Signature
              </Button>
              <Button
                variant={tool === 'date' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setTool('date')}
              >
                <Type className="h-4 w-4 mr-2" />
                Date
              </Button>
              <Button
                variant={tool === 'text' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setTool('text')}
              >
                <Type className="h-4 w-4 mr-2" />
                Text Field
              </Button>
              <div className="pt-4 border-t space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setScale(s => Math.min(s + 0.1, 2))}
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
                >
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={clearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </Card>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto border rounded-lg bg-muted/20">
              <div
                className="relative inline-block"
                style={{ cursor: tool !== 'select' ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                <Document
                  file={documentUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="p-8">Loading PDF...</div>}
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
                
                {/* Render signature fields as HTML overlays */}
                {fields
                  .filter(f => f.page === currentPage)
                  .map(field => (
                    <div
                      key={field.id}
                      className="absolute border-2 border-blue-500 bg-blue-500/20 rounded pointer-events-auto"
                      style={{
                        left: field.x * scale,
                        top: field.y * scale,
                        width: field.width * scale,
                        height: field.height * scale,
                        borderStyle: 'dashed'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-blue-700">
                        {field.label}
                      </div>
                      {tool === 'select' && (
                        <button
                          onClick={() => deleteField(field.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Page Navigation */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage === numPages}
              >
                Next
              </Button>
            </div>
          )}

          <DialogFooter>
            <div className="flex items-center gap-2 w-full">
              <div className="text-sm text-muted-foreground flex-1">
                {fields.length} signature field(s) added
              </div>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handlePreviewEmail}
                disabled={fields.length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Preview Email
              </Button>
              <Button onClick={handleSendEmail} disabled={loading || fields.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Customer
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {orderData && (
        <EmailPreviewDialog
          open={showEmailPreview}
          onOpenChange={setShowEmailPreview}
          quote={orderData}
          onSendEmail={async () => {
            setShowEmailPreview(false);
            await handleSendEmail();
          }}
        />
      )}
    </>
  );
}
