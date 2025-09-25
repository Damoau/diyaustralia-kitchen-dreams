import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import PricingCalculator from '@/lib/pricingCalculator';
import { StyleColorFinishSelector } from './StyleColorFinishSelector';
import { useCartPersistence } from '@/hooks/useCartPersistence';
import { useCartSaveTracking } from '@/hooks/useCartSaveTracking';
import { useCart } from '@/hooks/useCart';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Ruler, Palette, Settings, FileText, ShoppingCart, MapPin, AlertCircle, Calculator, Edit2 } from 'lucide-react';
import { useCabinetPreferences } from '@/hooks/useCabinetPreferences';
import { CabinetType, CabinetPart, DoorStyle, Color, Finish, DoorStyleFinish, ColorFinish } from '@/types/cabinet';

// Input validation schema  
const postcodeSchema = z.string()
  .trim()
  .regex(/^\d{4}$/, "Postcode must be 4 digits")
  .length(4, "Postcode must be exactly 4 digits");

interface AssemblyEstimate {
  eligible: boolean;
  carcass_only_price?: number;
  with_doors_price?: number;
  lead_time_days?: number;
  includes?: string[];
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
  const [doorStyleFinishes, setDoorStyleFinishes] = useState<DoorStyleFinish[]>([]);
  const [colorFinishes, setColorFinishes] = useState<ColorFinish[]>([]);

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

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Assembly postcode state
  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState("");
  const [assemblyEnabled, setAssemblyEnabled] = useState(false);
  const [assemblyType, setAssemblyType] = useState<'carcass_only' | 'with_doors'>('carcass_only');
  const [assemblyEstimate, setAssemblyEstimate] = useState<AssemblyEstimate | null>(null);
  const [assemblyEditMode, setAssemblyEditMode] = useState(false);
  
  const { markAsUnsaved, markAsSaving, markAsSaved, markAsError } = useCartSaveTracking();
  const { addToCart } = useCart();
  const { preferences: savedPrefs, updatePreference } = useCabinetPreferences();
  const { 
    preferences, 
    updateStylePreferences,
    preferredDoorStyleId,
    preferredColorId,
    preferredFinishId,
    preferredAssemblyType,
    updatePreferences
  } = useUserPreferences();
  
