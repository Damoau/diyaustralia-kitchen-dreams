import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CellConfigPopup } from "@/components/cabinet/CellConfigPopup";
import { supabase } from "@/integrations/supabase/client";
import { CabinetType, CabinetPart, GlobalSettings, CabinetTypePriceRange, CabinetTypeFinish } from "@/types/cabinet";
import { calculateCabinetPrice } from "@/lib/dynamicPricing";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";

const BaseCabinets = () => {
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
                  name: finish.door_style?.name + ' Finish' || 'Standard Finish',
                  rate_per_sqm: 150, // Default rate
                  door_style_id: finish.door_style?.id,
                  door_style: finish.door_style
                };

                const mockColor = finish.color || {
                  id: 'default-color',
                  name: 'Standard',
                  surcharge_rate_per_sqm: 0,
                  hex_code: '#ffffff',
                  active: true,
                  door_style_id: finish.door_style.id
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

  const handleCellClick = (cabinetType: CabinetType, sizeRange: string, price: number, finishConfig: any) => {
    console.log('Cell clicked:', { cabinetType: cabinetType.name, sizeRange, price, doorStyle: finishConfig.door_style?.name });
    
    const width = parseWidthRange(sizeRange);
    
    const mockFinish = {
      id: finishConfig.id,
      name: finishConfig.door_style_finish?.name || 'Standard Finish',
      finish_type: 'standard',
      rate_per_sqm: finishConfig.door_style_finish?.rate_per_sqm || 0,
      brand_id: '',
      active: true,
      created_at: new Date().toISOString(),
      door_style_name: finishConfig.door_style?.name || 'Unknown Style'
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
              Quality base cabinets for your kitchen. Click any price to configure and add to your quote.
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
                    <tbody>
                      {typeData.sizes?.map((sizeData: any, sizeIndex: number) => (
                        <tr key={sizeIndex} className="hover:bg-muted/50">
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

export default BaseCabinets;