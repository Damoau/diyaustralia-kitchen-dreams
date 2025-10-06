import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Send, Loader2 } from 'lucide-react';
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF files are allowed',
        variant: 'destructive'
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace('.pdf', ''));
    }
  };

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
          Upload Drawing Documents
        </CardTitle>
        <CardDescription>
          Upload PDF drawings for customer approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drawing">Drawing</SelectItem>
              <SelectItem value="specification">Specification</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload">PDF File (Max 10MB)</Label>
          <Input
            id="file-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {file && (
            <Badge variant="secondary" className="mt-2">
              {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </Badge>
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