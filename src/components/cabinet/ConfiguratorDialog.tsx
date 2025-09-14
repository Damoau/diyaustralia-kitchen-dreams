import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CabinetType, Brand, Finish, Color, DoorStyle, CabinetPart, GlobalSettings } from '@/types/cabinet';
import { generateCutlist, parseGlobalSettings, formatPrice } from '@/lib/pricing';
import { useCart } from '@/hooks/useCart';
import { HardwareCostPreview } from './HardwareCostPreview';

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
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [finishes, setFinishes] = useState<Finish[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [cabinetParts, setCabinetParts] = useState<CabinetPart[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings[]>([]);
  
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedHardwareOptions, setSelectedHardwareOptions] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart, isLoading: isAddingToCart } = useCart();

  // Load data
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

  // Update brand when finish changes
  useEffect(() => {
    if (selectedFinish) {
      const finish = finishes.find(f => f.id === selectedFinish);
      if (finish && finish.brand_id !== selectedBrand) {
        setSelectedBrand(finish.brand_id);
      }
    }
  }, [selectedFinish, finishes]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [
        brandsRes,
        finishesRes,
        colorsRes,
        doorStylesRes,
        cabinetPartsRes,
        settingsRes,
        hardwareRequirementsRes
      ] = await Promise.all([
        supabase.from('brands').select('*').eq('active', true),
        supabase.from('finishes').select('*').eq('active', true),
        supabase.from('colors').select('*').eq('active', true),
        supabase.from('door_styles').select('*').eq('active', true),
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
        `).eq('cabinet_type_id', cabinetType.id).eq('active', true)
      ]);

      if (brandsRes.data) {
        setBrands(brandsRes.data);
        if (brandsRes.data.length > 0 && !selectedBrand) {
          setSelectedBrand(brandsRes.data[0].id);
        }
      }
      
      if (finishesRes.data) setFinishes(finishesRes.data);
      if (colorsRes.data) setColors(colorsRes.data);
      if (doorStylesRes.data) {
        setDoorStyles(doorStylesRes.data);
        if (doorStylesRes.data.length > 0 && !selectedDoorStyle) {
          setSelectedDoorStyle(doorStylesRes.data[0].id);
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
    if (!selectedFinish || !selectedDoorStyle || cabinetParts.length === 0) {
      return 0;
    }

    const configuration = getCurrentConfiguration();
    const settings = parseGlobalSettings(globalSettings);
    
    // Calculate hardware cost based on selected options
    let hardwareCost = 0;
    // This will be implemented with actual product costs in HardwareCostPreview
    
    const cutlist = generateCutlist(configuration, cabinetParts, settings);
    
    // Add hardware cost to the total
    return cutlist.totalCost + hardwareCost;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Cabinet</DialogTitle>
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
                {cabinetType.product_image_url ? (
                  <img 
                    src={cabinetType.product_image_url} 
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
                  min={100}
                  max={2000}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height (mm)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={100}
                  max={3000}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Depth (mm)</Label>
                <Input
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  min={100}
                  max={1000}
                  className="mt-1"
                />
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
                    {currentDoorStyleColors.map(color => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          {color.hex_code && (
                            <div
                              className="w-3 h-3 rounded border"
                              style={{ backgroundColor: color.hex_code }}
                            />
                          )}
                          {color.name}
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
            
            {/* Quantity and Add to Cart Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">QTY:</Label>
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