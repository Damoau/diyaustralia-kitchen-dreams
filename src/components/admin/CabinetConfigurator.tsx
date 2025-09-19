import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PriceCalculationEngine } from './PriceCalculationEngine';
import {
  Loader2,
  Plus,
  Minus,
  ShoppingCart,
  Calculator,
  Eye,
  Save,
  Copy,
  RefreshCw,
  Settings
} from 'lucide-react';

interface CabinetType {
  id: string;
  name: string;
  category: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  min_height_mm?: number;
  max_height_mm?: number;
  min_depth_mm?: number;
  max_depth_mm?: number;
  base_price: number;
}

interface DoorStyle {
  id: string;
  name: string;
  base_rate_per_sqm: number;
  image_url?: string;
}

interface Color {
  id: string;
  name: string;
  hex_code?: string;
  surcharge_rate_per_sqm: number;
  image_url?: string;
}

interface HardwareBrand {
  id: string;
  name: string;
  description?: string;
}

interface Configuration {
  cabinetTypeId: string;
  width: number;
  height: number; 
  depth: number;
  doorStyleId: string;
  colorId: string;
  hardwareBrandId: string;
  quantity: number;
}

export const CabinetConfigurator = () => {
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [configuration, setConfiguration] = useState<Configuration>({
    cabinetTypeId: '',
    width: 600,
    height: 720,
    depth: 560,
    doorStyleId: '',
    colorId: '',
    hardwareBrandId: '',
    quantity: 1
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [livePricing, setLivePricing] = useState(true);
  const { toast } = useToast();

  // Fetch cabinet types
  const { data: cabinetTypes, isLoading: loadingCabinets } = useQuery({
    queryKey: ['cabinet-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as CabinetType[];
    }
  });

  // Fetch door styles
  const { data: doorStyles, isLoading: loadingDoorStyles } = useQuery({
    queryKey: ['door-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as DoorStyle[];
    }
  });

  // Fetch colors
  const { data: colors, isLoading: loadingColors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Color[];
    }
  });

  // Fetch hardware brands
  const { data: hardwareBrands, isLoading: loadingHardware } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as HardwareBrand[];
    }
  });

  // Calculate price whenever configuration changes
  useEffect(() => {
    if (selectedCabinetType && doorStyles && colors && livePricing) {
      calculatePrice();
    }
  }, [configuration, selectedCabinetType, doorStyles, colors, livePricing]);

  const calculatePrice = () => {
    if (!selectedCabinetType) return;

    const doorStyle = doorStyles?.find(ds => ds.id === configuration.doorStyleId);
    const color = colors?.find(c => c.id === configuration.colorId);

    if (!doorStyle || !color) return;

    // Calculate surface area (simplified - front face + edges)
    const widthM = configuration.width / 1000;
    const heightM = configuration.height / 1000;
    const surfaceArea = widthM * heightM;

    // Base price + door style rate + color surcharge
    const unitPrice = selectedCabinetType.base_price + 
                     (doorStyle.base_rate_per_sqm * surfaceArea) +
                     (color.surcharge_rate_per_sqm * surfaceArea);

    const total = unitPrice * configuration.quantity;
    setTotalPrice(total);
  };

  const handleCabinetTypeChange = (cabinetTypeId: string) => {
    const cabinet = cabinetTypes?.find(ct => ct.id === cabinetTypeId);
    if (!cabinet) return;

    setSelectedCabinetType(cabinet);
    setConfiguration(prev => ({
      ...prev,
      cabinetTypeId,
      width: cabinet.default_width_mm,
      height: cabinet.default_height_mm,
      depth: cabinet.default_depth_mm
    }));
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: number) => {
    if (!selectedCabinetType) return;

    // Validate against constraints
    let validValue = value;
    if (dimension === 'width') {
      validValue = Math.max(
        selectedCabinetType.min_width_mm || 100,
        Math.min(selectedCabinetType.max_width_mm || 1200, value)
      );
    } else if (dimension === 'height') {
      validValue = Math.max(
        selectedCabinetType.min_height_mm || 200,
        Math.min(selectedCabinetType.max_height_mm || 1000, value)
      );
    } else if (dimension === 'depth') {
      validValue = Math.max(
        selectedCabinetType.min_depth_mm || 200,
        Math.min(selectedCabinetType.max_depth_mm || 800, value)
      );
    }

    setConfiguration(prev => ({
      ...prev,
      [dimension]: validValue
    }));
  };

  const handleQuantityChange = (delta: number) => {
    setConfiguration(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta)
    }));
  };

  const addToCart = async () => {
    if (!selectedCabinetType || !configuration.doorStyleId || !configuration.colorId) {
      toast({
        title: "Incomplete Configuration",
        description: "Please select all options before adding to cart",
        variant: "destructive"
      });
      return;
    }

    try {
      // Here you would typically create a cart or add to existing cart
      toast({
        title: "Added to Cart",
        description: `${configuration.quantity}x ${selectedCabinetType.name} added to cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const selectedDoorStyle = doorStyles?.find(ds => ds.id === configuration.doorStyleId);
  const selectedColor = colors?.find(c => c.id === configuration.colorId);
  const selectedHardware = hardwareBrands?.find(hb => hb.id === configuration.hardwareBrandId);

  const isLoading = loadingCabinets || loadingDoorStyles || loadingColors || loadingHardware;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading configurator...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cabinet Configurator</h2>
          <p className="text-muted-foreground">
            Configure cabinets with live pricing and add to cart
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={livePricing ? "default" : "secondary"}>
            {livePricing ? "Live Pricing" : "Static Pricing"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLivePricing(!livePricing)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Toggle Pricing
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configurator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configurator">Cabinet Configurator</TabsTrigger>
          <TabsTrigger value="price-engine">Price Engine</TabsTrigger>
        </TabsList>

        <TabsContent value="configurator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cabinet Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cabinet-type">Cabinet Type</Label>
                <Select 
                  value={configuration.cabinetTypeId} 
                  onValueChange={handleCabinetTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cabinet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cabinetTypes?.map(cabinet => (
                      <SelectItem key={cabinet.id} value={cabinet.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{cabinet.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {cabinet.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCabinetType && (
                <div className="text-sm text-muted-foreground">
                  Base Price: {formatPrice(selectedCabinetType.base_price)}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCabinetType && (
            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
                <CardDescription>All dimensions in millimeters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="width">Width (mm)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="width"
                        type="number"
                        value={configuration.width}
                        onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
                        min={selectedCabinetType.min_width_mm || 100}
                        max={selectedCabinetType.max_width_mm || 1200}
                      />
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="height">Height (mm)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="height"
                        type="number"
                        value={configuration.height}
                        onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
                        min={selectedCabinetType.min_height_mm || 200}
                        max={selectedCabinetType.max_height_mm || 1000}
                      />
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="depth">Depth (mm)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="depth"
                        type="number"
                        value={configuration.depth}
                        onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value) || 0)}
                        min={selectedCabinetType.min_depth_mm || 200}
                        max={selectedCabinetType.max_depth_mm || 800}
                      />
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Door Style</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={configuration.doorStyleId} 
                  onValueChange={(value) => setConfiguration(prev => ({ ...prev, doorStyleId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select door style" />
                  </SelectTrigger>
                  <SelectContent>
                    {doorStyles?.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        <div className="flex flex-col">
                          <span>{style.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(style.base_rate_per_sqm)}/m²
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDoorStyle && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Rate: {formatPrice(selectedDoorStyle.base_rate_per_sqm)}/m²
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={configuration.colorId} 
                  onValueChange={(value) => setConfiguration(prev => ({ ...prev, colorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors?.map(color => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center space-x-2">
                          {color.hex_code && (
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: color.hex_code }}
                            />
                          )}
                          <div className="flex flex-col">
                            <span>{color.name}</span>
                            {color.surcharge_rate_per_sqm > 0 && (
                              <span className="text-xs text-muted-foreground">
                                +{formatPrice(color.surcharge_rate_per_sqm)}/m²
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hardware Brand</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={configuration.hardwareBrandId} 
                onValueChange={(value) => setConfiguration(prev => ({ ...prev, hardwareBrandId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware brand" />
                </SelectTrigger>
                <SelectContent>
                  {hardwareBrands?.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      <div className="flex flex-col">
                        <span>{brand.name}</span>
                        {brand.description && (
                          <span className="text-xs text-muted-foreground">
                            {brand.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview & Pricing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Total Price</span>
                {livePricing && <Badge>Live Pricing</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(totalPrice)}
              </div>
              {configuration.quantity > 1 && (
                <div className="text-sm text-muted-foreground">
                  {formatPrice(totalPrice / configuration.quantity)} per unit × {configuration.quantity}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCabinetType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="w-24 h-24 bg-muted-foreground/20 rounded-lg mx-auto mb-4" />
                    <div className="font-medium">{selectedCabinetType.name}</div>
                    <div className="text-sm">
                      {configuration.width} × {configuration.height} × {configuration.depth}mm
                    </div>
                    {selectedDoorStyle && (
                      <div className="text-sm mt-2">
                        {selectedDoorStyle.name}
                        {selectedColor && ` - ${selectedColor.name}`}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quantity & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={configuration.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-xl font-semibold min-w-[3rem] text-center">
                  {configuration.quantity}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={addToCart}
                disabled={!selectedCabinetType || !configuration.doorStyleId || !configuration.colorId}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Config
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          {selectedCabinetType && selectedDoorStyle && selectedColor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Price Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Price:</span>
                  <span>{formatPrice(selectedCabinetType.base_price)}</span>
                </div>
                
                {selectedDoorStyle.base_rate_per_sqm > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Door Style ({selectedDoorStyle.name}):</span>
                    <span>{formatPrice(selectedDoorStyle.base_rate_per_sqm * (configuration.width * configuration.height / 1000000))}</span>
                  </div>
                )}
                
                {selectedColor.surcharge_rate_per_sqm > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Color Surcharge ({selectedColor.name}):</span>
                    <span>{formatPrice(selectedColor.surcharge_rate_per_sqm * (configuration.width * configuration.height / 1000000))}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Unit Total:</span>
                  <span>{formatPrice(totalPrice / configuration.quantity)}</span>
                </div>
                
                {configuration.quantity > 1 && (
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Total ({configuration.quantity} units):</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* End of Right Panel */}
      </div>
      {/* End of Grid */}
    </TabsContent>

        <TabsContent value="price-engine">
          <PriceCalculationEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CabinetConfigurator;