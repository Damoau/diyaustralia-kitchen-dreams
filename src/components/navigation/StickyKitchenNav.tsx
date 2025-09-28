import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChevronLeft } from 'lucide-react';
import { CartDrawer } from '@/components/ui/cart-drawer';

interface KitchenCategory {
  name: string;
  path: string;
  description: string;
}

const kitchenCategories: KitchenCategory[] = [
  {
    name: 'Base Cabinets',
    path: '/shop/kitchen/base-cabinets',
    description: 'Floor-mounted storage solutions'
  },
  {
    name: 'Top Cabinets',
    path: '/shop/kitchen/top-cabinets',
    description: 'Wall-mounted upper storage'
  },
  {
    name: 'Pantry Cabinets',
    path: '/shop/kitchen/pantry-cabinets',
    description: 'Tall storage solutions'
  },
  {
    name: 'Dress Panels & Fillers',
    path: '/shop/kitchen/dress-panels-fillers',
    description: 'Finishing panels and fillers'
  }
];

export const StickyKitchenNav = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on kitchen shop pages
  if (!location.pathname.startsWith('/shop/kitchen')) {
    return null;
  }

  const handleNavigation = (path: string) => {
    navigate(path);
    setSheetOpen(false);
  };

  const getCurrentCategory = () => {
    const category = kitchenCategories.find(cat => 
      location.pathname.includes(cat.path.split('/').pop() || '')
    );
    return category?.name || 'Kitchen Cabinets';
  };

  return (
    <div className="sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

        {/* Right side - Cart and hamburger menu */}
        <div className="flex items-center space-x-2">
          <CartDrawer>
            <Button variant="outline" size="sm" className="relative">
              <span className="text-xs font-medium">Cart</span>
            </Button>
          </CartDrawer>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-6 pt-4">
                  <span className="text-lg font-bold text-foreground">Kitchen Categories</span>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <nav className="space-y-3">
                    {kitchenCategories.map((category) => (
                      <Button
                        key={category.path}
                        variant="ghost"
                        onClick={() => handleNavigation(category.path)}
                        className="w-full justify-start h-auto p-4 flex flex-col items-start space-y-1"
                      >
                        <span className="font-medium text-left">{category.name}</span>
                        <span className="text-xs text-muted-foreground text-left">
                          {category.description}
                        </span>
                      </Button>
                    ))}
                  </nav>
                  
                  <div className="mt-6 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleNavigation('/shop/kitchen')}
                      className="w-full"
                    >
                      View All Kitchen Products
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};