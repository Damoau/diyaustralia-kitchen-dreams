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
    hmrRate: settingsMap.hmr_rate_per_sqm || 85,
    hardwareBaseCost: settingsMap.hardware_base_cost || 45,
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
  settings: PricingSettings
): CabinetCutlist {
  const { width, height, depth, quantity } = configuration;
  
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

  // Calculate costs
  const carcassParts = parts.filter(p => !p.isDoor && !p.isHardware);
  const doorParts = parts.filter(p => p.isDoor);
  const hardwareParts = parts.filter(p => p.isHardware);

  // Carcass cost (HMR rate)
  const carcassArea = carcassParts.reduce((sum, part) => sum + part.area, 0);
  const carcassCostBeforeWastage = carcassArea * settings.hmrRate;
  const carcassCost = carcassCostBeforeWastage * (1 + settings.wastageFactor);

  // Door cost (finish rate + door style rate)
  const doorArea = doorParts.reduce((sum, part) => sum + part.area, 0);
  const finishRate = configuration.finish?.rate_per_sqm || 0;
  const doorStyleRate = configuration.doorStyle?.base_rate_per_sqm || 0;
  const doorCostBeforeWastage = doorArea * (finishRate + doorStyleRate);
  const doorCost = doorCostBeforeWastage * (1 + settings.wastageFactor);

  // Hardware cost
  const hardwareQuantity = hardwareParts.reduce((sum, part) => sum + part.quantity, 0);
  const hardwareCost = hardwareQuantity * settings.hardwareBaseCost;

  // Total cost (excluding GST for now)
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

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(price);
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