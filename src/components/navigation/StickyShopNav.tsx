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

  // Don't clean category names for main category dropdown - show full names
  // Only clean for the center title and subcategory filters
  const cleanDisplayCategory = displayCategory?.replace(/^(Base|Wall|Tall|Pantry)\s+/i, '') || 'Cabinets';

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
          
          {/* Center - Empty space (removed category title) */}
          <div className="hidden md:block"></div>
          
          {/* Right - Filters */}
          <div className="flex items-center gap-3">
            {/* Desktop: Both dropdowns */}
            <div className="hidden md:flex items-center gap-3">
              {/* Main Category Dropdown */}
              {mainCategories.length > 0 && (
                <Select
                  value={activeMainCategory}
                  onValueChange={onMainCategoryChange}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue className="text-center">
                      {mainCategories.find(c => c.name === activeMainCategory)?.display_name || displayCategory}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[60]">
                    {mainCategories.map((mainCat) => (
                      <SelectItem key={mainCat.id} value={mainCat.name} className="text-center">
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
                    <SelectValue className="text-center">
                      {activeSubcategory === "all" 
                        ? "All" 
                        : subcategories.find(s => s.name === activeSubcategory)?.display_name
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[60]">
                    <SelectItem value="all" className="text-center">All</SelectItem>
                    {subcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={subcat.name} className="text-center">
                        {subcat.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Mobile: Only subcategory filter */}
            <div className="md:hidden">
              {subcategories.length > 0 ? (
                <Select
                  value={activeSubcategory}
                  onValueChange={onFilterChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue className="text-center">
                      {activeSubcategory === "all" 
                        ? "All" 
                        : subcategories.find(s => s.name === activeSubcategory)?.display_name
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-[60]">
                    <SelectItem value="all" className="text-center">All</SelectItem>
                    {subcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={subcat.name} className="text-center">
                        {subcat.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm font-medium">{cleanDisplayCategory}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};