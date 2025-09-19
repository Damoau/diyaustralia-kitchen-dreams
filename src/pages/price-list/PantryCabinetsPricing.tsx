import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, ChevronDown, Archive, Loader2, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pricing";
import { pricingService } from "@/services/pricingService";
import { CabinetType } from "@/types/cabinet";
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
  sort_order: number;
}

interface PriceData {
  [cabinetTypeId: string]: {
    [doorStyleId: string]: {
      [rangeId: string]: number;
    };
  };
}

const PantryCabinetsPricing = () => {
  const navigate = useNavigate();
  const [selectedCabinetType, setSelectedCabinetType] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [priceData, setPriceData] = useState<PriceData>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('all');
  const isMobile = useIsMobile();

  // Navigation logic for cycling through categories
  const categories = [
    { title: 'Base Cabinets', path: '/price-list/base-cabinets' },
    { title: 'Top Cabinets', path: '/price-list/top-cabinets' },
    { title: 'Pantry Cabinets', path: '/price-list/pantry-cabinets' },
    { title: 'Dress Panels', path: '/price-list/dress-panels' }
  ];
  
  const currentIndex = categories.findIndex(cat => cat.path === '/price-list/pantry-cabinets');
  const prevCategory = categories[currentIndex - 1];
  const nextCategory = categories[currentIndex + 1];

  const filterOptions = [
    { value: 'doors', label: 'Doors' },
    { value: 'corners', label: 'Corners' },
    { value: 'appliance_cabinets', label: 'Appliance Cabinets' }
  ];

  const getSelectedFilterLabel = () => {
    if (selectedFilter === 'all') return 'All Cabinets';
    return filterOptions.find(option => option.value === selectedFilter)?.label || 'All Cabinets';
  };

  // Fetch pantry cabinets
  const { data: pantryCabinets, isLoading: loadingCabinets } = useQuery({
    queryKey: ['pantry-cabinets', selectedFilter],
    queryFn: async () => {
      let query = supabase
        .from('cabinet_types')
        .select('*')
        .eq('category', 'pantry')
        .eq('active', true)
        .order('name');

      if (selectedFilter !== 'all') {
        query = query.or(`subcategory.eq.${selectedFilter},subcategory.like.%${selectedFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CabinetType[];
    }
  });

  // Fetch cabinet type finishes for selected cabinet
  const { data: cabinetTypeFinishes, isLoading: loadingFinishes } = useQuery({
    queryKey: ['cabinet-type-finishes', selectedCabinetType],
    queryFn: async () => {
      if (!selectedCabinetType) return [];
      const { data, error } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(*)
        `)
        .eq('cabinet_type_id', selectedCabinetType)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCabinetType
  });

  // Fetch price ranges for selected cabinet
  const { data: priceRanges, isLoading: loadingRanges } = useQuery({
    queryKey: ['price-ranges', selectedCabinetType],
    queryFn: async () => {
      if (!selectedCabinetType) return [];
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('cabinet_type_id', selectedCabinetType)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data as PriceRange[];
    },
    enabled: !!selectedCabinetType
  });

  // Fetch additional required data
  const { data: cabinetParts } = useQuery({
    queryKey: ['cabinet-parts', selectedCabinetType],
    queryFn: async () => {
      if (!selectedCabinetType) return [];
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', selectedCabinetType);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCabinetType
  });

  const { data: globalSettings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Calculate prices when data is available
  const calculatePrices = async () => {
    if (!selectedCabinetType || !cabinetTypeFinishes || !priceRanges || !cabinetParts || !globalSettings) return;

    setIsCalculating(true);
    const newPriceData: PriceData = {};
    newPriceData[selectedCabinetType] = {};

    const selectedCabinet = pantryCabinets?.find(c => c.id === selectedCabinetType);
    if (!selectedCabinet) return;

    // Get Titus hardware brand ID for consistent pricing
    const { data: hardwareBrands } = await supabase
      .from('hardware_brands')
      .select('*')
      .eq('active', true);
    
    const titusBrand = hardwareBrands?.find(brand => brand.name === 'Titus');
    const defaultHardwareBrandId = titusBrand?.id || null;

    // Get hardware requirements and options for pricing calculation
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

    try {
      for (const finish of cabinetTypeFinishes) {
        if (!finish.door_style) continue;
        
        newPriceData[selectedCabinetType][finish.door_style.id] = {};

        for (const range of priceRanges) {
          // Use middle of the range for calculation
          const width = (range.min_width_mm + range.max_width_mm) / 2;
          const height = selectedCabinet.default_height_mm || 2100;
          const depth = selectedCabinet.default_depth_mm || 560;

          const price = pricingService.calculatePrice({
            cabinetType: selectedCabinet,
            width,
            height, 
            depth,
            quantity: 1,
            cabinetParts,
            globalSettings,
            doorStyle: finish.door_style,
            color: null,
            hardwareBrandId: defaultHardwareBrandId,
            hardwareRequirements: hardwareRequirements || [],
            hardwareOptions: hardwareOptions || []
          });

          newPriceData[selectedCabinetType][finish.door_style.id][range.id] = price;
        }
      }

      setPriceData(newPriceData);
    } finally {
      setIsCalculating(false);
    }
  };

  // Set first cabinet as default when cabinets load
  useEffect(() => {
    if (pantryCabinets && pantryCabinets.length > 0 && !selectedCabinetType) {
      setSelectedCabinetType(pantryCabinets[0].id);
    }
  }, [pantryCabinets, selectedCabinetType]);

  // Trigger calculation when dependencies change
  useEffect(() => {
    if (selectedCabinetType && cabinetTypeFinishes && priceRanges && cabinetParts && globalSettings) {
      calculatePrices();
    }
  }, [selectedCabinetType, cabinetTypeFinishes, priceRanges, cabinetParts, globalSettings]);

  const doorStyles = cabinetTypeFinishes?.map(f => f.door_style).filter(Boolean) as DoorStyle[] || [];
  
  // Filter door styles based on mobile selection
  const filteredDoorStyles = isMobile && selectedDoorStyle !== 'all' 
    ? doorStyles.filter(style => style.name.toLowerCase().includes(selectedDoorStyle.toLowerCase()))
    : doorStyles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1;
              navigate(categories[newIndex].path);
            }}
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 text-center min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Pantry Cabinets Pricing
            </h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newIndex = currentIndex === categories.length - 1 ? 0 : currentIndex + 1;
              navigate(categories[newIndex].path);
            }}
            className="flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Cabinet Subcategory Filter */}
        {loadingCabinets ? (
          <div className="flex justify-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex justify-center mb-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full max-w-sm h-12 justify-center">
                  <span className="flex-1 text-center">{getSelectedFilterLabel()}</span>
                  <ChevronDown className="h-4 w-4 text-primary ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-full max-w-sm">
                <DropdownMenuItem
                  onClick={() => setSelectedFilter('all')}
                  className={`justify-center ${selectedFilter === 'all' ? "bg-primary/10" : ""}`}
                >
                  All Cabinets
                </DropdownMenuItem>
                {filterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`justify-center ${selectedFilter === option.value ? "bg-primary/10" : ""}`}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Pricing Table */}
        {selectedCabinetType && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {pantryCabinets?.find(c => c.id === selectedCabinetType)?.name}
                  </h2>
                  <CardTitle>Pricing Table</CardTitle>
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
              {loadingFinishes || loadingRanges ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredDoorStyles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No door styles configured for this cabinet type
                </div>
              ) : priceRanges?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No price ranges configured for this cabinet type
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Size Range</th>
                        {filteredDoorStyles.map((doorStyle) => (
                          <th key={doorStyle.id} className="text-center p-4 font-semibold">
                            {doorStyle.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {priceRanges?.map((range) => (
                        <tr key={range.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">
                            <div>
                              <div className="font-semibold">{range.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {range.min_width_mm}mm - {range.max_width_mm}mm
                              </div>
                            </div>
                          </td>
                          {filteredDoorStyles.map((doorStyle) => {
                            const price = priceData[selectedCabinetType]?.[doorStyle.id]?.[range.id];
                            return (
                              <td key={doorStyle.id} className="p-4 text-center">
                                {price ? (
                                  <div className="font-semibold text-lg">
                                    {formatPrice(price)}
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
};

export default PantryCabinetsPricing;