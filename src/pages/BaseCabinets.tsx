import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType, CabinetPart, GlobalSettings, CabinetTypePriceRange, CabinetTypeFinish } from "@/types/cabinet";
import { calculateCabinetPrice } from "@/lib/dynamicPricing";
import { useCart } from "@/hooks/useCart";
import { formatPrice, parseGlobalSettings } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { RefreshImagesButton } from "@/components/RefreshImagesButton";
import { ConfiguratorDialog } from "@/components/cabinet/ConfiguratorDialog";

const BaseCabinets = () => {
  const [priceData, setPriceData] = useState<any>({});
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const { data: cabinetTypes } = useQuery({
    queryKey: ['cabinet-types-base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .eq('category', 'base')
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
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: cabinetTypeFinishes } = useQuery({
    queryKey: ['cabinet-type-finishes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(*),
          door_style_finish:door_style_finishes!cabinet_type_finishes_door_style_finish_id_fkey(*),
          color:colors(*)
        `)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Generate price data when dependencies change
  useEffect(() => {
    const generatePriceData = async () => {
      if (!cabinetTypes || !cabinetParts || !globalSettings) return;

      const newPriceData: any = {};

      for (const cabinetType of cabinetTypes) {
        const typeRanges = priceRanges?.filter(pr => pr.cabinet_type_id === cabinetType.id) || [];
        const typeFinishes = (cabinetTypeFinishes || []).filter((ctf: any) => 
          ctf.cabinet_type_id === cabinetType.id && ctf.active
        ).sort((a: any, b: any) => a.sort_order - b.sort_order);

        if (typeFinishes.length > 0) {
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
              
              const prices = typeFinishes.map((finish: any) => {
                // Create a door style finish object from the available data
                const doorStyleFinish = finish.door_style_finish || {
                  id: finish.id,
                  name: (finish.door_style?.name ? finish.door_style.name + ' Finish' : 'Standard Finish'),
                  rate_per_sqm: finish.door_style?.base_rate_per_sqm || 150, // Use actual door style rate
                  door_style_id: finish.door_style?.id || null,
                  door_style: finish.door_style
                };

                const mockColor = finish.color || {
                  id: 'default-color',
                  name: 'Standard',
                  surcharge_rate_per_sqm: 0,
                  hex_code: '#ffffff',
                  active: true,
                  door_style_id: finish.door_style?.id || null
                };

                return calculateCabinetPrice(
                  cabinetType,
                  width,
                  cabinetType.default_height_mm,
                  cabinetType.default_depth_mm,
                  doorStyleFinish,
                  mockColor,
                  cabinetParts,
                  globalSettings,
                  hardwareCost
                );
              });

              return {
                range: range.label,
                price: prices
              };
            }),
            finishes: typeFinishes.map((finish: any) => ({
              ...finish,
              displayName: finish.door_style?.name || 'Unknown Style'
            }))
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-6">
            <Link to="/pricing" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing Overview
            </Link>
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Base <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Cabinets</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Quality base cabinets for your kitchen. Use the Add to Cart buttons to configure and add to your quote.
            </p>
            
            <div className="bg-muted/40 rounded-md px-4 py-3 mb-6 max-w-3xl mx-auto text-sm">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-muted-foreground">
                <span className="font-medium text-foreground">Base depth:</span>
                <span>560mm (standard), 580mm for shadowline</span>
                <span>•</span>
                <span className="font-medium text-foreground">Base height:</span>
                <span>720mm (standard)</span>
                <span>•</span>
                <span>All sizes plus doors</span>
              </div>
            </div>

            {/* Navigation to other pricing pages */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Link to="/pricing/base-cabinets">
                <Button variant="default" size="sm">Base Cabinets</Button>
              </Link>
              <Link to="/pricing/top-cabinets">
                <Button variant="outline" size="sm">Top Cabinets</Button>
              </Link>
              <Link to="/pricing/pantry">
                <Button variant="outline" size="sm">Pantry</Button>
              </Link>
              <Link to="/pricing/panels-fillers">
                <Button variant="outline" size="sm">Dress Panels & Fillers</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Price Tables */}
      <section className="py-16">
        <div className="container mx-auto px-4 space-y-12">
          {cabinetTypes?.map((cabinetType) => {
            const typeData = priceData[cabinetType.name];
            if (!typeData) return null;

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
                 <h2 className="text-2xl font-semibold mb-6 flex items-center justify-between">
                  <span>
                    {cabinetType.name}
                    {!typeData.hasConfiguredRanges && (
                      <span className="ml-2 text-sm font-normal text-orange-600">
                        (Using default ranges - configure in admin for custom ranges)
                      </span>
                    )}
                  </span>
                  <Button 
                    onClick={() => {
                      setSelectedCabinetType(cabinetType);
                      setIsConfiguratorOpen(true);
                    }}
                    className="ml-4"
                  >
                    Add to Cart
                  </Button>
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
                                     className="carousel-image"
                                    onError={(e) => {
                                      console.error("Cabinet image failed to load:", cabinetType.product_image_url);
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                     <span className="text-white opacity-0 group-hover:opacity-100 font-medium">View Full Size</span>
                                   </div>
                                   <div className="absolute bottom-2 left-0 right-0 text-center">
                                     <span className="text-black text-xs font-medium">
                                       {cabinetType.name}
                                     </span>
                                   </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <div className="relative">
                                   <img 
                                     src={cabinetType.product_image_url} 
                                     alt={`${cabinetType.name} Cabinet - Full Size`}
                                     className="w-full h-auto max-h-[80vh] object-contain"
                                   />
                                   <DialogTitle className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
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
                                         className="carousel-image"
                                        onError={(e) => {
                                          console.error("Finish image failed to load:", ctf.image_url);
                                          e.currentTarget.style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <div className="carousel-image bg-gray-100 flex items-center justify-center">
                                        <span className="text-gray-500 text-sm text-center px-2">
                                          {ctf.door_style?.name || 'Unknown Style'}
                                          <br />
                                          <small>No image</small>
                                        </span>
                                      </div>
                                    )}
                                     <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                       <span className="text-white opacity-0 group-hover:opacity-100 font-medium">View Full Size</span>
                                     </div>
                                     <div className="absolute bottom-2 left-0 right-0 text-center">
                                       <span className="text-black text-xs font-medium">
                                         {ctf.door_style?.name || 'Unknown Style'}
                                       </span>
                                     </div>
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <div className="relative">
                                     {ctf.image_url ? (
                                       <img 
                                         src={ctf.image_url} 
                                         alt={`${cabinetType.name} - ${ctf.door_style?.name} - Full Size`}
                                         className="w-full h-auto max-h-[80vh] object-contain"
                                       />
                                     ) : (
                                       <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                                         <span className="text-gray-500">No image available</span>
                                       </div>
                                     )}
                                     <DialogTitle className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
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
                        {typeFinishes.map((finish: any, index: number) => (
                          <th key={index} className="border border-gray-300 px-4 py-3 text-center font-medium">
                            {finish.door_style?.name || 'Unknown Style'}
                            {finish.color && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {finish.color.name}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody 
                      className="price-table-disabled"
                      style={{ 
                        pointerEvents: 'none',
                        cursor: 'default',
                        userSelect: 'none'
                      }}
                    >
                       {typeData.sizes?.map((sizeData: any, sizeIndex: number) => (
                         <tr 
                           key={sizeIndex}
                           style={{ 
                             pointerEvents: 'none',
                             cursor: 'default'
                           }}
                         >
                           <td className="border border-gray-300 px-4 py-3 font-medium">
                             {sizeData.range}
                           </td>
                             {sizeData.price?.map((price: number, priceIndex: number) => (
                               <td 
                                 key={priceIndex} 
                                 className="border border-gray-300 px-4 py-3 text-center"
                                 style={{ 
                                   pointerEvents: 'none',
                                   cursor: 'default',
                                   userSelect: 'none'
                                 }}
                                 onMouseDown={(e) => e.preventDefault()}
                                 onMouseUp={(e) => e.preventDefault()}
                                 onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   return false;
                                 }}
                               >
                                 <div 
                                   className="text-lg font-bold px-2 py-1 w-full"
                                   style={{ 
                                     color: 'hsl(var(--foreground))', 
                                     pointerEvents: 'none',
                                     cursor: 'default',
                                     userSelect: 'none'
                                   }}
                                   onMouseDown={(e) => e.preventDefault()}
                                   onMouseUp={(e) => e.preventDefault()}
                                   onClick={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     return false;
                                   }}
                                 >
                                   {formatPrice(price)}
                                 </div>
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
                No base cabinet types configured yet. Please set up cabinet types in the admin panel.
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

      {/* Configurator Dialog */}
      {selectedCabinetType && (
        <ConfiguratorDialog
          open={isConfiguratorOpen}
          onOpenChange={setIsConfiguratorOpen}
          cabinetType={selectedCabinetType}
        />
      )}

      <Footer />
    </div>
  );
};

export default BaseCabinets;