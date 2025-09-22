import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface QuoteChangeRequestDialogProps {
  quoteId: string;
  onRequestSubmitted: () => void;
  children: React.ReactNode;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export const QuoteChangeRequestDialog = ({ 
  quoteId, 
  onRequestSubmitted, 
  children 
}: QuoteChangeRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [changeRequest, setChangeRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of acceptedFiles) {
        // Upload to Supabase storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(`quote-attachments/${fileName}`, file, {
            metadata: {
              owner: user?.id || 'anonymous'
            }
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(data.path);

        // Create file record
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert({
            filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_url: publicUrl,
            kind: 'attachment',
            visibility: 'private'
          })
          .select()
          .single();

        if (fileError) throw fileError;

        newFiles.push({
          id: fileRecord.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl
        });
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleSubmit = async () => {
    if (!changeRequest.trim()) {
      toast.error('Please describe the changes you would like to request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-quote-request-change', {
        body: {
          quote_id: quoteId,
          message: changeRequest.trim(),
          change_type: 'revision_request',
          file_ids: uploadedFiles.map(f => f.id)
        }
      });

      if (error) throw error;

      toast.success('Change request submitted successfully!');
      setChangeRequest('');
      setUploadedFiles([]);
      setOpen(false);
      onRequestSubmitted();
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast.error('Failed to submit change request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Request Changes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Message Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe the changes you'd like to request
            </label>
            <Textarea
              placeholder="Please be as specific as possible about the changes you need. Include measurements, colors, configurations, or any other details that will help us understand your requirements."
              value={changeRequest}
              onChange={(e) => setChangeRequest(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Attach files (optional)
            </label>
            <Card>
              <CardContent className="p-0">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm text-primary">Drop files here...</p>
                  ) : (
                    <div>
                      <p className="text-sm text-foreground mb-1">
                        Drag & drop files here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports images, PDFs, docs (max 10MB, 5 files)
                      </p>
                    </div>
                  )}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-1"></div>
                      <p className="text-xs text-muted-foreground">Uploading...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Attached Files
              </label>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !changeRequest.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};