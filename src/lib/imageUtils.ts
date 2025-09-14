/**
 * Utility functions for image compression and optimization
 */

interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compresses an image file to reduce file size
 */
export const compressImage = async (
  file: File, 
  options: CompressImageOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = calculateNewDimensions(
          img.naturalWidth, 
          img.naturalHeight, 
          maxWidth, 
          maxHeight
        );

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file with compressed data
            const compressedFile = new File(
              [blob], 
              getCompressedFileName(file.name, format), 
              { 
                type: format,
                lastModified: Date.now()
              }
            );

            console.log(`Image compressed: ${file.size} bytes → ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
            resolve(compressedFile);
          },
          format,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
const calculateNewDimensions = (
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // If image is larger than max dimensions, scale it down
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
};

/**
 * Generate a new filename with the compressed format extension
 */
const getCompressedFileName = (originalName: string, format: string): string => {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const extension = format.split('/')[1];
  return `${nameWithoutExt}_compressed.${extension}`;
};

/**
 * Validate if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Get optimal compression settings based on file size
 */
export const getOptimalCompressionSettings = (fileSize: number): CompressImageOptions => {
  // For very large files, use more aggressive compression
  if (fileSize > 5 * 1024 * 1024) { // > 5MB
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.6,
      format: 'image/jpeg'
    };
  }
  
  // For medium files, moderate compression
  if (fileSize > 2 * 1024 * 1024) { // > 2MB
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.7,
      format: 'image/jpeg'
    };
  }
  
  // For smaller files, light compression
  return {
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.8,
    format: 'image/jpeg'
  };
};