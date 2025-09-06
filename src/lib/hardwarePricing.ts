import { supabase } from '@/integrations/supabase/client';
import { CabinetType, HardwareBrand, CabinetHardwareRequirement, CabinetHardwareOption } from '@/types/cabinet';

export async function calculateHardwareCost(
  cabinetType: CabinetType,
  hardwareBrandId: string,
  quantity: number = 1
): Promise<number> {
  try {
    // Fetch hardware requirements for this cabinet type
    const { data: requirements, error: reqError } = await supabase
      .from('cabinet_hardware_requirements')
      .select(`
        *,
        hardware_type:hardware_types(*)
      `)
      .eq('cabinet_type_id', cabinetType.id)
      .eq('active', true);

    if (reqError) throw reqError;

    // Fetch hardware options for this brand
    const { data: options, error: optError } = await supabase
      .from('cabinet_hardware_options')
      .select(`
        *,
        hardware_product:hardware_products(*)
      `)
      .eq('hardware_brand_id', hardwareBrandId)
      .eq('active', true);

    if (optError) throw optError;

    let totalCost = 0;

    requirements?.forEach((req: any) => {
      const option = options?.find((opt: any) => opt.requirement_id === req.id);
      
      if (option && option.hardware_product) {
        let requiredQuantity = 0;
        
        switch (req.unit_scope) {
          case 'per_cabinet':
            requiredQuantity = req.units_per_scope * quantity;
            break;
          case 'per_door':
            requiredQuantity = req.units_per_scope * (cabinetType.door_count || 0) * quantity;
            break;
          case 'per_drawer':
            requiredQuantity = req.units_per_scope * (cabinetType.drawer_count || 0) * quantity;
            break;
        }
        
        totalCost += requiredQuantity * option.hardware_product.cost_per_unit;
      }
    });

    return totalCost;
  } catch (error) {
    console.error('Error calculating hardware cost:', error);
    return 0;
  }
}

export async function loadHardwareRequirementsWithOptions(cabinetTypeId: string) {
  try {
    const [requirementsRes, optionsRes] = await Promise.all([
      supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(*)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true),
      
      supabase
        .from('cabinet_hardware_options')
        .select(`
          *,
          hardware_product:hardware_products(*),
          hardware_brand:hardware_brands(*)
        `)
        .eq('active', true)
    ]);

    return {
      requirements: requirementsRes.data || [],
      options: optionsRes.data || []
    };
  } catch (error) {
    console.error('Error loading hardware data:', error);
    return { requirements: [], options: [] };
  }
}