import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShoppingCart, Minus, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { CabinetType } from '@/types/cabinet';
import { useCart } from '@/hooks/useCart';
import { useDynamicPricing } from '@/hooks/useDynamicPricing';
import { pricingService } from '@/services/pricingService';
import { PriceBreakdown } from './PriceBreakdown';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ConfiguratorDialogProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWidth?: number;
}

export function ConfiguratorDialog({ cabinetType, open, onOpenChange, initialWidth }: ConfiguratorDialogProps) {
  const [width, setWidth] = useState(initialWidth || cabinetType.default_width_mm);
  const [height, setHeight] = useState(cabinetType.default_height_mm);
  const [depth, setDepth] = useState(cabinetType.default_depth_mm);
  const [quantity, setQuantity] = useState(1);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const { addToCart, isLoading: isAddingToCart } = useCart();

  // Use dynamic pricing hook for real-time price calculation
  const {
    cabinetTypeFinishes,
    price,
    priceBreakdown,
    isLoading,
    cabinetParts,
    globalSettings
  } = useDynamicPricing({
    cabinetTypeId: cabinetType.id,
    width,
    height,
    depth,
    doorStyleId: selectedDoorStyle,
    colorId: selectedColor,
    quantity,
    refreshInterval: 5000 // Refresh every 5 seconds for real-time updates
  });

  // Auto-select first available options when data loads
  useEffect(() => {
    if (cabinetTypeFinishes && cabinetTypeFinishes.length > 0 && !selectedDoorStyle) {
      const firstFinish = cabinetTypeFinishes[0];
      if (firstFinish.door_style?.id) {
        setSelectedDoorStyle(firstFinish.door_style.id);
      }
    }
  }, [cabinetTypeFinishes, selectedDoorStyle]);

  // Reset dimensions when cabinet type changes
  useEffect(() => {
    setWidth(initialWidth || cabinetType.default_width_mm);
    setHeight(cabinetType.default_height_mm);
    setDepth(cabinetType.default_depth_mm);
  }, [cabinetType.id, initialWidth]);

  const handleAddToCart = async () => {
    const selectedDoorStyleObj = cabinetTypeFinishes?.find(f => f.door_style?.id === selectedDoorStyle)?.door_style;
    const selectedColorObj = availableColors?.find(c => c.id === selectedColor);

    const configuration = {
      cabinetType,
      width,
      height,
      depth,
      quantity,
      doorStyle: selectedDoorStyleObj,
      color: selectedColorObj,
      finish: null, // Not using separate finishes anymore
      hardwareBrand: null
    };

    try {
      const { parseGlobalSettings } = await import('@/lib/pricing');
      const settings = parseGlobalSettings(globalSettings || []);
      await addToCart(configuration, cabinetParts || [], settings);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const getCurrentCabinetImage = () => {
    if (selectedDoorStyle && cabinetTypeFinishes) {
      const matchingFinish = cabinetTypeFinishes.find(
        f => f.door_style?.id === selectedDoorStyle
      );
      return matchingFinish?.image_url;
    }
    return cabinetType.product_image_url;
  };

  // Fetch colors for the selected door style
  const { data: availableColors } = useQuery({
    queryKey: ['colors-for-door-style', selectedDoorStyle],
    queryFn: async () => {
      if (!selectedDoorStyle) return [];
      const { data, error } = await supabase
        .from('colors')
        .select('*, door_styles!colors_door_style_id_fkey(*)')
        .eq('door_style_id', selectedDoorStyle)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDoorStyle,
  });

  // Reset color when door style changes
  useEffect(() => {
    if (selectedDoorStyle && availableColors && availableColors.length > 0) {
      // Auto-select first available color for the selected door style
      if (!selectedColor || !availableColors.find(c => c.id === selectedColor)) {
        setSelectedColor(availableColors[0].id);
      }
    } else {
      // Clear color selection if no door style or no colors available
      setSelectedColor('');
    }
  }, [selectedDoorStyle, availableColors, selectedColor]);

  const availableDoorStyles = cabinetTypeFinishes?.map(f => f.door_style).filter(Boolean) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Configure {cabinetType.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-4">Loading configuration options...</p>
            </div>
          ) : (
            <>
              {/* Cabinet Info */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden">
                    {getCurrentCabinetImage() ? (
                      <img
                        src={getCurrentCabinetImage()}
                        alt={cabinetType.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold">{cabinetType.name}</h3>
                  <p className="text-muted-foreground">Base Cabinet</p>
                  {cabinetType.short_description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {cabinetType.short_description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      {cabinetType.door_count} Door{cabinetType.door_count !== 1 ? 's' : ''}
                    </Badge>
                    {cabinetType.drawer_count > 0 && (
                      <Badge variant="secondary">
                        {cabinetType.drawer_count} Drawer{cabinetType.drawer_count !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Width (mm)</Label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    min={cabinetType.min_width_mm || 100}
                    max={cabinetType.max_width_mm || 2000}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: {cabinetType.min_width_mm || 100}-{cabinetType.max_width_mm || 2000}mm
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Height (mm)</Label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min={cabinetType.min_height_mm || 100}
                    max={cabinetType.max_height_mm || 3000}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: {cabinetType.min_height_mm || 100}-{cabinetType.max_height_mm || 3000}mm
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Depth (mm)</Label>
                  <Input
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    min={cabinetType.min_depth_mm || 100}
                    max={cabinetType.max_depth_mm || 1000}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: {cabinetType.min_depth_mm || 100}-{cabinetType.max_depth_mm || 1000}mm
                  </p>
                </div>
              </div>

              {/* Door Style & Color Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Door Style</Label>
                  <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select door style" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDoorStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{style.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {pricingService.formatPrice(style.base_rate_per_sqm)}/m²
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Color</Label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {(availableColors || []).map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          <div className="flex items-center gap-2">
                            {color.hex_code && (
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: color.hex_code }}
                              />
                            )}
                            <span>{color.name}</span>
                            {color.surcharge_rate_per_sqm > 0 && (
                              <Badge variant="outline" className="ml-2">
                                +{pricingService.formatPrice(color.surcharge_rate_per_sqm)}/m²
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Display */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Price</p>
                      <p className="text-3xl font-bold text-primary">
                        {pricingService.formatPrice(price * quantity)}
                      </p>
                      {quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {pricingService.formatPrice(price)} × {quantity}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="animate-pulse">
                      Live Pricing
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Price Breakdown */}
              {priceBreakdown && (
                <Collapsible open={showPriceBreakdown} onOpenChange={setShowPriceBreakdown}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                    <span className="font-medium">View Price Breakdown</span>
                    {showPriceBreakdown ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4">
                      <PriceBreakdown
                        cabinetType={cabinetType}
                        width={width}
                        height={height}
                        depth={depth}
                        cabinetParts={cabinetParts || []}
                        globalSettings={globalSettings || []}
                        doorStyleFinish={{
                          id: selectedDoorStyle,
                          name: availableDoorStyles.find(s => s.id === selectedDoorStyle)?.name || 'Standard',
                          rate_per_sqm: availableDoorStyles.find(s => s.id === selectedDoorStyle)?.base_rate_per_sqm || 0,
                          door_style_id: selectedDoorStyle,
                          sort_order: 0,
                          active: true,
                          created_at: new Date().toISOString(),
                          door_style: availableDoorStyles.find(s => s.id === selectedDoorStyle)
                        }}
                        color={availableColors?.find(c => c.id === selectedColor)}
                        hardwareCost={45}
                        totalPrice={price}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Quantity & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !selectedDoorStyle}
                  className="min-w-32"
                >
                  {isAddingToCart ? (
                    <>Adding...</>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}