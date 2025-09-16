// Performance utilities and optimizations

// Debounce function for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle function for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization utility
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
};

// Intersection Observer utility for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Virtual scrolling utility for large lists
export class VirtualScrollManager {
  private container: HTMLElement;
  private itemHeight: number;
  private buffer: number;
  private visibleStart = 0;
  private visibleEnd = 0;

  constructor(container: HTMLElement, itemHeight: number, buffer = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
  }

  calculateVisibleRange(scrollTop: number, containerHeight: number, totalItems: number) {
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / this.itemHeight),
      totalItems - 1
    );

    this.visibleStart = Math.max(0, visibleStart - this.buffer);
    this.visibleEnd = Math.min(totalItems - 1, visibleEnd + this.buffer);

    return {
      start: this.visibleStart,
      end: this.visibleEnd,
      offsetY: this.visibleStart * this.itemHeight,
    };
  }
}

// Image preloader for better UX
export const preloadImages = (urls: string[]): Promise<void[]> => {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });

  return Promise.all(promises);
};

// Resource hints for critical resources
export const addResourceHints = (resources: Array<{ href: string; as?: string; type?: string }>) => {
  resources.forEach(({ href, as, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    if (as) link.setAttribute('as', as);
    if (type) link.type = type;
    document.head.appendChild(link);
  });
};

// Bundle analyzer utility
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('Bundle Analysis');
    
    // Analyze loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    console.log('Loaded Scripts:', scripts.length);
    
    // Analyze CSS
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    console.log('Loaded Stylesheets:', stylesheets.length);
    
    // Memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      });
    }
    
    console.groupEnd();
  }
};

// Performance timing utility
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  return async () => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  };
};

// Critical resource loading
export const loadCriticalResources = async () => {
  // Load critical fonts
  const criticalFonts = [
    '/fonts/inter-regular.woff2',
    '/fonts/inter-medium.woff2',
  ];

  // Load critical images
  const criticalImages = [
    '/hero-image.jpg',
    '/logo.png',
  ];

  try {
    await Promise.all([
      preloadImages(criticalImages),
      // Add font preloading logic here
    ]);
  } catch (error) {
    console.warn('Failed to preload critical resources:', error);
  }
};