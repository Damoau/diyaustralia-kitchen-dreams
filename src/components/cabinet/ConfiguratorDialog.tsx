import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { CabinetType, Brand, Finish, Color, DoorStyle, CabinetPart, GlobalSettings, CabinetTypeFinish } from '@/types/cabinet';
import { generateCutlist, parseGlobalSettings, formatPrice } from '@/lib/pricing';
import { calculateCabinetPrice } from '@/lib/dynamicPricing';
import { useCart } from '@/hooks/useCart';
import { HardwareCostPreview } from './HardwareCostPreview';
import { PriceBreakdown } from './PriceBreakdown';

interface ConfiguratorDialogProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWidth?: number;
}

export function ConfiguratorDialog({ cabinetType, open, onOpenChange, initialWidth }: ConfiguratorDialogProps) {
  // Use initialWidth if provided, otherwise default to price range minimum for consistency with static table
  const defaultWidth = initialWidth || cabinetType.default_width_mm;
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(cabinetType.default_height_mm);
  const [depth, setDepth] = useState(cabinetType.default_depth_mm);
  const [quantity, setQuantity] = useState(1);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [cabinetParts, setCabinetParts] = useState<CabinetPart[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings[]>([]);
  const [cabinetTypeFinishes, setCabinetTypeFinishes] = useState<CabinetTypeFinish[]>([]);
  
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedHardwareOptions, setSelectedHardwareOptions] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart, isLoading: isAddingToCart } = useCart();

  // For consistency with static table, fetch and use the minimum width from the first price range
  useEffect(() => {
    const fetchPriceRanges = async () => {
      if (!cabinetType.id) return;
      
      try {
        const { data: priceRanges } = await supabase
          .from('cabinet_type_price_ranges')
          .select('min_width_mm')
          .eq('cabinet_type_id', cabinetType.id)
          .eq('active', true)
          .order('sort_order', { ascending: true })
          .limit(1);
          
        const tableWidth = priceRanges?.[0]?.min_width_mm || cabinetType.default_width_mm;
        const newDefaultWidth = initialWidth || tableWidth;
        
        setWidth(newDefaultWidth);
        setHeight(cabinetType.default_height_mm);  
        setDepth(cabinetType.default_depth_mm);
      } catch (error) {
        console.error('Error fetching price ranges:', error);
        setWidth(initialWidth || cabinetType.default_width_mm);
        setHeight(cabinetType.default_height_mm);  
        setDepth(cabinetType.default_depth_mm);
      }
    };
    
    fetchPriceRanges();
  }, [cabinetType.id, initialWidth]);
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, cabinetType.id]);

  // Update colors when door style changes
  useEffect(() => {
    if (selectedDoorStyle) {
      const doorStyleColors = colors.filter(c => c.door_style_id === selectedDoorStyle);
      if (doorStyleColors.length > 0 && !doorStyleColors.find(c => c.id === selectedColor)) {
        setSelectedColor(doorStyleColors[0].id);
      }
    }
  }, [selectedDoorStyle, colors]);

  // Update finishes when door style changes
  useEffect(() => {
    if (selectedDoorStyle) {
      // Get finishes for this door style
      const doorStyleFinishes = finishes.filter(f => {
        // For now, we'll show all finishes - this could be filtered by door_style_finishes table
        return f.active;
      });
      if (doorStyleFinishes.length > 0 && !doorStyleFinishes.find(f => f.id === selectedFinish)) {
        setSelectedFinish(doorStyleFinishes[0].id);
      }
    }
  }, [selectedDoorStyle, finishes]);

  // Auto-select first available options when data loads
  useEffect(() => {
    if (doorStyles.length > 0 && !selectedDoorStyle) {
      setSelectedDoorStyle(doorStyles[0].id);
    }
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].id);
    }
    if (finishes.length > 0 && !selectedFinish) {
      setSelectedFinish(finishes[0].id);
    }
  }, [doorStyles, colors, finishes, selectedDoorStyle, selectedColor, selectedFinish]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Loading data for cabinet type:', cabinetType.id, cabinetType.name);
      
      const [
        brandsRes,
        finishesRes,
        cabinetPartsRes,
        settingsRes,
        hardwareRequirementsRes,
        cabinetTypeFinishesRes
      ] = await Promise.all([
        supabase.from('brands').select('*').eq('active', true),
        supabase.from('finishes').select('*').eq('active', true),
        supabase.from('cabinet_parts').select('*').eq('cabinet_type_id', cabinetType.id),
        supabase.from('global_settings').select('*'),
        // Fetch hardware requirements with their options
        supabase.from('cabinet_hardware_requirements').select(`
          *,
          hardware_type:hardware_types(name, category),
          cabinet_hardware_options(
            *,
            hardware_brand:hardware_brands(name),
            hardware_product:hardware_products(name, cost_per_unit)
          )
        `).eq('cabinet_type_id', cabinetType.id).eq('active', true),
        // Fetch cabinet type finishes for images AND available door styles/colors
        supabase.from('cabinet_type_finishes').select(`
          *,
          door_style:door_styles(*),
          door_style_finish:door_style_finishes!cabinet_type_finishes_door_style_finish_id_fkey(*),
          color:colors(*)
        `).eq('cabinet_type_id', cabinetType.id).eq('active', true).order('sort_order')
      ]);

      if (brandsRes.data) {
        setBrands(brandsRes.data);
        if (brandsRes.data.length > 0 && !selectedBrand) {
          setSelectedBrand(brandsRes.data[0].id);
        }
      }
      
      if (finishesRes.data) setFinishes(finishesRes.data);
      
      if (cabinetTypeFinishesRes.data) {
        setCabinetTypeFinishes(cabinetTypeFinishesRes.data);
        
        // Extract unique door styles from cabinet type finishes
        const uniqueDoorStyles = cabinetTypeFinishesRes.data
          .map(ctf => ctf.door_style)
          .filter((ds, index, array) => ds && array.findIndex(d => d?.id === ds?.id) === index)
          .filter(Boolean);
        
        // Extract unique colors from cabinet type finishes  
        const uniqueColors = cabinetTypeFinishesRes.data
          .map(ctf => ctf.color)
          .filter((c, index, array) => c && array.findIndex(col => col?.id === c?.id) === index)
          .filter(Boolean);
        
        setDoorStyles(uniqueDoorStyles);
        setColors(uniqueColors);
        
        // Auto-select first available options
        if (uniqueDoorStyles.length > 0 && !selectedDoorStyle) {
          setSelectedDoorStyle(uniqueDoorStyles[0].id);
        }
        if (uniqueColors.length > 0 && !selectedColor) {
          setSelectedColor(uniqueColors[0].id);
        }
        if (finishesRes.data && finishesRes.data.length > 0 && !selectedFinish) {
          setSelectedFinish(finishesRes.data[0].id);
        }
      }
      
      if (hardwareRequirementsRes.data) {
        // Set up default hardware selections
        const defaultSelections: Record<string, string> = {};
        hardwareRequirementsRes.data.forEach(req => {
          if (req.cabinet_hardware_options && req.cabinet_hardware_options.length > 0) {
            defaultSelections[req.id] = req.cabinet_hardware_options[0].id;
          }
        });
        setSelectedHardwareOptions(defaultSelections);
      }
      if (cabinetPartsRes.data) setCabinetParts(cabinetPartsRes.data);
      if (settingsRes.data) setGlobalSettings(settingsRes.data);
      
    } catch (error) {
      console.error('Error loading configurator data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentConfiguration = () => {
    const finish = finishes.find(f => f.id === selectedFinish);
    const color = colors.find(c => c.id === selectedColor);
    const doorStyle = doorStyles.find(ds => ds.id === selectedDoorStyle);
    
    return {
      cabinetType,
      width,
      height,
      depth,
      quantity,
      finish,
      color,
      doorStyle,
      hardwareOptions: selectedHardwareOptions,
    };
  };

  const calculatePrice = () => {
    if (!selectedDoorStyle || cabinetParts.length === 0 || globalSettings.length === 0) {
      return 0;
    }

    const doorStyle = doorStyles.find(ds => ds.id === selectedDoorStyle);
    const color = colors.find(c => c.id === selectedColor);
    
    if (!doorStyle) {
      return 0;
    }

    // Use default color if none selected
    const finalColor = color || {
      id: 'default',
      name: 'Standard',
      surcharge_rate_per_sqm: 0,
      door_style_id: selectedDoorStyle,
      active: true,
      created_at: new Date().toISOString(),
      hex_code: '#ffffff',
      sort_order: 0
    };

    
    // Create door style finish object - match static table calculation  
    const selectedFinishObj = finishes.find(f => f.id === selectedFinish);
    
    // Use the same calculation as the static table for door style finish rate
    const doorStyleFinish = {
      id: selectedDoorStyle,
      name: doorStyle.name + ' Finish',
      rate_per_sqm: doorStyle.base_rate_per_sqm || 150, // Use door style base rate, not finish rate
      door_style_id: selectedDoorStyle,
      door_style: doorStyle,
      active: true,
      created_at: new Date().toISOString(),
      sort_order: 0
    };

    const hardwareCost = 45; // Default hardware cost

    const calculatedPrice = calculateCabinetPrice(
      cabinetType,
      width,
      height, 
      depth,
      doorStyleFinish,
      finalColor,
      cabinetParts,
      globalSettings,
      hardwareCost
    );

    return calculatedPrice;
  };

  // Get the current cabinet image based on selected door style
  const getCurrentCabinetImage = () => {
    if (selectedDoorStyle && cabinetTypeFinishes.length > 0) {
      const matchingFinish = cabinetTypeFinishes.find(
        (ctf: any) => ctf.door_style_id === selectedDoorStyle && ctf.image_url
      );
      if (matchingFinish) {
        return matchingFinish.image_url;
      }
    }
    return cabinetType.product_image_url;
  };

  const handleAddToCart = async () => {
    if (!selectedFinish || !selectedDoorStyle) return;
    
    const configuration = getCurrentConfiguration();
    const settings = parseGlobalSettings(globalSettings);
    
    // Add hardware options info to configuration
    const configWithHardware = {
      ...configuration,
      hardwareSelections: selectedHardwareOptions
    };
    
    await addToCart(configWithHardware, cabinetParts, settings);
    onOpenChange(false);
  };

  const currentDoorStyleColors = colors.filter(c => c.door_style_id === selectedDoorStyle);
  const currentDoorStyleFinishes = finishes.filter(f => f.active); // All finishes for now
  const totalPrice = calculatePrice();

  // Trigger price recalculation when key values change
  useEffect(() => {
    if (selectedDoorStyle && colors.length > 0 && cabinetParts.length > 0 && globalSettings.length > 0) {
      console.log('Price calculation triggered by state change');
    }
  }, [selectedDoorStyle, selectedColor, selectedFinish, width, height, depth, quantity, colors, cabinetParts, globalSettings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {cabinetType.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cabinet Info Section */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                {getCurrentCabinetImage() ? (
                  <img 
                    src={getCurrentCabinetImage()} 
                    alt={cabinetType.name}
                    className="w-20 h-20 object-cover rounded border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded border-2 border-primary flex items-center justify-center">
                    <span className="text-xs text-muted-foreground text-center">{cabinetType.name}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{cabinetType.name}</h3>
                <p className="text-muted-foreground">Base Cabinet</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDoorStyle ? doorStyles.find(ds => ds.id === selectedDoorStyle)?.name : 'Select style'}
                </p>
              </div>
            </div>

            <p className="text-sm font-medium text-muted-foreground">Available Door Styles</p>

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
            {/* Door Style */}
            <div>
              <Label className="text-sm font-medium">Door Style</Label>
              <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select door style" />
                </SelectTrigger>
                <SelectContent>
                  {doorStyles.map(style => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name} {formatPrice(style.base_rate_per_sqm)}/m²
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            {selectedDoorStyle && (
              <div>
                <Label className="text-sm font-medium">Color</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {(currentDoorStyleColors.length > 0 ? currentDoorStyleColors : colors.slice(0, 5)).map(color => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          {color.hex_code && (
                            <div
                              className="w-3 h-3 rounded border"
                              style={{ backgroundColor: color.hex_code }}
                            />
                          )}
                          {color.name} (+{formatPrice(color.surcharge_rate_per_sqm || 0)}/m²)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            
            {/* Total Price */}
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Price</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(totalPrice * quantity)}</p>
            </div>

            {/* Price Breakdown */}
            <Collapsible open={showPriceBreakdown} onOpenChange={setShowPriceBreakdown}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="text-sm font-medium">View Price Breakdown</span>
                  {showPriceBreakdown ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                {totalPrice > 0 && selectedDoorStyle && cabinetParts.length > 0 && globalSettings.length > 0 && (
                  <PriceBreakdown
                    cabinetType={cabinetType}
                    width={width}
                    height={height}
                    depth={depth}
                    doorStyleFinish={{
                      id: selectedDoorStyle,
                      name: doorStyles.find(ds => ds.id === selectedDoorStyle)?.name + ' Finish' || '',
                      rate_per_sqm: finishes.find(f => f.id === selectedFinish)?.rate_per_sqm || 
                        doorStyles.find(ds => ds.id === selectedDoorStyle)?.base_rate_per_sqm || 150,
                      door_style_id: selectedDoorStyle,
                      door_style: doorStyles.find(ds => ds.id === selectedDoorStyle),
                      active: true,
                      created_at: new Date().toISOString(),
                      sort_order: 0
                    }}
                    color={colors.find(c => c.id === selectedColor)}
                    cabinetParts={cabinetParts}
                    globalSettings={globalSettings}
                    hardwareCost={45}
                    totalPrice={totalPrice}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>
            
            {/* Quantity and Add to Cart Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-9 w-9"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  min={1}
                  className="text-center w-16"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={!selectedFinish || !selectedDoorStyle || isAddingToCart}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}