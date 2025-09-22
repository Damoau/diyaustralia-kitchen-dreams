import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileData {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  storage_url: string;
}

interface FileAttachmentListProps {
  fileIds: string[];
  className?: string;
}

export const FileAttachmentList = ({ fileIds, className }: FileAttachmentListProps) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fileIds && fileIds.length > 0) {
      loadFiles();
    } else {
      setLoading(false);
    }
  }, [fileIds]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('id, filename, file_size, mime_type, storage_url')
        .in('id', fileIds);

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading file attachments:', error);
      toast.error('Failed to load file attachments');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const handleFileClick = (file: FileData) => {
    // For images, try to preview, for others download
    if (file.mime_type.startsWith('image/')) {
      window.open(file.storage_url, '_blank');
    } else {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = file.storage_url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="text-xs text-muted-foreground">Loading attachments...</div>
      </div>
    );
  }

  if (!fileIds || fileIds.length === 0 || files.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-medium text-muted-foreground">
        Attachments ({files.length})
      </div>
      <div className="space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border"
          >
            <div className="flex-shrink-0 text-muted-foreground">
              {getFileIcon(file.mime_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{file.filename}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.file_size)}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleFileClick(file)}
              className="flex-shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-primary"
              title={file.mime_type.startsWith('image/') ? 'View image' : 'Download file'}
            >
              {file.mime_type.startsWith('image/') ? (
                <Eye className="w-3 h-3" />
              ) : (
                <Download className="w-3 h-3" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};