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
import { ShoppingCart, Filter, ArrowLeft, Package } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

  const getFilterLabel = (value: string) => {
    const option = filterOptions.find(opt => opt.value === value);
    return option ? option.label : 'All Cabinets';
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

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Base <span className="text-transparent bg-clip-text bg-gradient-primary">Cabinets</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Foundation cabinets for your kitchen workspace
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-4 mt-6 lg:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg">
                    <Filter className="h-4 w-4 mr-2" />
                    {getFilterLabel(selectedFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {filterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSelectedFilter(option.value)}
                      className={selectedFilter === option.value ? "bg-primary/10" : ""}
                    >
                      {option.label}
                      {selectedFilter === option.value && (
                        <Badge variant="secondary" className="ml-auto">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                        {cabinet.subcategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                No cabinets found
              </h3>
              <p className="text-muted-foreground">
                {selectedFilter === 'all' 
                  ? 'No base cabinets are currently available.' 
                  : `No base cabinets found in the "${getFilterLabel(selectedFilter)}" category.`
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