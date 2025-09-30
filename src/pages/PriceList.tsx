import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SEOTags } from '@/components/SEOTags';

interface CabinetType {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  short_description?: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  product_image_url?: string;
}

interface DoorStyle {
  id: string;
  name: string;
  base_rate_per_sqm: number;
  description?: string;
  image_url?: string;
}

interface CabinetDoorStyle {
  id: string;
  cabinet_type_id: string;
  door_style_id: string;
  image_url?: string;
  door_style: DoorStyle;
}

export default function PriceList() {
  const [activeCategory, setActiveCategory] = useState('base-cabinets');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  // Fetch cabinet types
  const { data: cabinetTypes, isLoading: loadingCabinets } = useQuery({
    queryKey: ['cabinet-types-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as CabinetType[];
    }
  });

  // Fetch cabinet door styles with door style details
  const { data: cabinetDoorStyles } = useQuery({
    queryKey: ['cabinet-door-styles-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_door_styles')
        .select(`
          *,
          door_style:door_styles(*)
        `)
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as CabinetDoorStyle[];
    }
  });

  // Category mappings
  const categoryMappings = {
    'base-cabinets': 'Base Cabinets',
    'top-cabinets': 'Top Cabinets', 
    'pantry-cabinets': 'Pantry Cabinets',
    'dress-panels-fillers': 'Dress Panels & Fillers'
  };

  // Get cabinets for current category
  const getCurrentCabinets = () => {
    if (!cabinetTypes) return [];
    
    const categoryName = categoryMappings[activeCategory as keyof typeof categoryMappings];
    let cabinets = cabinetTypes.filter(ct => ct.category === categoryName);
    
    if (selectedSubcategory !== 'all') {
      cabinets = cabinets.filter(ct => ct.subcategory === selectedSubcategory);
    }
    
    return cabinets;
  };

  // Get subcategories for current category
  const getSubcategories = () => {
    if (!cabinetTypes) return [];
    
    const categoryName = categoryMappings[activeCategory as keyof typeof categoryMappings];
    const cabinets = cabinetTypes.filter(ct => ct.category === categoryName);
    return [...new Set(cabinets.map(ct => ct.subcategory).filter(Boolean))];
  };

  // Generate width ranges for cabinet
  const generateWidthRanges = (cabinetType: CabinetType) => {
    const minWidth = cabinetType.min_width_mm || 100;
    const maxWidth = cabinetType.max_width_mm || 1200;
    const ranges = [];
    
    for (let width = minWidth; width < maxWidth; width += 50) {
      ranges.push({
        display: `${width}-${width + 49}`,
        priceWidth: width + 49 // Use the higher number for pricing
      });
    }
    
    return ranges;
  };

  // Calculate price for specific width and door style
  const calculatePrice = (widthMm: number, heightMm: number, doorStyleRate: number) => {
    const area = (widthMm * heightMm) / 1000000; // Convert to sqm
    return area * doorStyleRate;
  };

  // Get door styles for a specific cabinet
  const getDoorStylesForCabinet = (cabinetId: string) => {
    if (!cabinetDoorStyles) return [];
    return cabinetDoorStyles.filter(cds => cds.cabinet_type_id === cabinetId);
  };

  const currentCabinets = getCurrentCabinets();
  const subcategories = getSubcategories();

  // Render cabinet pricing table
  const renderCabinetTable = (cabinet: CabinetType) => {
    const doorStyles = getDoorStylesForCabinet(cabinet.id);
    const widthRanges = generateWidthRanges(cabinet);

    if (doorStyles.length === 0) return null;

    return (
      <div key={cabinet.id} className="mb-12">
        <h3 className="text-xl font-semibold mb-4">{cabinet.name}</h3>
        
        {/* Door Style Images Carousel */}
        <div className="mb-6">
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {doorStyles.map((doorStyle) => (
                <CarouselItem key={doorStyle.id} className="md:basis-1/3 lg:basis-1/4">
                  <div className="p-2">
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6">
                        {doorStyle.image_url ? (
                          <div className="text-center space-y-2">
                            <img 
                              src={doorStyle.image_url} 
                              alt={doorStyle.door_style.name}
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-sm font-medium">{doorStyle.door_style.name}</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-full h-32 bg-muted rounded mb-2"></div>
                            <p className="text-sm font-medium">{doorStyle.door_style.name}</p>
                          </div>
                        )}
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

        {/* Pricing Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr>
                <th className="border border-border p-3 bg-muted text-left font-semibold">
                  Width (mm)
                </th>
                {doorStyles.map((doorStyle) => (
                  <th key={doorStyle.id} className="border border-border p-3 bg-muted text-center font-semibold min-w-[120px]">
                    {doorStyle.door_style.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {widthRanges.map((range) => (
                <tr key={range.display}>
                  <td className="border border-border p-3 font-medium">
                    {range.display}
                  </td>
                  {doorStyles.map((doorStyle) => (
                    <td key={doorStyle.id} className="border border-border p-3 text-center">
                      ${calculatePrice(
                        range.priceWidth, 
                        cabinet.default_height_mm, 
                        doorStyle.door_style.base_rate_per_sqm
                      ).toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOTags pageType="static" pageIdentifier="/price-list" />
      <Header />
      
      <main className="container mx-auto px-4 py-8 mobile-safe-bottom">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Price List</h1>
          <p className="text-muted-foreground mb-6">
            Comprehensive pricing for all our cabinet types with door style options.
          </p>
          
          <div className="flex justify-end mb-6">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {loadingCabinets ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="base-cabinets">Base Cabinets</TabsTrigger>
              <TabsTrigger value="top-cabinets">Top Cabinets</TabsTrigger>
              <TabsTrigger value="pantry-cabinets">Pantry Cabinets</TabsTrigger>
              <TabsTrigger value="dress-panels-fillers">Dress Panels & Fillers</TabsTrigger>
            </TabsList>

            {Object.keys(categoryMappings).map((categoryKey) => (
              <TabsContent key={categoryKey} value={categoryKey} className="space-y-6">
                {/* Subcategory Filter */}
                {subcategories.length > 0 && (
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Filter by subcategory:</label>
                    <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Subcategories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cabinets</SelectItem>
                        {subcategories.map(subcategory => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Cabinet Tables */}
                <div className="space-y-8">
                  {currentCabinets.length > 0 ? (
                    currentCabinets.map(cabinet => renderCabinetTable(cabinet))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No cabinets found for this category{selectedSubcategory !== 'all' ? ' and subcategory' : ''}.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
      
      <Footer />
    </div>
  );
}