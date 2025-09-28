import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HardwareSet {
  id: string;
  hardware_brand_id: string;
  category: string;
  set_name: string;
  is_default: boolean;
  hardware_brands: { name: string };
  hardware_set_items: Array<{
    hardware_product_id: string;
    quantity: number;
    hardware_products: {
      name: string;
      cost_per_unit: number;
    };
  }>;
}

interface HardwarePricingSettings {
  hardware_markup_percentage: number;
  hardware_discount_percentage: number;
  default_hinge_set_id?: string;
  default_runner_set_id?: string;
}

export const useHardwarePricing = () => {
  // Fetch hardware sets
  const { data: hardwareSets } = useQuery({
    queryKey: ['hardware-sets-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware_brand_sets')
        .select(`
          *,
          hardware_brands (name),
          hardware_set_items (
            *,
            hardware_products (
              name,
              cost_per_unit
            )
          )
        `)
        .order('set_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch hardware pricing settings
  const { data: pricingSettings } = useQuery({
    queryKey: ['hardware-pricing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'hardware_markup_percentage',
          'hardware_discount_percentage',
          'default_hinge_set_id',
          'default_runner_set_id'
        ]);
      
      if (error) throw error;
      
      const settings: HardwarePricingSettings = {
        hardware_markup_percentage: 35, // Default 35% markup
        hardware_discount_percentage: 0,
      };
      
      data.forEach(item => {
        const key = item.setting_key as keyof HardwarePricingSettings;
        if (key === 'hardware_markup_percentage' || key === 'hardware_discount_percentage') {
          settings[key] = parseFloat(item.setting_value) || 0;
        } else {
          (settings as any)[key] = item.setting_value;
        }
      });
      
      return settings;
    },
  });

  // Get default hardware sets
  const getDefaultHardwareSet = (category: 'hinge' | 'runner') => {
    if (!hardwareSets) return null;
    
    // First check if there's a configured default in settings
    const defaultSetId = category === 'hinge' 
      ? pricingSettings?.default_hinge_set_id 
      : pricingSettings?.default_runner_set_id;
    
    if (defaultSetId) {
      const configuredDefault = hardwareSets.find(set => set.id === defaultSetId);
      if (configuredDefault) return configuredDefault;
    }
    
    // Fallback to is_default flag
    return hardwareSets.find(set => set.category === category && set.is_default) || null;
  };

  // Calculate hardware set cost
  const calculateHardwareSetCost = (hardwareSet: HardwareSet, quantity: number = 1) => {
    const baseCost = hardwareSet.hardware_set_items.reduce((total, item) => {
      return total + (item.hardware_products.cost_per_unit * item.quantity);
    }, 0);
    
    const markup = pricingSettings?.hardware_markup_percentage || 35;
    const discount = pricingSettings?.hardware_discount_percentage || 0;
    
    const markedUpCost = baseCost * (1 + markup / 100);
    const finalCost = markedUpCost * (1 - discount / 100);
    
    return {
      baseCost: baseCost * quantity,
      markedUpCost: markedUpCost * quantity,
      finalCost: finalCost * quantity,
      markup,
      discount,
      quantity
    };
  };

  // Get hardware options for a category
  const getHardwareOptions = (category: 'hinge' | 'runner') => {
    if (!hardwareSets) return [];
    
    return hardwareSets
      .filter(set => set.category === category)
        .map(set => ({
          id: set.id,
          name: `${set.hardware_brands.name} - ${set.set_name}`,
          brandName: set.hardware_brands.name,
          setName: set.set_name,
          isDefault: set.is_default,
          pricing: calculateHardwareSetCost(set, 1)
        }));
  };

  // Calculate total hardware cost for cabinet configuration
  const calculateCabinetHardwareCost = (
    cabinetType: any,
    selectedHardware: { [category: string]: string },
    quantity: number = 1
  ) => {
    let totalCost = 0;
    const breakdown: { [category: string]: any } = {};

    ['hinge', 'runner'].forEach(category => {
      const selectedSetId = selectedHardware[category];
      let hardwareSet: HardwareSet | null = null;

      if (selectedSetId) {
        hardwareSet = hardwareSets?.find(set => set.id === selectedSetId) || null;
      } else {
        hardwareSet = getDefaultHardwareSet(category as 'hinge' | 'runner');
      }

      if (hardwareSet) {
        // Calculate quantity needed based on cabinet type
        let neededQuantity = quantity;
        
        if (category === 'hinge') {
          const doorCount = Math.max(cabinetType.door_qty || cabinetType.door_count || 1, 1);
          neededQuantity = doorCount * quantity;
        } else if (category === 'runner') {
          const drawerCount = cabinetType.drawer_count || 0;
          neededQuantity = drawerCount * quantity;
        }

        const setCost = calculateHardwareSetCost(hardwareSet, neededQuantity);
        breakdown[category] = {
          setName: `${hardwareSet.hardware_brands.name} - ${hardwareSet.set_name}`,
          ...setCost
        };
        totalCost += setCost.finalCost;
      }
    });

    return {
      totalCost,
      breakdown
    };
  };

  return {
    hardwareSets,
    pricingSettings,
    getDefaultHardwareSet,
    calculateHardwareSetCost,
    getHardwareOptions,
    calculateCabinetHardwareCost,
  };
};