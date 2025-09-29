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
    <div className="sticky top-14 z-50 w-full bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Back button */}
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
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Categories</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          {/* Center - Category Title */}
          <div className="flex items-center gap-3">
            <div className="h-5 w-px bg-border/60" />
            <h2 className="text-lg font-semibold text-foreground hidden md:block">
              {displayCategory}
            </h2>
            <div className="h-5 w-px bg-border/60 hidden md:block" />
          </div>
          
          {/* Right side - Filter Controls */}
          <div className="flex items-center gap-3">
            {/* Desktop: Two-level navigation */}
            <div className="hidden md:flex items-center gap-3">
              {/* Main Category Dropdown */}
              {mainCategories.length > 0 && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    <Select
                      value={activeMainCategory}
                      onValueChange={onMainCategoryChange}
                    >
                      <SelectTrigger className="w-48 bg-card border-border/60 hover:border-border hover:bg-secondary/30 transition-colors">
                        <SelectValue>
                          {mainCategories.find(c => c.name === activeMainCategory)?.display_name || displayCategory}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 backdrop-blur-md border border-border/60 shadow-xl z-[60] rounded-lg">
                        {mainCategories.map((mainCat) => (
                          <SelectItem 
                            key={mainCat.id} 
                            value={mainCat.name}
                            className="hover:bg-secondary/50 focus:bg-secondary/50 transition-colors"
                          >
                            {mainCat.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {/* Subcategory Dropdown - only show if subcategories exist */}
              {subcategories.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Filter</label>
                  <Select
                    value={activeSubcategory}
                    onValueChange={onFilterChange}
                  >
                    <SelectTrigger className="w-56 bg-card border-border/60 hover:border-border hover:bg-secondary/30 transition-colors">
                      <SelectValue>
                        {activeSubcategory === "all" 
                          ? `All ${displayCategory}` 
                          : subcategories.find(s => s.name === activeSubcategory)?.display_name
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-md border border-border/60 shadow-xl z-[60] rounded-lg">
                      <SelectItem 
                        value="all"
                        className="hover:bg-secondary/50 focus:bg-secondary/50 transition-colors"
                      >
                        All {displayCategory}
                      </SelectItem>
                      {subcategories.map((subcat) => (
                        <SelectItem 
                          key={subcat.id} 
                          value={subcat.name}
                          className="hover:bg-secondary/50 focus:bg-secondary/50 transition-colors"
                        >
                          {subcat.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Mobile: Compact layout */}
            <div className="md:hidden flex items-center gap-2">
              {subcategories.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Filter</label>
                  <Select
                    value={activeSubcategory}
                    onValueChange={onFilterChange}
                  >
                    <SelectTrigger className="w-48 bg-card border-border/60 hover:border-border hover:bg-secondary/30 transition-colors">
                      <SelectValue>
                        {activeSubcategory === "all" 
                          ? `All ${displayCategory}` 
                          : subcategories.find(s => s.name === activeSubcategory)?.display_name
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-md border border-border/60 shadow-xl z-[60] rounded-lg">
                      <SelectItem 
                        value="all"
                        className="hover:bg-secondary/50 focus:bg-secondary/50 transition-colors"
                      >
                        All {displayCategory}
                      </SelectItem>
                      {subcategories.map((subcat) => (
                        <SelectItem 
                          key={subcat.id} 
                          value={subcat.name}
                          className="hover:bg-secondary/50 focus:bg-secondary/50 transition-colors"
                        >
                          {subcat.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground">{displayCategory}</span>
                  <div className="text-xs text-muted-foreground">Browse all products</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};