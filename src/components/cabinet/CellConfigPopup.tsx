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
import { compressImage } from '@/lib/imageUtils';
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
  const [width, setWidth] = useState<number | string>(initialWidth);
  const [height, setHeight] = useState<number | string>(cabinetType.default_height_mm);
  const [depth, setDepth] = useState<number | string>(cabinetType.default_depth_mm);
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedHardwareOptions, setSelectedHardwareOptions] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState(initialPrice);
  
  const [doorStyles, setDoorStyles] = useState<DoorStyle[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [hardwareRequirements, setHardwareRequirements] = useState<HardwareRequirement[]>([]);
  
  const { toast } = useToast();
  const { addToCart, isLoading: isAddingToCart } = useCart();

  // Reset state when popup closes/opens
  useEffect(() => {
    if (!isOpen) {
      // Reset selections when popup closes
      setSelectedDoorStyle('');
      setSelectedColor('');
      setSelectedHardwareOptions({});
    } else {
      // Reset dimensions to defaults when opening
      setWidth(initialWidth);
      setHeight(cabinetType.default_height_mm);
      setDepth(cabinetType.default_depth_mm);
      setCalculatedPrice(initialPrice);
      
      // Clear previous selections to ensure fresh start
      setSelectedDoorStyle('');
      setSelectedColor('');
      setSelectedHardwareOptions({});
    }
  }, [isOpen, initialWidth, initialPrice, cabinetType]);

  // Load door styles on mount and set initial door style from finish config
  useEffect(() => {
    if (isOpen) {
      loadDoorStyles();
      loadHardwareRequirements();
    }
  }, [isOpen, cabinetType.id]);

  // Set door style from finish config when door styles are loaded
  useEffect(() => {
    if (doorStyles.length > 0 && finish && (finish as any).door_style_id) {
      setSelectedDoorStyle((finish as any).door_style_id);
    } else if (doorStyles.length > 0 && !selectedDoorStyle) {
      // Fallback to first door style if no specific door style from finish config
      setSelectedDoorStyle(doorStyles[0].id);
    }
  }, [doorStyles, finish]);

  // Load colors when door style changes
  useEffect(() => {
    if (selectedDoorStyle) {
      loadColors(selectedDoorStyle);
    }
  }, [selectedDoorStyle]);

  // Set initial color from finish config
  useEffect(() => {
    if (colors.length > 0) {
      // Try to set color from finish config first
      if (finish && (finish as any).color_id) {
        const finishColor = colors.find(c => c.id === (finish as any).color_id);
        if (finishColor) {
          setSelectedColor(finishColor.id);
          return;
        }
      }
      // Fallback to first color if no specific color from finish config
      if (!selectedColor) {
        setSelectedColor(colors[0].id);
      }
    }
  }, [colors, finish]);

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
    // Only calculate if we have the required data
    if (selectedDoorStyle && selectedColor && doorStyles.length > 0 && colors.length > 0) {
      calculatePrice();
    }
  }, [width, height, depth, selectedDoorStyle, selectedColor, selectedHardwareOptions, doorStyles, colors, hardwareRequirements]);

  const loadDoorStyles = async () => {
    try {
      // Load door styles that are compatible with the selected finish's brand
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      
      setDoorStyles(data || []);
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

      // Convert string values to numbers for calculation
      const widthNum = typeof width === 'string' ? parseInt(width) || 0 : width;
      const heightNum = typeof height === 'string' ? parseInt(height) || 0 : height;
      const depthNum = typeof depth === 'string' ? parseInt(depth) || 0 : depth;

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

      // Create a door style finish object from the selected door style
      const doorStyleFinish = {
        id: `temp-${selectedDoorStyle}`,
        door_style_id: selectedDoorStyle,
        name: doorStyle.name,
        rate_per_sqm: doorStyle.base_rate_per_sqm,
        sort_order: 0,
        active: true,
        created_at: new Date().toISOString(),
        door_style: doorStyle
      };

      // Use the selected door style finish instead of the original finish
      const price = calculateCabinetPrice(
        cabinetType,
        widthNum,
        heightNum,
        depthNum,
        doorStyleFinish,
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
      
      if (!doorStyle) {
        toast({
          title: "Select door style",
          description: "Please choose a door style before adding to cart",
          variant: "destructive"
        });
        return;
      }

      if (!color) {
        toast({
          title: "Select color",
          description: "Please choose a color before adding to cart",
          variant: "destructive"
        });
        return;
      }

      // Convert string values to numbers for configuration
      const widthNum = typeof width === 'string' ? parseInt(width) || 0 : width;
      const heightNum = typeof height === 'string' ? parseInt(height) || 0 : height;
      const depthNum = typeof depth === 'string' ? parseInt(depth) || 0 : depth;

      const configuration = {
        cabinetType,
        width: widthNum,
        height: heightNum,
        depth: depthNum,
        quantity: 1,
        finish,
        color: color || undefined,
        doorStyle,
        hardwareOptions: selectedHardwareOptions
      };

      console.log('Adding to cart with configuration:', configuration);

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
          {/* Cabinet Header with Image */}
          <div className="flex items-start gap-4">
            {/* Main Cabinet Image - High quality display */}
            <div 
              className="w-32 h-32 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors flex-shrink-0 overflow-hidden"
              onClick={() => {
                const currentDoorStyle = selectedDoorStyle ? doorStyles.find(ds => ds.id === selectedDoorStyle) : null;
                const imageUrl = currentDoorStyle?.image_url || (finish as any)?.image_url || cabinetType.product_image_url;
                if (imageUrl) {
                  window.open(imageUrl, '_blank');
                }
              }}
            >
              {(() => {
                const currentDoorStyle = selectedDoorStyle ? doorStyles.find(ds => ds.id === selectedDoorStyle) : null;
                const imageUrl = currentDoorStyle?.image_url || (finish as any)?.image_url || cabinetType.product_image_url;

                return imageUrl ? (
                  <img 
                    key={`cabinet-image-${selectedDoorStyle || 'default'}`} // Force re-render when door style changes
                    src={imageUrl} 
                    alt={`${cabinetType.name} - ${currentDoorStyle?.name || (finish as any)?.door_style?.name || 'Cabinet'}`}
                    className="w-full h-full transition-all duration-300"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                      imageRendering: 'auto',
                      width: '100%',
                      height: '100%',
                      minWidth: '0',
                      minHeight: '0'
                    }}
                    onError={(e) => {
                      console.error('Cabinet image failed to load:', imageUrl);
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<span class="text-xs text-muted-foreground text-center p-2">Image failed to load</span>';
                      }
                    }}
                    onLoad={() => {
                      console.log('Cabinet image updated:', imageUrl, 'Door style:', currentDoorStyle?.name);
                    }}
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="text-center p-2">
                    <span className="text-xs text-muted-foreground">No image available</span>
                  </div>
                );
              })()}
            </div>
            
            {/* Cabinet Details */}
            <div className="flex-1">
              <h3 className="font-medium text-lg">{cabinetType.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {cabinetType.category.charAt(0).toUpperCase() + cabinetType.category.slice(1)} Cabinet
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedDoorStyle 
                  ? doorStyles.find(ds => ds.id === selectedDoorStyle)?.name || 'Loading...'
                  : (finish as any)?.door_style?.name || 'Select door style'
                }
              </p>
            </div>
          </div>

          {/* Door Style Image Carousel - Compressed and optimized images */}
          {doorStyles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Available Door Styles ({doorStyles.filter(s => s.image_url).length} options)</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
                {doorStyles.map(style => (
                  style.image_url && (
                    <div 
                      key={style.id}
                      className={`w-20 h-20 bg-muted/30 rounded-lg border-2 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-all duration-200 flex-shrink-0 overflow-hidden ${
                        selectedDoorStyle === style.id ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-dashed border-muted-foreground/20'
                      }`}
                      onClick={() => {
                        console.log('Door style clicked:', style.name, 'ID:', style.id);
                        setSelectedDoorStyle(style.id);
                      }}
                      title={style.name}
                    >
                      <img 
                        src={style.image_url} 
                        alt={style.name}
                        className="w-full h-full transition-all duration-200"
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                          imageRendering: 'crisp-edges',
                          width: '100%',
                          height: '100%',
                          minWidth: '0',
                          minHeight: '0'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<span class="text-xs text-muted-foreground text-center p-1">No image</span>';
                          }
                        }}
                        onLoad={(e) => {
                          // Ensure image maintains quality after load
                          const img = e.currentTarget;
                          img.style.imageRendering = 'auto';
                          console.log('Door style image loaded:', style.name);
                        }}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="width" className="text-xs">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => {
                  const value = e.target.value;
                  setWidth(value === '' ? '' : value);
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => {
                  const value = e.target.value;
                  setHeight(value === '' ? '' : value);
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="depth" className="text-xs">Depth (mm)</Label>
              <Input
                id="depth"
                type="number"
                value={depth}
                onChange={(e) => {
                  const value = e.target.value;
                  setDepth(value === '' ? '' : value);
                }}
                className="h-8"
              />
            </div>
          </div>

          {/* Door Style */}
          <div>
            <Label className="text-xs">Door Style</Label>
            <Select 
              value={selectedDoorStyle} 
              onValueChange={setSelectedDoorStyle}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select door style" />
              </SelectTrigger>
               <SelectContent className="bg-background border shadow-lg z-50">
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
                 <SelectContent className="bg-background border shadow-lg z-50">
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
                 <SelectContent className="bg-background border shadow-lg z-50">
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