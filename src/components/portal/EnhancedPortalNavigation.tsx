import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  FileText,
  Package,
  Files,
  MessageSquare,
  User,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';

const navigationItems = [
  { path: '/portal', label: 'Dashboard', icon: Home },
  { path: '/portal/quotes', label: 'Quotes', icon: FileText, badge: 2 },
  { path: '/portal/orders', label: 'Orders', icon: Package, badge: 1 },
  { path: '/portal/files', label: 'Files', icon: Files },
  { path: '/portal/messages', label: 'Messages', icon: MessageSquare, badge: 3 },
  { path: '/portal/addresses', label: 'Addresses', icon: MapPin },
  { path: '/portal/profile', label: 'Profile', icon: User },
];

export const EnhancedPortalNavigation = () => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavItem = ({ item, mobile = false }: { item: typeof navigationItems[0], mobile?: boolean }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <NavLink
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={({ isActive: routeActive }) => 
          `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive || routeActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          } ${mobile ? 'w-full' : ''}`
        }
      >
        <item.icon className="w-4 h-4" />
        <span>{item.label}</span>
        {item.badge && (
          <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {item.badge}
          </Badge>
        )}
      </NavLink>
    );
  };

  const QuickActions = () => {
    const currentPath = location.pathname;
    
    // Contextual quick actions based on current page
    if (currentPath === '/portal/quotes') {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/get-quote')}
          className="flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">New Quote</span>
        </Button>
      );
    }
    
    if (currentPath === '/portal/orders') {
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/shop')}
          className="flex items-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Shop Now</span>
        </Button>
      );
    }
    
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate('/shop')}
        className="flex items-center space-x-2"
      >
        <ShoppingCart className="w-4 h-4" />
        <span className="hidden sm:inline">Shop</span>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DK</span>
          </div>
          <span className="font-bold text-lg hidden sm:inline">DIY Kitchen Dreams</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full hidden md:inline">
            Customer Portal
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigationItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <QuickActions />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              5
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || 'Customer'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/portal/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/portal/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/')}>
                <ArrowRight className="mr-2 h-4 w-4" />
                <span>Main Site</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle>Customer Portal</SheetTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <NavItem key={item.path} item={item} mobile />
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Main Site
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};