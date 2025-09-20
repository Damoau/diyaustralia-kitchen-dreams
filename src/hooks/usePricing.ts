import { useState, useEffect } from 'react';
import PricingCalculator from '@/lib/pricingCalculator';
import { supabase } from '@/integrations/supabase/client';

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
  const [hardwareRequirements, setHardwareRequirements] = useState<any[]>([]);

  useEffect(() => {
    const fetchHardwareRequirements = async () => {
      if (!cabinetType?.id) {
        setHardwareRequirements([]);
        return;
      }

      try {
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
        console.error('Error fetching hardware requirements:', error);
        setHardwareRequirements([]);
      }
    };

    fetchHardwareRequirements();
  }, [cabinetType?.id]);

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
        const doorCount = Math.max(cabinetType.door_qty || cabinetType.door_count || 1, 1);
        const doorArea = (dimensions.width / 1000) * (dimensions.height / 1000) * doorCount;
        rates.colorSurcharge *= doorArea * quantity;
        rates.finishSurcharge *= doorArea * quantity;

        const result = PricingCalculator.calculateCabinetPrice(
          cabinetType,
          dimensions,
          quantity,
          rates,
          hardwareRequirements
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
    hardwareRequirements,
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