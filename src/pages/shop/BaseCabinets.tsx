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
import { ShoppingCart, ArrowLeft, Package } from "lucide-react";
import { Link } from "react-router-dom";

const BaseCabinets = () => {
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filterOptions = [
    { value: 'all', label: 'All Cabinets' },
    { value: 'doors', label: 'Doors' },
    { value: 'drawers', label: 'Drawers' },
    { value: 'corners', label: 'Corners' },
    { value: 'appliance_cabinets', label: 'Appliance Cabinets' },
    { value: 'bin_cabinets', label: 'Bin Cabinets' }
  ];

  // Fetch base cabinets
  const { data: cabinetTypes = [], isLoading } = useQuery({
    queryKey: ["base-cabinets", selectedFilter],
    queryFn: async () => {
      let query = supabase
        .from("cabinet_types")
        .select("*")
        .eq("active", true)
        .eq("category", "base")
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardFooter>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link to="/shop" className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Link>
          </div>

          {/* Category Navigation - Base, Top, Pantry, Dress Panels */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Link to="/shop/base-cabinets">
              <Button className="w-full h-12">
                Base Cabinets
              </Button>
            </Link>
            <Link to="/shop/top-cabinets">
              <Button variant="outline" className="w-full h-12">
                Top Cabinets
              </Button>
            </Link>
            <Link to="/shop/pantry-cabinets">
              <Button variant="outline" className="w-full h-12">
                Pantry Cabinets
              </Button>
            </Link>
            <Link to="/shop/dress-panels">
              <Button variant="outline" className="w-full h-12">
                Dress Panels
              </Button>
            </Link>
          </div>

          {/* Filter Buttons - Fixed 2-Row Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedFilter === option.value ? "default" : "outline"}
                onClick={() => setSelectedFilter(option.value)}
                className="w-full h-12 text-sm"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Cabinet Grid */}
          {cabinetTypes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {cabinetTypes.map((cabinet) => (
                <Card key={cabinet.id} className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="p-3">
                    <div className="aspect-square bg-muted/30 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {cabinet.product_image_url ? (
                        <img 
                          src={cabinet.product_image_url} 
                          alt={cabinet.name}
                          className="w-full h-full object-contain group-hover:scale-[1.75] transition-transform duration-300 scale-[1.4]"
                        />
                      ) : (
                        <Package className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50" />
                      )}
                    </div>
                    <CardTitle className="text-sm md:text-lg leading-tight">{cabinet.name}</CardTitle>
                  </CardHeader>
                  
                  <CardFooter className="px-3 pb-3 pt-0">
                    <Button 
                      className="w-full text-xs md:text-sm h-8 md:h-10 justify-center"
                      onClick={() => handleCreateCabinet(cabinet)}
                    >
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
                No cabinets found
              </h3>
              <p className="text-muted-foreground">
                {selectedFilter === 'all' 
                  ? 'No base cabinets are currently available.' 
                  : `No base cabinets found in the selected category.`
                }
              </p>
              {selectedFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFilter('all')}
                  className="mt-4"
                >
                  Show All Cabinets
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

export default BaseCabinets;