  // Mock postcode lookup - this would connect to your postcode zones table
  const { data: postcodeData } = useQuery({
    queryKey: ['postcode-lookup', postcode],
    queryFn: async () => {
      if (!postcode || postcode.length !== 4) return null;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-assembly-eligibility', {
          body: { postcode }
        });

        if (error) {
          console.error('Assembly eligibility check failed:', error);
          return null;
        }

        return {
          postcode: data.postcode,
          state: data.state,
          zone: data.zone,
          metro: data.metro,
          assembly_eligible: data.eligible,
          assembly_price_per_cabinet: data.eligible ? 150 : 0
        };
      } catch (error) {
        console.error('Error checking assembly eligibility:', error);
        return null;
      }
    },
    enabled: postcode.length === 4,
  });
  
  
  // Handle assembly selection change
  const handleAssemblySelection = (type: 'flat_pack' | 'carcass_only' | 'with_doors') => {
    if (type === 'flat_pack') {
      setAssemblyEnabled(false);
      updatePreferences({ preferredAssemblyType: null });
    } else {
      // Check if assembly is available for this postcode
      if (postcode.length === 4 && assemblyEstimate && !assemblyEstimate.eligible) {
        // Don't allow assembly selection if postcode is not eligible
        return;
      }
      setAssemblyEnabled(true);
      setAssemblyType(type);
      updatePreferences({ preferredAssemblyType: type });
    }
    setAssemblyEditMode(false); // Close edit mode after selection
  };

  // Initialize with saved preferences when component loads - but only if no postcode restrictions
  useEffect(() => {
    if (preferredAssemblyType) {
      if (preferredAssemblyType === 'carcass_only' || preferredAssemblyType === 'with_doors') {
        // Only apply assembly preferences if no postcode is entered or assembly is available
        if (postcode.length !== 4 || (assemblyEstimate && assemblyEstimate.eligible)) {
          setAssemblyEnabled(true);
          setAssemblyType(preferredAssemblyType);
        } else {
          // If postcode exists but assembly not available, default to flat pack
          setAssemblyEnabled(false);
        }
      }
    } else if (preferredAssemblyType === null) {
      // Explicitly set to flat pack if null is saved
      setAssemblyEnabled(false);
    }
  }, [preferredAssemblyType, postcode, assemblyEstimate]);

  // Calculate assembly estimate when postcode changes
  useEffect(() => {
    if (postcodeData) {
      // Get cabinet-specific assembly pricing
      const cabinetAssemblyData = selectedCabinetType?.assembly_available ? {
        carcass_only_price: selectedCabinetType.assembly_carcass_only_price || 0,
        with_doors_price: selectedCabinetType.assembly_with_doors_price || 0
      } : null;
      
      setAssemblyEstimate({
        eligible: postcodeData.assembly_eligible && selectedCabinetType?.assembly_available,
        carcass_only_price: cabinetAssemblyData?.carcass_only_price,
        with_doors_price: cabinetAssemblyData?.with_doors_price,
        lead_time_days: postcodeData.assembly_eligible ? 8 : undefined,
        includes: postcodeData.assembly_eligible ? [
          'Professional installation',
          'Hardware attachment', 
          'Adjustment and alignment',
          '12-month warranty'
        ] : undefined
      });
    }
  }, [postcodeData]);

  // Handle postcode input with validation
  const handlePostcodeChange = (value: string) => {
    setPostcode(value);
    setPostcodeError("");
    
    // Clear assembly estimate while typing
    if (value.length !== 4) {
      setAssemblyEstimate(null);
    }

    // Validate postcode format
    if (value.length === 4) {
      try {
        postcodeSchema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          setPostcodeError(error.errors[0].message);
        }
      }
    }
  };

  // Reset selections when configurator opens with a new cabinet
  useEffect(() => {
    if (open && cabinetTypeId) {
      // Clear previous selections to allow preferences to be applied
      setSelectedDoorStyle('');
      setSelectedColor('');
      setSelectedFinish('');
      setNotes('');
      // Reset assembly state when opening configurator - don't clear postcode/preferences
      setPostcodeError('');
      setAssemblyEstimate(null);
      setAssemblyEditMode(false);
      // Don't reset assemblyEnabled and assemblyType - let preferences apply
    }
  }, [open, cabinetTypeId]);

  // Load data when configurator opens
  useEffect(() => {
    if (open) {
      loadCabinetTypes();
      loadDoorStyles();
      loadColors();
      loadFinishes();
      loadDoorStyleFinishes();
      loadColorFinishes();
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

  // Apply saved preferences as defaults when data is loaded
  useEffect(() => {
    // First check new cabinet preferences system
    const newPreferredDoorStyle = savedPrefs?.preferred_door_style_id;
    const newPreferredColor = savedPrefs?.preferred_color_id;
    const newPreferredFinish = savedPrefs?.preferred_finish_id;
    
    // Fallback to old preference system
    const doorStyleId = newPreferredDoorStyle || preferredDoorStyleId;
    const colorId = newPreferredColor || preferredColorId;
    const finishId = newPreferredFinish || preferredFinishId;

    if (
      doorStyles.length > 0 && 
      colors.length > 0 && 
      finishes.length > 0 &&
      doorStyleId && 
      colorId && 
      finishId &&
      !selectedDoorStyle && // Only apply if nothing is selected yet
      !selectedColor && 
      !selectedFinish
    ) {
      // Check if preferred door style exists and is active
      const preferredDoorStyle = doorStyles.find(ds => ds.id === doorStyleId);
      const preferredColor = colors.find(c => c.id === colorId);
      const preferredFinish = finishes.find(f => f.id === finishId);

      if (preferredDoorStyle && preferredColor && preferredFinish) {
        // Apply preferences regardless of compatibility relationships
        // If the relationships are empty, we'll allow any combination
        const hasRelationshipData = doorStyleFinishes.length > 0 || colorFinishes.length > 0;
        
        if (!hasRelationshipData) {
          // No relationship constraints exist, apply preferences directly
          setSelectedDoorStyle(doorStyleId);
          setSelectedColor(colorId);
          setSelectedFinish(finishId);
          
          console.log('Applied saved preferences (no constraints):', {
            doorStyle: preferredDoorStyle.name,
            color: preferredColor.name,
            finish: preferredFinish.name,
            source: newPreferredDoorStyle ? 'new-system' : 'old-system'
          });
        } else {
          // Check if the preferred door style supports the preferred finish
          const doorStyleSupportsFinish = doorStyleFinishes.some(
            dsf => dsf.door_style_id === doorStyleId && dsf.finish_id === finishId
          );

          // Check if the preferred color supports the preferred finish
          const colorSupportsFinish = colorFinishes.some(
            cf => cf.color_id === colorId && cf.finish_id === finishId
          );

          // If all combinations are compatible, apply the preferences
          if (doorStyleSupportsFinish && colorSupportsFinish) {
            setSelectedDoorStyle(doorStyleId);
            setSelectedColor(colorId);
            setSelectedFinish(finishId);
            
            console.log('Applied saved preferences (with constraints):', {
              doorStyle: preferredDoorStyle.name,
              color: preferredColor.name,
              finish: preferredFinish.name,
              source: newPreferredDoorStyle ? 'new-system' : 'old-system'
            });
          } else {
            console.log('Saved preferences not compatible with current constraints');
          }
        }
      }
    }
  }, [
    doorStyles, 
    colors, 
    finishes, 
    doorStyleFinishes, 
    colorFinishes,
    preferredDoorStyleId, 
    preferredColorId, 
    preferredFinishId,
    savedPrefs,
    selectedDoorStyle,
    selectedColor,
    selectedFinish
  ]);

  const loadCabinetTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinet_types')
        .select(`
          *,
          room_category:unified_categories!room_category_id(
            id,
            name,
            display_name,
            level
          )
        `)
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCabinetTypes(data as CabinetType[] || []);
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

  const loadDoorStyleFinishes = async () => {
    try {
      const { data, error } = await supabase
        .from('door_style_finishes')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setDoorStyleFinishes(data || []);
    } catch (error) {
      console.error('Error loading door style finishes:', error);
    }
  };

  const loadColorFinishes = async () => {
    try {
      const { data, error } = await supabase
        .from('color_finishes')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setColorFinishes(data || []);
    } catch (error) {
      console.error('Error loading color finishes:', error);
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
      materialRate: (selectedCabinetType as any).material_rate_per_sqm || 85,
      doorRate: doorStyle?.base_rate_per_sqm || (selectedCabinetType as any).door_rate_per_sqm || 120,
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
      hardwareRequirements,
      doorStyles.find(ds => ds.id === selectedDoorStyle)
    );

    console.log('Calculated pricing:', calculatedPricing);
    
    // Add assembly cost if enabled
    const assemblyPrice = assemblyEnabled && assemblyEstimate ? 
      (assemblyType === 'carcass_only' ? assemblyEstimate.carcass_only_price || 0 : assemblyEstimate.with_doors_price || 0) : 0;
    const finalPrice = calculatedPricing.totalPrice + assemblyPrice;
    
    return finalPrice;
  };

  const calculateWeightInfo = () => {
    if (!selectedCabinetType || !dimensions.width || !dimensions.height || !dimensions.depth) {
      return null;
    }

    const doorStyle = doorStyles.find(ds => ds.id === selectedDoorStyle);
    
    const cabinetTypeWithParts = {
      ...selectedCabinetType,
      cabinet_parts: cabinetParts
    };

    const calculatedPricing = PricingCalculator.calculateCabinetPrice(
      cabinetTypeWithParts,
      dimensions,
      quantity,
      {
        materialRate: (selectedCabinetType as any).material_rate_per_sqm || 85,
        doorRate: doorStyle?.base_rate_per_sqm || (selectedCabinetType as any).door_rate_per_sqm || 120,
        colorSurcharge: 0,
        finishSurcharge: 0,
      },
      hardwareRequirements,
      doorStyle
    );

    return calculatedPricing.weight;
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

  const handleAddToCart = () => {
    if (!selectedCabinetType || !selectedDoorStyle || !selectedColor || !selectedFinish) {
      toast.error('Please complete all selections before adding to cart');
      return;
    }

    const totalPrice = calculateTotalPrice();
    const weightInfo = calculateWeightInfo();

    const cartItem = {
      cabinet_type_id: selectedCabinetType.id,
      door_style_id: selectedDoorStyle,
      color_id: selectedColor,
      finish_id: selectedFinish,
      width_mm: dimensions.width,
      height_mm: dimensions.height,
      depth_mm: dimensions.depth,
      quantity: quantity,
      unit_price: totalPrice,
      notes: notes.trim() || undefined,
      configuration: {
        style: selectedDoorStyle,
        color: selectedColor,
        finish: selectedFinish,
        customDimensions: dimensions,
        weight: weightInfo,
        quantity: quantity,
        // Include assembly information in configuration
        assembly: assemblyEnabled ? {
          postcode: postcode,
          enabled: true,
          type: assemblyType,
          price: assemblyType === 'carcass_only' ? assemblyEstimate?.carcass_only_price : assemblyEstimate?.with_doors_price,
          lead_time_days: assemblyEstimate?.lead_time_days,
          includes: assemblyEstimate?.includes
        } : {
          enabled: false
        }
      }
    };

    // Add item directly to cart
    addToCart(cartItem);
    toast.success(`Added ${quantity} × ${selectedCabinetType.name} to cart`);
    onOpenChange(false);
  };

  const handleStyleColorFinishSelection = (doorStyleId: string, colorId: string, finishId: string) => {
    setSelectedDoorStyle(doorStyleId);
    setSelectedColor(colorId);
    setSelectedFinish(finishId);
    
    // Save user preferences for future selections
    updateStylePreferences(doorStyleId, colorId, finishId);
    
    // Also save to new cabinet preferences system
    updatePreference('preferred_door_style_id', doorStyleId);
    updatePreference('preferred_color_id', colorId);
    updatePreference('preferred_finish_id', finishId);
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
            <div className="lg:hidden sticky top-0 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-4 py-3 z-50 flex items-center justify-between shadow-lg">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {selectedCabinetType.name}
                </h3>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-lg font-bold">
                  ${calculateTotalPrice().toFixed(2)}
                </div>
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-white/20 text-white">
                  {quantity} item{quantity !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          )}

          {/* Desktop Floating Price Box - Top Right */}
          {selectedCabinetType && (
            <div className="hidden lg:block absolute top-6 right-6 z-10">
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
                <CardContent className="p-4 text-center min-w-[200px]">
                  <div className="text-2xl font-bold mb-1">
                    ${calculateTotalPrice().toFixed(2)}
                  </div>
                  <div className="text-xs opacity-90 mb-3">Total Price</div>
                  <Badge variant="secondary" className="text-xs px-3 py-1 bg-white/20 text-white">
                    {quantity} item{quantity !== 1 ? 's' : ''}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-background to-secondary/5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                {selectedCabinetType?.name || 'Configure Product'}
                {selectedCabinetType && (
                  <Badge variant="outline" className="text-xs font-medium">
                    {selectedCabinetType.category}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Main Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column - Image */}
              <div className="lg:col-span-2">
                {selectedCabinetType && (
                  <div className="lg:sticky lg:top-6">
                    <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-background to-secondary/5">
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
                                <div className="w-16 h-16 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
                                  <Settings className="w-8 h-8 text-primary" />
                                </div>
                                <span className="text-muted-foreground font-medium">Product Preview</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Enhanced overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent text-white p-4">
                            <div className="text-sm font-medium">
                              {dimensions.width} × {dimensions.height} × {dimensions.depth}mm
                              {selectedDoorStyle && colors.find(c => c.id === selectedColor) && (
                                <div className="flex items-center gap-2 mt-2">
                                  {colors.find(c => c.id === selectedColor)?.hex_code && (
                                    <div 
                                      className="w-3 h-3 rounded-full border-2 border-white/80 shadow-sm"
                                      style={{ backgroundColor: colors.find(c => c.id === selectedColor)?.hex_code }}
                                    />
                                  )}
                                  <span className="truncate text-sm">{doorStyles.find(s => s.id === selectedDoorStyle)?.name}</span>
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
              <div className="lg:col-span-3 space-y-4">
                {selectedCabinetType && (
                  <>
                    {/* Dimensions */}
                    <Card className="shadow-md border-0 bg-gradient-to-br from-background to-secondary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                          <Ruler className="w-5 h-5 text-primary" />
                          Dimensions (mm)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="width" className="text-sm font-medium">Width</Label>
                            <Input
                              id="width"
                              type="number"
                              value={dimensions.width}
                              onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
                              onBlur={() => handleDimensionBlur('width')}
                              className="text-center font-mono h-10 dimension-number font-semibold border-2 focus:border-primary/50"
                            />
                            <div className="text-xs text-muted-foreground text-center font-medium">
                              {selectedCabinetType.min_width_mm}-{selectedCabinetType.max_width_mm}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="height" className="text-sm font-medium">Height</Label>
                            <Input
                              id="height"
                              type="number"
                              value={dimensions.height}
                              onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
                              onBlur={() => handleDimensionBlur('height')}
                              className="text-center font-mono h-10 dimension-number font-semibold border-2 focus:border-primary/50"
                            />
                            <div className="text-xs text-muted-foreground text-center font-medium">
                              {selectedCabinetType.min_height_mm}-{selectedCabinetType.max_height_mm}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="depth" className="text-sm font-medium">Depth</Label>
                            <Input
                              id="depth"
                              type="number"
                              value={dimensions.depth}
                              onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value) || 0)}
                              onBlur={() => handleDimensionBlur('depth')}
                              className="text-center font-mono h-10 dimension-number font-semibold border-2 focus:border-primary/50"
                            />
                            <div className="text-xs text-muted-foreground text-center font-medium">
                              {selectedCabinetType.min_depth_mm}-{selectedCabinetType.max_depth_mm}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Door Style, Color & Finish Selector */}
                    <Card className="shadow-md border-0 bg-gradient-to-br from-background to-secondary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                          <Palette className="w-5 h-5 text-primary" />
                          Door Style, Colour & Finish
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div 
                          onClick={() => setStyleColorFinishSelectorOpen(true)}
                          className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 min-h-[140px] flex items-center justify-center group"
                        >
                          {selectedDoorStyle && selectedColor && selectedFinish ? (
                            <div className="w-full">
                              <div className="flex items-center gap-6 mb-4">
                                {/* Door Style Image Box */}
                                <div className="flex-1">
                                  <div className="aspect-square rounded-xl overflow-hidden border-2 bg-muted shadow-sm">
                                    {getSelectedDoorStyle()?.image_url ? (
                                      <img 
                                        src={getSelectedDoorStyle()?.image_url} 
                                        alt={getSelectedDoorStyle()?.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/20 to-secondary/5">
                                        <Settings className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Color Square Box */}
                                <div className="flex-1">
                                  <div 
                                    className="aspect-square rounded-xl border-2 border-border shadow-lg"
                                    style={{ backgroundColor: getSelectedColor()?.hex_code || '#f3f4f6' }}
                                  />
                                </div>
                              </div>
                              
                              {/* Single line with all selections */}
                              <div className="text-center">
                                <p className="text-base font-semibold leading-tight mb-1">
                                  {getSelectedDoorStyle()?.name} | {getSelectedColor()?.name} | {getSelectedFinish()?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Click to change selection
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                                <Palette className="w-8 h-8 text-primary" />
                              </div>
                              <p className="font-semibold text-lg mb-2">Select Door Style, Colour & Finish</p>
                              <p className="text-sm text-muted-foreground">Click to customize your cabinet</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hardware & Quantity */}
                    <Card className="shadow-md border-0 bg-gradient-to-br from-background to-secondary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                          <Settings className="w-5 h-5 text-primary" />
                          Options
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Hardware Brand</Label>
                          <Select>
                            <SelectTrigger className="h-10 border-2 focus:border-primary/50">
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
                          <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            className="text-center font-mono h-10 text-base font-semibold border-2 focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            Postcode for Assembly
                          </Label>
                          <Input
                            type="text"
                            value={postcode}
                            onChange={(e) => handlePostcodeChange(e.target.value)}
                            placeholder="e.g., 3000"
                            maxLength={4}
                            className={`h-10 border-2 focus:border-primary/50 ${postcodeError ? "border-destructive" : ""}`}
                          />
                          {postcodeError && (
                            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3" />
                              {postcodeError}
                            </p>
                          )}
                          
                            {/* Assembly Options - Always Show */}
                            <div className="mt-3 space-y-2">
                              {!assemblyEditMode ? (
                                // Show selected option with edit button
                                <div className="p-3 rounded-lg border border-primary bg-primary/5 ring-1 ring-primary/20">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full border-2 border-primary bg-primary" />
                                      <div>
                                        <p className="text-xs font-medium">
                                          {!assemblyEnabled 
                                            ? 'Flat Pack' 
                                            : assemblyType === 'carcass_only' 
                                              ? 'Carcass Assembly' 
                                              : 'Complete Assembly'
                                          }
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {!assemblyEnabled 
                                            ? 'Self-assembly required' 
                                            : assemblyType === 'carcass_only' 
                                              ? 'Pre-assembled with drawer runners' 
                                              : 'Fully assembled with doors fitted'
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {!assemblyEnabled 
                                          ? '$0.00' 
                                          : assemblyType === 'carcass_only' 
                                            ? `$${assemblyEstimate?.carcass_only_price?.toFixed(2) || '0.00'}` 
                                            : `$${assemblyEstimate?.with_doors_price?.toFixed(2) || '0.00'}`
                                        }
                                      </Badge>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setAssemblyEditMode(true)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Show all options for selection
                                <div className="space-y-2">
                                  {/* Flat Pack Option - Always Available */}
                                  <div 
                                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                                      !assemblyEnabled 
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                                        : 'border-border hover:border-primary/30'
                                    }`}
                                    onClick={() => handleAssemblySelection('flat_pack')}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border-2 ${
                                          !assemblyEnabled 
                                            ? 'border-primary bg-primary' 
                                            : 'border-muted-foreground'
                                        }`} />
                                        <div>
                                          <p className="text-xs font-medium">Flat Pack</p>
                                          <p className="text-xs text-muted-foreground">Self-assembly required</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        $0.00
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {/* Carcass Only Assembly Option */}
                                  <div 
                                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                                      assemblyEnabled && assemblyType === 'carcass_only' 
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                                        : (!assemblyEstimate?.eligible && postcode.length === 4) 
                                          ? 'border-muted-foreground/30 bg-muted/30 cursor-not-allowed opacity-60' 
                                          : 'border-border hover:border-primary/30'
                                    }`}
                                    onClick={() => {
                                      if (assemblyEstimate?.eligible || postcode.length !== 4) {
                                        handleAssemblySelection('carcass_only');
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border-2 ${
                                          assemblyEnabled && assemblyType === 'carcass_only' 
                                            ? 'border-primary bg-primary' 
                                            : 'border-muted-foreground'
                                        }`} />
                                        <div>
                                          <p className="text-xs font-medium flex items-center gap-1">
                                            Carcass Assembly
                                            {!assemblyEstimate?.eligible && postcode.length === 4 && (
                                              <span className="text-destructive">(Not available)</span>
                                            )}
                                          </p>
                                          <p className="text-xs text-muted-foreground">Pre-assembled with drawer runners</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        ${assemblyEstimate?.carcass_only_price?.toFixed(2) || '0.00'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {/* Complete Assembly Option */}
                                  <div 
                                    className={`cursor-pointer p-3 rounded-lg border transition-all ${
                                      assemblyEnabled && assemblyType === 'with_doors' 
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                                        : (!assemblyEstimate?.eligible && postcode.length === 4) 
                                          ? 'border-muted-foreground/30 bg-muted/30 cursor-not-allowed opacity-60' 
                                          : 'border-border hover:border-primary/30'
                                    }`}
                                    onClick={() => {
                                      if (assemblyEstimate?.eligible || postcode.length !== 4) {
                                        handleAssemblySelection('with_doors');
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full border-2 ${
                                          assemblyEnabled && assemblyType === 'with_doors' 
                                            ? 'border-primary bg-primary' 
                                            : 'border-muted-foreground'
                                        }`} />
                                        <div>
                                          <p className="text-xs font-medium flex items-center gap-1">
                                            Complete Assembly
                                            {!assemblyEstimate?.eligible && postcode.length === 4 && (
                                              <span className="text-destructive">(Not available)</span>
                                            )}
                                          </p>
                                          <p className="text-xs text-muted-foreground">Fully assembled with doors fitted</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        ${assemblyEstimate?.with_doors_price?.toFixed(2) || '0.00'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          
                          {/* Loading/Checking Assembly */}
                          {postcode.length === 4 && !assemblyEstimate && !postcodeError && (
                            <div className="mt-2 text-xs text-muted-foreground text-center py-2">
                              Checking assembly availability...
                            </div>
                          )}
                          
                          {/* Assembly Not Available Message */}
                          {postcode.length === 4 && assemblyEstimate && !assemblyEstimate.eligible && (
                            <div className="mt-2 text-xs text-orange-600 text-center py-2 bg-orange-50 rounded border border-orange-200">
                              Assembly not available for postcode {postcode}. Flat pack option available.
                            </div>
                          )}
                          
                          {/* Assembly Available Message */}
                          {postcode.length === 4 && assemblyEstimate && assemblyEstimate.eligible && (
                            <div className="mt-2 text-xs text-green-600 text-center py-2 bg-green-50 rounded border border-green-200">
                              Assembly available for postcode {postcode}! All options shown above.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes - Compact */}
                    <Card className="shadow-md border-0 bg-gradient-to-br from-background to-secondary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                          <FileText className="w-5 h-5 text-primary" />
                          Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Textarea
                          placeholder="Special requirements or notes..."
                          className="min-h-[80px] resize-none text-sm border-2 focus:border-primary/50"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </CardContent>
                    </Card>

                    {/* Packaging & Add to Cart - Enhanced */}
                     <div className="space-y-3">
                       <Button
                         onClick={handleAddToCart}
                         className="w-full"
                         size="lg"
                         disabled={!selectedCabinetType || !selectedDoorStyle || !selectedColor || !selectedFinish}
                       >
                         Add to Cart - ${(calculateTotalPrice() * quantity).toFixed(2)}
                       </Button>
                       {(!selectedDoorStyle || !selectedColor || !selectedFinish) && (
                         <div className="text-sm text-muted-foreground text-center -mt-2 font-medium">
                           Complete all selections to add to cart
                         </div>
                       )}
                     </div>
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
          doorStyleFinishes={doorStyleFinishes}
          colorFinishes={colorFinishes}
          selectedDoorStyle={selectedDoorStyle || savedPrefs?.preferred_door_style_id || preferredDoorStyleId}
          selectedColor={selectedColor || savedPrefs?.preferred_color_id || preferredColorId}
          selectedFinish={selectedFinish || savedPrefs?.preferred_finish_id || preferredFinishId}
          onSelectionComplete={handleStyleColorFinishSelection}
        />

      </DialogContent>
    </Dialog>
  );
};