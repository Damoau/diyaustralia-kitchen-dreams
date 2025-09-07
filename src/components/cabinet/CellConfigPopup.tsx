import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Calculator } from 'lucide-react';
import { CabinetType, Finish, Color, DoorStyle, CabinetPart, GlobalSettings } from '@/types/cabinet';
import { calculateCabinetPrice } from '@/lib/dynamicPricing';
import { calculateHardwareCost } from '@/lib/hardwarePricing';
import { formatPrice, parseGlobalSettings } from '@/lib/pricing';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';

interface CellConfigPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cabinetType: CabinetType;
  finish: Finish;
  initialWidth: number;
  initialPrice: number;
  cabinetParts: CabinetPart[];
  globalSettings: GlobalSettings[];
}

interface HardwareRequirement {
  id: string;
  units_per_scope: number;
  unit_scope: string;
  hardware_type: { name: string };
  cabinet_hardware_options: Array<{
    id: string;
    hardware_brand: { name: string };
    hardware_product: { name: string; cost_per_unit: number };
  }>;
}

export function CellConfigPopup({ 
  isOpen, 
  onClose, 
  cabinetType, 
  finish,
  initialWidth, 
  initialPrice,
  cabinetParts,
  globalSettings 
}: CellConfigPopupProps) {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(cabinetType.default_height_mm);
  const [depth, setDepth] = useState(cabinetType.default_depth_mm);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedHardwareOptions, setSelectedHardwareOptions] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(initialPrice);
  
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [hardwareRequirements, setHardwareRequirements] = useState<HardwareRequirement[]>([]);
  
  const { toast } = useToast();
  const { addToCart, isLoading: isAddingToCart } = useCart();

  // Load door styles on mount
  useEffect(() => {
    if (isOpen) {
      loadDoorStyles();
      loadHardwareRequirements();
    }
  }, [isOpen, cabinetType.id]);

  // Load colors when door style changes
  useEffect(() => {
    if (selectedDoorStyle) {
      loadColors(selectedDoorStyle);
    }
  }, [selectedDoorStyle]);

  // Set first color as default when colors load
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].id);
    }
  }, [colors]);

  // Set default hardware selections
  useEffect(() => {
    if (hardwareRequirements.length > 0) {
      const defaultSelections: Record<string, string> = {};
      hardwareRequirements.forEach(req => {
        if (req.cabinet_hardware_options.length > 0) {
          defaultSelections[req.id] = req.cabinet_hardware_options[0].id;
        }
      });
      setSelectedHardwareOptions(defaultSelections);
    }
  }, [hardwareRequirements]);

  // Recalculate price when any parameter changes
  useEffect(() => {
    if (selectedDoorStyle && selectedColor && Object.keys(selectedHardwareOptions).length > 0) {
      calculatePrice();
    }
  }, [width, height, depth, selectedDoorStyle, selectedColor, selectedHardwareOptions]);

  const loadDoorStyles = async () => {
    try {
      // Load door styles that are configured for this cabinet type
      const { data, error } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(
            id,
            name,
            base_rate_per_sqm,
            active
          ),
          door_style_finish:door_style_finishes(
            id,
            name,
            rate_per_sqm
          ),
          color:colors(
            id,
            name,
            hex_code,
            surcharge_rate_per_sqm
          )
        `)
        .eq('cabinet_type_id', cabinetType.id)
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      
      // Extract unique door styles from cabinet type finishes
      const uniqueDoorStyles = data?.reduce((acc: any[], finish: any) => {
        if (finish.door_style && !acc.find(ds => ds.id === finish.door_style.id)) {
          acc.push(finish.door_style);
        }
        return acc;
      }, []) || [];
      
      setDoorStyles(uniqueDoorStyles);
      
      // Set first door style as default
      if (uniqueDoorStyles.length > 0) {
        setSelectedDoorStyle(uniqueDoorStyles[0].id);
      }
    } catch (error) {
      console.error('Error loading door styles:', error);
    }
  };

  const loadColors = async (doorStyleId: string) => {
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('door_style_id', doorStyleId)
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setColors(data || []);
    } catch (error) {
      console.error('Error loading colors:', error);
    }
  };

  const loadHardwareRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(name),
          cabinet_hardware_options(
            *,
            hardware_brand:hardware_brands(name),
            hardware_product:hardware_products(name, cost_per_unit)
          )
        `)
        .eq('cabinet_type_id', cabinetType.id)
        .eq('active', true);

      if (error) throw error;
      setHardwareRequirements(data || []);
    } catch (error) {
      console.error('Error loading hardware requirements:', error);
    }
  };

  const calculatePrice = async () => {
    try {
      const doorStyle = doorStyles.find(ds => ds.id === selectedDoorStyle);
      const color = colors.find(c => c.id === selectedColor);
      
      if (!doorStyle || !color) return;

      // Calculate hardware cost based on selected options
      let totalHardwareCost = 0;
      for (const req of hardwareRequirements) {
        const selectedOptionId = selectedHardwareOptions[req.id];
        const selectedOption = req.cabinet_hardware_options.find(opt => opt.id === selectedOptionId);
        
        if (selectedOption) {
          // Calculate quantity based on unit_scope
          let quantity = req.units_per_scope || 1;
          if (req.unit_scope === 'per_door') {
            quantity = quantity * cabinetType.door_count;
          } else if (req.unit_scope === 'per_drawer') {
            quantity = quantity * cabinetType.drawer_count;
          }
          totalHardwareCost += selectedOption.hardware_product.cost_per_unit * quantity;
        }
      }

      // Use the actual finish passed from the parent component
      const price = calculateCabinetPrice(
        cabinetType,
        width,
        height,
        depth,
        finish,
        color,
        cabinetParts,
        globalSettings,
        totalHardwareCost
      );

      setCalculatedPrice(price);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      const doorStyle = doorStyles.find(ds => ds.id === selectedDoorStyle);
      const color = colors.find(c => c.id === selectedColor);
      
      if (!doorStyle || !color) {
        toast({
          title: "Error",
          description: "Please select door style and color",
          variant: "destructive"
        });
        return;
      }

      const configuration = {
        cabinetType,
        width,
        height,
        depth,
        quantity: 1,
        finish,
        color,
        doorStyle,
        hardwareOptions: selectedHardwareOptions
      };

      const settings = parseGlobalSettings(globalSettings);
      await addToCart(configuration, cabinetParts, settings);
      
      toast({
        title: "Added to Cart",
        description: `${cabinetType.name} added to your quote successfully!`
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configure Cabinet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabinet Info */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <h3 className="font-medium">{cabinetType.name}</h3>
            <p className="text-sm text-muted-foreground">{finish.name}</p>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="width" className="text-xs">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="depth" className="text-xs">Depth (mm)</Label>
              <Input
                id="depth"
                type="number"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>

          {/* Door Style */}
          <div>
            <Label className="text-xs">Door Style</Label>
            <Select value={selectedDoorStyle} onValueChange={setSelectedDoorStyle}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select door style" />
              </SelectTrigger>
              <SelectContent>
                {doorStyles.map(style => (
                  <SelectItem key={style.id} value={style.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{style.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {formatPrice(style.base_rate_per_sqm)}/m²
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          {colors.length > 0 && (
            <div>
              <Label className="text-xs">Color</Label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map(color => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        {color.hex_code && (
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                        )}
                        <span>{color.name}</span>
                        {color.surcharge_rate_per_sqm > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            +{formatPrice(color.surcharge_rate_per_sqm)}/m²
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hardware Options */}
          {hardwareRequirements.map((req) => (
            <div key={req.id}>
              <Label className="text-xs">{req.hardware_type.name}</Label>
              <Select 
                value={selectedHardwareOptions[req.id] || ''}
                onValueChange={(value) => {
                  setSelectedHardwareOptions(prev => ({
                    ...prev,
                    [req.id]: value
                  }));
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {req.cabinet_hardware_options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs">
                          {option.hardware_brand.name} - {option.hardware_product.name}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {formatPrice(option.hardware_product.cost_per_unit)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Price Display */}
          <div className="p-3 bg-primary/10 rounded-lg text-center">
            <div className="text-xs text-muted-foreground">Total Price</div>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(calculatedPrice)}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!selectedDoorStyle || !selectedColor || isAddingToCart}
            className="w-full"
          >
            {isAddingToCart ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Quote
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}