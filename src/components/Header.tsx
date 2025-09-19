import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, Settings, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const Header = () => {
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = 0; // Placeholder since cart is removed
  
  // Debug logging for header cart state
  useEffect(() => {
    console.log('Header component mounted, total items:', totalItems);
  }, [totalItems]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isInAdminMode = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-dark rounded-lg"></div>
            <span className="text-xl font-bold text-foreground">DIY Australia</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isInAdminMode ? (
            <>
              <Button 
                variant={location.pathname === '/admin' ? "default" : "ghost"} 
                onClick={() => navigate('/admin')}
                className="text-sm"
              >
                Admin Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-sm"
              >
                Back to Site
              </Button>
            </>
          ) : (
            <>
              <a 
                href="/"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Home
              </a>
              <a 
                href="/shop"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/shop' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Shop
              </a>
              <a 
                href="/kitchen-styles"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/kitchen-styles' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Kitchen Styles
              </a>
              <a 
                href="/get-quote"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/get-quote' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Get Quote
              </a>
              <a 
                href="/manufacturing"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/manufacturing' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Manufacturing
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="relative hidden md:flex"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  {user?.email?.split('@')[0] || 'Account'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAdmin && !isInAdminMode && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/auth')}
              className="hidden sm:flex"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden">
          <Button 
            variant="outline" 
            size="sm" 
            className="relative mr-2"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white flex flex-col">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-6 pt-4 flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-dark rounded-lg"></div>
                  <span className="text-xl font-bold text-foreground">DIY Australia</span>
                </div>
                
                <div className="flex-1 overflow-y-auto overscroll-contain pb-4">
                  <nav className="flex flex-col space-y-4">
                  {isInAdminMode ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => navigate('/admin')}
                        className="justify-start"
                      >
                        Admin Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="justify-start"
                      >
                        Back to Site
                      </Button>
                    </>
                  ) : (
                    <>
                      <a
                        href="/"
                        className="flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        Home
                      </a>
                      <a
                        href="/shop"
                        className="flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        Shop
                      </a>
                      <a
                        href="/kitchen-styles"
                        className="flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        Kitchen Styles
                      </a>
                      <a
                        href="/get-quote"
                        className="flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        Get Quote
                      </a>
                      <a
                        href="/manufacturing"
                        className="flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        Manufacturing
                      </a>
                    </>
                  )}
                  </nav>
                </div>
                
                <div className="flex-shrink-0 mt-6 space-y-4 border-t border-gray-100 pt-6">
                  {isAuthenticated ? (
                    <>
                      {isAdmin && !isInAdminMode && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/admin')}
                          className="w-full justify-start"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full justify-start"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/auth')}
                      className="w-full justify-start"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  )}
                </div>
                
                <div className="flex-shrink-0 mt-6 pt-6 border-t border-gray-100">
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