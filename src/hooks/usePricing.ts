import { useState, useEffect } from 'react';
import PricingCalculator from '@/lib/pricingCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useMaterialSpecifications } from './useMaterialSpecifications';

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
  const { getDefaultMaterialRate } = useMaterialSpecifications();

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
        // Get material rate from material specifications
        const materialRate = getDefaultMaterialRate();

        // Calculate proper door rate: base door style rate + color surcharge + finish rate
        const baseDoorRate = selectedDoorStyle?.base_rate_per_sqm || 120;
        const colorSurchargeRate = selectedColor?.surcharge_rate_per_sqm || 0;
        const finishRate = selectedFinish?.rate_per_sqm || 0;
        const totalDoorRate = baseDoorRate + colorSurchargeRate + finishRate;

        const rates = {
          materialRate: materialRate,
          doorRate: totalDoorRate,
          colorSurcharge: 0, // Already included in doorRate
          finishSurcharge: 0, // Already included in doorRate
        };

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
    selectedFinish,
    getDefaultMaterialRate
  ]);

  return { pricing, loading };
};

export default usePricing;