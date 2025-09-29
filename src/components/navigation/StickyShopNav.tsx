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

interface MainCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
  active: boolean;
}

interface StickyShopNavProps {
  showStickyFilter?: boolean;
  subcategories?: Subcategory[];
  activeSubcategory?: string;
  onFilterChange?: (subcategory: string) => void;
  displayCategory?: string;
  mainCategories?: MainCategory[];
  activeMainCategory?: string;
  onMainCategoryChange?: (category: string) => void;
  room?: string;
}

export const StickyShopNav = ({
  showStickyFilter = false,
  subcategories = [],
  activeSubcategory = 'all',
  onFilterChange,
  displayCategory = 'Kitchen Cabinets',
  mainCategories = [],
  activeMainCategory = '',
  onMainCategoryChange,
  room = ''
}: StickyShopNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on shop category pages (any room type)
  const shopCategoryPattern = /^\/shop\/[^\/]+\/[^\/]+/;
  if (!shopCategoryPattern.test(location.pathname)) {
    return null;
  }

  // Always show the sticky filter on category pages for better UX
  // Remove the scroll dependency to make it always visible

  return (
    <div className="sticky top-14 z-50 w-full bg-background border-b border-border">
      <div className="container px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const pathParts = location.pathname.split('/');
              if (pathParts.length >= 3) {
                const roomName = pathParts[2];
                navigate(`/shop/${roomName}`);
              } else {
                navigate('/shop');
              }
            }}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          {/* Center - Category name */}
          <h2 className="text-lg font-medium">{displayCategory}</h2>
          
          {/* Right - Filters */}
          <div className="flex items-center gap-3">
            {/* Main Category Dropdown */}
            {mainCategories.length > 0 && (
              <Select
                value={activeMainCategory}
                onValueChange={onMainCategoryChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue>
                    {mainCategories.find(c => c.name === activeMainCategory)?.display_name || displayCategory}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-[60]">
                  {mainCategories.map((mainCat) => (
                    <SelectItem key={mainCat.id} value={mainCat.name}>
                      {mainCat.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Subcategory Filter */}
            {subcategories.length > 0 && (
              <Select
                value={activeSubcategory}
                onValueChange={onFilterChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue>
                    {activeSubcategory === "all" 
                      ? `All ${displayCategory}` 
                      : subcategories.find(s => s.name === activeSubcategory)?.display_name
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-[60]">
                  <SelectItem value="all">All {displayCategory}</SelectItem>
                  {subcategories.map((subcat) => (
                    <SelectItem key={subcat.id} value={subcat.name}>
                      {subcat.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};