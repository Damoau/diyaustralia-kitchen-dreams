import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignatureCapture } from './SignatureCapture';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  orderId: string;
  onApproved?: () => void;
}

export function DocumentViewer({ orderId, onApproved }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [orderId]);

  useEffect(() => {
    if (selectedDoc) {
      loadPdfUrl(selectedDoc);
    }
  }, [selectedDoc]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('order_documents')
        .select('*')
        .eq('order_id', orderId)
        .in('status', ['sent', 'viewed', 'approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      
      if (data && data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error loading documents',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPdfUrl = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_url, 3600); // 1 hour

      if (error) throw error;
      setPdfUrl(data.signedUrl);

      // Track view
      await supabase.rpc('track_document_view', { p_document_id: doc.id });
      
      // Refresh documents to update view count
      loadDocuments();
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      toast({
        title: 'Error loading PDF',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrint = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDoc.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleApprove = () => {
    if (selectedDoc.requires_signature) {
      setShowSignature(true);
    } else {
      approveDocument();
    }
  };

  const approveDocument = async (signedPdfBlob?: Blob) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      let signatureUrl = null;

      // Upload signed PDF if provided
      if (signedPdfBlob) {
        const signedFileName = `${selectedDoc.order_id}/${selectedDoc.id}_signed.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(signedFileName, signedPdfBlob, { upsert: true });

        if (uploadError) throw uploadError;
        signatureUrl = signedFileName;
      }

      // Update document status
      const { error } = await supabase
        .from('order_documents')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          signature_url: signatureUrl
        })
        .eq('id', selectedDoc.id);

      if (error) throw error;

      toast({
        title: 'Document approved',
        description: 'Thank you for approving this document'
      });

      setShowSignature(false);
      loadDocuments();
      
      if (onApproved) {
        onApproved();
      }
    } catch (error: any) {
      toast({
        title: 'Approval failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No documents available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document List */}
      <div className="grid gap-2">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className={`cursor-pointer transition-colors ${
              selectedDoc?.id === doc.id ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedDoc(doc)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-sm text-muted-foreground">
                  Version {doc.version} • {doc.view_count} views
                </p>
              </div>
              <Badge
                variant={
                  doc.status === 'approved' ? 'default' :
                  doc.status === 'viewed' ? 'secondary' : 'outline'
                }
              >
                {doc.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                {doc.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PDF Viewer */}
      {selectedDoc && pdfUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedDoc.title}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="border rounded-lg overflow-auto max-h-[600px] bg-gray-50">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                  disabled={pageNumber >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Approve Button */}
              {selectedDoc.status !== 'approved' && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleApprove}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {selectedDoc.requires_signature ? 'Sign & Approve' : 'Approve Document'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Dialog */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
          </DialogHeader>
          <SignatureCapture
            documentId={selectedDoc?.id}
            pdfUrl={pdfUrl || ''}
            onSigned={approveDocument}
            onCancel={() => setShowSignature(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}