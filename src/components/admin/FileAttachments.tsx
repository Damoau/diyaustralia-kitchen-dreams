import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Image, Trash2, Download, Eye } from 'lucide-react';

interface FileAttachment {
  id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  storage_url: string;
  created_at: string;
}

interface FileAttachmentsProps {
  scope: string;
  scopeId: string;
  onFilesChange?: (files: FileAttachment[]) => void;
}

export const FileAttachments = ({ scope, scopeId, onFilesChange }: FileAttachmentsProps) => {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadFiles = useCallback(async () => {
    try {
      const { data: attachments, error } = await supabase
        .from('file_attachments')
        .select(`
          file_id,
          files (
            id,
            filename,
            mime_type,
            file_size,
            storage_url,
            created_at
          )
        `)
        .eq('scope', scope)
        .eq('scope_id', scopeId);

      if (error) throw error;

      const fileList = attachments?.map(att => att.files).filter(Boolean) || [];
      setFiles(fileList as FileAttachment[]);
      onFilesChange?.(fileList as FileAttachment[]);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }, [scope, scopeId, onFilesChange]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${scope}/${scopeId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Create file record
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert({
            filename: file.name,
            mime_type: file.type,
            file_size: file.size,
            storage_url: publicUrl,
            kind: 'document',
            visibility: 'private',
            owner_user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (fileError) throw fileError;

        // Create attachment
        const { error: attachError } = await supabase.functions.invoke('files-attach', {
          body: {
            file_id: fileRecord.id,
            scope,
            scope_id: scopeId
          }
        });

        if (attachError) throw attachError;
      }

      toast({
        title: "Success",
        description: `${acceptedFiles.length} file(s) uploaded successfully`
      });

      await loadFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [scope, scopeId, toast, loadFiles]);

  const deleteFile = async (fileId: string) => {
    try {
      // Delete file attachment
      const { error: attachError } = await supabase
        .from('file_attachments')
        .delete()
        .eq('file_id', fileId)
        .eq('scope', scope)
        .eq('scope_id', scopeId);

      if (attachError) throw attachError;

      // Delete file record (storage file will be cleaned up by trigger)
      const { error: fileError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (fileError) throw fileError;

      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error", 
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (file: FileAttachment) => {
    try {
      const response = await fetch(file.storage_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip']
    }
  });

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {uploading ? (
              <p>Uploading files...</p>
            ) : isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-gray-500">
                  Supports: Images, PDFs, Documents, Drawings (Max 20MB each)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium mb-4">Attached Files ({files.length})</h4>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.mime_type)}
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatFileSize(file.file_size)}</span>
                        <Badge variant="outline">{file.mime_type.split('/')[1]?.toUpperCase()}</Badge>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.mime_type.startsWith('image/') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.storage_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFile(file.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};