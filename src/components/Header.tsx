import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-dark rounded-xl shadow-lg"></div>
          <span className="text-2xl font-bold text-foreground">DIY Australia</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium">
            Services
          </a>
          <a href="/kitchen-styles" className="text-foreground hover:text-primary transition-colors font-medium">
            Kitchen Styles
          </a>
          <a href="/base-cabinet-prices" className="text-foreground hover:text-primary transition-colors font-medium">
            Pricing
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
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="hero" size="sm" className="px-6 hidden sm:flex">
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
                  <a 
                    href="#services" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                  >
                    Services
                  </a>
                  <a 
                    href="/kitchen-styles" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                  >
                    Kitchen Styles
                  </a>
                  <a 
                    href="/base-cabinet-prices" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-gray-100"
                  >
                    Pricing
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
                </nav>
                
                <div className="mt-8">
                  <Button variant="hero" size="lg" className="w-full">
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