import { useState, useEffect } from 'react';
import PricingCalculator from '@/lib/pricingCalculator';

interface UsePricingProps {
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
}

export const usePricing = ({
  cabinetType,
  dimensions,
  quantity = 1,
  selectedDoorStyle,
  selectedColor,
  selectedFinish
}: UsePricingProps) => {
  const [pricing, setPricing] = useState<{
    totalPrice: number;
    breakdown: {
      carcass: number;
      doors: number;
      hardware: number;
      surcharges: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculatePricing = async () => {
      if (!cabinetType || !dimensions.width || !dimensions.height || !dimensions.depth) {
        setPricing(null);
        return;
      }

      setLoading(true);
      
      try {
        const rates = {
          materialRate: cabinetType.material_rate_per_sqm || 85,
          doorRate: selectedDoorStyle?.base_rate_per_sqm || cabinetType.door_rate_per_sqm || 120,
          colorSurcharge: selectedColor?.surcharge_rate_per_sqm || 0,
          finishSurcharge: selectedFinish?.rate_per_sqm || 0,
        };

        // Calculate door area for surcharges
        const doorArea = (dimensions.width / 1000) * (dimensions.height / 1000) * (cabinetType.door_count || 1);
        rates.colorSurcharge *= doorArea * quantity;
        rates.finishSurcharge *= doorArea * quantity;

        const result = PricingCalculator.calculateCabinetPrice(
          cabinetType,
          dimensions,
          quantity,
          rates
        );

        setPricing(result);
      } catch (error) {
        console.error('Pricing calculation error:', error);
        setPricing(null);
      } finally {
        setLoading(false);
      }
    };

    calculatePricing();
  }, [
    cabinetType,
    dimensions.width,
    dimensions.height,
    dimensions.depth,
    quantity,
    selectedDoorStyle,
    selectedColor,
    selectedFinish
  ]);

  return { pricing, loading };
};

export default usePricing;