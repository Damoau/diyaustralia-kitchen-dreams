import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  loadingClassName?: string;
  errorClassName?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className,
  loadingClassName,
  errorClassName,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoading(false);
    setIsError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder/Loading state */}
      {isLoading && (
        <div 
          className={cn(
            "absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center",
            loadingClassName
          )}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={isVisible ? (isError ? fallbackSrc : src) : undefined}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          isError && errorClassName,
          className
        )}
        {...props}
      />
    </div>
  );
};

// Optimized image component for product images
export const ProductImage: React.FC<LazyImageProps> = (props) => {
  return (
    <LazyImage
      {...props}
      className={cn("w-full h-full object-cover", props.className)}
      loadingClassName="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
      errorClassName="bg-gray-100 dark:bg-gray-800"
    />
  );
};

// Optimized avatar component
export const AvatarImage: React.FC<LazyImageProps> = (props) => {
  return (
    <LazyImage
      {...props}
      className={cn("w-10 h-10 rounded-full object-cover", props.className)}
      loadingClassName="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full"
      errorClassName="bg-gray-200 dark:bg-gray-700 rounded-full"
    />
  );
};