import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PricingCalculator from '@/lib/pricingCalculator';
import { DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMaterialSpecifications } from '@/hooks/useMaterialSpecifications';

interface PricingDisplayProps {
  cabinetType: any;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  quantity?: number;
  selectedDoorStyle?: any;
  selectedColor?: any;
  selectedFinish?: any;
  className?: string;
}

export const PricingDisplay: React.FC<PricingDisplayProps> = ({
  cabinetType,
  dimensions,
  quantity = 1,
  selectedDoorStyle,
  selectedColor,
  selectedFinish,
  className
}) => {
  const [pricing, setPricing] = useState<{
    totalPrice: number;
    breakdown: { carcass: number; doors: number; hardware: number; surcharges: number; };
  } | null>(null);
  const [cabinetParts, setCabinetParts] = useState<any[]>([]);
  const [hardwareRequirements, setHardwareRequirements] = useState<any[]>([]);
  const { getDefaultMaterialRate } = useMaterialSpecifications();

  // Fetch cabinet parts when cabinetType changes
  useEffect(() => {
    const fetchCabinetPartsAndHardware = async () => {
      if (!cabinetType?.id) {
        setCabinetParts([]);
        setHardwareRequirements([]);
        return;
      }

      try {
        // Fetch cabinet parts
        const { data: parts } = await supabase
          .from('cabinet_parts')
          .select('*')
          .eq('cabinet_type_id', cabinetType.id);
        
        setCabinetParts(parts || []);

        // Fetch hardware requirements
        const { data: hardware } = await supabase
          .from('cabinet_hardware_requirements')
          .select(`
            *,
            hardware_type:hardware_types(name, category)
          `)
          .eq('cabinet_type_id', cabinetType.id)
          .eq('active', true);
        
        setHardwareRequirements(hardware || []);
      } catch (error) {
        console.error('Error fetching cabinet data:', error);
        setCabinetParts([]);
        setHardwareRequirements([]);
      }
    };

    fetchCabinetPartsAndHardware();
  }, [cabinetType?.id]);

  // Calculate pricing when dependencies change
  useEffect(() => {
    if (!cabinetType || !dimensions.width || !dimensions.height || !dimensions.depth) {
      setPricing(null);
      return;
    }

    const cabinetTypeWithParts = {
      ...cabinetType,
      cabinet_parts: cabinetParts
    };

    const rates = {
      materialRate: getDefaultMaterialRate(),
      doorRate: (selectedDoorStyle?.base_rate_per_sqm || 120) + 
                (selectedColor?.surcharge_rate_per_sqm || 0) +
                (selectedFinish?.rate_per_sqm || 0),
      colorSurcharge: 0, // Already included in doorRate
      finishSurcharge: 0, // Already included in doorRate
    };

    const calculatedPricing = PricingCalculator.calculateCabinetPrice(
      cabinetTypeWithParts,
      dimensions,
      quantity,
      rates,
      hardwareRequirements
    );

    setPricing(calculatedPricing);
  }, [cabinetType, cabinetParts, hardwareRequirements, dimensions, quantity, selectedDoorStyle, selectedColor, selectedFinish, getDefaultMaterialRate]);

  if (!pricing) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Enter dimensions to see pricing
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Pricing Breakdown
          <Badge variant="outline" className="ml-auto text-xs">Prices inc GST</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Carcass Cost:</span>
            <span className="font-medium">{formatPrice(pricing.breakdown.carcass)}</span>
          </div>
          
          {pricing.breakdown.doors > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Doors Cost:</span>
              <span className="font-medium">{formatPrice(pricing.breakdown.doors)}</span>
            </div>
          )}
          
          {pricing.breakdown.hardware > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Hardware Cost:</span>
              <span className="font-medium">{formatPrice(pricing.breakdown.hardware)}</span>
            </div>
          )}
          
          {pricing.breakdown.surcharges > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Surcharges:</span>
              <span className="font-medium">{formatPrice(pricing.breakdown.surcharges)}</span>
            </div>
          )}
        </div>

        <Separator />
        
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold">Total Price:</span>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {formatPrice(pricing.totalPrice)}
          </Badge>
        </div>

        {quantity > 1 && (
          <div className="text-xs text-muted-foreground text-center">
            Price per unit: {formatPrice(pricing.totalPrice / quantity)}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> All prices include 10% GST</p>
          <p><strong>Calculation Method:</strong> {cabinetType.price_calculation_method || 'formula'}</p>
          <p><strong>Dimensions:</strong> {dimensions.width}mm × {dimensions.height}mm × {dimensions.depth}mm</p>
          {quantity > 1 && <p><strong>Quantity:</strong> {quantity}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingDisplay;