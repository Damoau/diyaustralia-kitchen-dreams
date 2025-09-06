import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType, CabinetPart, GlobalSettings, HardwareBrand, CabinetTypePriceRange, CabinetTypeFinish } from "@/types/cabinet";
import { calculateCabinetPrice } from "@/lib/dynamicPricing";
import { calculateHardwareCost } from "@/lib/hardwarePricing";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";

const CabinetPricesNew = () => {
  const [selectedHardwareBrand, setSelectedHardwareBrand] = useState<string>('');
  const [priceData, setPriceData] = useState<any>({});
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

  const { data: hardwareBrands } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true);
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

  const { data: cabinetTypeFinishes } = useQuery({
    queryKey: ['cabinet-type-finishes'],
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
        const typeFinishes = cabinetTypeFinishes
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

              const hardwareCost = selectedHardwareBrand ? 
                await calculateHardwareCost(cabinetType, selectedHardwareBrand, 1) : 
                45;

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
  }, [cabinetTypes, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes, selectedHardwareBrand]);

  // Set default hardware brand
  useEffect(() => {
    if (hardwareBrands && hardwareBrands.length > 0 && !selectedHardwareBrand) {
      setSelectedHardwareBrand(hardwareBrands[0].id);
    }
  }, [hardwareBrands, selectedHardwareBrand]);

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
              Dynamic pricing based on your cabinet configurations. Select hardware brand to see updated prices.
            </p>
            
            {/* Hardware Brand Selector */}
            <div className="max-w-xs mx-auto mb-8">
              <Label htmlFor="hardware-brand" className="text-sm font-medium">
                Hardware Brand
              </Label>
              <Select value={selectedHardwareBrand} onValueChange={setSelectedHardwareBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware brand" />
                </SelectTrigger>
                <SelectContent>
                  {hardwareBrands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            // Get finishes for this cabinet type
            const typeFinishes = cabinetTypeFinishes?.filter((ctf: any) => 
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
                <h2 className="text-2xl font-semibold mb-6">
                  {cabinetType.name}
                  {!typeData.hasConfiguredRanges && (
                    <span className="ml-2 text-sm font-normal text-orange-600">
                      (Using default ranges - configure in admin for custom ranges)
                    </span>
                  )}
                </h2>
                
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
                              {formatPrice(price)}
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

      <Footer />
    </div>
  );
};

export default CabinetPricesNew;