import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, Settings, LogOut, LogIn, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { CartDrawer } from "@/components/ui/cart-drawer";

interface RoomCategory {
  id: string;
  name: string;
  display_name: string;
  active: boolean;
}

const DynamicHeader = () => {
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = 0; // Placeholder since cart is removed
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeRooms, setActiveRooms] = useState<RoomCategory[]>([]);
  
  // Load active room categories
  useEffect(() => {
    loadActiveRooms();
    console.log('DynamicHeader: Loading active rooms...');
    
    // Set up real-time subscription to refresh when categories are updated
    const channel = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unified_categories'
        },
        () => {
          console.log('DynamicHeader: Category changed, reloading...');
          loadActiveRooms(); // Refresh when any category changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActiveRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('unified_categories')
        .select('id, name, display_name, active')
        .eq('level', 1)
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;
      setActiveRooms(data || []);
      console.log('Loaded active rooms:', data);
    } catch (error) {
      console.error('Error loading active rooms:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      setSheetOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNavigation = (path: string) => {
    console.log('DynamicHeader: Navigating to', path, 'from', location.pathname);
    navigate(path);
    setSheetOpen(false);
  };

  const isInAdminMode = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-dark rounded-lg"></div>
            <span className="text-xl font-bold text-foreground">DIY Kitchens</span>
          </Link>
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
              <Link 
                to="/"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Home
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                      location.pathname.startsWith('/shop') ? 'text-foreground' : 'text-foreground/60'
                    }`}
                  >
                    Shop <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-background border shadow-md z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/shop" className="w-full">
                      All Categories
                    </Link>
                  </DropdownMenuItem>
                  {activeRooms.map((room) => (
                    <DropdownMenuItem key={room.id} asChild>
                      <Link to={`/shop/${room.name}`} className="w-full">
                        {room.display_name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link 
                to="/kitchen-styles"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/kitchen-styles' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Kitchen Styles
              </Link>
              <Link 
                to="/manufacturing"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/manufacturing' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Manufacturing
              </Link>
              <Link 
                to="/price-list"
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  location.pathname === '/price-list' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Price List
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <CartDrawer>
            <Button 
              variant="outline" 
              size="sm" 
              className="relative hidden md:flex"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </CartDrawer>
          
          <Button 
            size="sm" 
            className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate('/get-quote')}
          >
            Get Quote
          </Button>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  {user?.email?.split('@')[0] || 'Account'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/portal')}>
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </DropdownMenuItem>
                {isAdmin && !isInAdminMode && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
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
          <CartDrawer>
            <Button 
              variant="outline" 
              size="sm" 
              className="relative mr-2"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </CartDrawer>
          
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white flex flex-col">
              <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-3 mb-6 pt-4 flex-shrink-0">
                    <Link to="/" className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-dark rounded-lg"></div>
                      <span className="text-xl font-bold text-foreground">DIY Kitchens</span>
                    </Link>
                  </div>
                
                <div className="flex-1 overflow-y-auto overscroll-contain pb-4">
                  <nav className="flex flex-col space-y-4">
                  {isInAdminMode ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/admin')}
                        className="justify-start"
                      >
                        Admin Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/')}
                        className="justify-start"
                      >
                        Back to Site
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/')}
                        className="justify-start"
                      >
                        Home
                      </Button>
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleNavigation('/shop')}
                          className="justify-start font-medium"
                        >
                          Shop - All Categories
                        </Button>
                        <div className="ml-4 space-y-1">
                          {activeRooms.map((room) => (
                            <Button
                              key={room.id}
                              variant="ghost"
                              onClick={() => handleNavigation(`/shop/${room.name}`)}
                              className="justify-start text-sm text-muted-foreground hover:text-foreground"
                            >
                              {room.display_name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/kitchen-styles')}
                        className="justify-start"
                      >
                        Kitchen Styles
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/manufacturing')}
                        className="justify-start"
                      >
                        Manufacturing
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/price-list')}
                        className="justify-start"
                      >
                        Price List
                      </Button>
                    </>
                  )}
                  </nav>
                </div>
                
                <div className="flex-shrink-0 mt-6 space-y-4 border-t border-gray-100 pt-6">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleNavigation('/portal')}
                        className="w-full justify-start"
                      >
                        <User className="mr-2 h-4 w-4" />
                        My Account
                      </Button>
                      {isAdmin && !isInAdminMode && (
                        <Button
                          variant="outline"
                          onClick={() => handleNavigation('/admin')}
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
                      onClick={() => handleNavigation('/auth')}
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

export default DynamicHeader;