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
    onClose();
  };

  const currentDoorStyleColors = colors.filter(c => c.door_style_id === selectedDoorStyle);
  const currentDoorStyleFinishes = finishes.filter(f => f.active); // All finishes for now
  const totalPrice = calculatePrice();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {cabinetType.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              {/* Dimensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dimensions (mm)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="width">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        min={100}
                        max={2000}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        min={100}
                        max={3000}
                      />
                    </div>
                    <div>
                      <Label htmlFor="depth">Depth</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={depth}
                        onChange={(e) => setDepth(Number(e.target.value))}
                        min={100}
                        max={1000}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Door Style - First Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Door Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select door style" />
                    </SelectTrigger>
                    <SelectContent>
                      {doorStyles.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                          <Badge variant="secondary" className="ml-2">
                            {formatPrice(style.base_rate_per_sqm)}/m²
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Color Selection - Second */}
              {selectedDoorStyle && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Color</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {currentDoorStyleColors.map(color => (
                        <div
                          key={color.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedColor === color.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedColor(color.id)}
                        >
                          <div className="flex items-center gap-2">
                            {color.hex_code && (
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: color.hex_code }}
                              />
                            )}
                            <span className="text-sm font-medium">{color.name}</span>
                          </div>
                          {color.surcharge_rate_per_sqm > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              +{formatPrice(color.surcharge_rate_per_sqm)}/m²
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Finish Selection - Third */}
              {selectedDoorStyle && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Finish</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedFinish} onValueChange={setSelectedFinish}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select finish" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentDoorStyleFinishes.map(finish => (
                          <SelectItem key={finish.id} value={finish.id}>
                            {finish.name} ({brands.find(b => b.id === finish.brand_id)?.name})
                            <Badge variant="secondary" className="ml-2">
                              {formatPrice(finish.rate_per_sqm)}/m²
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Hardware Selection */}
              <HardwareCostPreview 
                cabinetType={cabinetType}
                selectedHardwareOptions={selectedHardwareOptions}
                onHardwareChange={setSelectedHardwareOptions}
                quantity={quantity}
              />
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cabinet Type:</span>
                    <span>{cabinetType.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dimensions:</span>
                    <span>{width} × {height} × {depth}mm</span>
                  </div>

                  {selectedFinish && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Finish:</span>
                      <span>{finishes.find(f => f.id === selectedFinish)?.name}</span>
                    </div>
                  )}

                  {selectedColor && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Color:</span>
                      <span>{colors.find(c => c.id === selectedColor)?.name}</span>
                    </div>
                  )}

                  {selectedDoorStyle && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Door Style:</span>
                      <span>{doorStyles.find(ds => ds.id === selectedDoorStyle)?.name}</span>
                    </div>
                  )}


                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Price (inc. GST):</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleAddToCart}
                disabled={!selectedFinish || !selectedDoorStyle || isAddingToCart}
                className="w-full"
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