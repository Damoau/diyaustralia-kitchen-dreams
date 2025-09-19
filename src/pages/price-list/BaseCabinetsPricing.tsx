import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Package, Loader2, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pricing";
import { pricingService } from "@/services/pricingService";
import { CabinetType } from "@/types/cabinet";
import { PriceCalculationBreakdown } from "@/components/price-list/PriceCalculationBreakdown";
import { CabinetPricingTable } from "@/components/price-list/CabinetPricingTable";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/Header";

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
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('all');
  const isMobile = useIsMobile();

  // Navigation logic for cycling through categories
  const categories = [
    { title: 'Base Cabinets', path: '/price-list/base-cabinets' },
    { title: 'Top Cabinets', path: '/price-list/top-cabinets' },
    { title: 'Pantry Cabinets', path: '/price-list/pantry-cabinets' },
    { title: 'Dress Panels', path: '/price-list/dress-panels' }
  ];
  
  const currentIndex = categories.findIndex(cat => cat.path === '/price-list/base-cabinets');
  const prevCategory = categories[currentIndex - 1];
  const nextCategory = categories[currentIndex + 1];

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
    console.log('🎯 CALCULATE PRICES FOR:', targetCabinetId, 'Type:', typeof targetCabinetId);
    if (!targetCabinetId || targetCabinetId === 'all') {
      console.log('❌ SKIPPING - Invalid cabinet ID or "all" selected');
      return;
    }
    
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
      
      const titusBrand = hardwareBrands?.find(brand => brand.name.toLowerCase().includes('titus'));
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
      console.log('💾 PRICE DATA SAVED FOR CABINET:', targetCabinetId, 'Data:', newPriceData[targetCabinetId]);
      setDebugData({
        cabinet: cabinets,
        finishes: freshFinishes,
        ranges: freshRanges,
        parts: freshParts,
        settings: freshSettings
      });
      console.log('🐛 DEBUG DATA SET:', {
        cabinetName: cabinets?.name,
        finishesCount: freshFinishes?.length,
        rangesCount: freshRanges?.length
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
  console.log('🚪 DOOR STYLES CALCULATED:', {
    debugDataExists: !!debugData,
    finishesCount: debugData?.finishes?.length || 0,
    doorStylesCount: doorStyles.length,
    doorStyles: doorStyles.map(ds => ds.name)
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => prevCategory && navigate(prevCategory.path)}
            disabled={!prevCategory}
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="w-80 text-center min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
              Base Cabinets Pricing
            </h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nextCategory && navigate(nextCategory.path)}
            disabled={!nextCategory}
            className="flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Cabinet Selection Filter */}
        {loadingCabinets ? (
          <div className="flex justify-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : baseCabinets && baseCabinets.length > 0 ? (
          <div className="flex justify-center mb-8">
            <Select value={selectedCabinetType} onValueChange={setSelectedCabinetType}>
              <SelectTrigger className="w-full max-w-sm h-12 justify-center">
                <SelectValue>
                  <span className="flex-1 text-center">
                    {selectedCabinetType === 'all' 
                      ? `Select Cabinet Type (${baseCabinets.length} available)`
                      : baseCabinets.find(c => c.id === selectedCabinetType)?.name || 'Select Cabinet Type'
                    }
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="center" className="w-full max-w-sm">
                <SelectItem value="all">All Cabinets ({baseCabinets.length} available)</SelectItem>
                {baseCabinets.map((cabinet) => (
                  <SelectItem key={cabinet.id} value={cabinet.id}>
                    {cabinet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex justify-center mb-8">
            <p className="text-muted-foreground">No base cabinets found</p>
          </div>
        )}

        {/* Mobile Door Style Filter */}
        {isMobile && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Filter by Kitchen Style</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a kitchen style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="shaker">Shaker</SelectItem>
                  <SelectItem value="poly">Poly</SelectItem>
                  <SelectItem value="ultimate">Ultimate</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Cabinet Cards Display */}
        {(selectedCabinetType === 'all' ? baseCabinets : baseCabinets?.filter(c => c.id === selectedCabinetType))?.map((cabinet) => (
          <CabinetPricingTable 
            key={cabinet.id} 
            cabinet={cabinet}
            onImageEnlarge={setEnlargedImage}
            selectedDoorStyleFilter={isMobile ? selectedDoorStyle : undefined}
          />
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
    </div>
  );
};

export default BaseCabinetsPricing;