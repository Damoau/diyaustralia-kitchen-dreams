import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface AdminReplyWithAttachmentsProps {
  onSendReply: (message: string, fileIds: string[]) => Promise<void>;
  sending: boolean;
  disabled?: boolean;
}

export const AdminReplyWithAttachments = ({ 
  onSendReply, 
  sending, 
  disabled = false 
}: AdminReplyWithAttachmentsProps) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
          .upload(`admin-attachments/${fileName}`, file, {
            metadata: {
              owner: 'admin'
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

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message.');
      return;
    }

    try {
      await onSendReply(replyMessage.trim(), uploadedFiles.map(f => f.id));
      setReplyMessage('');
      setUploadedFiles([]);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Send Reply</h4>
      
      {/* Message Input */}
      <Textarea
        placeholder="Type your reply to the customer..."
        value={replyMessage}
        onChange={(e) => setReplyMessage(e.target.value)}
        rows={3}
        disabled={disabled}
      />

      {/* File Upload Area */}
      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={disabled} />
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-primary">Drop files here...</p>
            ) : (
              <div>
                <p className="text-sm text-foreground mb-1">
                  Attach files (optional)
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse (max 10MB, 5 files)
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

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Attached Files</label>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2 border rounded-lg">
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
                className="flex-shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSendReply}
          disabled={!replyMessage.trim() || sending || disabled || isUploading}
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </div>
  );
};