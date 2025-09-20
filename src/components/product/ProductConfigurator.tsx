import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PricingCalculator from '@/lib/pricingCalculator';
import { StyleColorFinishSelector } from './StyleColorFinishSelector';

interface CabinetType {
  id: string;
  name: string;
  category: string;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm: number;
  max_width_mm: number;
  min_height_mm: number;
  max_height_mm: number;
  min_depth_mm: number;
  max_depth_mm: number;
  door_count: number;
  drawer_count: number;
  product_image_url?: string;
  material_rate_per_sqm?: number;
  door_rate_per_sqm?: number;
  door_qty?: number;
}

interface CabinetPart {
  id: string;
  part_name: string;
  quantity: number;
  width_formula?: string;
  height_formula?: string;
  is_door: boolean;
  is_hardware: boolean;
}

interface HardwareRequirement {
  id: string;
  hardware_type_id: string;
  unit_scope: string;
  units_per_scope: number;
  hardware_type: {
    name: string;
    category: string;
  };
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
  surcharge_rate_per_sqm: number;
  hex_code?: string;
}

interface Finish {
  id: string;
  name: string;
  rate_per_sqm: number;
  finish_type: string;
}

interface ProductConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabinetTypeId?: string;
}

export const ProductConfigurator: React.FC<ProductConfiguratorProps> = ({
  open,
  onOpenChange,
  cabinetTypeId
}) => {
  const [cabinetTypes, setCabinetTypes] = useState<CabinetType[]>([]);
  const [selectedCabinetType, setSelectedCabinetType] = useState<CabinetType | null>(null);
  const [cabinetParts, setCabinetParts] = useState<CabinetPart[]>([]);
  const [hardwareRequirements, setHardwareRequirements] = useState<HardwareRequirement[]>([]);
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [finishes, setFinishes] = useState<Finish[]>([]);

  // Configuration state
  const [dimensions, setDimensions] = useState({
    width: 600,
    height: 720,
    depth: 560
  });
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [styleColorFinishSelectorOpen, setStyleColorFinishSelectorOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCabinetTypes();
      loadDoorStyles();
      loadColors();
      loadFinishes();
    }
  }, [open]);

  useEffect(() => {
    if (cabinetTypeId && cabinetTypes.length > 0) {
      const cabinetType = cabinetTypes.find(ct => ct.id === cabinetTypeId);
      if (cabinetType) {
        setSelectedCabinetType(cabinetType);
        setDimensions({
          width: cabinetType.default_width_mm,
          height: cabinetType.default_height_mm,
          depth: cabinetType.default_depth_mm
        });
      }
    }
  }, [cabinetTypeId, cabinetTypes]);

  useEffect(() => {
    if (selectedCabinetType) {
      loadCabinetParts(selectedCabinetType.id);
      loadHardwareRequirements(selectedCabinetType.id);
    }
  }, [selectedCabinetType]);

  const loadCabinetTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCabinetTypes(data || []);
    } catch (error) {
      console.error('Error loading cabinet types:', error);
      toast.error('Failed to load cabinet types');
    }
  };

  const loadCabinetParts = async (cabinetTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', cabinetTypeId)
        .order('part_name', { ascending: true });

      if (error) throw error;
      setCabinetParts(data || []);
    } catch (error) {
      console.error('Error loading cabinet parts:', error);
      toast.error('Failed to load cabinet parts');
    }
  };

  const loadHardwareRequirements = async (cabinetTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(name, category)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true);

      if (error) throw error;
      setHardwareRequirements(data || []);
    } catch (error) {
      console.error('Error loading hardware requirements:', error);
      toast.error('Failed to load hardware requirements');
    }
  };

  const loadDoorStyles = async () => {
    try {
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setDoorStyles(data || []);
    } catch (error) {
      console.error('Error loading door styles:', error);
    }
  };

  const loadColors = async () => {
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setColors(data || []);
    } catch (error) {
      console.error('Error loading colors:', error);
    }
  };

  const loadFinishes = async () => {
    try {
      const { data, error } = await supabase
        .from('finishes')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setFinishes(data || []);
    } catch (error) {
      console.error('Error loading finishes:', error);
    }
  };

  const calculatePartDimensions = (part: CabinetPart) => {
    const { width, height, depth } = dimensions;
    
    const calculateDimension = (formula: string | undefined, defaultValue: number) => {
      if (!formula) return defaultValue;
      
      try {
        // Replace common variables in formulas
        const processedFormula = formula
          .replace(/width/g, width.toString())
          .replace(/height/g, height.toString())
          .replace(/depth/g, depth.toString())
          .replace(/W/g, width.toString())
          .replace(/H/g, height.toString())
          .replace(/D/g, depth.toString());
        
        // Simple evaluation (in production, use a proper expression parser)
        return eval(processedFormula);
      } catch (error) {
        console.error('Error calculating dimension:', error);
        return defaultValue;
      }
    };

    return {
      width: calculateDimension(part.width_formula, width),
      height: calculateDimension(part.height_formula, height)
    };
  };

  const calculateTotalPrice = () => {
    if (!selectedCabinetType) return 0;

    const doorStyle = doorStyles.find(ds => ds.id === selectedDoorStyle);
    const color = colors.find(c => c.id === selectedColor);
    const finish = finishes.find(f => f.id === selectedFinish);

    const cabinetTypeWithParts = {
      ...selectedCabinetType,
      cabinet_parts: cabinetParts
    };

    const rates = {
      materialRate: selectedCabinetType.material_rate_per_sqm || 85,
      doorRate: doorStyle?.base_rate_per_sqm || selectedCabinetType.door_rate_per_sqm || 120,
      colorSurcharge: color?.surcharge_rate_per_sqm || 0,
      finishSurcharge: finish?.rate_per_sqm || 0,
    };

    // Calculate door area for surcharges
    const doorCount = Math.max(selectedCabinetType.door_qty || selectedCabinetType.door_count || 1, 1);
    const doorArea = (dimensions.width / 1000) * (dimensions.height / 1000) * doorCount;
    rates.colorSurcharge *= doorArea * quantity;
    rates.finishSurcharge *= doorArea * quantity;

    console.log('ProductConfigurator pricing calculation:', {
      cabinetType: selectedCabinetType.name,
      dimensions,
      quantity,
      rates,
      cabinetParts: cabinetParts.length
    });

    const calculatedPricing = PricingCalculator.calculateCabinetPrice(
      cabinetTypeWithParts,
      dimensions,
      quantity,
      rates,
      hardwareRequirements
    );

    console.log('Calculated pricing:', calculatedPricing);
    return calculatedPricing.totalPrice;
  };

  const calculateDoorArea = () => {
    if (!selectedCabinetType) return 0;
    
    const doorParts = cabinetParts.filter(part => part.is_door);
    let totalArea = 0;

    doorParts.forEach(part => {
      const partDimensions = calculatePartDimensions(part);
      const area = (partDimensions.width / 1000) * (partDimensions.height / 1000); // Convert to m²
      totalArea += area * part.quantity;
    });

    return totalArea;
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: number) => {
    // Allow any value during typing, validation happens on blur
    setDimensions(prev => ({
      ...prev,
      [dimension]: value
    }));
  };

  const handleDimensionBlur = (dimension: 'width' | 'height' | 'depth') => {
    if (!selectedCabinetType) return;

    const constraints = {
      width: { min: selectedCabinetType.min_width_mm, max: selectedCabinetType.max_width_mm },
      height: { min: selectedCabinetType.min_height_mm, max: selectedCabinetType.max_height_mm },
      depth: { min: selectedCabinetType.min_depth_mm, max: selectedCabinetType.max_depth_mm }
    };

    const constraint = constraints[dimension];
    const currentValue = dimensions[dimension];
    
    if (currentValue < constraint.min || currentValue > constraint.max) {
      const clampedValue = Math.max(constraint.min, Math.min(constraint.max, currentValue));
      
      toast.error(
        `${dimension.charAt(0).toUpperCase() + dimension.slice(1)} must be between ${constraint.min}mm and ${constraint.max}mm. Adjusted to ${clampedValue}mm.`
      );
      
      setDimensions(prev => ({
        ...prev,
        [dimension]: clampedValue
      }));
    }
  };

  const handleAddToCart = async () => {
    if (!selectedCabinetType || !selectedDoorStyle || !selectedColor || !selectedFinish) {
      toast.error('Please complete all selections');
      return;
    }

    setLoading(true);
    try {
      // Here you would typically add to cart
      // For now, just show success message
      toast.success('Product configured successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleStyleColorFinishSelection = (doorStyleId: string, colorId: string, finishId: string) => {
    setSelectedDoorStyle(doorStyleId);
    setSelectedColor(colorId);
    setSelectedFinish(finishId);
  };

  const getSelectedDoorStyle = () => doorStyles.find(ds => ds.id === selectedDoorStyle);
  const getSelectedColor = () => colors.find(c => c.id === selectedColor);
  const getSelectedFinish = () => finishes.find(f => f.id === selectedFinish);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0 z-50">
        {/* Debug info - Remove after testing */}
        {!selectedCabinetType && open && (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">Loading cabinet configuration...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-4"></div>
          </div>
        )}
        
        <div className="relative">
          {/* Mobile Sticky Price Bar - Top */}
          {selectedCabinetType && (
            <div className="lg:hidden sticky top-0 bg-primary text-primary-foreground px-3 py-2 z-50 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">
                  ${calculateTotalPrice().toFixed(2)}
                </div>
                <div className="text-xs opacity-90">Total Price</div>
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {quantity} item{quantity !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {/* Desktop Floating Price Box - Top Right */}
          {selectedCabinetType && (
            <div className="hidden lg:block absolute top-4 right-4 z-10">
              <Card className="shadow-xl border-2 bg-primary text-primary-foreground">
                <CardContent className="p-3 text-center min-w-[180px]">
                  <div className="text-xl font-bold mb-1">
                    ${calculateTotalPrice().toFixed(2)}
                  </div>
                  <div className="text-xs opacity-90 mb-2">Total Price</div>
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {quantity} item{quantity !== 1 ? 's' : ''}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Header */}
          <div className="px-4 py-3 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                {selectedCabinetType?.name || 'Configure Product'}
                {selectedCabinetType && (
                  <Badge variant="outline" className="text-xs">
                    {selectedCabinetType.category}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Main Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left Column - Image */}
              <div className="lg:col-span-2">
                {selectedCabinetType && (
                  <div className="lg:sticky lg:top-4">
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-[4/3] relative">
                          {selectedCabinetType.product_image_url ? (
                            <img
                              src={selectedCabinetType.product_image_url}
                              alt={selectedCabinetType.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-2 bg-secondary/30 rounded-full flex items-center justify-center">
                                  <span className="text-xl">📐</span>
                                </div>
                                <span className="text-muted-foreground text-sm">Product Preview</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Compact overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2">
                            <div className="text-xs">
                              {dimensions.width} × {dimensions.height} × {dimensions.depth}mm
                              {selectedDoorStyle && colors.find(c => c.id === selectedColor) && (
                                <div className="flex items-center gap-1 mt-1">
                                  {colors.find(c => c.id === selectedColor)?.hex_code && (
                                    <div 
                                      className="w-2 h-2 rounded-full border border-white/50"
                                      style={{ backgroundColor: colors.find(c => c.id === selectedColor)?.hex_code }}
                                    />
                                  )}
                                  <span className="truncate">{doorStyles.find(s => s.id === selectedDoorStyle)?.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Right Column - Configuration */}
              <div className="lg:col-span-3 space-y-3">
                {selectedCabinetType && (
                  <>
                    {/* Dimensions */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-1">
                          📏 Dimensions (mm)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="width" className="text-xs">Width</Label>
                            <Input
                              id="width"
                              type="number"
                              value={dimensions.width}
                              onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
                              onBlur={() => handleDimensionBlur('width')}
                              className="text-center font-mono h-8 text-sm"
                            />
                            <div className="text-xs text-muted-foreground text-center">
                              {selectedCabinetType.min_width_mm}-{selectedCabinetType.max_width_mm}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="height" className="text-xs">Height</Label>
                            <Input
                              id="height"
                              type="number"
                              value={dimensions.height}
                              onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
                              onBlur={() => handleDimensionBlur('height')}
                              className="text-center font-mono h-8 text-sm"
                            />
                            <div className="text-xs text-muted-foreground text-center">
                              {selectedCabinetType.min_height_mm}-{selectedCabinetType.max_height_mm}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="depth" className="text-xs">Depth</Label>
                            <Input
                              id="depth"
                              type="number"
                              value={dimensions.depth}
                              onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value) || 0)}
                              onBlur={() => handleDimensionBlur('depth')}
                              className="text-center font-mono h-8 text-sm"
                            />
                            <div className="text-xs text-muted-foreground text-center">
                              {selectedCabinetType.min_depth_mm}-{selectedCabinetType.max_depth_mm}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Door Style, Color & Finish Selector */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-1">
                          🎨 Door Style, Colour & Finish
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div 
                          onClick={() => setStyleColorFinishSelectorOpen(true)}
                          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[120px] flex items-center justify-center"
                        >
                          {selectedDoorStyle && selectedColor && selectedFinish ? (
                            <div className="w-full">
                              <div className="flex items-center gap-4">
                                {/* Door Style Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
                                  {getSelectedDoorStyle()?.image_url ? (
                                    <img 
                                      src={getSelectedDoorStyle()?.image_url} 
                                      alt={getSelectedDoorStyle()?.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                      <span className="text-2xl">🚪</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{getSelectedDoorStyle()?.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div 
                                      className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                                      style={{ backgroundColor: getSelectedColor()?.hex_code || '#f3f4f6' }}
                                    />
                                    <span className="text-sm text-muted-foreground truncate">
                                      {getSelectedColor()?.name}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate mt-1">
                                    {getSelectedFinish()?.name} ({getSelectedFinish()?.finish_type})
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground text-center mt-3">
                                Click to change selection
                              </p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                <span className="text-2xl">🎨</span>
                              </div>
                              <p className="font-medium mb-1">Select Door Style, Colour & Finish</p>
                              <p className="text-sm text-muted-foreground">Click to customize your cabinet</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hardware & Quantity */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-1">
                          🔧 Options
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div>
                          <Label className="text-xs">Hardware Brand</Label>
                          <Select>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blum">Blum</SelectItem>
                              <SelectItem value="hettich">Hettich</SelectItem>
                              <SelectItem value="hafele">Häfele</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            className="text-center font-mono h-8"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes - Compact */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-1">
                          📝 Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Textarea
                          placeholder="Special requirements or notes..."
                          className="min-h-[60px] resize-none text-sm"
                        />
                      </CardContent>
                    </Card>

                    {/* Add to Cart - Compact */}
                    <Button 
                      onClick={handleAddToCart} 
                      disabled={loading || !selectedDoorStyle || !selectedColor || !selectedFinish}
                      className="w-full h-10 font-semibold"
                      size="default"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </div>
                      ) : (
                        `Add to Cart - $${calculateTotalPrice().toFixed(2)}`
                      )}
                    </Button>
                    {(!selectedDoorStyle || !selectedColor || !selectedFinish) && (
                      <div className="text-xs text-muted-foreground text-center -mt-2">
                        Complete all selections to continue
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Style Color Finish Selector Dialog */}
        <StyleColorFinishSelector
          open={styleColorFinishSelectorOpen}
          onOpenChange={setStyleColorFinishSelectorOpen}
          doorStyles={doorStyles}
          colors={colors}
          finishes={finishes}
          selectedDoorStyle={selectedDoorStyle}
          selectedColor={selectedColor}
          selectedFinish={selectedFinish}
          onSelectionComplete={handleStyleColorFinishSelection}
        />
      </DialogContent>
    </Dialog>
  );
};