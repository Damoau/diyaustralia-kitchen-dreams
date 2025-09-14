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
import { HardwareBrandSelector } from './HardwareBrandSelector';
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
  const [selectedHardwareBrand, setSelectedHardwareBrand] = useState<string>('');
  const [touchedFields, setTouchedFields] = useState<{width: boolean, height: boolean, depth: boolean}>({
    width: false,
    height: false,
    depth: false
  });
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

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
    refreshInterval: 5000, // Refresh every 5 seconds for real-time updates
    hardwareBrandId: selectedHardwareBrand
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
    
    // Get selected hardware brand
    const { data: hardwareBrandObj } = await supabase
      .from('hardware_brands')
      .select('*')
      .eq('id', selectedHardwareBrand)
      .single();

    const configuration = {
      cabinetType,
      width,
      height,
      depth,
      quantity,
      doorStyle: selectedDoorStyleObj,
      color: selectedColorObj,
      finish: null, // Not using separate finishes anymore
      hardwareBrand: hardwareBrandObj
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
      <DialogContent className="max-w-md md:max-w-5xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-8 p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {cabinetType.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-6">
          {isLoading ? (
            <div className="text-center py-4 sm:py-8">
              <div className="animate-pulse space-y-2 sm:space-y-4">
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-3 sm:h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-2 sm:mt-4 text-sm">Loading configuration options...</p>
            </div>
          ) : (
            <>
              {/* Mobile Layout: Stacked */}
              <div className="md:hidden space-y-4">
                {/* Cabinet Image */}
                <div className="flex justify-center">
                  <div 
                    className="w-20 h-20 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => getCurrentCabinetImage() && setShowFullScreenImage(true)}
                  >
                    {getCurrentCabinetImage() ? (
                      <img
                        src={getCurrentCabinetImage()}
                        alt={cabinetType.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Width (mm)</Label>
                    <Input
                      type="number"
                      value={width === 0 ? '' : width}
                      onChange={(e) => setWidth(e.target.value === '' ? 0 : Number(e.target.value))}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, width: true }))}
                      min={cabinetType.min_width_mm || 100}
                      max={cabinetType.max_width_mm || 2000}
                      className="mt-1 h-8 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {cabinetType.min_width_mm || 100}-{cabinetType.max_width_mm || 2000}
                    </p>
                    {touchedFields.width && (width < (cabinetType.min_width_mm || 100) || width > (cabinetType.max_width_mm || 2000)) && (
                      <p className="text-xs text-destructive mt-1">Outside range</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Height (mm)</Label>
                    <Input
                      type="number"
                      value={height === 0 ? '' : height}
                      onChange={(e) => setHeight(e.target.value === '' ? 0 : Number(e.target.value))}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, height: true }))}
                      min={cabinetType.min_height_mm || 100}
                      max={cabinetType.max_height_mm || 3000}
                      className="mt-1 h-8 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {cabinetType.min_height_mm || 100}-{cabinetType.max_height_mm || 3000}
                    </p>
                    {touchedFields.height && (height < (cabinetType.min_height_mm || 100) || height > (cabinetType.max_height_mm || 3000)) && (
                      <p className="text-xs text-destructive mt-1">Outside range</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Depth (mm)</Label>
                    <Input
                      type="number"
                      value={depth === 0 ? '' : depth}
                      onChange={(e) => setDepth(e.target.value === '' ? 0 : Number(e.target.value))}
                      onBlur={() => setTouchedFields(prev => ({ ...prev, depth: true }))}
                      min={cabinetType.min_depth_mm || 100}
                      max={cabinetType.max_depth_mm || 1000}
                      className="mt-1 h-8 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {cabinetType.min_depth_mm || 100}-{cabinetType.max_depth_mm || 1000}
                    </p>
                    {touchedFields.depth && (depth < (cabinetType.min_depth_mm || 100) || depth > (cabinetType.max_depth_mm || 1000)) && (
                      <p className="text-xs text-destructive mt-1">Outside range</p>
                    )}
                  </div>
                </div>

                {/* Door Style, Color & Hardware Selection */}
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Label className="text-xs">Door Style</Label>
                    <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue placeholder="Select door style" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDoorStyles.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm">{style.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {pricingService.formatPrice(style.base_rate_per_sqm)}/m²
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger className="mt-1 h-8">
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
                              <span className="text-sm">{color.name}</span>
                              {color.surcharge_rate_per_sqm > 0 && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  +{pricingService.formatPrice(color.surcharge_rate_per_sqm)}/m²
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Hardware Brand Selection */}
                  <div>
                    <Label className="text-xs">Hardware Brand</Label>
                    <HardwareBrandSelector
                      cabinetType={cabinetType}
                      selectedBrandId={selectedHardwareBrand}
                      onBrandChange={setSelectedHardwareBrand}
                      quantity={quantity}
                      compact={true}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop/Tablet Layout: Side by side */}
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left: Large Image */}
                  <div className="space-y-4">
                    <div 
                      className="w-full h-80 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => getCurrentCabinetImage() && setShowFullScreenImage(true)}
                    >
                      {getCurrentCabinetImage() ? (
                        <img
                          src={getCurrentCabinetImage()}
                          alt={cabinetType.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image Available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Dimensions and Controls */}
                  <div className="space-y-4">
                    {/* Dimensions */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Dimensions</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Width (mm)</Label>
                          <Input
                            type="number"
                            value={width === 0 ? '' : width}
                            onChange={(e) => setWidth(e.target.value === '' ? 0 : Number(e.target.value))}
                            onBlur={() => setTouchedFields(prev => ({ ...prev, width: true }))}
                            min={cabinetType.min_width_mm || 100}
                            max={cabinetType.max_width_mm || 2000}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: {cabinetType.min_width_mm || 100}-{cabinetType.max_width_mm || 2000}mm
                          </p>
                          {touchedFields.width && (width < (cabinetType.min_width_mm || 100) || width > (cabinetType.max_width_mm || 2000)) && (
                            <p className="text-xs text-destructive mt-1">Outside valid range</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm">Height (mm)</Label>
                          <Input
                            type="number"
                            value={height === 0 ? '' : height}
                            onChange={(e) => setHeight(e.target.value === '' ? 0 : Number(e.target.value))}
                            onBlur={() => setTouchedFields(prev => ({ ...prev, height: true }))}
                            min={cabinetType.min_height_mm || 100}
                            max={cabinetType.max_height_mm || 3000}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: {cabinetType.min_height_mm || 100}-{cabinetType.max_height_mm || 3000}mm
                          </p>
                          {touchedFields.height && (height < (cabinetType.min_height_mm || 100) || height > (cabinetType.max_height_mm || 3000)) && (
                            <p className="text-xs text-destructive mt-1">Outside valid range</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm">Depth (mm)</Label>
                          <Input
                            type="number"
                            value={depth === 0 ? '' : depth}
                            onChange={(e) => setDepth(e.target.value === '' ? 0 : Number(e.target.value))}
                            onBlur={() => setTouchedFields(prev => ({ ...prev, depth: true }))}
                            min={cabinetType.min_depth_mm || 100}
                            max={cabinetType.max_depth_mm || 1000}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: {cabinetType.min_depth_mm || 100}-{cabinetType.max_depth_mm || 1000}mm
                          </p>
                          {touchedFields.depth && (depth < (cabinetType.min_depth_mm || 100) || depth > (cabinetType.max_depth_mm || 1000)) && (
                            <p className="text-xs text-destructive mt-1">Outside valid range</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Style Options */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-lg">Style Options</h3>
                      <div>
                        <Label className="text-sm">Door Style</Label>
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
                        <Label className="text-sm">Color</Label>
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
                      
                      {/* Hardware Brand Selection */}
                      <div>
                        <Label className="text-sm">Hardware Brand</Label>
                        <HardwareBrandSelector
                          cabinetType={cabinetType}
                          selectedBrandId={selectedHardwareBrand}
                          onBrandChange={setSelectedHardwareBrand}
                          quantity={quantity}
                          compact={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Price</p>
                      <p className="text-xl sm:text-3xl font-bold text-primary">
                        {pricingService.formatPrice(price * quantity)}
                      </p>
                      {quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {pricingService.formatPrice(price)} × {quantity}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="animate-pulse text-xs">
                      Live Pricing
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Price Breakdown */}
              {priceBreakdown && (
                <Collapsible open={showPriceBreakdown} onOpenChange={setShowPriceBreakdown}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded text-sm">
                    <span className="font-medium">View Price Breakdown</span>
                    {showPriceBreakdown ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2">
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
                        hardwareCost={0} // Hardware cost will be calculated by the new component
                        totalPrice={price}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Quantity & Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Qty</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !selectedDoorStyle || !selectedHardwareBrand}
                  className="flex-1 h-8"
                >
                  {isAddingToCart ? (
                    <span className="text-xs">Adding...</span>
                  ) : (
                    <>
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      <span className="text-xs">Add to Cart</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Full Screen Image Overlay */}
        {showFullScreenImage && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setShowFullScreenImage(false)}
          >
            <div className="relative max-w-full max-h-full p-4">
              <img
                src={getCurrentCabinetImage()}
                alt={cabinetType.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullScreenImage(false);
                }}
                className="absolute top-2 right-2 text-white hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}