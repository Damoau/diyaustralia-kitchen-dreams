import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { CabinetType } from '@/types/cabinet';
import { useCart } from '@/contexts/CartContext';
import { useDynamicPricing } from '@/hooks/useDynamicPricing';
import { useCabinetPreferences } from '@/hooks/useCabinetPreferences';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Step Components
import { StepIndicator } from './configurator/StepIndicator';
import { ProductPreview } from './configurator/ProductPreview';
import { StepOne } from './configurator/StepOne';
import { StepTwo } from './configurator/StepTwo';
import { StepThree } from './configurator/StepThree';
import { StepFour } from './configurator/StepFour';

interface StepBasedConfiguratorDialogProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWidth?: number;
}

const STEP_TITLES = ['Size', 'Style', 'Hardware', 'Review'];

export function StepBasedConfiguratorDialog({ 
  cabinetType, 
  open, 
  onOpenChange, 
  initialWidth 
}: StepBasedConfiguratorDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
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
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedHardwareBrand, setSelectedHardwareBrand] = useState<string>('');

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
    refreshInterval: 5000,
    hardwareBrandId: selectedHardwareBrand
  });

  // Fetch hardware brands
  const { data: hardwareBrands = [] } = useQuery({
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

  // Fetch colors for the selected door style
  const { data: availableColors = [] } = useQuery({
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

  // Auto-select defaults
  useEffect(() => {
    if (hardwareBrands.length > 0 && !selectedHardwareBrand) {
      const titusBrand = hardwareBrands.find(brand => brand.name === 'Titus');
      setSelectedHardwareBrand(titusBrand ? titusBrand.id : hardwareBrands[0].id);
    }
  }, [hardwareBrands, selectedHardwareBrand]);

  useEffect(() => {
    if (cabinetTypeFinishes && cabinetTypeFinishes.length > 0 && !selectedDoorStyle) {
      const firstFinish = cabinetTypeFinishes[0];
      if (firstFinish.door_style?.id) {
        setSelectedDoorStyle(firstFinish.door_style.id);
      }
    }
  }, [cabinetTypeFinishes, selectedDoorStyle]);

  useEffect(() => {
    if (selectedDoorStyle && availableColors.length > 0) {
      if (!selectedColor || !availableColors.find(c => c.id === selectedColor)) {
        setSelectedColor(availableColors[0].id);
      }
    } else {
      setSelectedColor('');
    }
  }, [selectedDoorStyle, availableColors, selectedColor]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setWidth(initialWidth || cabinetType.default_width_mm);
      setHeight(cabinetType.default_height_mm);
      setDepth(cabinetType.default_depth_mm);
      
      // Apply locked preferences
      const lockedPrefs = getLockedPreferences();
      if (locks.height && lockedPrefs.height) setHeight(lockedPrefs.height);
      if (locks.depth && lockedPrefs.depth) setDepth(lockedPrefs.depth);
      if (locks.doorStyle && lockedPrefs.doorStyleId) setSelectedDoorStyle(lockedPrefs.doorStyleId);
      if (locks.color && lockedPrefs.colorId) setSelectedColor(lockedPrefs.colorId);
      if (locks.hardware && lockedPrefs.hardwareBrandId) setSelectedHardwareBrand(lockedPrefs.hardwareBrandId);
    }
  }, [open, cabinetType.id, initialWidth, locks, getLockedPreferences]);

  // Preference handlers
  const handleHeightChange = (value: number) => {
    setHeight(value);
    if (locks.height) updatePreference('height', value);
  };

  const handleDepthChange = (value: number) => {
    setDepth(value);
    if (locks.depth) updatePreference('depth', value);
  };

  const handleDoorStyleChange = (value: string) => {
    setSelectedDoorStyle(value);
    if (locks.doorStyle) updatePreference('doorStyleId', value);
  };

  const handleColorChange = (value: string) => {
    setSelectedColor(value);
    if (locks.color) updatePreference('colorId', value);
  };

  const handleHardwareChange = (value: string) => {
    setSelectedHardwareBrand(value);
    if (locks.hardware) updatePreference('hardwareBrandId', value);
  };

  const handleAddToCart = async () => {
    const selectedDoorStyleObj = cabinetTypeFinishes?.find(f => f.door_style?.id === selectedDoorStyle)?.door_style;
    const selectedColorObj = availableColors?.find(c => c.id === selectedColor);
    
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
      rightSideWidth: cabinetType.cabinet_style === 'corner' ? rightSideWidth : undefined,
      leftSideWidth: cabinetType.cabinet_style === 'corner' ? leftSideWidth : undefined,
      rightSideDepth: cabinetType.cabinet_style === 'corner' ? rightSideDepth : undefined,
      leftSideDepth: cabinetType.cabinet_style === 'corner' ? leftSideDepth : undefined,
      quantity,
      doorStyle: selectedDoorStyleObj,
      color: selectedColorObj,
      finish: null,
      hardwareBrand: hardwareBrandObj
    };

    try {
      const { parseGlobalSettings } = await import('@/lib/pricing');
      const settings = parseGlobalSettings(globalSettings || []);
      await addToCart(configuration, cabinetParts || [], settings);
      
      toast({
        title: "Added to Cart",
        description: `${configuration.cabinetType.name} has been added to your cart!`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
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

  const availableDoorStyles = cabinetTypeFinishes?.map(f => f.door_style).filter(Boolean) || [];
  
  const getSelectedNames = () => ({
    doorStyle: availableDoorStyles.find(d => d.id === selectedDoorStyle)?.name || '',
    color: availableColors.find(c => c.id === selectedColor)?.name || '',
    hardware: hardwareBrands.find(h => h.id === selectedHardwareBrand)?.name || ''
  });

  const names = getSelectedNames();

  const nextStep = () => {
    if (currentStep < STEP_TITLES.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Configure Your Cabinet
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <StepIndicator 
          currentStep={currentStep} 
          totalSteps={STEP_TITLES.length} 
          stepTitles={STEP_TITLES} 
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Product Preview - Left Side */}
          <div className="w-1/2 p-6">
            <ProductPreview
              cabinetType={cabinetType}
              currentImage={getCurrentCabinetImage()}
              width={width}
              height={height}
              depth={depth}
              isCorner={cabinetType.cabinet_style === 'corner'}
              rightSideWidth={rightSideWidth}
              leftSideWidth={leftSideWidth}
            />
          </div>

          {/* Configuration Steps - Right Side */}
          <div className="w-1/2 border-l bg-muted/20">
            <div className="h-full flex flex-col">
              <div className="flex-1 p-6 overflow-y-auto">
                {currentStep === 1 && (
                  <StepOne
                    cabinetType={cabinetType}
                    width={width}
                    height={height}
                    depth={depth}
                    rightSideWidth={rightSideWidth}
                    leftSideWidth={leftSideWidth}
                    rightSideDepth={rightSideDepth}
                    leftSideDepth={leftSideDepth}
                    locks={{ 
                      height: locks.height,
                      depth: locks.depth
                    }}
                    onWidthChange={setWidth}
                    onHeightChange={handleHeightChange}
                    onDepthChange={handleDepthChange}
                    onRightSideWidthChange={setRightSideWidth}
                    onLeftSideWidthChange={setLeftSideWidth}
                    onRightSideDepthChange={setRightSideDepth}
                    onLeftSideDepthChange={setLeftSideDepth}
                    onToggleLock={(field) => {
                      if (field === 'height' || field === 'depth') {
                        toggleLock(field);
                      }
                    }}
                  />
                )}

                {currentStep === 2 && (
                  <StepTwo
                    availableDoorStyles={availableDoorStyles}
                    availableColors={availableColors}
                    selectedDoorStyle={selectedDoorStyle}
                    selectedColor={selectedColor}
                    locks={locks}
                    onDoorStyleChange={handleDoorStyleChange}
                    onColorChange={handleColorChange}
                    onToggleLock={toggleLock}
                  />
                )}

                {currentStep === 3 && (
                  <StepThree
                    availableHardwareBrands={hardwareBrands}
                    selectedHardwareBrand={selectedHardwareBrand}
                    locks={locks}
                    onHardwareChange={handleHardwareChange}
                    onToggleLock={toggleLock}
                  />
                )}

                {currentStep === 4 && (
                  <StepFour
                    cabinetType={cabinetType}
                    width={width}
                    height={height}
                    depth={depth}
                    quantity={quantity}
                    selectedDoorStyleName={names.doorStyle}
                    selectedColorName={names.color}
                    selectedHardwareBrandName={names.hardware}
                    price={price}
                    priceBreakdown={priceBreakdown}
                    isLoading={isLoading}
                    isAddingToCart={isAddingToCart}
                    onQuantityChange={setQuantity}
                    onAddToCart={handleAddToCart}
                    isCorner={cabinetType.cabinet_style === 'corner'}
                    rightSideWidth={rightSideWidth}
                    leftSideWidth={leftSideWidth}
                  />
                )}
              </div>

              {/* Navigation Footer */}
              <div className="border-t p-6 bg-background">
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  {currentStep < STEP_TITLES.length ? (
                    <Button onClick={nextStep}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Ready to add to cart
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}