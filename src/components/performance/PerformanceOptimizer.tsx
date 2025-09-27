import React, { memo, useMemo, useCallback } from 'react';
import { usePerformanceMonitor, useSlowRenderDetector } from '@/hooks/usePerformanceMonitor';

// Higher-order component to add performance monitoring
export function withPerformanceMonitoring<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  displayName?: string
) {
  const PerformanceMonitoredComponent = memo((props: T) => {
    const componentName = displayName || Component.displayName || Component.name || 'Unknown';
    
    // Monitor performance
    usePerformanceMonitor(componentName);
    useSlowRenderDetector(componentName, 16); // 16ms for 60fps
    
    return <Component {...props} />;
  });
  
  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName || Component.displayName || Component.name})`;
  
  return PerformanceMonitoredComponent;
}

// Optimized list renderer for large datasets
interface VirtualizedListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 80, 
  containerHeight = 400,
  className = ""
}: VirtualizedListProps) => {
  usePerformanceMonitor('VirtualizedList');
  
  const [scrollTop, setScrollTop] = React.useState(0);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);
  
  // Render only visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleRange.startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Memoized component wrapper
export function withMemoization<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  compareProps?: (prevProps: T, nextProps: T) => boolean
) {
  const MemoizedComponent = memo(Component, compareProps);
  MemoizedComponent.displayName = `withMemoization(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

// Performance-optimized image component
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className, 
  width, 
  height, 
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  
  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);
  
  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);
  
  return (
    <div className={`relative ${className || ''}`}>
      {!imageLoaded && !imageError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className || ''}`}
        style={{ width, height }}
      />
      
      {imageError && (
        <div 
          className="flex items-center justify-center bg-gray-100 text-gray-400 text-sm"
          style={{ width, height }}
        >
          Image unavailable
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';