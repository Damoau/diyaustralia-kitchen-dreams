import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  value,
  onChange,
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cabinet-${Date.now()}.${fileExt}`;
      const filePath = `cabinet-types/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('door-style-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('door-style-images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif']
    },
    multiple: false
  });

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className={className}>
      {value ? (
        <Card className="relative p-4">
          <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
            <img
              src={value}
              alt="Cabinet preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card
          {...getRootProps()}
          className={`border-dashed border-2 p-8 cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className={`rounded-full p-4 ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 
                 isDragActive ? 'Drop image here' : 'Drag & drop cabinet image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
            {!isUploading && (
              <Button type="button" variant="outline" size="sm">
                Choose File
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};