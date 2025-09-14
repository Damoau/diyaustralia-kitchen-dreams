import { CabinetConfiguration, CabinetPart, PartCutlist, CabinetCutlist, GlobalSettings } from '@/types/cabinet';

export interface PricingSettings {
  hmrRate: number;
  hardwareBaseCost: number;
  gstRate: number;
  wastageFactor: number;
}

export function parseGlobalSettings(settings: GlobalSettings[]): PricingSettings {
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.setting_key] = parseFloat(setting.setting_value);
    return acc;
  }, {} as Record<string, number>);

  return {
    hmrRate: settingsMap.hmr_rate_per_sqm,
    hardwareBaseCost: settingsMap.hardware_base_cost || 0,
    gstRate: settingsMap.gst_rate || 0.1,
    wastageFactor: settingsMap.wastage_factor || 0.05,
  };
}

export function calculatePartDimensions(
  part: CabinetPart,
  width: number,
  height: number,
  depth: number
): { width: number; height: number } {
  const getDimension = (formula: string | null | undefined): number => {
    switch (formula) {
      case 'width': return width;
      case 'height': return height;
      case 'depth': return depth;
      default: return 0;
    }
  };

  return {
    width: getDimension(part.width_formula),
    height: getDimension(part.height_formula),
  };
}

export function generateCutlist(
  configuration: CabinetConfiguration,
  cabinetParts: CabinetPart[],
  settings: PricingSettings,
  hardwareRequirements?: any[],
  hardwareOptions?: any[]
): CabinetCutlist {
  const { width, height, depth, quantity, cabinetType } = configuration;
  
  const parts: PartCutlist[] = cabinetParts.map(part => {
    const dimensions = calculatePartDimensions(part, width, height, depth);
    const area = (dimensions.width / 1000) * (dimensions.height / 1000); // Convert mm to m²
    
    return {
      partName: part.part_name,
      width: dimensions.width,
      height: dimensions.height,
      quantity: part.quantity * quantity,
      area: area * part.quantity * quantity,
      isDoor: part.is_door,
      isHardware: part.is_hardware,
    };
  });

  // Calculate costs using your specific formula
  const carcassCost = calculateCarcassCost(width, height, depth, parts, settings, quantity);
  const doorCost = calculateDoorCost(width, height, parts, configuration, settings, quantity);
  
  // Hardware cost - calculate based on door/drawer count and selected brand
  let hardwareCost = 0;
  if (configuration.hardwareBrand && hardwareRequirements && hardwareOptions) {
    const doorCount = cabinetType.door_count || 0;
    const drawerCount = cabinetType.drawer_count || 0;
    
    hardwareRequirements.forEach(req => {
      const option = hardwareOptions.find(opt => 
        opt.requirement_id === req.id && 
        opt.hardware_brand_id === configuration.hardwareBrand?.id
      );
      
      if (option && option.hardware_product) {
        let requiredQuantity = 0;
        switch (req.unit_scope) {
          case 'per_cabinet':
            requiredQuantity = req.units_per_scope * quantity;
            break;
          case 'per_door':
            requiredQuantity = req.units_per_scope * doorCount * quantity;
            break;
          case 'per_drawer':
            requiredQuantity = req.units_per_scope * drawerCount * quantity;
            break;
        }
        hardwareCost += requiredQuantity * option.hardware_product.cost_per_unit;
      }
    });
  } else {
    // Fallback to base hardware cost calculation
    const hardwareQuantity = parts.filter(p => p.isHardware).reduce((sum, part) => sum + part.quantity, 0);
    hardwareCost = hardwareQuantity * settings.hardwareBaseCost;
  }

  // Total cost (no wastage applied)
  const subtotal = carcassCost + doorCost + hardwareCost;
  const totalCost = subtotal * (1 + settings.gstRate);

  return {
    configuration,
    parts,
    carcassCost,
    doorCost,
    hardwareCost,
    totalCost,
  };
}

