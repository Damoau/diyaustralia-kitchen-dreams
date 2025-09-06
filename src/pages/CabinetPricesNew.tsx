import { useState, useEffect, useMemo } from "react";
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
import { generatePriceTableData } from "@/lib/dynamicPricing";
import { calculateHardwareCost } from "@/lib/hardwarePricing";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";

const CabinetPricesNew = () => {
  const [selectedHardwareBrand, setSelectedHardwareBrand] = useState<string>('');
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
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: cabinetTypeFinishes } = useQuery({
    queryKey: ['cabinet-type-finishes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_type_finishes' as any)
        .select(`
          *,
          finish:finishes(*),
          door_style:door_styles(*)
        `)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const priceData = useMemo(async () => {
    if (!cabinetTypes || !cabinetParts || !globalSettings || !priceRanges || !cabinetTypeFinishes) {
      return {};
    }

    const hardwareCost = selectedHardwareBrand ? 
      await calculateHardwareCost(cabinetTypes[0], selectedHardwareBrand, 1) : 
      45; // default hardware cost

    return await generatePriceTableData(
      cabinetTypes,
      cabinetParts,
      globalSettings,
      priceRanges,
      cabinetTypeFinishes,
      hardwareCost
    );
  }, [cabinetTypes, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes, selectedHardwareBrand]);

  const [resolvedPriceData, setResolvedPriceData] = useState<any>({});

  useEffect(() => {
    if (priceData instanceof Promise) {
      priceData.then(setResolvedPriceData);
    } else {
      setResolvedPriceData(priceData);
    }
  }, [priceData]);

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
            const typeData = resolvedPriceData[cabinetType.name];
            if (!typeData) return null;

            // Get finishes for this cabinet type
            const typeFinishes = cabinetTypeFinishes?.filter((ctf: any) => 
              ctf.cabinet_type_id === cabinetType.id && ctf.active
            ).sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

            if (typeFinishes.length === 0) return null;

            return (
              <div key={cabinetType.id} className="mb-12">
                <h2 className="text-2xl font-semibold mb-6">{cabinetType.name}</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium">
                          Size Range
                        </th>
                        {typeFinishes.map((ctf: any) => (
                          <th key={ctf.id} className="border border-gray-300 px-4 py-3 text-center font-medium min-w-[120px]">
                            {ctf.finish?.brand?.name} - {ctf.door_style?.name}
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
                No cabinet types with pricing configured yet. Please set up cabinet types with price ranges and finishes in the admin panel.
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