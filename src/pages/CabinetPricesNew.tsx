import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CellConfigPopup } from "@/components/cabinet/CellConfigPopup";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType, CabinetPart, GlobalSettings, CabinetTypePriceRange, CabinetTypeFinish } from "@/types/cabinet";
import { calculateCabinetPrice } from "@/lib/dynamicPricing";
import { calculateHardwareCost } from "@/lib/hardwarePricing";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RefreshImagesButton } from "@/components/RefreshImagesButton";

const CabinetPricesNew = () => {
  
  const [priceData, setPriceData] = useState<any>({});
  const [cellPopupOpen, setCellPopupOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    cabinetType: CabinetType;
    finish: any;
    width: number;
    price: number;
  } | null>(null);
  const { toast } = useToast();

  const { data: cabinetTypes } = useQuery({
    queryKey: ['cabinet-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as CabinetType[];
    },
  });

  const { data: cabinetParts } = useQuery({
    queryKey: ['cabinet-parts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cabinet_parts').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: globalSettings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('global_settings').select('*');
      if (error) throw error;
      return data;
    },
  });


  const { data: priceRanges } = useQuery({
    queryKey: ['cabinet-type-price-ranges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges' as any)
        .select('*')
        .eq('active', true)
        .order('cabinet_type_id', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: cabinetTypeFinishes, refetch: refetchFinishes } = useQuery({
        queryKey: ['cabinet-type-finishes'],
        refetchOnWindowFocus: true, // Refetch when window gains focus
        staleTime: 0, // Always consider data stale
        refetchInterval: 5000, // Refetch every 5 seconds to catch new images
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_type_finishes' as any)
        .select(`
          *,
          door_style_finish:door_style_finishes(*),
          door_style:door_styles(*),
          color:colors(*)
        `)
        .eq('active', true)
        .order('cabinet_type_id', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  // Generate pricing data when all dependencies are loaded
  useEffect(() => {
    if (!cabinetTypes || !cabinetParts || !globalSettings || !priceRanges || !cabinetTypeFinishes) {
      return;
    }

    const generatePriceData = async () => {
      const newPriceData: any = {};

      for (const cabinetType of cabinetTypes) {
        // Get price ranges for this cabinet type
        const typeRanges = priceRanges
          .filter((range: any) => range.cabinet_type_id === cabinetType.id && range.active)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
        
        // Get finishes for this cabinet type
        const typeFinishes = (cabinetTypeFinishes || [])
          .filter((ctf: any) => ctf.cabinet_type_id === cabinetType.id && ctf.active)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);

            console.log(`Processing ${cabinetType.name}: ${typeRanges.length} ranges, ${typeFinishes.length} finishes`);

            if (typeFinishes.length > 0) {
              // Use default ranges if no specific ranges configured
              const ranges = typeRanges.length > 0 ? typeRanges : [
                { id: 'default-1', label: '300 - 400mm', min_width_mm: 300, max_width_mm: 400 },
                { id: 'default-2', label: '400 - 500mm', min_width_mm: 400, max_width_mm: 500 },
                { id: 'default-3', label: '500 - 600mm', min_width_mm: 500, max_width_mm: 600 }
              ];

              const hardwareCost = 45; // Default hardware cost

              newPriceData[cabinetType.name] = {
                name: cabinetType.name,
                id: cabinetType.id,
                hasConfiguredRanges: typeRanges.length > 0,
                sizes: ranges.map((range: any) => {
                  const width = range.min_width_mm;
                  console.log(`Using width ${width}mm for range "${range.label}" in ${cabinetType.name}`);
                  
                  const prices = typeFinishes.map((ctf: any) => {
                    const relevantParts = cabinetParts.filter((p: any) => p.cabinet_type_id === cabinetType.id);
                    
                    // Create a mock door style finish if not present
                    const doorStyleFinish = ctf.door_style_finish || {
                      id: `mock-${ctf.id}`,
                      door_style_id: ctf.door_style_id,
                      name: 'Standard Finish',
                      rate_per_sqm: 0,
                      sort_order: 0,
                      active: true,
                      created_at: new Date().toISOString(),
                      door_style: ctf.door_style
                    };

                    const calculatedPrice = calculateCabinetPrice(
                      cabinetType,
                      width,
                      cabinetType.default_height_mm || 720,
                      cabinetType.default_depth_mm || 560,
                      doorStyleFinish,
                      ctf.color,
                      relevantParts,
                      globalSettings,
                      hardwareCost,
                      ctf
                    );
                    
                    console.log(`${cabinetType.name} ${range.label}: Width=${width}mm, Price=${calculatedPrice}`);
                    return calculatedPrice;
                  });
              
              return {
                range: range.label,
                price: prices
              };
            })
          };
        }
      }

      setPriceData(newPriceData);
    };

    generatePriceData();
  }, [cabinetTypes, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes]);


  const parseWidthRange = (rangeStr: string): number => {
    const match = rangeStr.match(/\d+/);
    return match ? parseInt(match[0]) : 300;
  };

  const handleCellClick = (cabinetType: CabinetType, sizeRange: string, price: number, finishConfig: any) => {
    console.log('Cell clicked:', { cabinetType: cabinetType.name, sizeRange, price });
    
    const width = parseWidthRange(sizeRange);
    
    // Create a mock finish object from the finish config
    const mockFinish = {
      id: finishConfig.id,
      name: finishConfig.door_style?.name || 'Standard',
      finish_type: 'standard',
      rate_per_sqm: finishConfig.door_style_finish?.rate_per_sqm || 0,
      brand_id: '',
      active: true,
      created_at: new Date().toISOString()
    };
    
    setSelectedCell({
      cabinetType,
      finish: mockFinish,
      width,
      price
    });
    setCellPopupOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-section overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-5xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
              Premium Cabinet 
              <span className="block text-transparent bg-clip-text bg-gradient-premium mt-2">
                Pricing
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
              Discover our dynamic pricing system. Click any price to customize your perfect cabinet configuration and add to your quote.
            </p>
            <RefreshImagesButton className="bg-gradient-premium text-white hover:shadow-elevated transition-all duration-300 px-8 py-3 rounded-xl font-semibold" />
          </div>
        </div>
      </section>

      {/* Price Tables */}
      <section className="py-16">
        <div className="container mx-auto px-4 space-y-12">
          {cabinetTypes?.map((cabinetType) => {
            const typeData = priceData[cabinetType.name];
            if (!typeData) return null;

            // Get finishes for this cabinet type
            const typeFinishes = (cabinetTypeFinishes || []).filter((ctf: any) => 
              ctf.cabinet_type_id === cabinetType.id && ctf.active
            ).sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

            if (typeFinishes.length === 0) {
              return (
                <div key={cabinetType.id} className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6">{cabinetType.name}</h2>
                  <div className="text-center py-8 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground mb-2">
                      No door styles configured for this cabinet type.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please configure door styles in the admin panel.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={cabinetType.id} className="mb-16 animate-slide-up">
                <div className="bg-white rounded-3xl shadow-card overflow-hidden border border-wood-warm/20">
                  <div className="bg-gradient-to-r from-wood-rich via-wood-dark to-wood-rich p-8">
                    <h2 className="text-3xl font-bold text-white mb-3">
                      {cabinetType.name}
                    </h2>
                    {!typeData.hasConfiguredRanges && (
                      <div className="inline-flex items-center gap-2 bg-cabinet-gold/20 text-cabinet-gold px-4 py-2 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-cabinet-gold rounded-full animate-pulse"></div>
                        Using default ranges - configure in admin for custom ranges
                      </div>
                    )}
                  </div>
                 
                  {/* Cabinet Type + Door Style Images Carousel */}
                  {typeFinishes.some((ctf: any) => ctf.image_url) && (
                    <div className="mb-12">
                      <h3 className="text-lg font-semibold text-wood-rich mb-6 text-center">Available Door Styles</h3>
                      <Carousel className="w-full max-w-6xl mx-auto">
                        <CarouselContent className="-ml-4">
                          {typeFinishes
                            .filter((ctf: any) => ctf.image_url)
                            .map((ctf: any) => (
                              <CarouselItem key={ctf.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <div className="group cursor-pointer">
                                      <div className="relative overflow-hidden rounded-2xl shadow-image hover:shadow-elevated transition-all duration-300 group-hover:scale-[1.02]">
                                        <img 
                                          src={ctf.image_url} 
                                          alt={`${cabinetType.name} - ${ctf.door_style?.name}`}
                                          className="w-full h-48 object-cover"
                                          onError={(e) => {
                                            console.error("Image failed to load:", ctf.image_url);
                                            e.currentTarget.style.display = "none";
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                          <p className="text-center text-sm font-semibold text-white drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            {ctf.door_style?.name}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] p-0 border-0 bg-transparent">
                                    <div className="relative rounded-2xl overflow-hidden">
                                      <img 
                                        src={ctf.image_url} 
                                        alt={`${cabinetType.name} - ${ctf.door_style?.name}`}
                                        className="w-full h-auto max-h-[80vh] object-contain"
                                      />
                                      <div className="absolute bottom-6 left-0 right-0 text-center">
                                        <h3 className="text-white text-2xl font-bold bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-md rounded-2xl mx-auto px-6 py-3 inline-block shadow-elevated">
                                          {ctf.door_style?.name}
                                        </h3>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="bg-white/90 hover:bg-white shadow-card border-0" />
                        <CarouselNext className="bg-white/90 hover:bg-white shadow-card border-0" />
                      </Carousel>
                    </div>
                  )}
                 
                  {/* Modern Card-Based Pricing Grid */}
                  <div className="grid gap-6 lg:gap-8">
                    {typeData.sizes?.map((sizeData: any, index: number) => (
                      <div 
                        key={index} 
                        className="bg-gradient-card rounded-3xl shadow-card hover:shadow-elevated transition-all duration-300 border border-wood-warm/30 overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-wood-rich to-wood-dark p-6">
                          <h3 className="text-xl font-bold text-white mb-2">
                            Size Range: {sizeData.range}
                          </h3>
                          <p className="text-wood-warm text-sm">
                            Choose your preferred door style and finish
                          </p>
                        </div>
                        
                        <div className="p-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sizeData.price?.map((price: number, priceIndex: number) => {
                              const finish = typeFinishes[priceIndex];
                              return (
                                <div 
                                  key={priceIndex}
                                  className="group bg-white rounded-2xl shadow-card hover:shadow-price transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer hover:scale-[1.02]"
                                  onClick={() => handleCellClick(cabinetType, sizeData.range, price, finish)}
                                >
                                  <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="w-3 h-3 rounded-full bg-gradient-premium"></div>
                                      <span className="text-xs font-medium text-wood-rich bg-wood-warm px-2 py-1 rounded-full">
                                        {finish?.door_style?.name || 'Standard'}
                                      </span>
                                    </div>
                                    
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-primary mb-1 group-hover:bg-gradient-price group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                        {formatPrice(price)}
                                      </div>
                                      
                                      {finish?.door_style_finish?.name && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                          {finish.door_style_finish.name}
                                        </p>
                                      )}
                                      
                                      {finish?.color && (
                                        <div className="flex items-center justify-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-wood-rich"></div>
                                          <span className="text-xs text-wood-dark font-medium">
                                            {finish.color.name}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                      <button className="w-full text-xs font-semibold text-primary group-hover:text-white group-hover:bg-gradient-price transition-all duration-300 py-2 rounded-lg">
                                        Configure & Quote
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {(!cabinetTypes || cabinetTypes.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No cabinet types configured yet. Please set up cabinet types in the admin panel.
              </p>
            </div>
          )}
          
          {cabinetTypes && cabinetTypes.length > 0 && Object.keys(priceData).length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">
                No pricing data available. 
              </p>
              <p className="text-sm text-muted-foreground">
                Please configure door styles and finishes for your cabinet types in the admin panel.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Cell Configuration Popup */}
      {selectedCell && (
        <CellConfigPopup
          isOpen={cellPopupOpen}
          onClose={() => setCellPopupOpen(false)}
          cabinetType={selectedCell.cabinetType}
          finish={selectedCell.finish}
          initialWidth={selectedCell.width}
          initialPrice={selectedCell.price}
          cabinetParts={cabinetParts || []}
          globalSettings={globalSettings || []}
        />
      )}

      <Footer />
    </div>
  );
};

export default CabinetPricesNew;