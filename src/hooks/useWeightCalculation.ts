import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeightCalculationProps {
  cabinetTypeId: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  doorStyleId?: string;
  quantity?: number;
}

interface WeightBreakdown {
  totalWeight: number;
  carcassWeight: number;
  doorWeight: number;
  hardwareWeight: number;
  packageDimensions: {
    length_mm: number;
    width_mm: number;
    height_mm: number;
    cubic_m: number;
  };
}

export const useWeightCalculation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateWeight = async (props: WeightCalculationProps): Promise<WeightBreakdown | null> => {
    setLoading(true);
    setError(null);

    try {
      // Get cabinet parts with weight specifications
      const { data: cabinetParts, error: partsError } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', props.cabinetTypeId);

      if (partsError) throw partsError;

      // Get door style weight specifications
      let doorStyle = null;
      if (props.doorStyleId) {
        const { data: doorStyleData, error: doorError } = await supabase
          .from('door_styles')
          .select('*')
          .eq('id', props.doorStyleId)
          .single();

        if (doorError) throw doorError;
        doorStyle = doorStyleData;
      }

      // Calculate carcass weight (all non-door, non-hardware parts)
      let carcassWeight = 0;
      const carcassParts = cabinetParts?.filter(part => !part.is_door && !part.is_hardware) || [];
      
      for (const part of carcassParts) {
        // Calculate part dimensions in square meters
        const partWidth = calculateDimension(part.width_formula, props.width_mm, props.height_mm, props.depth_mm);
        const partHeight = calculateDimension(part.height_formula, props.width_mm, props.height_mm, props.depth_mm);
        const areaM2 = (partWidth / 1000) * (partHeight / 1000);
        
        // Calculate weight: area × density × thickness × quantity × weight multiplier
        const thickness_m = (part.material_thickness_mm || 18) / 1000;
        const density = part.material_density_kg_per_sqm || 12.0;
        const weightMultiplier = part.weight_multiplier || 1.0;
        const partQuantity = part.quantity || 1;
        
        const partWeight = areaM2 * density * weightMultiplier * partQuantity;
        carcassWeight += partWeight;
      }

      // Calculate door weight
      let doorWeight = 0;
      const doorParts = cabinetParts?.filter(part => part.is_door) || [];
      
      for (const part of doorParts) {
        const doorWidth = calculateDimension(part.width_formula, props.width_mm, props.height_mm, props.depth_mm);
        const doorHeight = calculateDimension(part.height_formula, props.width_mm, props.height_mm, props.depth_mm);
        const doorAreaM2 = (doorWidth / 1000) * (doorHeight / 1000);
        
        // Use door style specifications if available
        const doorDensity = doorStyle?.material_density_kg_per_sqm || 12.0;
        const doorThickness = (doorStyle?.thickness_mm || 18) / 1000;
        const doorWeightFactor = doorStyle?.weight_factor || 1.0;
        const doorQuantity = part.quantity || 1;
        
        const partDoorWeight = doorAreaM2 * doorDensity * doorWeightFactor * doorQuantity;
        doorWeight += partDoorWeight;
      }

      // Calculate hardware weight (estimated)
      const hardwareParts = cabinetParts?.filter(part => part.is_hardware) || [];
      let hardwareWeight = 0;
      
      for (const part of hardwareParts) {
        // Standard hardware weight estimation based on cabinet size
        const baseHardwareWeight = 2.5; // kg base weight for hinges, handles, etc.
        const sizeMultiplier = (props.width_mm * props.height_mm) / (600 * 720); // relative to standard cabinet
        hardwareWeight += baseHardwareWeight * sizeMultiplier * (part.quantity || 1);
      }

      const totalWeight = (carcassWeight + doorWeight + hardwareWeight) * (props.quantity || 1);

      // Calculate package dimensions (with padding for packaging)
      const packagePadding = 50; // mm padding on each side
      const packageDimensions = {
        length_mm: props.width_mm + packagePadding,
        width_mm: props.depth_mm + packagePadding,
        height_mm: props.height_mm + packagePadding,
        cubic_m: ((props.width_mm + packagePadding) * (props.depth_mm + packagePadding) * (props.height_mm + packagePadding)) / 1000000000
      };

      return {
        totalWeight,
        carcassWeight,
        doorWeight,
        hardwareWeight,
        packageDimensions
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate weight');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { calculateWeight, loading, error };
};

// Helper function to calculate dimension from formula
function calculateDimension(formula: string | null, width: number, height: number, depth: number): number {
  if (!formula) return 0;
  
  // Replace variables in formula
  const expression = formula
    .replace(/width/g, width.toString())
    .replace(/height/g, height.toString())
    .replace(/depth/g, depth.toString());
  
  try {
    // Simple expression evaluation (only allow basic math)
    return Function('"use strict"; return (' + expression + ')')();
  } catch {
    return 0;
  }
}