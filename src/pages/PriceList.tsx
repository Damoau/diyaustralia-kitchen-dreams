import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
}

interface Color {
  id: string;
  name: string;
  surcharge_rate_per_sqm: number;
}

interface Finish {
  id: string;
  name: string;
  rate_per_sqm: number;
  finish_type: string;
}

export default function PriceList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  // Fetch door styles
  const { data: doorStyles } = useQuery({
    queryKey: ['door-styles-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as DoorStyle[];
    }
  });

  // Fetch colors
  const { data: colors } = useQuery({
    queryKey: ['colors-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Color[];
    }
  });

  // Fetch finishes
  const { data: finishes } = useQuery({
    queryKey: ['finishes-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finishes')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Finish[];
    }
  });

  // Get unique categories and subcategories
  const categories = [...new Set(cabinetTypes?.map(ct => ct.category) || [])];
  const subcategories = selectedCategory === 'all' 
    ? [...new Set(cabinetTypes?.map(ct => ct.subcategory).filter(Boolean) || [])]
    : [...new Set(cabinetTypes?.filter(ct => ct.category === selectedCategory).map(ct => ct.subcategory).filter(Boolean) || [])];

  // Filter cabinet types based on search and category filters
  const filteredCabinetTypes = cabinetTypes?.filter(ct => {
    const matchesSearch = ct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ct.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ct.subcategory?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || ct.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || ct.subcategory === selectedSubcategory;
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  }) || [];

  // Calculate base price for a cabinet (simplified calculation)
  const calculateBasePrice = (cabinetType: CabinetType) => {
    const area = (cabinetType.default_width_mm * cabinetType.default_height_mm) / 1000000; // Convert to sqm
    const baseRate = 150; // Base rate per sqm - this should come from settings
    return area * baseRate;
  };

  // Generate size ranges for display
  const generateSizeRanges = (cabinetType: CabinetType) => {
    const minWidth = cabinetType.min_width_mm || 100;
    const maxWidth = cabinetType.max_width_mm || 1200;
    const ranges = [];
    
    for (let width = minWidth; width < maxWidth; width += 50) {
      ranges.push(`${width}-${width + 49}mm`);
    }
    
    return ranges.slice(0, 5); // Show first 5 ranges
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Price List</h1>
          <p className="text-muted-foreground mb-6">
            Transparent pricing for all our cabinet types, door styles, colors, and finishes.
          </p>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search cabinet types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {subcategories.length > 0 && (
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subcategories.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
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
          <div className="space-y-8">
            {/* Cabinet Types Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Cabinet Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCabinetTypes.map(cabinetType => (
                  <Card key={cabinetType.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{cabinetType.name}</CardTitle>
                        <Badge variant="secondary">{cabinetType.category}</Badge>
                      </div>
                      {cabinetType.subcategory && (
                        <Badge variant="outline" className="w-fit">
                          {cabinetType.subcategory}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cabinetType.short_description && (
                        <p className="text-sm text-muted-foreground">
                          {cabinetType.short_description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Default Size:</span>
                          <span className="text-sm font-medium">
                            {cabinetType.default_width_mm}×{cabinetType.default_height_mm}×{cabinetType.default_depth_mm}mm
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm">Base Price:</span>
                          <span className="text-sm font-semibold text-primary">
                            ${calculateBasePrice(cabinetType).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Available Size Ranges:</p>
                        <div className="flex flex-wrap gap-1">
                          {generateSizeRanges(cabinetType).map(range => (
                            <Badge key={range} variant="outline" className="text-xs">
                              {range}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Door Styles Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Door Styles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {doorStyles?.map(doorStyle => (
                  <Card key={doorStyle.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{doorStyle.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Rate per m²</span>
                        <span className="font-semibold">${doorStyle.base_rate_per_sqm.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Colors Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Colors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {colors?.map(color => (
                  <Card key={color.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{color.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Surcharge per m²</span>
                        <span className="font-semibold">
                          {color.surcharge_rate_per_sqm > 0 
                            ? `+$${color.surcharge_rate_per_sqm.toFixed(2)}`
                            : 'No charge'
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Finishes Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Finishes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {finishes?.map(finish => (
                  <Card key={finish.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{finish.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {finish.finish_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Rate per m²</span>
                        <span className="font-semibold">${finish.rate_per_sqm.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}