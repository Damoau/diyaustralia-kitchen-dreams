import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType } from "@/types/cabinet";
import { pricingService } from "@/services/pricingService";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const Pantry = () => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [priceData, setPriceData] = useState<any>({});

  // Fetch cabinet types for pantry (tall category)
  const { data: cabinetTypes } = useQuery({
    queryKey: ['cabinet-types-tall'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .eq('category', 'tall')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as CabinetType[];
    },
  });

  // Fetch cabinet parts
  const { data: cabinetParts } = useQuery({
    queryKey: ['cabinet-parts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cabinet_parts').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch global settings
  const { data: globalSettings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('global_settings').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch price ranges
  const { data: priceRanges } = useQuery({
    queryKey: ['cabinet-type-price-ranges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch cabinet type finishes
  const { data: cabinetTypeFinishes } = useQuery({
    queryKey: ['cabinet-type-finishes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(*),
          door_style_finish:door_style_finishes(*),
          color:colors(*)
        `)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Generate price tables when data changes
  useEffect(() => {
    const generatePricing = async () => {
      if (!cabinetTypes || !cabinetParts || !globalSettings || !cabinetTypeFinishes) return;

      const newPriceData: any = {};

      for (const cabinetType of cabinetTypes) {
        const typeFinishes = cabinetTypeFinishes.filter(
          (ctf: any) => ctf.cabinet_type_id === cabinetType.id && ctf.active
        ).sort((a: any, b: any) => a.sort_order - b.sort_order);

        const typeRanges = priceRanges?.filter(pr => pr.cabinet_type_id === cabinetType.id) || [];

        if (typeFinishes.length > 0) {
          const tableData = pricingService.generateTableData({
            cabinetType,
            cabinetParts,
            globalSettings,
            priceRanges: typeRanges,
            cabinetTypeFinishes: typeFinishes
          });

          newPriceData[cabinetType.name] = {
            ...tableData,
            finishes: typeFinishes.map((finish: any) => ({
              ...finish,
              displayName: finish.door_style?.name || finish.color?.name || 'Unknown Style'
            }))
          };
        }
      }

      setPriceData(newPriceData);
    };

    generatePricing();
  }, [cabinetTypes, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes]);

  const handleCreateCabinet = (cabinet: CabinetType) => {
    setSelectedCabinetType(cabinet);
    setConfiguratorOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-6">
            <Link to="/pricing" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing Overview
            </Link>
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Pantry <span className="text-transparent bg-clip-text bg-gradient-primary">Cabinets</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Spacious pantry storage solutions. View pricing below and use "Create Your Cabinet" to customize and order.
            </p>
            
            {/* Pantry Specifications */}
            <div className="bg-muted/30 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <Info className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Pantry Specifications</h3>
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-foreground">Standard height: 2100mm</p>
                <p className="font-medium text-foreground">Standard depth: 580mm</p>
                <p className="text-sm text-muted-foreground mt-2">All sizes plus doors</p>
              </div>
            </div>

            {/* Navigation to other pricing pages */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Link to="/pricing/base-cabinets">
                <Button variant="outline" size="sm">Base Cabinets</Button>
              </Link>
              <Link to="/pricing/top-cabinets">
                <Button variant="outline" size="sm">Top Cabinets</Button>
              </Link>
              <Button variant="default" size="sm">Pantry</Button>
              <Link to="/pricing/panels-fillers">
                <Button variant="outline" size="sm">Dress Panels & Fillers</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cabinet Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-12">
            {cabinetTypes?.map((cabinetType) => {
              const cabinetTypeData = priceData[cabinetType.name];
              
              return (
                <Card key={cabinetType.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl">{cabinetType.name}</CardTitle>
                    {cabinetType.short_description && (
                      <p className="text-muted-foreground">{cabinetType.short_description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!cabinetTypeData ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No pricing configured for this cabinet type.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Please contact us for a custom quote.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Cabinet Images Carousel */}
                        {cabinetTypeData.finishes && cabinetTypeData.finishes.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">Available Styles</h3>
                            <Carousel className="w-full max-w-4xl mx-auto">
                              <CarouselContent>
                                {cabinetTypeData.finishes.map((finish: any) => (
                                  <CarouselItem key={finish.id} className="md:basis-1/3 lg:basis-1/4">
                                    <div className="p-1">
                                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                        <CardContent className="aspect-square p-6 flex flex-col items-center justify-center">
                                          {finish.image_url ? (
                                            <img
                                              src={finish.image_url}
                                              alt={finish.displayName || 'Cabinet Style'}
                                              className="w-full h-32 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => setSelectedImage(finish.image_url)}
                                            />
                                          ) : (
                                            <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                                              <span className="text-muted-foreground text-sm">No Image</span>
                                            </div>
                                          )}
                                          <Badge variant="secondary" className="text-xs">
                                            {finish.displayName || 'Unknown Style'}
                                          </Badge>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious />
                              <CarouselNext />
                            </Carousel>
                          </div>
                        )}

                        {/* Pricing Table */}
                        {cabinetTypeData.priceRanges && cabinetTypeData.priceRanges.length > 0 && (
                          <div className="overflow-x-auto mb-6">
                            <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                              <thead>
                                <tr>
                                  <th className="border border-border p-3 text-left bg-muted/50 font-semibold">Size Range</th>
                                  {cabinetTypeData.finishes.map((finish: any, index: number) => (
                                    <th key={index} className="border border-border p-3 text-center bg-muted/50 font-semibold">
                                      {finish.displayName || 'Style ' + (index + 1)}
                                    </th>
                                  ))}
                                  <th className="border border-border p-3 text-center bg-muted/50 font-semibold">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cabinetTypeData.priceRanges.map((range: any) => (
                                  <tr key={range.id}>
                                    <td className="border border-border p-3 text-left font-medium">{range.label}</td>
                                    {range.prices?.map((price: number, priceIndex: number) => (
                                      <td key={priceIndex} className="border border-border p-3 text-center">
                                        <span className="font-semibold text-lg">
                                          {pricingService.formatPrice(price)}
                                        </span>
                                      </td>
                                    ))}
                                    <td className="border border-border p-3 text-center">
                                      <Button
                                        size="sm"
                                        onClick={() => handleCreateCabinet(cabinetType)}
                                        className="bg-primary hover:bg-primary/90"
                                      >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Create Your Cabinet
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Additional Information */}
                        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> Prices include GST and are updated automatically. 
                            All cabinets come with {cabinetType.door_count || 0} door(s) and {cabinetType.drawer_count || 0} drawer(s).
                            Use "Create Your Cabinet" to configure exact dimensions and add to cart.
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {(!cabinetTypes || cabinetTypes.length === 0) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No pantry cabinet types configured. Please set up cabinet types in the admin panel.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage('')}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Cabinet Style"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

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

      <Footer />
    </div>
  );
};

export default Pantry;