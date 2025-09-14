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
    // Use custom quantity of 1 for doors as requested
    const doorQty = 1;
    
    console.log('🔧 DOOR QUANTITY CALCULATION (Custom qty=1):', {
      cabinetName: cabinetType.name,
      customDoorQty: doorQty
    });
    
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

    console.log('PricingService.calculatePrice called with:', {
      cabinetType: cabinetType.name,
      dimensions: { width, height, depth },
      doorStyle: doorStyle?.name,
      color: color?.name,
      quantity,
      hardwareBrandId,
      hardwareRequirementsCount: hardwareRequirements?.length || 0,
      hardwareOptionsCount: hardwareOptions?.length || 0
    });

    const quantities = this.calculatePartQuantities(cabinetParts, cabinetType);
    const settings = this.parseGlobalSettings(globalSettings);

    // Calculate carcass costs - NO wastage factor to match breakdown display
    const carcassArea = {
      backs: (width * height / 1000000) * quantities.backs,
      bottoms: (width * depth / 1000000) * quantities.bottoms,
      sides: (height * depth / 1000000) * quantities.sides
    };

    const carcassCosts = {
      backs: carcassArea.backs * settings.hmrRate,
      bottoms: carcassArea.bottoms * settings.hmrRate,
      sides: carcassArea.sides * settings.hmrRate,
      total: 0
    };
    carcassCosts.total = carcassCosts.backs + carcassCosts.bottoms + carcassCosts.sides;

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
      doorCosts.total = doorCosts.area * doorCosts.totalRate;
    }

    // Hardware cost - use fixed $10 as per user formula
    const hardwareCost = 10;

    // Calculate totals
    const subtotal = (carcassCosts.total + doorCosts.total) * quantity + hardwareCost;
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

    console.log('🧮 DETAILED PRICE BREAKDOWN FOR $2,767:', {
      cabinetName: cabinetType.name,
      dimensions: { width, height, depth },
      doorStyle: doorStyle?.name,
      doorStyleRate: doorStyle?.base_rate_per_sqm || 0,
      color: color?.name,
      colorSurcharge: color?.surcharge_rate_per_sqm || 0,
      quantities: quantities,
      carcassArea: {
        backs: (width * height / 1000000) * quantities.backs,
        bottoms: (width * depth / 1000000) * quantities.bottoms,
        sides: (height * depth / 1000000) * quantities.sides
      },
      carcassCosts: {
        backs: carcassCosts.backs,
        bottoms: carcassCosts.bottoms,
        sides: carcassCosts.sides,
        total: carcassCosts.total
      },
      doorArea: (width * height / 1000000) * quantities.doors,
      doorCosts: {
        styleRate: doorCosts.styleRate,
        colorSurcharge: doorCosts.colorSurcharge,
        totalRate: doorCosts.totalRate,
        area: doorCosts.area,
        total: doorCosts.total
      },
      hardwareCost,
      subtotal,
      gst,
      finalTotal,
      roundedTotal: Math.round(finalTotal)
    });

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