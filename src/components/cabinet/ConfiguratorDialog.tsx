import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShoppingCart, Minus, Plus, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import { CabinetType } from '@/types/cabinet';
import { useCart } from '@/hooks/useCart';
import { useDynamicPricing } from '@/hooks/useDynamicPricing';
import { useCabinetPreferences } from '@/hooks/useCabinetPreferences';
import { useToast } from '@/hooks/use-toast';
import { pricingService } from '@/services/pricingService';
import { PriceBreakdown } from './PriceBreakdown';
import { HardwareBrandSelector } from './HardwareBrandSelector';
import { CornerCabinetConfig } from './CornerCabinetConfig';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ConfiguratorDialogProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWidth?: number;
}

export function ConfiguratorDialog({ cabinetType, open, onOpenChange, initialWidth }: ConfiguratorDialogProps) {
  // Standard cabinet dimensions
  const [width, setWidth] = useState(initialWidth || cabinetType.default_width_mm);
  const [height, setHeight] = useState(cabinetType.default_height_mm);
  const [depth, setDepth] = useState(cabinetType.default_depth_mm);
  
  // Corner cabinet dimensions
  const [rightSideWidth, setRightSideWidth] = useState(cabinetType.right_side_width_mm || cabinetType.default_width_mm);
  const [leftSideWidth, setLeftSideWidth] = useState(cabinetType.left_side_width_mm || cabinetType.default_width_mm);
  const [rightSideDepth, setRightSideDepth] = useState(cabinetType.right_side_depth_mm || cabinetType.default_depth_mm);
  const [leftSideDepth, setLeftSideDepth] = useState(cabinetType.left_side_depth_mm || cabinetType.default_depth_mm);
  
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
  const { toast } = useToast();

  // Cabinet preferences for lock-in functionality
  const { preferences, locks, updatePreference, toggleLock, getLockedPreferences } = useCabinetPreferences();

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

  // Fetch hardware brands to set default
  const { data: hardwareBrands } = useQuery({
    queryKey: ['hardware-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brands')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Auto-select Titus as default hardware brand
  useEffect(() => {
    if (hardwareBrands && hardwareBrands.length > 0 && !selectedHardwareBrand) {
      const titusBrand = hardwareBrands.find(brand => brand.name === 'Titus');
      const defaultBrandId = titusBrand ? titusBrand.id : hardwareBrands[0].id;
      setSelectedHardwareBrand(defaultBrandId);
    }
  }, [hardwareBrands, selectedHardwareBrand]);

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

  // Apply locked preferences when dialog opens
  useEffect(() => {
    if (open) {
      const lockedPrefs = getLockedPreferences();
      
      if (locks.height && lockedPrefs.height) {
        setHeight(lockedPrefs.height);
      }
      if (locks.depth && lockedPrefs.depth) {
        setDepth(lockedPrefs.depth);
      }
      if (locks.doorStyle && lockedPrefs.doorStyleId) {
        setSelectedDoorStyle(lockedPrefs.doorStyleId);
      }
      if (locks.color && lockedPrefs.colorId) {
        setSelectedColor(lockedPrefs.colorId);
      }
      if (locks.hardware && lockedPrefs.hardwareBrandId) {
        setSelectedHardwareBrand(lockedPrefs.hardwareBrandId);
      }
    }
  }, [open, locks, getLockedPreferences]);

  // Update preferences when values change
  const handleHeightChange = (value: number) => {
    setHeight(value);
    if (locks.height) {
      updatePreference('height', value);
    }
  };

  const handleDepthChange = (value: number) => {
    setDepth(value);
    if (locks.depth) {
      updatePreference('depth', value);
    }
  };

  const handleDoorStyleChange = (value: string) => {
    setSelectedDoorStyle(value);
    if (locks.doorStyle) {
      updatePreference('doorStyleId', value);
    }
  };

  const handleColorChange = (value: string) => {
    setSelectedColor(value);
    if (locks.color) {
      updatePreference('colorId', value);
    }
  };

  const handleHardwareChange = (value: string) => {
    setSelectedHardwareBrand(value);
    if (locks.hardware) {
      updatePreference('hardwareBrandId', value);
    }
  };

  const handleAddToCart = async () => {
    console.log('🚀 AddToCart clicked!', {
      selectedDoorStyle,
      selectedColor,
      selectedHardwareBrand,
      cabinetParts: cabinetParts?.length,
      globalSettings: globalSettings?.length
    });
    
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
      width: cabinetType.cabinet_style === 'corner' ? rightSideWidth : width,
      height,
      depth: cabinetType.cabinet_style === 'corner' ? rightSideDepth : depth,
      // Corner cabinet specific dimensions
      rightSideWidth: cabinetType.cabinet_style === 'corner' ? rightSideWidth : undefined,
      leftSideWidth: cabinetType.cabinet_style === 'corner' ? leftSideWidth : undefined,
      rightSideDepth: cabinetType.cabinet_style === 'corner' ? rightSideDepth : undefined,
      leftSideDepth: cabinetType.cabinet_style === 'corner' ? leftSideDepth : undefined,
      quantity,
      doorStyle: selectedDoorStyleObj,
      color: selectedColorObj,
      finish: null, // Not using separate finishes anymore
      hardwareBrand: hardwareBrandObj
    };

    console.log('🎯 Configuration built:', configuration);

    try {
      const { parseGlobalSettings } = await import('@/lib/pricing');
      const settings = parseGlobalSettings(globalSettings || []);
      console.log('📊 Settings parsed, calling addToCart...');
      await addToCart(configuration, cabinetParts || [], settings);
      
      console.log('✅ addToCart completed successfully!');
      
      // Show success toast
      toast({
        title: "Added to Cart",
        description: `${configuration.cabinetType.name} has been added to your cart!`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
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
      <DialogContent className="max-w-md md:max-w-5xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-8 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-primary">
            <ShoppingCart className="h-4 w-4 text-primary" />
            {cabinetType.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configure your cabinet dimensions, style, and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">Loading...</p>
            </div>
          ) : (
            <>
              {/* Mobile Layout: Stacked */}
              <div className="md:hidden space-y-3">
                {/* Cabinet Image */}
                <div className="flex justify-center">
                  <div 
                    className="w-16 h-16 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
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

                {/* Compact Dimensions Grid */}
                <TooltipProvider>
                  {cabinetType.cabinet_style === 'corner' ? (
                    <CornerCabinetConfig
                      cabinetType={cabinetType}
                      rightSideWidth={rightSideWidth}
                      leftSideWidth={leftSideWidth}
                      height={height}
                      rightSideDepth={rightSideDepth}
                      leftSideDepth={leftSideDepth}
                      onRightSideWidthChange={setRightSideWidth}
                      onLeftSideWidthChange={setLeftSideWidth}
                      onHeightChange={handleHeightChange}
                      onRightSideDepthChange={setRightSideDepth}
                      onLeftSideDepthChange={setLeftSideDepth}
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={width === 0 ? '' : width}
                          onChange={(e) => setWidth(e.target.value === '' ? 0 : Number(e.target.value))}
                          className="mt-1 h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={height === 0 ? '' : height}
                            onChange={(e) => handleHeightChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            className={`mt-1 h-7 text-xs pr-8 ${locks.height ? 'border-primary border-2' : ''}`}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLock('height')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-primary/10"
                              >
                                {locks.height ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Lock this height setting for all future cabinet configurations</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Depth</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={depth === 0 ? '' : depth}
                            onChange={(e) => handleDepthChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            className={`mt-1 h-7 text-xs pr-8 ${locks.depth ? 'border-primary border-2' : ''}`}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLock('depth')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-primary/10"
                              >
                                {locks.depth ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Lock this depth setting for all future cabinet configurations</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}
                </TooltipProvider>

                {/* Compact Selection Grid */}
                <TooltipProvider>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label className="text-xs">Door Style</Label>
                      <div className="relative">
                        <Select value={selectedDoorStyle} onValueChange={handleDoorStyleChange}>
                          <SelectTrigger className={`mt-1 h-7 text-xs pr-8 ${locks.doorStyle ? 'border-primary border-2' : ''}`}>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {availableDoorStyles.map((style) => (
                              <SelectItem key={style.id} value={style.id}>
                                <span className="text-xs">{style.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLock('doorStyle')}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-primary/10 z-10"
                            >
                              {locks.doorStyle ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lock this door style for all future cabinet configurations</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Color</Label>
                      <div className="relative">
                        <Select value={selectedColor} onValueChange={handleColorChange}>
                          <SelectTrigger className={`mt-1 h-7 text-xs pr-8 ${locks.color ? 'border-primary border-2' : ''}`}>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {(availableColors || []).map((color) => (
                              <SelectItem key={color.id} value={color.id}>
                                <span className="text-xs">{color.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLock('color')}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-primary/10 z-10"
                            >
                              {locks.color ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lock this color for all future cabinet configurations</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Hardware</Label>
                      <div className="relative">
                        <Select value={selectedHardwareBrand} onValueChange={handleHardwareChange}>
                          <SelectTrigger className={`mt-1 h-7 text-xs pr-8 ${locks.hardware ? 'border-primary border-2' : ''}`}>
                            <SelectValue placeholder="Select hardware" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="none">No Hardware</SelectItem>
                            <SelectItem value="c808f420-ad8b-4c23-a9c8-1553f5373fb9">Blum</SelectItem>
                            <SelectItem value="c8000cad-7a41-4feb-ab7d-6c49e5a54e4f">Titus</SelectItem>
                          </SelectContent>
                        </Select>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLock('hardware')}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-primary/10 z-10"
                            >
                              {locks.hardware ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lock this hardware selection for all future cabinet configurations</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {/* Desktop/Tablet Layout: More Compact Side by side */}
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left: Larger Image Only */}
                  <div className="space-y-3">
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

                  {/* Right: Price, Dimensions, Door Style, Color, and Hardware */}
                  <div className="space-y-3">
                    {/* Price Display at Top */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Price</p>
                            <p className="text-2xl font-bold text-primary">
                              {pricingService.formatPrice(price)}
                            </p>
                            {quantity > 1 && (
                              <p className="text-xs text-muted-foreground">
                                {pricingService.formatPrice(price / quantity)} × {quantity}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Live Pricing
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Compact Dimensions */}
                    <TooltipProvider>
                      <div className="space-y-2">
                        <h3 className="font-medium text-base">Dimensions</h3>
                        {cabinetType.cabinet_style === 'corner' ? (
                          <CornerCabinetConfig
                            cabinetType={cabinetType}
                            rightSideWidth={rightSideWidth}
                            leftSideWidth={leftSideWidth}
                            height={height}
                            rightSideDepth={rightSideDepth}
                            leftSideDepth={leftSideDepth}
                            onRightSideWidthChange={setRightSideWidth}
                            onLeftSideWidthChange={setLeftSideWidth}
                            onHeightChange={handleHeightChange}
                            onRightSideDepthChange={setRightSideDepth}
                            onLeftSideDepthChange={setLeftSideDepth}
                          />
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Width (mm)</Label>
                              <Input
                                type="number"
                                value={width === 0 ? '' : width}
                                onChange={(e) => setWidth(e.target.value === '' ? 0 : Number(e.target.value))}
                                className="mt-1 h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Height (mm)</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={height === 0 ? '' : height}
                                  onChange={(e) => handleHeightChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                  className={`mt-1 h-8 text-sm pr-8 ${locks.height ? 'border-primary border-2' : ''}`}
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleLock('height')}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-primary/10"
                                    >
                                      {locks.height ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Lock this height setting for all future cabinet configurations</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Depth (mm)</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={depth === 0 ? '' : depth}
                                  onChange={(e) => handleDepthChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                  className={`mt-1 h-8 text-sm pr-8 ${locks.depth ? 'border-primary border-2' : ''}`}
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleLock('depth')}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-primary/10"
                                    >
                                      {locks.depth ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Lock this depth setting for all future cabinet configurations</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipProvider>

                    {/* Door Style and Color in same row */}
                    <TooltipProvider>
                      <div className="space-y-2">
                         <div className="grid grid-cols-2 gap-3">
                           <div>
                             <Label className="text-sm">Door Style</Label>
                             <div className="relative">
                               <Select value={selectedDoorStyle} onValueChange={handleDoorStyleChange}>
                                 <SelectTrigger className={`mt-1 h-9 pr-8 ${locks.doorStyle ? 'border-primary border-2' : ''}`}>
                                   <SelectValue placeholder="Select style" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-background border z-50">
                                   {availableDoorStyles.map((style) => (
                                     <SelectItem key={style.id} value={style.id}>
                                       <div className="flex items-center justify-between w-full">
                                         <span>{style.name}</span>
                                         <Badge variant="outline" className="ml-2 text-xs">
                                           {pricingService.formatPrice(style.base_rate_per_sqm)}/m²
                                         </Badge>
                                       </div>
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => toggleLock('doorStyle')}
                                     className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/10 z-10"
                                   >
                                     {locks.doorStyle ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Lock this door style for all future cabinet configurations</p>
                                 </TooltipContent>
                               </Tooltip>
                             </div>
                           </div>
                           
                           <div>
                             <Label className="text-sm">Color</Label>
                             <div className="relative">
                               <Select value={selectedColor} onValueChange={handleColorChange}>
                                 <SelectTrigger className={`mt-1 h-9 pr-8 ${locks.color ? 'border-primary border-2' : ''}`}>
                                   <SelectValue placeholder="Select color" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-background border z-50">
                                   {(availableColors || []).map((color) => (
                                     <SelectItem key={color.id} value={color.id}>
                                       <div className="flex items-center gap-2">
                                         {color.hex_code && (
                                           <div
                                             className="w-3 h-3 rounded border"
                                             style={{ backgroundColor: color.hex_code }}
                                           />
                                         )}
                                         <span>{color.name}</span>
                                       </div>
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => toggleLock('color')}
                                     className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/10 z-10"
                                   >
                                     {locks.color ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Lock this color for all future cabinet configurations</p>
                                 </TooltipContent>
                               </Tooltip>
                             </div>
                           </div>
                         </div>
                        

                          {/* Hardware under Door Style and Color */}
                          <div>
                            <Label className="text-sm">Hardware Brand</Label>
                            <div className="relative">
                              <Select value={selectedHardwareBrand} onValueChange={handleHardwareChange}>
                                <SelectTrigger className={`mt-1 h-9 pr-8 ${locks.hardware ? 'border-primary border-2' : ''}`}>
                                  <SelectValue placeholder="Select hardware" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border z-50">
                                  <SelectItem value="none">No Hardware</SelectItem>
                                  {hardwareBrands?.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                      {brand.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => toggleLock('hardware')}
                                   className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/10 z-10"
                                 >
                                   {locks.hardware ? <Lock className="h-3 w-3 text-primary" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p>Lock this hardware selection for all future cabinet configurations</p>
                               </TooltipContent>
                             </Tooltip>
                           </div>
                         </div>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-3">
                {/* Quantity and Chunky Add to Cart */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Qty</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Chunky Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !selectedDoorStyle || !selectedHardwareBrand}
                    className="flex-1 h-12 text-base font-semibold"
                    size="lg"
                  >
                    {isAddingToCart ? (
                      <span>Adding to Cart...</span>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>

                {/* Compact Price Breakdown Toggle */}
                {priceBreakdown && (
                  <Collapsible open={showPriceBreakdown} onOpenChange={setShowPriceBreakdown}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded text-sm">
                      <span className="font-medium">Price Breakdown</span>
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
                            rate_per_sqm: 0, // Don't duplicate base rate here
                            door_style_id: selectedDoorStyle,
                            sort_order: 0,
                            active: true,
                            created_at: new Date().toISOString(),
                            door_style: availableDoorStyles.find(s => s.id === selectedDoorStyle)
                          }}
                          color={availableColors?.find(c => c.id === selectedColor)}
                          hardwareCost={priceBreakdown?.hardwareCost || 0}
                          totalPrice={price}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
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