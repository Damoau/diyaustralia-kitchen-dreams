import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfiguratorDialog } from '@/components/cabinet/ConfiguratorDialog';
import { pricingService } from '@/services/pricingService';
import { CabinetType } from '@/types/cabinet';

const BaseCabinets = () => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [priceData, setPriceData] = useState<any>({});

  // Fetch base cabinet types
  const { data: cabinetTypes, isLoading: loadingCabinets } = useQuery({
    queryKey: ['cabinetTypes', 'base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('category', 'base')
        .eq('active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as CabinetType[];
    },
  });

  // Fetch all necessary data for pricing calculations
  const { data: allPricingData, isLoading: loadingPricing } = useQuery({
    queryKey: ['pricingData'],
    queryFn: async () => {
      const [cabinetPartsRes, globalSettingsRes, priceRangesRes, cabinetTypeFinishesRes] = await Promise.all([
        supabase.from('cabinet_parts').select('*'),
        supabase.from('global_settings').select('*'),
        supabase.from('cabinet_type_price_ranges').select('*').eq('active', true).order('sort_order', { ascending: true }),
        supabase.from('cabinet_type_finishes').select(`
          *,
          door_style:door_styles(*),
          color:colors(*),
          door_style_finish:door_style_finishes(*)
        `).eq('active', true).order('sort_order', { ascending: true })
      ]);

      if (cabinetPartsRes.error) throw cabinetPartsRes.error;
      if (globalSettingsRes.error) throw globalSettingsRes.error;
      if (priceRangesRes.error) throw priceRangesRes.error;
      if (cabinetTypeFinishesRes.error) throw cabinetTypeFinishesRes.error;

      return {
        cabinetParts: cabinetPartsRes.data,
        globalSettings: globalSettingsRes.data,
        priceRanges: priceRangesRes.data,
        cabinetTypeFinishes: cabinetTypeFinishesRes.data
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate price data when all data is available
  React.useEffect(() => {
    if (!cabinetTypes || !allPricingData) return;

    const newPriceData: any = {};

    cabinetTypes.forEach(cabinetType => {
      try {
        const priceTableData = pricingService.generateTableData({
          cabinetType,
          cabinetParts: allPricingData.cabinetParts || [],
          globalSettings: allPricingData.globalSettings || [],
          priceRanges: allPricingData.priceRanges?.filter(r => r.cabinet_type_id === cabinetType.id) || [],
          cabinetTypeFinishes: allPricingData.cabinetTypeFinishes?.filter(f => f.cabinet_type_id === cabinetType.id) || []
        });

        newPriceData[cabinetType.id] = priceTableData;
      } catch (error) {
        console.error(`Error generating price data for ${cabinetType.name}:`, error);
        newPriceData[cabinetType.id] = null;
      }
    });

    setPriceData(newPriceData);
  }, [cabinetTypes, allPricingData]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Link to="/pricing" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Pricing
              </Link>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Base Cabinet <span className="text-primary">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Premium base cabinets with customizable finishes and professional installation. 
              All prices include GST and are updated in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tables */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Base Cabinet Pricing</h2>
          
          {loadingCabinets || loadingPricing ? (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-4">Loading pricing data...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {cabinetTypes?.map((cabinetType) => {
                const cabinetTypeData = priceData[cabinetType.id];
                
                return (
                  <Card key={cabinetType.id} className="shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl">{cabinetType.name}</CardTitle>
                        {loadingPricing && (
                          <Badge variant="secondary" className="animate-pulse">
                            Updating prices...
                          </Badge>
                        )}
                      </div>
                      {cabinetType.short_description && (
                        <p className="text-muted-foreground">{cabinetType.short_description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {!cabinetTypeData ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No pricing configured for this cabinet type.</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Please contact us for a custom quote.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Cabinet Images Carousel */}
                          {cabinetTypeData.finishes && cabinetTypeData.finishes.length > 0 && (
                            <div className="mb-8">
                              <h3 className="text-lg font-semibold mb-4">Available Styles</h3>
                              <Carousel className="w-full max-w-4xl mx-auto">
                                <CarouselContent>
                                  {cabinetTypeData.finishes.map((finish: any) => (
                                    <CarouselItem key={finish.id} className="md:basis-1/3 lg:basis-1/4">
                                      <div className="p-1">
                                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                          <CardContent className="aspect-square p-6 flex flex-col items-center justify-center">
                                            {finish.image_url ? (
                                              <img
                                                src={finish.image_url}
                                                alt={finish.displayName || 'Cabinet Style'}
                                                className="w-full h-32 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setSelectedImage(finish.image_url)}
                                              />
                                            ) : (
                                              <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                                                <span className="text-muted-foreground text-sm">No Image</span>
                                              </div>
                                            )}
                                            <Badge variant="secondary" className="text-xs">
                                              {finish.displayName || 'Unknown Style'}
                                            </Badge>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                              </Carousel>
                            </div>
                          )}

                          {/* Pricing Table */}
                          {cabinetTypeData.sizes && cabinetTypeData.sizes.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-border">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="border border-border p-3 text-left font-semibold">Size Range</th>
                                    {cabinetTypeData.finishes?.map((finish: any) => (
                                      <th key={finish.id} className="border border-border p-3 text-center font-semibold min-w-[120px]">
                                        <div className="flex flex-col items-center space-y-1">
                                          <span>{finish.displayName || 'Unknown'}</span>
                                          {finish.door_style?.base_rate_per_sqm && (
                                            <Badge variant="outline" className="text-xs">
                                              ${finish.door_style.base_rate_per_sqm}/m²
                                            </Badge>
                                          )}
                                        </div>
                                      </th>
                                    ))}
                                    <th className="border border-border p-3 text-center font-semibold">Configure</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cabinetTypeData.sizes.map((size: any, sizeIndex: number) => (
                                    <tr key={sizeIndex} className="hover:bg-muted/30 transition-colors">
                                      <td className="border border-border p-3 font-medium">
                                        <div className="flex flex-col">
                                          <span>{size.range}</span>
                                          {size.width && (
                                            <span className="text-xs text-muted-foreground">
                                              Width: {size.width}mm
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      {size.prices?.map((price: number, priceIndex: number) => (
                                        <td key={priceIndex} className="border border-border p-3 text-center">
                                          <span className="font-semibold text-lg">
                                            {pricingService.formatPrice(price)}
                                          </span>
                                        </td>
                                      ))}
                                      <td className="border border-border p-3 text-center">
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedCabinetType(cabinetType);
                                            setIsConfiguratorOpen(true);
                                          }}
                                          className="bg-primary hover:bg-primary/90"
                                        >
                                          Add to Cart
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Additional Information */}
                          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>Note:</strong> Prices include GST and are updated automatically. 
                              All cabinets come with {cabinetType.door_count || 0} door(s) and {cabinetType.drawer_count || 0} drawer(s).
                              Custom dimensions available - use "Add to Cart" to configure your exact requirements.
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* No Cabinet Types Message */}
              {cabinetTypes && cabinetTypes.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">No Base Cabinets Available</h3>
                    <p className="text-muted-foreground">
                      We're currently updating our cabinet selection. Please check back soon or contact us for assistance.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage('')}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Cabinet Style"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cabinet Configurator */}
      {selectedCabinetType && (
        <ConfiguratorDialog
          cabinetType={selectedCabinetType}
          open={isConfiguratorOpen}
          onOpenChange={setIsConfiguratorOpen}
        />
      )}
    </div>
  );
};

export default BaseCabinets;