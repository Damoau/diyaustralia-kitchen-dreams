import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Send, Loader2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface OrderDocumentManagerProps {
  orderId: string;
  onDocumentUploaded?: () => void;
}

export function OrderDocumentManager({ orderId, onDocumentUploaded }: OrderDocumentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('drawing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: documentType === 'customer_plan' 
      ? {
          'application/pdf': ['.pdf'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
          'application/acad': ['.dwg'],
          'application/dxf': ['.dxf']
        }
      : {
          'application/pdf': ['.pdf']
        },
    maxSize: documentType === 'customer_plan' ? 20 * 1024 * 1024 : 10 * 1024 * 1024,
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file || !title) {
      toast({
        title: 'Missing information',
        description: 'Please select a file and provide a title',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      // Step 1: Get signed upload URL
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'document-sign-upload',
        {
          body: {
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
            orderId,
            documentType,
            title,
            description,
            requiresSignature
          }
        }
      );

      if (uploadError) throw uploadError;

      // Step 2: Upload file to storage
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-upsert': 'true'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      toast({
        title: 'Document uploaded',
        description: `${title} has been uploaded successfully (v${uploadData.version})`
      });

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setRequiresSignature(false);
      
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSendToCustomer = async () => {
    try {
      // Get all pending documents for this order
      const { data: documents, error } = await supabase
        .from('order_documents')
        .select('id')
        .eq('order_id', orderId)
        .eq('status', 'pending');

      if (error) throw error;

      if (!documents || documents.length === 0) {
        toast({
          title: 'No documents to send',
          description: 'Please upload documents first',
          variant: 'destructive'
        });
        return;
      }

      // Update all pending documents to 'sent'
      const { error: updateError } = await supabase
        .from('order_documents')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('status', 'pending');

      if (updateError) throw updateError;

      // Update order status
      await supabase
        .from('orders')
        .update({ drawings_status: 'sent' })
        .eq('id', orderId);

      toast({
        title: 'Documents sent',
        description: 'Customer will receive an email notification'
      });

      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (error: any) {
      toast({
        title: 'Failed to send',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Upload drawings or customer plans for approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Select value={documentType} onValueChange={(value: any) => {
            setDocumentType(value);
            setFile(null); // Reset file when type changes
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drawing">Technical Drawing</SelectItem>
              <SelectItem value="customer_plan">Customer Plan</SelectItem>
              <SelectItem value="specification">Specification</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {documentType === 'customer_plan' && (
            <p className="text-xs text-muted-foreground">
              Supports PDF, images (JPG, PNG, WEBP), and CAD files (DWG, DXF) up to 20MB
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>File Upload</Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} disabled={uploading} />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">Drop the file here...</p>
            ) : (
              <>
                <p className="text-sm font-medium mb-1">
                  Drag & drop your file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  {documentType === 'customer_plan' 
                    ? 'PDF, Images, or CAD files up to 20MB'
                    : 'PDF files up to 10MB'}
                </p>
              </>
            )}
          </div>
          {file && (
            <div className="flex items-center justify-between mt-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Document Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Kitchen Layout Drawing"
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes about this document"
            disabled={uploading}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="requires-signature">Requires Customer Signature</Label>
          <Switch
            id="requires-signature"
            checked={requiresSignature}
            onCheckedChange={setRequiresSignature}
            disabled={uploading}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || !title || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>

          <Button
            onClick={handleSendToCustomer}
            variant="default"
            disabled={uploading}
          >
            <Send className="mr-2 h-4 w-4" />
            Send to Customer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
