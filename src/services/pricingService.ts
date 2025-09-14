import { CabinetType, CabinetPart, GlobalSettings } from '@/types/cabinet';

interface PriceCalculationParams {
  cabinetType: CabinetType;
  width: number;
  height: number;
  depth: number;
  cabinetParts: CabinetPart[];
  globalSettings: GlobalSettings[];
  doorStyle?: any;
  color?: any;
  quantity?: number;
  hardwareBrandId?: string;
  hardwareRequirements?: any[];
  hardwareOptions?: any[];
}

interface PriceTableParams {
  cabinetType: CabinetType;
  cabinetParts: CabinetPart[];
  globalSettings: GlobalSettings[];
  priceRanges: any[];
  cabinetTypeFinishes: any[];
}

interface PriceBreakdown {
  carcassCosts: {
    backs: number;
    bottoms: number;
    sides: number;
    total: number;
  };
  doorCosts: {
    styleRate: number;
    finishRate: number;
    colorSurcharge: number;
    totalRate: number;
    area: number;
    total: number;
  };
  hardwareCost: number;
  subtotal: number;
  gst: number;
  finalTotal: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  quantities: {
    backs: number;
    bottoms: number;
    sides: number;
    doors: number;
  };
}

class PricingService {
  private lastBreakdown: PriceBreakdown | null = null;

  private parseGlobalSettings(settings: GlobalSettings[]) {
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = parseFloat(setting.setting_value) || 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      hmrRate: settingsMap['hmr_rate_per_sqm'],
      gstRate: settingsMap['gst_rate'] || 0.1,
      wastageFactor: settingsMap['wastage_factor'] || 1.1,
      hardwareBaseCost: settingsMap['hardware_base_cost'] || 0
    };
  }

  private calculatePartQuantities(cabinetParts: CabinetPart[], cabinetType: CabinetType) {
    // Use admin-set door quantities to match expectations
    const doorQty = cabinetType.door_qty || cabinetType.door_count || 0;
    console.log('PricingService door quantity:', doorQty, 'from cabinet type:', cabinetType.name);
    
    return {
      backs: cabinetType.backs_qty || 1,
      bottoms: cabinetType.bottoms_qty || 1,
      sides: cabinetType.sides_qty || 2,
      doors: doorQty
    };
  }

  calculatePrice(params: PriceCalculationParams): number {
    const {
      cabinetType,
      width,
      height,
      depth,
      cabinetParts,
      globalSettings,
      doorStyle,
      color,
      quantity = 1,
      hardwareBrandId,
      hardwareRequirements = [],
      hardwareOptions = []
    } = params;

    const settings = this.parseGlobalSettings(globalSettings);
    const quantities = this.calculatePartQuantities(cabinetParts, cabinetType);

    // Calculate carcass costs - NO wastage factor to match breakdown display
    const carcassArea = {
      backs: (width * height / 1000000) * quantities.backs,
      bottoms: (width * depth / 1000000) * quantities.bottoms,
      sides: (height * depth / 1000000) * quantities.sides // Fixed: was using width * depth, should be height * depth
    };

    const carcassCosts = {
      backs: carcassArea.backs * settings.hmrRate, // No wastage factor
      bottoms: carcassArea.bottoms * settings.hmrRate, // No wastage factor  
      sides: carcassArea.sides * settings.hmrRate, // No wastage factor
      total: 0
    };
    carcassCosts.total = carcassCosts.backs + carcassCosts.bottoms + carcassCosts.sides;
    
    console.log('Carcass calculation:', {
      dimensions: { width, height, depth },
      quantities,
      areas: carcassArea,
      costs: carcassCosts,
      hmrRate: settings.hmrRate
    });

    // Calculate door costs
    let doorCosts = {
      styleRate: doorStyle?.base_rate_per_sqm || 0,
      finishRate: 0,
      colorSurcharge: color?.surcharge_rate_per_sqm || 0,
      totalRate: 0,
      area: 0,
      total: 0
    };

    if (quantities.doors > 0) {
      doorCosts.area = (width * height / 1000000) * quantities.doors;
      doorCosts.totalRate = doorCosts.styleRate + doorCosts.finishRate + doorCosts.colorSurcharge;
      doorCosts.total = doorCosts.area * doorCosts.totalRate; // No wastage factor
      
      console.log('Door calculation:', {
        doors: quantities.doors,
        area: doorCosts.area,
        rates: { styleRate: doorCosts.styleRate, finishRate: doorCosts.finishRate, colorSurcharge: doorCosts.colorSurcharge },
        totalRate: doorCosts.totalRate,
        total: doorCosts.total
      });
    }

    // Hardware cost - calculate based on admin configuration
    let hardwareCost = 0;
    if (hardwareBrandId && hardwareBrandId !== 'none' && hardwareRequirements.length > 0) {
      hardwareRequirements.forEach(requirement => {
        // Find matching option for this requirement and selected brand
        const matchingOption = hardwareOptions.find(option => 
          option.requirement_id === requirement.id && 
          option.hardware_brand_id === hardwareBrandId
        );
        
        if (matchingOption && matchingOption.hardware_product) {
          const costPerUnit = matchingOption.hardware_product.cost_per_unit || 0;
          const unitsNeeded = requirement.units_per_scope || 1;
          const requirementCost = costPerUnit * unitsNeeded * quantity;
          hardwareCost += requirementCost;
          
          console.log('Hardware calculation:', {
            requirement: requirement.hardware_type?.name,
            brand: hardwareBrandId,
            product: matchingOption.hardware_product.name,
            costPerUnit,
            unitsNeeded,
            quantity,
            requirementCost,
            totalHardwareCost: hardwareCost
          });
        }
      });
    } else {
      // No hardware selected
      hardwareCost = 0;
      console.log('No hardware selected, cost = 0');
    }

    // Calculate totals
    const subtotal = (carcassCosts.total + doorCosts.total + hardwareCost) * quantity;
    const gst = subtotal * settings.gstRate;
    const finalTotal = subtotal + gst;

    // Store breakdown for later retrieval
    this.lastBreakdown = {
      carcassCosts,
      doorCosts,
      hardwareCost,
      subtotal,
      gst,
      finalTotal,
      dimensions: { width, height, depth },
      quantities
    };

    return Math.round(finalTotal);
  }

  generateTableData(params: PriceTableParams) {
    const { cabinetType, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes } = params;

    // Use price ranges or generate default ones
    const ranges = priceRanges.length > 0 ? priceRanges : [
      { id: 'default-1', label: '300-400mm', min_width_mm: 300, max_width_mm: 400 },
      { id: 'default-2', label: '400-500mm', min_width_mm: 400, max_width_mm: 500 },
      { id: 'default-3', label: '500-600mm', min_width_mm: 500, max_width_mm: 600 }
    ];

    const priceRangeData = ranges.map(range => {
      const width = range.min_width_mm;
      
      const prices = cabinetTypeFinishes.map(finish => {
        const doorStyle = finish.door_style;
        const color = finish.color;
        
        return this.calculatePrice({
          cabinetType,
          width,
          height: cabinetType.default_height_mm,
          depth: cabinetType.default_depth_mm,
          cabinetParts,
          globalSettings,
          doorStyle,
          color,
          quantity: 1
        });
      });

      return {
        id: range.id,
        label: range.label,
        prices
      };
    });

    return {
      priceRanges: priceRangeData,
      finishes: cabinetTypeFinishes
    };
  }

  getLastBreakdown(): PriceBreakdown | null {
    return this.lastBreakdown;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}

export const pricingService = new PricingService();