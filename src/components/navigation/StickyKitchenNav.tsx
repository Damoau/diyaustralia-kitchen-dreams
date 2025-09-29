import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export const StickyKitchenNav = ({
  showStickyFilter = false,
  subcategories = [],
  activeSubcategory = 'all',
  onFilterChange,
  displayCategory = 'Kitchen Cabinets'
}: StickyKitchenNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on kitchen shop pages
  if (!location.pathname.startsWith('/shop/kitchen')) {
    return null;
  }

  // Only show the sticky menu when showStickyFilter is true
  if (!showStickyFilter || subcategories.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/shop/kitchen')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div className="h-4 w-px bg-border" />
          
          <Select
            value={activeSubcategory}
            onValueChange={onFilterChange}
          >
            <SelectTrigger className="w-56">
              <SelectValue>
                {activeSubcategory === "all" 
                  ? `All ${displayCategory}` 
                  : subcategories.find(s => s.name === activeSubcategory)?.display_name
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="all">All {displayCategory}</SelectItem>
              {subcategories.map((subcat) => (
                <SelectItem key={subcat.id} value={subcat.name}>
                  {subcat.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};