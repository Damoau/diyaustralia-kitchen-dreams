import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType } from "@/types/cabinet";
import { ShoppingCart, ArrowLeft, Package, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DressPanels = () => {
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const navigate = useNavigate();

  const categories = [
    { name: 'Base Cabinets', route: '/shop/base-cabinets' },
    { name: 'Top Cabinets', route: '/shop/top-cabinets' },
    { name: 'Pantry Cabinets', route: '/shop/pantry-cabinets' },
    { name: 'Dress Panels', route: '/shop/dress-panels' }
  ];

  const currentCategoryIndex = 3; // Dress Panels is index 3

  const navigateToCategory = (direction: 'prev' | 'next') => {
    // Find current index dynamically
    const currentIndex = categories.findIndex(cat => cat.route === '/shop/dress-panels');
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === categories.length - 1 ? 0 : currentIndex + 1;
    }
    navigate(categories[newIndex].route);
  };

  const filterOptions = [
    { value: 'all', label: 'All Panels & Fillers' },
    { value: 'base', label: 'Base' },
    { value: 'top', label: 'Top' },
    { value: 'pantry', label: 'Pantry' }
  ];

  // Fetch panels and fillers
  const { data: cabinetTypes = [], isLoading } = useQuery({
    queryKey: ["dress-panels", selectedFilter],
    queryFn: async () => {
      let query = supabase
        .from("cabinet_types")
        .select("*")
        .eq("active", true)
        .eq("category", "panels")
        .order("display_order", { ascending: true })
        .order("subcategory_display_order", { ascending: true });

      if (selectedFilter !== 'all') {
        query = query.or(`subcategory.eq.${selectedFilter},subcategory.like.%${selectedFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CabinetType[] || [];
    },
  });

  const handleCreateCabinet = (cabinet: CabinetType) => {
    setSelectedCabinetType(cabinet);
    setConfiguratorOpen(true);
  };

  const getFilterLabel = (value: string) => {
    const option = filterOptions.find(opt => opt.value === value);
    return option ? option.label : 'All Panels & Fillers';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">Loading...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="flex items-center mb-8">
            <Link to="/shop" className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Link>
          </div>

          {/* Category Navigation with Arrows */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateToCategory('prev')}
              className="h-12 w-12"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <h1 className="text-2xl md:text-3xl font-bold text-center">
              {categories[categories.findIndex(cat => cat.route === '/shop/dress-panels')].name}
            </h1>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateToCategory('next')}
              className="h-12 w-12"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Filter Dropdown - Single Line */}
          <div className="flex justify-center mb-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-64 h-12 justify-between">
                  All Panels & Fillers
                  <ChevronDown className="h-4 w-4 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64">
                {filterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`justify-center ${selectedFilter === option.value ? "bg-primary/10" : ""}`}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Cabinet Grid */}
          {cabinetTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cabinetTypes.map((cabinet) => (
                <Card key={cabinet.id} className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {cabinet.product_image_url ? (
                        <img 
                          src={cabinet.product_image_url} 
                          alt={cabinet.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-muted-foreground/50" />
                      )}
                    </div>
                    <CardTitle className="text-xl">{cabinet.name}</CardTitle>
                    {cabinet.short_description && (
                      <p className="text-sm text-muted-foreground">{cabinet.short_description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Size: {cabinet.min_width_mm}-{cabinet.max_width_mm}mm W</p>
                      <p>Height: {cabinet.default_height_mm}mm</p>
                      <p>Depth: {cabinet.default_depth_mm}mm</p>
                    </div>
                    {cabinet.subcategory && (
                      <Badge variant="outline" className="text-xs">
                        {cabinet.subcategory.charAt(0).toUpperCase() + cabinet.subcategory.slice(1)}
                      </Badge>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => handleCreateCabinet(cabinet)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Create Your Cabinet
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                No panels or fillers found
              </h3>
              <p className="text-muted-foreground">
                {selectedFilter === 'all' 
                  ? 'No dress panels or fillers are currently available.' 
                  : `No panels or fillers found in the "${getFilterLabel(selectedFilter)}" category.`
                }
              </p>
              {selectedFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFilter('all')}
                  className="mt-4"
                >
                  Show All Items
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Configurator Dialog */}
      {selectedCabinetType && (
        <ConfiguratorDialog
          cabinetType={selectedCabinetType}
          open={configuratorOpen}
          onOpenChange={(open) => {
            setConfiguratorOpen(open);
            if (!open) setSelectedCabinetType(null);
          }}
        />
      )}
    </div>
  );
};

export default DressPanels;