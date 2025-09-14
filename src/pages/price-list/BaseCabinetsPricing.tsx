import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pricing";
import { pricingService } from "@/services/pricingService";
import { CabinetType } from "@/types/cabinet";

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

const BaseCabinetsPricing = () => {
  const navigate = useNavigate();
  const [selectedCabinetType, setSelectedCabinetType] = useState<string>('');
  const [priceData, setPriceData] = useState<PriceData>({});
  const [isCalculating, setIsCalculating] = useState(false);

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

    const selectedCabinet = baseCabinets?.find(c => c.id === selectedCabinetType);
    if (!selectedCabinet) return;

    try {
      for (const finish of cabinetTypeFinishes) {
        if (!finish.door_style) continue;
        
        newPriceData[selectedCabinetType][finish.door_style.id] = {};

        for (const range of priceRanges) {
          // Use middle of the range for calculation
          const width = (range.min_width_mm + range.max_width_mm) / 2;
          const height = selectedCabinet.default_height_mm || 720;
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
            hardwareBrandId: null
          });

          newPriceData[selectedCabinetType][finish.door_style.id][range.id] = price;
        }
      }

      setPriceData(newPriceData);
    } finally {
      setIsCalculating(false);
    }
  };

  // Trigger calculation when dependencies change
  useState(() => {
    if (selectedCabinetType && cabinetTypeFinishes && priceRanges && cabinetParts && globalSettings) {
      calculatePrices();
    }
  });

  const doorStyles = cabinetTypeFinishes?.map(f => f.door_style).filter(Boolean) as DoorStyle[] || [];

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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Base Cabinets Pricing</h1>
          </div>
        </div>

        {/* Cabinet Type Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Cabinet Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingCabinets ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                baseCabinets?.map((cabinet) => (
                  <Card 
                    key={cabinet.id}
                    className={`cursor-pointer transition-all ${
                      selectedCabinetType === cabinet.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedCabinetType(cabinet.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground">{cabinet.name}</h3>
                      {selectedCabinetType === cabinet.id && (
                        <Badge className="mt-2" variant="default">Selected</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Table */}
        {selectedCabinetType && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pricing Table</CardTitle>
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
              ) : doorStyles.length === 0 ? (
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
                        {doorStyles.map((doorStyle) => (
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
                          {doorStyles.map((doorStyle) => {
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
  );
};

export default BaseCabinetsPricing;