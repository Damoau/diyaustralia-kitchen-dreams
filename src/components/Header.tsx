import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, Settings, LogOut, LogIn } from "lucide-react";
import { EnhancedCartDrawer } from "@/components/cart/EnhancedCartDrawer";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const Header = () => {
  const { totalItems } = useCart();
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Debug logging for header cart state
  useEffect(() => {
    console.log('🎯 Header re-rendered with totalItems:', totalItems);
  }, [totalItems]);
  
  // Check if user is in admin mode
  const isInAdminMode = location.pathname.startsWith('/admin');
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-dark rounded-xl shadow-lg"></div>
          <span className="text-2xl font-bold text-foreground">DIY Australia</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {isInAdminMode ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                ← Back to Site
              </Button>
              <span className="text-sm text-muted-foreground">Admin Panel</span>
            </>
          ) : (
            <>
              <a href="/shop" className="text-foreground hover:text-primary transition-colors font-medium">
                Shop
              </a>
              <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium">
                Services
              </a>
              <a href="/manufacturing" className="text-foreground hover:text-primary transition-colors font-medium">
                Manufacturing
              </a>
              <a href="/kitchen-styles" className="text-foreground hover:text-primary transition-colors font-medium">
                Kitchen Styles
              </a>
              <a href="/price-list" className="text-foreground hover:text-primary transition-colors font-medium">
                Price List
              </a>
              <a href="#gallery" className="text-foreground hover:text-primary transition-colors font-medium">
                Gallery
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium">
                About
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">
                Contact
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <EnhancedCartDrawer>
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </EnhancedCartDrawer>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  {user?.email?.split('@')[0] || 'Account'}
                </Button>
              </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                {isAdmin && !isInAdminMode && (
                  <>
                    <DropdownMenuItem onClick={() => {
                      console.log('Navigating to admin, isAdmin:', isAdmin, 'user:', user);
                      navigate('/admin');
                    }}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isInAdminMode && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/')}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Exit Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="hidden sm:flex">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
          
          <Button variant="hero" size="sm" className="px-6 hidden sm:flex" onClick={() => navigate('/get-quote')}>
            Get Quote
          </Button>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-8 pt-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-dark rounded-lg"></div>
                  <span className="text-xl font-bold text-foreground">DIY Australia</span>
                </div>
                
                <nav className="flex flex-col space-y-6">
                  {isInAdminMode ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100 justify-start"
                      >
                        ← Back to Site
                      </Button>
                      <div className="text-lg font-medium text-muted-foreground py-2 border-b border-gray-100">
                        Admin Panel
                      </div>
                    </>
                  ) : (
                    <>
                  <a 
                    href="/shop" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                  >
                    Shop
                  </a>
                  <a 
                    href="#services" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                  >
                    Services
                  </a>
                      <a 
                        href="/manufacturing" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                      >
                        Manufacturing
                      </a>
                      <a 
                        href="/kitchen-styles" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                      >
                        Kitchen Styles
                      </a>
                      <a 
                        href="/price-list" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                      >
                        Price List
                      </a>
                      <a 
                        href="#gallery" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                      >
                        Gallery
                      </a>
                      <a 
                        href="#about" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                      >
                        About
                      </a>
                      <a 
                        href="#contact" 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                      >
                        Contact
                      </a>
                    </>
                  )}
                </nav>
                
                <div className="mt-8 space-y-4">
                  {isAuthenticated ? (
                    <>
                      {isAdmin && !isInAdminMode && (
                        <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/admin')}>
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Button>
                      )}
                      {isInAdminMode && (
                        <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/')}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Exit Admin
                        </Button>
                      )}
                      <Button variant="outline" size="lg" className="w-full" onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/auth')}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  )}
                  <Button variant="hero" size="lg" className="w-full" onClick={() => navigate('/get-quote')}>
                    Get Free Quote
                  </Button>
                </div>
                
                <div className="mt-auto pt-8 border-t border-gray-100">
                  <div className="text-center text-sm text-muted-foreground">
                    <p className="mb-2">1300 DIY AUS</p>
                    <p>info@diyaustralia.com</p>
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

export default Header;