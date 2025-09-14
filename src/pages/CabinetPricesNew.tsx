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
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
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
    const width = parseWidthRange(sizeRange);
    
    // Pass the complete finish configuration instead of a mock object
    setSelectedCell({
      cabinetType,
      finish: finishConfig, // Pass the actual finish config with all data
      width,
      price
    });
    setCellPopupOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Cabinet <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Dynamic pricing based on your cabinet configurations. Click any price to configure and add to quote.
            </p>
            <RefreshImagesButton className="mt-4" />
            
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
              <div key={cabinetType.id} className="mb-12">
                 <h2 className="text-2xl font-semibold mb-6 text-center">
                   {cabinetType.name}
                   {!typeData.hasConfiguredRanges && (
                     <span className="block text-sm font-normal text-orange-600 mt-1">
                       (Using default ranges - configure in admin for custom ranges)
                     </span>
                   )}
                  </h2>
                  
                  {/* Cabinet Images Carousel - Always show */}
                  <div className="mb-8">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium text-muted-foreground">Available Finishes</h3>
                    </div>
                    <Carousel className="w-full max-w-5xl mx-auto">
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {/* Show cabinet type image if available */}
                        {cabinetType.product_image_url && (
                          <CarouselItem className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative group cursor-pointer hover:opacity-90 transition-opacity">
                                  <img 
                                    src={cabinetType.product_image_url} 
                                    alt={`${cabinetType.name} Cabinet`}
                                    className="w-full h-56 object-contain rounded-lg border"
                                    style={{ imageRendering: 'crisp-edges' }}
                                    onError={(e) => {
                                      console.error("Cabinet image failed to load:", cabinetType.product_image_url);
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <p className="text-center text-sm font-medium text-foreground">
                                      {cabinetType.name}
                                    </p>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                                <div className="relative">
                                  <img 
                                    src={cabinetType.product_image_url} 
                                    alt={`${cabinetType.name} Cabinet`}
                                    className="w-full h-auto max-w-full rounded-lg"
                                  />
                                  <DialogTitle className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-black px-3 py-1 rounded">
                                    {cabinetType.name}
                                  </DialogTitle>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CarouselItem>
                        )}
                        
                        {/* Show door style finishes */}
                        {typeFinishes.map((ctf: any) => (
                          <CarouselItem key={ctf.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative group cursor-pointer hover:opacity-90 transition-opacity">
                                  {ctf.image_url ? (
                                    <img 
                                      src={ctf.image_url} 
                                      alt={`${cabinetType.name} - ${ctf.door_style?.name}`}
                                      className="w-full h-56 object-contain rounded-lg border"
                                      style={{ imageRendering: 'crisp-edges' }}
                                      onError={(e) => {
                                        console.error("Finish image failed to load:", ctf.image_url);
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-56 bg-muted/30 rounded-lg border flex items-center justify-center">
                                      <span className="text-sm text-muted-foreground">No Image</span>
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <p className="text-center text-sm font-medium text-foreground">
                                      {ctf.door_style?.name || 'Unknown Style'}
                                    </p>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                                <div className="relative">
                                  {ctf.image_url ? (
                                    <img 
                                      src={ctf.image_url} 
                                      alt={`${cabinetType.name} - ${ctf.door_style?.name}`}
                                      className="w-full h-auto max-w-full rounded-lg"
                                    />
                                  ) : (
                                    <div className="w-full h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                                      <span className="text-lg text-muted-foreground">No Image Available</span>
                                    </div>
                                  )}
                                  <DialogTitle className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-black px-3 py-1 rounded">
                                    {ctf.door_style?.name || 'Unknown Style'}
                                  </DialogTitle>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                  
                  <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium">
                          Size Range
                        </th>
                        {typeFinishes.map((ctf: any) => (
                          <th key={ctf.id} className="border border-gray-300 px-4 py-3 text-center font-medium min-w-[120px]">
                            {ctf.door_style?.name || 'Unknown Style'}
                            {ctf.door_style_finish?.name && ` - ${ctf.door_style_finish.name}`}
                            {ctf.color && ` (${ctf.color.name})`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {typeData.sizes?.map((sizeData: any, index: number) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="border border-gray-300 px-4 py-3 font-medium">
                            {sizeData.range}
                          </td>
                           {sizeData.price?.map((price: number, priceIndex: number) => (
                             <td key={priceIndex} className="border border-gray-300 px-4 py-3 text-center">
                               <button
                                 onClick={() => handleCellClick(cabinetType, sizeData.range, price, typeFinishes[priceIndex])}
                                 className="text-lg font-bold text-primary hover:text-primary/80 hover:bg-primary/10 cursor-pointer transition-all rounded px-2 py-1 w-full"
                               >
                                 {formatPrice(price)}
                               </button>
                             </td>
                           ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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