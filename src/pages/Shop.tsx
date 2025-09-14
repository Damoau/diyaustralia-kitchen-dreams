import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Package } from "lucide-react";
import { CabinetType } from "@/types/cabinet";

const Shop = () => {
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);

  // Fetch cabinet types grouped by category
  const { data: cabinetTypes = [], isLoading } = useQuery({
    queryKey: ["shop-cabinet-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cabinet_types")
        .select("*")
        .eq("active", true)
        .order("category", { ascending: true })
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Group cabinet types by category
  const groupedCabinets = cabinetTypes.reduce((acc, cabinet) => {
    const category = cabinet.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cabinet);
    return acc;
  }, {} as Record<string, typeof cabinetTypes>);

  const handleCreateCabinet = (cabinet: any) => {
    setSelectedCabinetType(cabinet as CabinetType);
    setConfiguratorOpen(true);
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "base":
        return "Base Cabinets";
      case "wall":
        return "Top Cabinets";
      case "tall":
        return "Pantry";
      case "panels":
        return "Dress Panels and Fillers";
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "base":
      case "wall":
      case "tall":
        return <Package className="h-6 w-6" />;
      case "panels":
        return <Package className="h-6 w-6" />;
      default:
        return <Package className="h-6 w-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="pt-24 pb-16">
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
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Cabinet Shop
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Configure and customize your perfect cabinets with our easy-to-use cabinet builder
            </p>
          </div>

          {/* Cabinet Categories */}
          <div className="space-y-16">
            {Object.entries(groupedCabinets).map(([category, cabinets]) => (
              <section key={category} id={category} className="space-y-8 scroll-mt-24">
                {/* Category Header */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {getCategoryIcon(category)}
                    <h2 className="text-3xl font-bold text-foreground">
                      {getCategoryDisplayName(category)}
                    </h2>
                  </div>
                  <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full"></div>
                </div>

                {/* Cabinet Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cabinets.slice(0, 1).map((cabinet) => (
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
                        <CardDescription className="text-sm">
                          {cabinet.short_description || `Customize your ${cabinet.name.toLowerCase()}`}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          <p>Size Range: {cabinet.min_width_mm}mm - {cabinet.max_width_mm}mm W</p>
                          <p>Height: {cabinet.min_height_mm}mm - {cabinet.max_height_mm}mm</p>
                          <p>Depth: {cabinet.min_depth_mm}mm - {cabinet.max_depth_mm}mm</p>
                        </div>
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
                
                {cabinets.length > 1 && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      + {cabinets.length - 1} more {category} cabinet{cabinets.length > 2 ? 's' : ''} available
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>
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

export default Shop;