import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Subcategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
  active: boolean;
}

interface StickyKitchenNavProps {
  showStickyFilter?: boolean;
  subcategories?: Subcategory[];
  activeSubcategory?: string;
  onFilterChange?: (subcategory: string) => void;
  displayCategory?: string;
  filteredCount?: number;
}

export const StickyKitchenNav = ({
  showStickyFilter = false,
  subcategories = [],
  activeSubcategory = 'all',
  onFilterChange,
  displayCategory = 'Kitchen Cabinets',
  filteredCount = 0
}: StickyKitchenNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on kitchen shop pages
  if (!location.pathname.startsWith('/shop/kitchen')) {
    return null;
  }

  const getCurrentCategory = () => {
    // Extract category from pathname
    const pathParts = location.pathname.split('/');
    if (pathParts[3]) {
      return pathParts[3].split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return displayCategory;
  };

  return (
    <>
      {/* Regular Navigation Row - Not Sticky */}
      <div className="w-full border-b bg-background">
        <div className="container flex h-12 items-center justify-between px-4">
          {/* Left side - Back and current category */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/shop/kitchen')}
              className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-medium text-foreground">
              {getCurrentCategory()}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Filter Row Only */}
      {showStickyFilter && subcategories.length > 0 && (
        <div className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Filter:</span>
              <Select
                value={activeSubcategory}
                onValueChange={onFilterChange}
              >
                <SelectTrigger className="w-48 h-8">
                  <SelectValue>
                    {activeSubcategory === "all" 
                      ? `All ${displayCategory}` 
                      : subcategories.find(s => s.name === activeSubcategory)?.display_name
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {displayCategory}</SelectItem>
                  {subcategories.map((subcat) => (
                    <SelectItem key={subcat.id} value={subcat.name}>
                      {subcat.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="ml-auto text-xs">
                {filteredCount} products
              </Badge>
            </div>
          </div>
        </div>
      )}
    </>
  );
};