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
    carcassComponent: number;
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
      acc[setting.setting_key] = parseFloat(setting.setting_value);
      return acc;
    }, {} as Record<string, number>);

    return {
      hmrRate: settingsMap.hmr_rate_per_sqm || 1000,
      hardwareBaseCost: settingsMap.hardware_base_cost || 45,
      gstRate: settingsMap.gst_rate || 0.1,
      wastageFactor: settingsMap.wastage_factor || 0.05,
    };
  }

  private calculatePartQuantities(cabinetParts: CabinetPart[], cabinetType: CabinetType) {
    // Try to get quantities from cabinet parts first
    const backParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('back') && !p.is_door);
    const bottomParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('bottom') && !p.is_door);
    const sideParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('side') && !p.is_door);
    const doorParts = cabinetParts.filter(p => p.is_door);

    return {
      backs: backParts.reduce((sum, part) => sum + part.quantity, 0) || cabinetType.backs_qty || 1,
      bottoms: bottomParts.reduce((sum, part) => sum + part.quantity, 0) || cabinetType.bottoms_qty || 1,
      sides: sideParts.reduce((sum, part) => sum + part.quantity, 0) || cabinetType.sides_qty || 2,
      doors: doorParts.reduce((sum, part) => sum + part.quantity, 0) || cabinetType.door_qty || cabinetType.door_count || 0,
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
      quantity = 1
    } = params;

    const settings = this.parseGlobalSettings(globalSettings);
    const quantities = this.calculatePartQuantities(cabinetParts, cabinetType);

    // Convert to meters
    const widthM = width / 1000;
    const heightM = height / 1000;
    const depthM = depth / 1000;

    // Calculate carcass costs
    const backCost = (widthM * heightM) * quantities.backs * settings.hmrRate;
    const bottomCost = (widthM * depthM) * quantities.bottoms * settings.hmrRate;
    const sideCost = (depthM * heightM) * quantities.sides * settings.hmrRate;
    const carcassTotal = backCost + bottomCost + sideCost;

    // Calculate door costs
    const doorStyleBaseRate = doorStyle?.base_rate_per_sqm || 0;
    const doorStyleFinishRate = 0; // Not using separate finish rate anymore
    const colorSurcharge = color?.surcharge_rate_per_sqm || 0;
    const carcassMaterialRate = settings.hmrRate * 0.2; // 20% of HMR rate as carcass component
    const totalDoorRate = doorStyleBaseRate + doorStyleFinishRate + colorSurcharge + carcassMaterialRate;
    const doorArea = (widthM * heightM) * quantities.doors;
    const doorCost = doorArea * totalDoorRate;

    // Hardware cost
    const hardwareCost = settings.hardwareBaseCost;

    // Calculate totals
    const subtotal = (carcassTotal + doorCost + hardwareCost) * quantity;
    const gst = subtotal * settings.gstRate;
    const finalTotal = subtotal + gst;

    // Store breakdown for debugging
    this.lastBreakdown = {
      carcassCosts: {
        backs: backCost * quantity,
        bottoms: bottomCost * quantity,
        sides: sideCost * quantity,
        total: carcassTotal * quantity,
      },
      doorCosts: {
        styleRate: doorStyleBaseRate,
        finishRate: doorStyleFinishRate,
        colorSurcharge,
        carcassComponent: carcassMaterialRate,
        totalRate: totalDoorRate,
        area: doorArea,
        total: doorCost * quantity,
      },
      hardwareCost: hardwareCost * quantity,
      subtotal,
      gst,
      finalTotal,
      dimensions: { width, height, depth },
      quantities,
    };

    return Math.round(finalTotal);
  }

  generateTableData(params: PriceTableParams) {
    const { cabinetType, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes } = params;
    
    const tableData = {
      cabinetType: cabinetType.name,
      sizes: priceRanges.map((range: any) => {
        const width = range.min_width_mm;
        
        const prices = cabinetTypeFinishes.map((finish: any) => {
          const doorStyle = finish.door_style || { base_rate_per_sqm: 0 };
          const color = finish.color || { surcharge_rate_per_sqm: 0 };
          
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
          range: range.label,
          prices,
          width
        };
      }),
      finishes: cabinetTypeFinishes.map((finish: any) => ({
        ...finish,
        displayName: finish.door_style?.name || 'Unknown Style'
      }))
    };

    return tableData;
  }

  getLastBreakdown(): PriceBreakdown | null {
    return this.lastBreakdown;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(price));
  }
}

export const pricingService = new PricingService();