// Calculate carcass cost using your specific formula
function calculateCarcassCost(
  width: number, 
  height: number, 
  depth: number, 
  parts: PartCutlist[], 
  settings: PricingSettings, 
  quantity: number
): number {
  // Get quantities for each part type
  const backParts = parts.filter(p => p.partName.toLowerCase().includes('back') && !p.isDoor);
  const bottomParts = parts.filter(p => p.partName.toLowerCase().includes('bottom') && !p.isDoor);
  const sideParts = parts.filter(p => p.partName.toLowerCase().includes('side') && !p.isDoor);
  
  const qtyBacks = backParts.reduce((sum, part) => sum + part.quantity, 0);
  const qtyBottoms = bottomParts.reduce((sum, part) => sum + part.quantity, 0);
  const qtySides = sideParts.reduce((sum, part) => sum + part.quantity, 0);
  
  // Convert dimensions to meters
  const widthM = width / 1000;
  const heightM = height / 1000;
  const depthM = depth / 1000;
  
  // Apply your formula:
  // (Width/1000 * height/1000) * Qty of back parts * HMR Price +
  // (Width/1000 * Depth/1000) * Qty Bottoms * HMR Price +
  // (Width/1000 * Depth/1000) * Qty sides * HMR Price
  
  const backCost = (widthM * heightM) * qtyBacks * settings.hmrRate;
  const bottomCost = (widthM * depthM) * qtyBottoms * settings.hmrRate;
  const sideCost = (widthM * depthM) * qtySides * settings.hmrRate;
  
  const totalCarcassCost = backCost + bottomCost + sideCost;
  
  // Return without wastage factor
  return totalCarcassCost;
}

// Calculate door cost using your specific formula
function calculateDoorCost(
  width: number, 
  height: number, 
  parts: PartCutlist[], 
  configuration: CabinetConfiguration, 
  settings: PricingSettings, 
  quantity: number
): number {
  // Get door parts
  const doorParts = parts.filter(p => p.isDoor);
  const qtyDoors = doorParts.reduce((sum, part) => sum + part.quantity, 0);
  
  // Convert dimensions to meters
  const widthM = width / 1000;
  const heightM = height / 1000;
  
  // Apply your formula: (Width/1000 * height/1000) * Qty of door parts * door price
  const finishRate = configuration.finish?.rate_per_sqm || 0;
  const doorStyleRate = configuration.doorStyle?.base_rate_per_sqm || 0;
  const colorSurcharge = 0; // Color surcharge will be handled separately if needed
  const totalDoorRate = finishRate + doorStyleRate + colorSurcharge;
  
  const doorCost = (widthM * heightM) * qtyDoors * totalDoorRate;
  
  // Return without wastage factor
  return doorCost;
}

export function formatPrice(price: number): string {
  // Round to nearest dollar
  const roundedPrice = Math.round(price);
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedPrice);
}

export function exportToCsv(cutlists: CabinetCutlist[]): string {
  const headers = [
    'Cabinet Type',
    'Dimensions (W×H×D)',
    'Quantity',
    'Part Name',
    'Part Width (mm)',
    'Part Height (mm)',
    'Part Quantity',
    'Part Area (m²)',
    'Type',
    'Unit Cost',
    'Total Cost'
  ];

  const rows = cutlists.flatMap(cutlist => 
    cutlist.parts.map(part => [
      cutlist.configuration.cabinetType.name,
      `${cutlist.configuration.width}×${cutlist.configuration.height}×${cutlist.configuration.depth}`,
      cutlist.configuration.quantity.toString(),
      part.partName,
      part.width.toString(),
      part.height.toString(),
      part.quantity.toString(),
      part.area.toFixed(4),
      part.isDoor ? 'Door' : part.isHardware ? 'Hardware' : 'Carcass',
      formatPrice(cutlist.totalCost / cutlist.configuration.quantity),
      formatPrice(cutlist.totalCost)
    ])
  );

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}