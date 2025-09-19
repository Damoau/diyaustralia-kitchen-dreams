import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

    let totalPrice = 0;
    const doorArea = calculateDoorArea();

    // Add door style cost
    const doorStyle = doorStyles.find(ds => ds.id === selectedDoorStyle);
    if (doorStyle && doorArea > 0) {
      totalPrice += doorStyle.base_rate_per_sqm * doorArea;
    }

    // Add color surcharge
    const color = colors.find(c => c.id === selectedColor);
    if (color && doorArea > 0) {
      totalPrice += color.surcharge_rate_per_sqm * doorArea;
    }

    // Add finish cost
    const finish = finishes.find(f => f.id === selectedFinish);
    if (finish && doorArea > 0) {
      totalPrice += finish.rate_per_sqm * doorArea;
    }

    return totalPrice * quantity;
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
    if (!selectedCabinetType) return;

    const constraints = {
      width: { min: selectedCabinetType.min_width_mm, max: selectedCabinetType.max_width_mm },
      height: { min: selectedCabinetType.min_height_mm, max: selectedCabinetType.max_height_mm },
      depth: { min: selectedCabinetType.min_depth_mm, max: selectedCabinetType.max_depth_mm }
    };

    const constraint = constraints[dimension];
    const clampedValue = Math.max(constraint.min, Math.min(constraint.max, value));

    setDimensions(prev => ({
      ...prev,
      [dimension]: clampedValue
    }));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Product</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Cabinet Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Cabinet Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedCabinetType?.id || ''}
                  onValueChange={(value) => {
                    const cabinetType = cabinetTypes.find(ct => ct.id === value);
                    setSelectedCabinetType(cabinetType || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a cabinet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cabinetTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCabinetType && (
              <>
                {/* Dimensions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dimensions (mm)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          type="number"
                          value={dimensions.width}
                          onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
                          min={selectedCabinetType.min_width_mm}
                          max={selectedCabinetType.max_width_mm}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedCabinetType.min_width_mm} - {selectedCabinetType.max_width_mm}mm
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          type="number"
                          value={dimensions.height}
                          onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
                          min={selectedCabinetType.min_height_mm}
                          max={selectedCabinetType.max_height_mm}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedCabinetType.min_height_mm} - {selectedCabinetType.max_height_mm}mm
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="depth">Depth</Label>
                        <Input
                          id="depth"
                          type="number"
                          value={dimensions.depth}
                          onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value) || 0)}
                          min={selectedCabinetType.min_depth_mm}
                          max={selectedCabinetType.max_depth_mm}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedCabinetType.min_depth_mm} - {selectedCabinetType.max_depth_mm}mm
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Style & Finish */}
                <Card>
                  <CardHeader>
                    <CardTitle>Style & Finish</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Door Style</Label>
                      <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select door style" />
                        </SelectTrigger>
                        <SelectContent>
                          {doorStyles.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name} (+${style.base_rate_per_sqm}/m²)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Color</Label>
                      <Select value={selectedColor} onValueChange={setSelectedColor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map((color) => (
                            <SelectItem key={color.id} value={color.id}>
                              <div className="flex items-center gap-2">
                                {color.hex_code && (
                                  <div 
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: color.hex_code }}
                                  />
                                )}
                                {color.name} (+${color.surcharge_rate_per_sqm}/m²)
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Finish</Label>
                      <Select value={selectedFinish} onValueChange={setSelectedFinish}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finish" />
                        </SelectTrigger>
                        <SelectContent>
                          {finishes.map((finish) => (
                            <SelectItem key={finish.id} value={finish.id}>
                              {finish.name} - {finish.finish_type} (+${finish.rate_per_sqm}/m²)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Right Column - Preview & Details */}
          <div className="space-y-6">
            {selectedCabinetType && (
              <>
                {/* Cabinet Parts Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Parts Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cabinetParts.map((part) => {
                        const partDimensions = calculatePartDimensions(part);
                        return (
                          <div key={part.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span>{part.part_name}</span>
                              {part.is_door && <Badge variant="secondary">Door</Badge>}
                              {part.is_hardware && <Badge variant="outline">Hardware</Badge>}
                            </div>
                            <div className="text-right">
                              <div>Qty: {part.quantity}</div>
                              {(part.width_formula || part.height_formula) && (
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(partDimensions.width)}×{Math.round(partDimensions.height)}mm
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Hardware Requirements */}
                {hardwareRequirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Hardware Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {hardwareRequirements.map((req) => (
                          <div key={req.id} className="flex justify-between items-center text-sm">
                            <div>
                              <div>{req.hardware_type.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {req.hardware_type.category}
                              </div>
                            </div>
                            <div className="text-right">
                              <div>{req.units_per_scope} per {req.unit_scope}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Price Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Price Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Door Area:</span>
                        <span>{calculateDoorArea().toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Price:</span>
                        <span>${(calculateTotalPrice() / quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>{quantity}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total Price:</span>
                          <span>${calculateTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Add to Cart Button */}
                <Button 
                  onClick={handleAddToCart} 
                  disabled={loading || !selectedDoorStyle || !selectedColor || !selectedFinish}
                  className="w-full"
                >
                  {loading ? 'Adding...' : 'Add to Cart'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};