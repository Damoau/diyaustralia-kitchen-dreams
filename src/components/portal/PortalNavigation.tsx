import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Home, 
  FileText, 
  ShoppingBag, 
  Files, 
  MessageSquare, 
  User, 
  MapPin,
  LogOut,
  Bell
} from "lucide-react";

export const PortalNavigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { path: "/portal", label: "Dashboard", icon: Home },
    { path: "/portal/quotes", label: "Quotes", icon: FileText },
    { path: "/portal/orders", label: "Orders", icon: ShoppingBag },
    { path: "/portal/files", label: "Files", icon: Files },
    { path: "/portal/messages", label: "Messages", icon: MessageSquare, badge: 3 },
    { path: "/portal/profile", label: "Profile", icon: User },
    { path: "/portal/addresses", label: "Addresses", icon: MapPin },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const NavItem = ({ item, mobile = false }: { item: typeof navigationItems[0]; mobile?: boolean }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    
    return (
      <Link
        to={item.path}
        onClick={() => mobile && setIsOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
        {item.badge && (
          <Badge variant="destructive" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/portal" className="font-semibold text-lg">
            Customer Portal
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                  
                  <nav className="flex flex-col gap-1">
                    {navigationItems.map((item) => (
                      <NavItem key={item.path} item={item} mobile />
                    ))}
                  </nav>
                  
                  <Button variant="ghost" onClick={handleSignOut} className="justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};