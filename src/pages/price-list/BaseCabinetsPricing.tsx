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
  console.log('🔥🔥🔥 COMPONENT LOADED 🔥🔥🔥', new Date().toISOString());
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCabinetType, setSelectedCabinetType] = useState<string>('');
  const [priceData, setPriceData] = useState<PriceData>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

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
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('category', 'base')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as CabinetType[];
    }
  });

  // Calculate prices COMPLETELY FRESH - no dependencies on React Query
  const calculatePricesFromScratch = async () => {
    if (!selectedCabinetType) return;
    
    console.log('🔥🔥🔥 COMPLETE FRESH CALCULATION START - TIMESTAMP:', new Date().toISOString());
    setIsCalculating(true);
    
    try {
      // 1. Get selected cabinet fresh
      const { data: cabinets } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', selectedCabinetType)
        .single();

      console.log('📦 FRESH CABINET:', cabinets);

      // 2. Get finishes fresh
      const { data: freshFinishes } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(*)
        `)
        .eq('cabinet_type_id', selectedCabinetType)
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
        .eq('cabinet_type_id', selectedCabinetType)
        .eq('active', true)
        .order('sort_order');

      // 4. Get cabinet parts fresh
      const { data: freshParts } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', selectedCabinetType);

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
        .eq('cabinet_type_id', selectedCabinetType)
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
      const newPriceData: PriceData = {};
      newPriceData[selectedCabinetType] = {};

      for (const finish of freshFinishes || []) {
        if (!finish.door_style) continue;
        
        console.log('💰💰💰 CALCULATING FOR DOOR STYLE:', finish.door_style.name, 'RATE:', finish.door_style.base_rate_per_sqm, 'TIMESTAMP:', new Date().toISOString());
        newPriceData[selectedCabinetType][finish.door_style.id] = {};

        for (const range of freshRanges || []) {
          const width = (range.min_width_mm + range.max_width_mm) / 2;
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
          newPriceData[selectedCabinetType][finish.door_style.id][range.id] = price;
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

  // Set first cabinet as default when cabinets load
  useEffect(() => {
    if (baseCabinets && baseCabinets.length > 0 && !selectedCabinetType) {
      const firstCabinet = baseCabinets[0];
      console.log('🎯 SETTING FIRST CABINET:', firstCabinet.name, firstCabinet.id);
      setSelectedCabinetType(firstCabinet.id);
    }
  }, [baseCabinets, selectedCabinetType]);

  // Trigger fresh calculation when cabinet type changes
  useEffect(() => {
    if (selectedCabinetType) {
      console.log('🔄🔄🔄 CABINET TYPE CHANGED - STARTING FRESH CALCULATION - TIMESTAMP:', new Date().toISOString());
      // Clear all state first
      setPriceData({});
      setDebugData(null);
      // Force calculation with delay to ensure state is cleared
      setTimeout(() => calculatePricesFromScratch(), 100);
    }
  }, [selectedCabinetType]);

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
            <Button onClick={calculatePricesFromScratch} variant="outline" size="sm">
              🔄 Force Recalculate
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              🌊 Hard Refresh
            </Button>
          </div>
        </div>

        {/* Cabinet Selection Carousel */}
        {baseCabinets && baseCabinets.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Cabinet Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {baseCabinets.map((cabinet) => (
                    <CarouselItem key={cabinet.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedCabinetType === cabinet.id 
                            ? 'ring-2 ring-primary shadow-lg' 
                            : 'hover:ring-1 hover:ring-primary/50'
                        }`}
                        onClick={() => setSelectedCabinetType(cabinet.id)}
                      >
                        <CardContent className="p-4">
                          {cabinet.product_image_url && (
                            <img 
                              src={cabinet.product_image_url} 
                              alt={cabinet.name}
                              className="w-full h-32 object-cover rounded-md mb-3"
                            />
                          )}
                          <h3 className="font-semibold text-sm mb-2">{cabinet.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{cabinet.short_description}</p>
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {cabinet.door_count || 0} doors
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {cabinet.drawer_count || 0} drawers
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>
        )}

        {/* Pricing Table */}
        {selectedCabinetType && (
          <Card key={`pricing-${selectedCabinetType}-${Date.now()}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {baseCabinets?.find(c => c.id === selectedCabinetType)?.name}
                  </h2>
                  <CardTitle>Pricing Table - CACHE BUST: {Date.now()}</CardTitle>
                </div>
                {isCalculating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating prices...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingCabinets ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : doorStyles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No door styles configured for this cabinet type
                </div>
              ) : debugData?.ranges?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No price ranges configured for this cabinet type
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Size Range</th>
                        {doorStyles.map((style) => (
                          <th key={style.id} className="text-center p-3 font-semibold min-w-[120px]">
                            {style.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {debugData?.ranges?.map((range: PriceRange) => (
                        <tr key={range.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="font-medium">{range.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {range.min_width_mm}mm - {range.max_width_mm}mm
                            </div>
                          </td>
                          {doorStyles.map((style) => (
                            <td key={style.id} className="text-center p-3">
                              {priceData[selectedCabinetType]?.[style.id]?.[range.id] ? (
                                <div>
                                  <span className="font-semibold text-primary block">
                                    {formatPrice(priceData[selectedCabinetType][style.id][range.id])}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Rate: ${style.base_rate_per_sqm}/m²
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Price Calculation Breakdown - FORCE REFRESH */}
        {selectedCabinetType && debugData?.finishes?.[0]?.door_style && debugData?.finishes?.[0]?.color && (
          <PriceCalculationBreakdown
            key={`breakdown-${Date.now()}`}
            cabinetType={selectedCabinetType}
            doorStyle={debugData.finishes.find(f => f.door_style?.name.trim() === 'Poly')?.door_style || debugData.finishes[0].door_style}
            color={debugData.finishes[0].color}
            priceRanges={debugData.ranges}
          />
        )}

        {/* Debug Information */}
        {debugData && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Door Styles Found:</h4>
                  <pre className="text-sm bg-muted p-2 rounded">
                    {JSON.stringify(debugData.finishes?.map(f => ({
                      name: f.door_style?.name,
                      rate: f.door_style?.base_rate_per_sqm
                    })), null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold">Price Ranges:</h4>
                  <pre className="text-sm bg-muted p-2 rounded">
                    {JSON.stringify(debugData.ranges?.map(r => ({
                      label: r.label,
                      min: r.min_width_mm,
                      max: r.max_width_mm
                    })), null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BaseCabinetsPricing;