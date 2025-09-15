import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  MoreHorizontal,
  ArrowUpDown,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface Filter {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
  onPageChange?: (page: number) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  filters?: Filter[];
  onFilterChange?: (filters: Filter[]) => void;
  actions?: {
    label: string;
    onClick: (item: T) => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive';
  }[];
  bulkActions?: {
    label: string;
    onClick: (items: T[]) => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive';
  }[];
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  pagination,
  onPageChange,
  onSort,
  filters = [],
  onFilterChange,
  actions = [],
  bulkActions = [],
  emptyState,
  className,
}: DataTableProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localFilters, setLocalFilters] = React.useState<Filter[]>(filters);
  const [searchQuery, setSearchQuery] = React.useState(
    searchParams.get('search') || ''
  );

  const isAllSelected = selectable && selectedItems.length === data.length && data.length > 0;
  const isPartiallySelected = selectable && selectedItems.length > 0 && selectedItems.length < data.length;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data);
    }
  };

  const handleSelectItem = (item: T) => {
    if (!onSelectionChange) return;
    
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    if (isSelected) {
      onSelectionChange(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  const handleSort = (key: keyof T) => {
    if (!onSort) return;
    
    const currentSort = searchParams.get('sort');
    const currentOrder = searchParams.get('order') as 'asc' | 'desc';
    
    if (currentSort === key) {
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      onSort(key, newOrder);
    } else {
      onSort(key, 'asc');
    }
  };

  const handleFilterChange = (updatedFilters: Filter[]) => {
    setLocalFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const removeFilter = (filterKey: string) => {
    const updated = localFilters.filter(f => f.key !== filterKey);
    handleFilterChange(updated);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-muted animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {localFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                {columns
                  .filter(col => col.filterable)
                  .map(col => (
                    <DropdownMenuItem
                      key={col.key as string}
                      onClick={() => {
                        // Add filter logic here
                      }}
                    >
                      {col.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bulk Actions */}
          {selectable && selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} selected
              </span>
              {bulkActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  onClick={() => action.onClick(selectedItems)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Active Filters */}
        {localFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {localFilters.map((filter) => (
              <Badge key={filter.key} variant="secondary" className="gap-1">
                {filter.label}: {filter.value}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => removeFilter(filter.key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key as string}
                  style={{ width: column.width }}
                  className={cn(
                    column.sortable && "cursor-pointer select-none hover:bg-muted/50"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-12">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="text-center py-8"
                >
                  {emptyState || (
                    <div className="text-muted-foreground">
                      <p>No data available</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.some(selected => selected.id === item.id)}
                        onCheckedChange={() => handleSelectItem(item)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key as string}>
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '-')}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={() => action.onClick(item)}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
            {pagination.totalItems} entries
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}