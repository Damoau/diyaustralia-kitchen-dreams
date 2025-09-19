import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Menu,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Truck,
  Settings,
  Users,
  BarChart3,
  Bell,
  DollarSign,
  Wrench,
  MapPin,
  Factory,
  Shield,
  X
} from 'lucide-react';

const navigationItems = [
  {
    group: 'Overview',
    items: [
      { title: 'Dashboard', url: '/admin/overview', icon: LayoutDashboard },
    ]
  },
  {
    group: 'Sales',
    items: [
      { title: 'Carts', url: '/admin/sales/carts', icon: ShoppingCart },
      { title: 'Quotes', url: '/admin/sales/quotes', icon: FileText },
    ]
  },
  {
    group: 'Operations',
    items: [
      { title: 'Orders', url: '/admin/orders', icon: Package },
      { title: 'Production', url: '/admin/production', icon: Factory },
      { title: 'Shipping', url: '/admin/shipping', icon: Truck },
      { title: 'Assembly', url: '/admin/assembly', icon: Wrench },
    ]
  },
  {
    group: 'Configuration',
    items: [
      { title: 'Cabinet Management', url: '/admin/cabinets', icon: Package },
      { title: 'Configuration Migration', url: '/admin/configuration-migration', icon: MapPin },
      { title: 'Pricing', url: '/admin/pricing', icon: DollarSign },
      { title: 'Discounts', url: '/admin/discounts', icon: DollarSign },
      { title: 'Users', url: '/admin/users', icon: Users },
      { title: 'Roles', url: '/admin/roles', icon: Users },
    ]
  },
  {
    group: 'Analytics',
    items: [
      { title: 'Reports', url: '/admin/reports', icon: BarChart3 },
      { title: 'Exports', url: '/admin/exports', icon: BarChart3 },
    ]
  },
  {
    group: 'System',
    items: [
      { title: 'Security', url: '/admin/security', icon: Shield },
      { title: 'Notifications', url: '/admin/notifications', icon: Bell },
      { title: 'Settings', url: '/admin/settings', icon: Settings },
    ]
  },
];

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin/overview') {
      return location.pathname === '/admin' || location.pathname === '/admin/overview';
    }
    return location.pathname === path;
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-xl">
        <SheetHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Admin Navigation</SheetTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 max-h-full">
            {navigationItems.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                  {group.group}
                </h4>
                
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      onClick={handleNavClick}
                      className={({ isActive: routeActive }) => 
                        `flex flex-col items-center space-y-1 p-3 rounded-lg text-xs font-medium transition-colors border ${
                          isActive(item.url) || routeActive
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-center leading-tight">{item.title}</span>
                      
                      {/* Show badge for notifications */}
                      {item.title === 'Notifications' && (
                        <Badge variant="destructive" className="absolute top-1 right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                          3
                        </Badge>
                      )}
                    </NavLink>
                  ))}
                </div>
                
                {groupIndex < navigationItems.length - 1 && (
                  <Separator className="my-3" />
                )}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};