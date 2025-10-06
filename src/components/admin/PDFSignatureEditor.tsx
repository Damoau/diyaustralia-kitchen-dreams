import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Document, Page, pdfjs } from 'react-pdf';
import { Canvas as FabricCanvas, Rect, FabricText } from 'fabric';
import { MousePointer, Type, Trash2, Send, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFSignatureEditorProps {
  documentId: string;
  orderId: string;
  documentUrl: string;
  onClose: () => void;
  onSent: () => void;
}

interface SignatureBox {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'signature' | 'date' | 'text';
  label: string;
  page: number;
}

export function PDFSignatureEditor({ documentId, orderId, documentUrl, onClose, onSent }: PDFSignatureEditorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [tool, setTool] = useState<'select' | 'signature' | 'date' | 'text'>('select');
  const [signatureBoxes, setSignatureBoxes] = useState<SignatureBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStartPos, setDrawingStartPos] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const drawingRectRef = useRef<Rect | null>(null);
  const { toast } = useToast();

  // Initialize canvas after PDF loads
  useEffect(() => {
    if (!canvasRef.current || !pageRef.current) return;

    // Wait a bit for PDF to fully render
    const timer = setTimeout(() => {
      const fabricCanvas = new FabricCanvas(canvasRef.current!, {
        width: pageRef.current!.offsetWidth,
        height: pageRef.current!.offsetHeight,
        selection: true,
      });

      setCanvas(fabricCanvas);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (canvas) {
        canvas.dispose();
      }
    };
  }, [currentPage, scale]);

  useEffect(() => {
    if (!canvas) return;
    canvas.isDrawingMode = false;
    canvas.selection = tool === 'select';
    
    // Handle drag-to-create for signature tools
    if (tool !== 'select') {
      canvas.defaultCursor = 'crosshair';
      
      const handleMouseDown = (e: any) => {
        if (!e.pointer) return;
        setIsDrawing(true);
        setDrawingStartPos({ x: e.pointer.x, y: e.pointer.y });

        const rect = new Rect({
          left: e.pointer.x,
          top: e.pointer.y,
          fill: 'rgba(59, 130, 246, 0.2)',
          stroke: '#3b82f6',
          strokeWidth: 2,
          width: 0,
          height: 0,
          strokeDashArray: [5, 5],
          selectable: false,
        });

        drawingRectRef.current = rect;
        canvas.add(rect);
      };

      const handleMouseMove = (e: any) => {
        if (!isDrawing || !drawingStartPos || !drawingRectRef.current || !e.pointer) return;

        const width = Math.abs(e.pointer.x - drawingStartPos.x);
        const height = Math.abs(e.pointer.y - drawingStartPos.y);
        const left = Math.min(drawingStartPos.x, e.pointer.x);
        const top = Math.min(drawingStartPos.y, e.pointer.y);

        drawingRectRef.current.set({ left, top, width, height });
        canvas.renderAll();
      };

      const handleMouseUp = (e: any) => {
        if (!isDrawing || !drawingStartPos || !drawingRectRef.current || !e.pointer) return;

        const width = Math.abs(e.pointer.x - drawingStartPos.x);
        const height = Math.abs(e.pointer.y - drawingStartPos.y);

        // Only create if drag is significant (at least 20px)
        if (width > 20 && height > 20) {
          const left = Math.min(drawingStartPos.x, e.pointer.x);
          const top = Math.min(drawingStartPos.y, e.pointer.y);

          // Remove temporary rect
          canvas.remove(drawingRectRef.current);

          // Create final signature box
          const label = tool === 'signature' ? 'Sign Here' : tool === 'date' ? 'Date' : 'Text Field';

          const finalRect = new Rect({
            left,
            top,
            fill: 'rgba(59, 130, 246, 0.2)',
            stroke: '#3b82f6',
            strokeWidth: 2,
            width,
            height,
            strokeDashArray: [5, 5],
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockRotation: true,
          });

          const text = new FabricText(label, {
            left: left + 5,
            top: top + (height / 2) - 7,
            fontSize: 14,
            fill: '#1e40af',
            selectable: false,
            evented: false,
          });

          canvas.add(finalRect);
          canvas.add(text);
          canvas.setActiveObject(finalRect);

          // Link text to rect movement and scaling
          finalRect.on('moving', () => {
            text.set({
              left: (finalRect.left || 0) + 5,
              top: (finalRect.top || 0) + ((finalRect.height || height) / 2) - 7,
            });
          });

          finalRect.on('scaling', () => {
            text.set({
              left: (finalRect.left || 0) + 5,
              top: (finalRect.top || 0) + ((finalRect.height || height) * (finalRect.scaleY || 1) / 2) - 7,
            });
          });

          canvas.on('object:modified', () => {
            canvas.renderAll();
          });

          const box: SignatureBox = {
            x: left,
            y: top,
            width,
            height,
            type: tool as 'signature' | 'date' | 'text',
            label,
            page: currentPage,
          };

          setSignatureBoxes(prev => [...prev, box]);
          toast({
            title: 'Field added',
            description: `${label} field added to page ${currentPage}`,
          });
        } else {
          // Remove temporary rect if drag was too small
          canvas.remove(drawingRectRef.current);
        }

        setIsDrawing(false);
        setDrawingStartPos(null);
        drawingRectRef.current = null;
        setTool('select'); // Return to select mode after placing
      };

      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);

      console.log(`Canvas in ${tool.toUpperCase()} mode - drag to create field`);

      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      };
    } else {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      // Make sure all objects are selectable in select mode
      canvas.forEachObject((obj) => {
        if (obj.type === 'rect') {
          obj.selectable = true;
          obj.evented = true;
        }
      });
      console.log('Canvas in SELECT mode - objects should be draggable');
    }
    canvas.renderAll();
  }, [tool, canvas, isDrawing, drawingStartPos, currentPage, toast]);

  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    setSignatureBoxes([]);
  };

  const saveAnnotations = async () => {
    if (signatureBoxes.length === 0) {
      toast({
        title: 'No signature boxes',
        description: 'Please add at least one signature box before sending',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Save annotations to database
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('document_annotations')
        .insert({
          document_id: documentId,
          user_id: userData.user?.id || '',
          page_number: currentPage,
          annotation_type: 'signature_fields',
          annotation_data: { boxes: signatureBoxes } as any,
        });

      if (error) throw error;

      // Update document status to 'sent'
      const { error: updateError } = await supabase
        .from('order_documents')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Update order status
      await supabase
        .from('orders')
        .update({ drawings_status: 'sent' })
        .eq('id', orderId);

      toast({
        title: 'Document sent',
        description: 'Customer will receive an email to review and sign',
      });

      onSent();
      onClose();
    } catch (error: any) {
      console.error('Error saving annotations:', error);
      toast({
        title: 'Failed to send document',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Signature Fields</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Toolbar */}
          <Card className="w-48 p-4 space-y-2 flex-shrink-0">
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
                onClick={clearCanvas}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </Card>

          {/* PDF Viewer with Canvas Overlay */}
          <div className="flex-1 overflow-auto border rounded-lg bg-muted/20">
            <div className="relative inline-block" ref={pageRef}>
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
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-auto"
                style={{ zIndex: 10 }}
              />
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
              {signatureBoxes.length} signature field(s) added
            </div>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveAnnotations} disabled={loading || signatureBoxes.length === 0}>
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
  );
}
