import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { debounce } from '@/lib/performance';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: ({ index, data }: { index: number; data: T[] }) => React.ReactElement;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualizedListProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(Math.ceil(height / itemHeight));
  
  // Memoize filtered items to prevent unnecessary re-renders
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    return items.filter((item: any) => {
      // Generic search - adapt based on your data structure
      const searchableString = typeof item === 'string' 
        ? item 
        : JSON.stringify(item).toLowerCase();
      return searchableString.includes(searchTerm.toLowerCase());
    });
  }, [items, searchTerm]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(filteredItems.length, visibleEnd + overscan);
    return filteredItems.slice(start, end).map((item, index) => ({
      item,
      index: start + index
    }));
  }, [filteredItems, visibleStart, visibleEnd, overscan]);

  // Handle scroll
  const handleScroll = useCallback(
    debounce((e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const newVisibleStart = Math.floor(scrollTop / itemHeight);
      const newVisibleEnd = newVisibleStart + Math.ceil(height / itemHeight);
      
      setVisibleStart(newVisibleStart);
      setVisibleEnd(newVisibleEnd);
    }, 16),
    [itemHeight, height]
  );

  const containerHeight = filteredItems.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: containerHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => 
            renderItem({ index, data: filteredItems })
          )}
        </div>
      </div>
    </div>
  );
}

// Example usage component for cabinet types
interface CabinetTypeItemProps {
  index: number;
  data: any[];
}

export const CabinetTypeItem: React.FC<CabinetTypeItemProps> = ({ index, data }) => {
  const item = data[index];
  
  return (
    <div className="flex items-center p-4 border-b border-border hover:bg-muted/50">
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-muted-foreground">{item.category}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm">
          {item.default_width_mm}×{item.default_height_mm}×{item.default_depth_mm}
        </p>
      </div>
    </div>
  );
};

// Simple infinite loading list implementation
interface InfiniteListProps<T> {
  items: T[];
  loadMore: () => Promise<void>;
  hasNextPage: boolean;
  isLoading: boolean;
  height: number;
  itemHeight: number;
  renderItem: ({ index, data }: { index: number; data: T[] }) => React.ReactElement;
}

export function InfiniteList<T>(props: InfiniteListProps<T>) {
  const { items, loadMore, hasNextPage, isLoading, height, itemHeight, renderItem } = props;
  
  const handleScroll = useCallback(
    debounce((e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - itemHeight * 5 && hasNextPage && !isLoading) {
        loadMore();
      }
    }, 100),
    [loadMore, hasNextPage, isLoading, itemHeight]
  );

  return (
    <div 
      className="overflow-auto"
      style={{ height }}
      onScroll={handleScroll}
    >
      {items.map((_, index) => renderItem({ index, data: items }))}
      {hasNextPage && (
        <div className="flex items-center justify-center p-4">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <p className="text-muted-foreground">Load more...</p>
          )}
        </div>
      )}
    </div>
  );
}