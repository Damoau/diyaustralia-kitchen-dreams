import { supabase } from '@/integrations/supabase/client';

interface HardwareSetItem {
  hardware_product_id: string;
  quantity: number;
  hardware_products: {
    name: string;
    cost_per_unit: number;
  };
}

interface HardwareSet {
  id: string;
  hardware_brand_id: string;
  category: string;
  set_name: string;
  is_default: boolean;
  hardware_brands: { name: string };
  hardware_set_items: HardwareSetItem[];
}

interface HardwarePricingResult {
  baseCost: number;
  markedUpCost: number;
  finalCost: number;
  markup: number;
  discount: number;
  quantity: number;
  setName: string;
  brandName: string;
}

export class HardwarePricingCalculator {
  private static hardwareSets: HardwareSet[] | null = null;
  private static pricingSettings: any = null;

  // Initialize hardware data
  static async initialize() {
    if (!this.hardwareSets || !this.pricingSettings) {
      await Promise.all([
        this.loadHardwareSets(),
        this.loadPricingSettings()
      ]);
    }
  }

  private static async loadHardwareSets() {
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
    this.hardwareSets = data as any[];
  }

  private static async loadPricingSettings() {
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
    
    const settings: any = {
      hardware_markup_percentage: 35,
      hardware_discount_percentage: 0,
    };
    
    data.forEach(item => {
      if (item.setting_key === 'hardware_markup_percentage' || item.setting_key === 'hardware_discount_percentage') {
        settings[item.setting_key] = parseFloat(item.setting_value) || 0;
      } else {
        settings[item.setting_key] = item.setting_value;
      }
    });
    
    this.pricingSettings = settings;
  }

  // Get default hardware set for category
  static getDefaultHardwareSet(category: 'hinge' | 'runner'): HardwareSet | null {
    if (!this.hardwareSets) return null;
    
    // First check configured defaults
    const defaultSetId = category === 'hinge' 
      ? this.pricingSettings?.default_hinge_set_id 
      : this.pricingSettings?.default_runner_set_id;
    
    if (defaultSetId) {
      const configuredDefault = this.hardwareSets.find(set => set.id === defaultSetId);
      if (configuredDefault) return configuredDefault;
    }
    
    // Fallback to is_default flag
    const defaultSet = this.hardwareSets.find(set => set.category === category && set.is_default);
    if (defaultSet) return defaultSet;
    
    // Final fallback to first set in category
    return this.hardwareSets.find(set => set.category === category) || null;
  }

  // Calculate hardware set cost with markup and discount
  static calculateSetCost(hardwareSet: HardwareSet, quantity: number = 1): HardwarePricingResult {
    const baseCost = hardwareSet.hardware_set_items.reduce((total, item) => {
      return total + (item.hardware_products.cost_per_unit * item.quantity);
    }, 0);
    
    const markup = this.pricingSettings?.hardware_markup_percentage || 35;
    const discount = this.pricingSettings?.hardware_discount_percentage || 0;
    
    const markedUpCost = baseCost * (1 + markup / 100);
    const finalCost = markedUpCost * (1 - discount / 100);
    
    return {
      baseCost: baseCost * quantity,
      markedUpCost: markedUpCost * quantity,
      finalCost: finalCost * quantity,
      markup,
      discount,
      quantity,
      setName: hardwareSet.set_name,
      brandName: hardwareSet.hardware_brands.name
    };
  }

  // Calculate total hardware cost for a cabinet
  static async calculateCabinetHardware(
    cabinetType: any,
    selectedHardware: { [category: string]: string } = {},
    quantity: number = 1
  ): Promise<{
    totalCost: number;
    breakdown: { [category: string]: HardwarePricingResult };
  }> {
    await this.initialize();
    
    let totalCost = 0;
    const breakdown: { [category: string]: HardwarePricingResult } = {};

    // Calculate for hinges
    if (cabinetType.door_qty > 0 || cabinetType.door_count > 0) {
      const hingeSetId = selectedHardware['hinge'];
      let hingeSet: HardwareSet | null = null;

      if (hingeSetId && this.hardwareSets) {
        hingeSet = this.hardwareSets.find(set => set.id === hingeSetId) || null;
      }
      
      if (!hingeSet) {
        hingeSet = this.getDefaultHardwareSet('hinge');
      }

      if (hingeSet) {
        const doorCount = Math.max(cabinetType.door_qty || cabinetType.door_count || 1, 1);
        const hingeQuantity = doorCount * quantity;
        const hingeCost = this.calculateSetCost(hingeSet, hingeQuantity);
        
        breakdown['hinge'] = hingeCost;
        totalCost += hingeCost.finalCost;
      }
    }

    // Calculate for runners (if cabinet has drawers)
    if (cabinetType.drawer_count > 0) {
      const runnerSetId = selectedHardware['runner'];
      let runnerSet: HardwareSet | null = null;

      if (runnerSetId && this.hardwareSets) {
        runnerSet = this.hardwareSets.find(set => set.id === runnerSetId) || null;
      }
      
      if (!runnerSet) {
        runnerSet = this.getDefaultHardwareSet('runner');
      }

      if (runnerSet) {
        const drawerCount = cabinetType.drawer_count;
        const runnerQuantity = drawerCount * quantity;
        const runnerCost = this.calculateSetCost(runnerSet, runnerQuantity);
        
        breakdown['runner'] = runnerCost;
        totalCost += runnerCost.finalCost;
      }
    }

    return {
      totalCost,
      breakdown
    };
  }

  // Get available hardware options for a category
  static getHardwareOptions(category: 'hinge' | 'runner') {
    if (!this.hardwareSets) return [];
    
    return this.hardwareSets
      .filter(set => set.category === category)
      .map(set => ({
        id: set.id,
        name: `${set.hardware_brands.name} - ${set.set_name}`,
        brandName: set.hardware_brands.name,
        setName: set.set_name,
        isDefault: set.is_default,
        baseCost: set.hardware_set_items.reduce((total, item) => {
          return total + (item.hardware_products.cost_per_unit * item.quantity);
        }, 0)
      }))
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      });
  }
}