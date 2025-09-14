import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pricing";
import { pricingService } from "@/services/pricingService";
import { CabinetType } from "@/types/cabinet";
import { PriceCalculationBreakdown } from "@/components/price-list/PriceCalculationBreakdown";

interface DoorStyle {
  id: string;
  name: string;
  base_rate_per_sqm: number;
}

interface PriceRange {
  id: string;
  label: string;
  min_width_mm: number;
  max_width_mm: number;
}

interface PriceData {
  [cabinetTypeId: string]: {
    [doorStyleId: string]: {
      [rangeId: string]: number;
    };
  };
}

const BaseCabinetsPricing = () => {
  console.log('🚀🚀🚀 BaseCabinetsPricing COMPONENT LOADED!!! 🚀🚀🚀');
  console.log('🔥🔥🔥 COMPONENT LOADED 🔥🔥🔥', new Date().toISOString());
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCabinetType, setSelectedCabinetType] = useState<string>('all');
  const [priceData, setPriceData] = useState<PriceData>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [enlargedImage, setEnlargedImage] = useState<{url: string, name: string} | null>(null);

  // Clear all cached data when component mounts
  useEffect(() => {
    console.log('🔥🔥🔥 AGGRESSIVE CACHE CLEAR 🔥🔥🔥', new Date().toISOString());
    queryClient.clear();
    localStorage.clear();
    setPriceData({});
    setDebugData(null);
    // Force browser to not cache this page
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }, [queryClient]);

  // Fetch base cabinets
  const { data: baseCabinets, isLoading: loadingCabinets } = useQuery({
    queryKey: ['base-cabinets'],
    queryFn: async () => {
      console.log('🔍 FETCHING BASE CABINETS...');
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('category', 'base')
        .eq('active', true)
        .order('name');
      console.log('📦 CABINET DATA FETCHED:', { count: data?.length, error, data });
      if (error) throw error;
      return data as CabinetType[];
    }
  });

  console.log('🔥 COMPONENT STATE:', { 
    baseCabinets: baseCabinets?.length, 
    loadingCabinets, 
    selectedCabinetType 
  });

  // Calculate prices COMPLETELY FRESH - no dependencies on React Query
  const calculatePricesFromScratch = async (cabinetId?: string) => {
    const targetCabinetId = cabinetId || selectedCabinetType;
    if (!targetCabinetId || targetCabinetId === 'all') return;
    
    console.log('🔥🔥🔥 COMPLETE FRESH CALCULATION START - TIMESTAMP:', new Date().toISOString());
    setIsCalculating(true);
    
    try {
      // 1. Get selected cabinet fresh
      const { data: cabinets } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', targetCabinetId)
        .single();

      console.log('📦 FRESH CABINET:', cabinets);

      // 2. Get finishes fresh
      const { data: freshFinishes } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(*)
        `)
        .eq('cabinet_type_id', targetCabinetId)
        .eq('active', true)
        .order('sort_order');

      console.log('🚪 FRESH DOOR STYLES:', freshFinishes?.map(f => ({
        name: f.door_style?.name,
        rate: f.door_style?.base_rate_per_sqm
      })));

      // 3. Get price ranges fresh
      const { data: freshRanges } = await supabase
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('cabinet_type_id', targetCabinetId)
        .eq('active', true)
        .order('sort_order');

      // 4. Get cabinet parts fresh
      const { data: freshParts } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', targetCabinetId);

      // 5. Get global settings fresh
      const { data: freshSettings } = await supabase
        .from('global_settings')
        .select('*');

      // 6. Get hardware data fresh
      const { data: hardwareBrands } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true);
      
      const titusBrand = hardwareBrands?.find(brand => brand.name === 'Titus');
      const defaultHardwareBrandId = titusBrand?.id || null;

      const { data: hardwareRequirements } = await supabase
        .from('cabinet_hardware_requirements')
        .select('*')
        .eq('cabinet_type_id', targetCabinetId)
        .eq('active', true);

      const { data: hardwareOptions } = await supabase
        .from('cabinet_hardware_options')
        .select(`
          *,
          hardware_product:hardware_products(*)
        `)
        .eq('active', true);

      // 7. Get all active colors for lookup
      const { data: allColors } = await supabase
        .from('colors')
        .select('*')
        .eq('active', true);

      console.log('🎨 ALL COLORS:', allColors);

      // 8. Calculate prices with fresh data
      const newPriceData: PriceData = { ...priceData };
      newPriceData[targetCabinetId] = {};

      for (const finish of freshFinishes || []) {
        if (!finish.door_style) continue;
        
        console.log('💰💰💰 CALCULATING FOR DOOR STYLE:', finish.door_style.name, 'RATE:', finish.door_style.base_rate_per_sqm, 'TIMESTAMP:', new Date().toISOString());
        newPriceData[targetCabinetId][finish.door_style.id] = {};

        for (const range of freshRanges || []) {
          const width = range.min_width_mm; // Use minimum width instead of average to match popup
          const height = cabinets?.default_height_mm || 720;
          const depth = cabinets?.default_depth_mm || 560;

          // Find the correct color for this door style
          let colorToUse;
          if (finish.door_style.name.trim() === 'Poly') {
            // For Poly, use Pure White
            colorToUse = allColors?.find(c => c.name === 'Pure White');
          } else {
            // For other door styles, find color by door_style_id or use a default
            colorToUse = allColors?.find(c => c.door_style_id === finish.door_style.id) || 
                        allColors?.find(c => c.name === 'sublime tek a') ||
                        allColors?.find(c => c.name === 'Black');
          }

          console.log('🎨 COLOR FOR', finish.door_style.name.trim(), ':', colorToUse?.name, 'Surcharge:', colorToUse?.surcharge_rate_per_sqm);

          const price = pricingService.calculatePrice({
            cabinetType: cabinets as CabinetType,
            width,
            height,
            depth,
            quantity: 1,
            cabinetParts: freshParts || [],
            globalSettings: freshSettings || [],
            doorStyle: finish.door_style,
            color: colorToUse,
            hardwareBrandId: defaultHardwareBrandId,
            hardwareRequirements: hardwareRequirements || [],
            hardwareOptions: hardwareOptions || []
          });

          console.log(`💵💵💵 FINAL PRICE FOR ${finish.door_style.name} ${width}mm: $${price} 💵💵💵`);
          newPriceData[targetCabinetId][finish.door_style.id][range.id] = price;
        }
      }

      setPriceData(newPriceData);
      setDebugData({
        cabinet: cabinets,
        finishes: freshFinishes,
        ranges: freshRanges,
        parts: freshParts,
        settings: freshSettings
      });

    } catch (error) {
      console.error('❌ FRESH CALCULATION ERROR:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Set first cabinet as default when cabinets load and calculate prices for all if "all" is selected
  useEffect(() => {
    if (baseCabinets && baseCabinets.length > 0) {
      if (selectedCabinetType === 'all') {
        // Calculate prices for all cabinets
        baseCabinets.forEach(cabinet => {
          calculatePricesFromScratch(cabinet.id);
        });
      } else if (selectedCabinetType && selectedCabinetType !== 'all') {
        calculatePricesFromScratch();
      }
    }
  }, [baseCabinets, selectedCabinetType]);

  const doorStyles = debugData?.finishes?.map(f => f.door_style).filter(Boolean) as DoorStyle[] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/price-list')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Price List
          </Button>
          
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Base Cabinets Pricing</h1>
            <Button onClick={() => calculatePricesFromScratch()} variant="outline" size="sm">
              🔄 Force Recalculate
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              🌊 Hard Refresh
            </Button>
          </div>
        </div>

        {/* Cabinet Selection Buttons */}
        {loadingCabinets ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading cabinets...</p>
            </CardContent>
          </Card>
        ) : baseCabinets && baseCabinets.length > 0 ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Cabinet Type ({baseCabinets.length} available)</CardTitle>
            </CardHeader>
            <CardContent>
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  <CarouselItem className="pl-2 md:pl-4 md:basis-1/4 lg:basis-1/5">
                    <Button 
                      variant={selectedCabinetType === 'all' ? 'default' : 'outline'} 
                      className="w-full"
                      onClick={() => setSelectedCabinetType('all')}
                    >
                      All Cabinets
                    </Button>
                  </CarouselItem>
                  {baseCabinets.map((cabinet) => (
                    <CarouselItem key={cabinet.id} className="pl-2 md:pl-4 md:basis-1/4 lg:basis-1/5">
                      <Button 
                        variant={selectedCabinetType === cabinet.id ? 'default' : 'outline'} 
                        className="w-full"
                        onClick={() => setSelectedCabinetType(cabinet.id)}
                      >
                        {cabinet.name}
                      </Button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No base cabinets found</p>
            </CardContent>
          </Card>
        )}

        {/* Cabinet Cards Display */}
        {(selectedCabinetType === 'all' ? baseCabinets : baseCabinets?.filter(c => c.id === selectedCabinetType))?.map((cabinet) => (
          <Card key={cabinet.id} className="space-y-0 mb-8">
            {/* Cabinet Name Header */}
            <CardHeader className="text-center border-b">
              <CardTitle className="text-4xl font-bold">
                {cabinet.name}
              </CardTitle>
            </CardHeader>
            
            {/* Door Style Finishes Carousel */}
            {debugData?.finishes && debugData.finishes.length > 0 && (
              <div className="border-b">
                <CardContent className="pb-6">
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {debugData.finishes.map((finish: any) => (
                        <CarouselItem key={finish.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                          <Card 
                            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-primary/50 overflow-hidden hover-scale"
                            onClick={() => finish.image_url && setEnlargedImage({
                              url: finish.image_url,
                              name: finish.door_style?.name || 'Door Style'
                            })}
                          >
                            <div className="relative aspect-[4/3] w-full">
                              {finish.image_url ? (
                                <img 
                                  src={finish.image_url} 
                                  alt={finish.door_style?.name || 'Door Style'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Package className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              {/* Text overlay at bottom - black text with drop shadow, no white box */}
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="font-semibold text-center text-sm text-black drop-shadow-md">
                                  {finish.door_style?.name}
                                </h3>
                              </div>
                            </div>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </CardContent>
              </div>
            )}

            {/* Pricing Table */}
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pricing Table</CardTitle>
                  {isCalculating && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Calculating...</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {Object.keys(priceData).length > 0 && priceData[cabinet.id] && doorStyles.length > 0 ? (
                  <div className="space-y-6">
                    {/* Price Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left p-3 bg-muted font-semibold border">Door Style</th>
                            {debugData?.ranges?.map((range: PriceRange) => (
                              <th key={range.id} className="text-center p-3 bg-muted font-semibold border min-w-24">
                                <div className="text-sm">{range.label}</div>
                                <div className="text-xs text-muted-foreground font-normal">
                                  {range.min_width_mm}mm - {range.max_width_mm}mm
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {doorStyles.map((doorStyle) => (
                            <tr key={doorStyle.id} className="hover:bg-muted/50">
                              <td className="p-3 font-medium border">{doorStyle.name}</td>
                              {debugData?.ranges?.map((range: PriceRange) => {
                                const price = priceData[cabinet.id]?.[doorStyle.id]?.[range.id];
                                return (
                                  <td key={range.id} className="p-3 text-center border">
                                    {price ? formatPrice(price) : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {isCalculating ? 'Calculating prices...' : `No pricing data available for ${cabinet.name}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        ))}

        {/* Enlarged Image Modal */}
        {enlargedImage && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <img 
                src={enlargedImage.url}
                alt={enlargedImage.name}
                className="w-full h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute top-4 left-4 bg-white/90 rounded px-3 py-1">
                <h3 className="font-semibold text-black">{enlargedImage.name}</h3>
              </div>
              <button 
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-black font-bold"
                onClick={() => setEnlargedImage(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseCabinetsPricing;