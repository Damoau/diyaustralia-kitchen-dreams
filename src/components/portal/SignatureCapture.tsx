import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { PDFDocument } from 'pdf-lib';
import { Loader2 } from 'lucide-react';

interface SignatureCaptureProps {
  documentId: string;
  pdfUrl: string;
  onSigned: (signedPdfBlob: Blob) => void;
  onCancel: () => void;
}

export function SignatureCapture({ pdfUrl, onSigned, onCancel }: SignatureCaptureProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [processing, setProcessing] = useState(false);

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert('Please provide a signature');
      return;
    }

    setProcessing(true);

    try {
      // Get signature as PNG data URL
      const signatureDataUrl = sigCanvas.current.toDataURL('image/png');
      
      // Fetch original PDF
      const pdfResponse = await fetch(pdfUrl);
      const pdfBytes = await pdfResponse.arrayBuffer();
      
      // Load PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Embed signature image
      const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      
      // Add signature to last page
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();
      
      // Draw signature in bottom right
      lastPage.drawImage(signatureImage, {
        x: width - 220,
        y: 30,
        width: 200,
        height: 60,
      });
      
      // Add signature text
      lastPage.drawText(`Digitally signed on ${new Date().toLocaleDateString()}`, {
        x: width - 220,
        y: 20,
        size: 8,
      });
      
      // Save modified PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedPdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      onSigned(signedPdfBlob);
    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Failed to sign document. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-4">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas w-full h-40 border rounded',
            style: { width: '100%', height: '160px' }
          }}
          backgroundColor="rgb(255, 255, 255)"
        />
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Sign above using your mouse or touchscreen
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={processing}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSign}
          disabled={processing}
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing...
            </>
          ) : (
            'Sign & Approve'
          )}
        </Button>
      </div>
    </div>
  );
}