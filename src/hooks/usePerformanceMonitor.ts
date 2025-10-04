import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  reRenderCount: number;
  memoryUsage?: number;
}

// Hook to monitor component performance
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    reRenderCount: 0,
  });

  useEffect(() => {
    const startTime = performance.now();
    renderCountRef.current += 1;

    // Measure render time
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || undefined;

    setMetrics({
      renderTime,
      reRenderCount: renderCountRef.current,
      memoryUsage,
    });

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        reRenderCount: renderCountRef.current,
        memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
      });
    }
  });

  return metrics;
};

// Hook to detect slow renders
export const useSlowRenderDetector = (componentName: string, threshold = 16) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > threshold) {
        console.warn(`[Slow Render] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
        
        // In production, you could send this to an analytics service
        if (process.env.NODE_ENV === 'production') {
          // Example: analytics.track('slow_render', { component: componentName, renderTime });
        }
      }
    };
  });
};

// Hook to measure Core Web Vitals
export const useWebVitals = () => {
  const [vitals, setVitals] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }>({});

  useEffect(() => {
    // Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          setVitals(prev => ({ ...prev, lcp: entry.startTime }));
        }
        if (entry.entryType === 'first-contentful-paint') {
          setVitals(prev => ({ ...prev, fcp: entry.startTime }));
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'paint'] });
    } catch (error) {
      console.warn('Performance Observer not supported');
    }

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      if (clsValue > 0) {
        setVitals(prev => ({ ...prev, cls: clsValue }));
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Layout Shift Observer not supported');
    }

    // Time to First Byte
    if ('navigation' in performance && 'responseStart' in performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      setVitals(prev => ({ ...prev, ttfb }));
    }

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  return vitals;
};

// Hook for bundle size tracking
export const useBundleAnalytics = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Track loaded modules
      const modules = Object.keys(window as any).filter(key => 
        key.startsWith('__webpack') || key.startsWith('__vite')
      );
      
      console.log('[Bundle Analytics] Loaded modules:', modules.length);
    }
  }, []);
};