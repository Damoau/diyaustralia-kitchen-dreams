import { CabinetType, CabinetPart, Finish, DoorStyle, Color, GlobalSettings } from '@/types/cabinet';
import { PricingSettings, parseGlobalSettings } from './pricing';

// Calculate dynamic cabinet price using your specific formula
export function calculateCabinetPrice(
  cabinetType: CabinetType,
  width: number,
  height: number = 720,
  depth: number = 560,
  finish: Finish,
  doorStyle?: DoorStyle,
  color?: Color,
  cabinetParts: CabinetPart[] = [],
  globalSettings: GlobalSettings[] = [],
  hardwareCost: number = 0
): number {
  const settings = parseGlobalSettings(globalSettings);
  
  // Get part quantities from cabinet parts or use defaults
  let qtyBacks = 1;
  let qtyBottoms = 1; 
  let qtySides = 2;
  let qtyDoors = cabinetType.door_count || 0;
  
  // If we have cabinet parts data, use actual quantities
  if (cabinetParts.length > 0) {
    const backParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('back') && !p.is_door);
    const bottomParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('bottom') && !p.is_door);  
    const sideParts = cabinetParts.filter(p => p.part_name.toLowerCase().includes('side') && !p.is_door);
    const doorParts = cabinetParts.filter(p => p.is_door);
    
    qtyBacks = backParts.reduce((sum, part) => sum + part.quantity, qtyBacks);
    qtyBottoms = bottomParts.reduce((sum, part) => sum + part.quantity, qtyBottoms);
    qtySides = sideParts.reduce((sum, part) => sum + part.quantity, qtySides);
    qtyDoors = doorParts.reduce((sum, part) => sum + part.quantity, qtyDoors);
  }
  
  // Convert dimensions to meters
  const widthM = width / 1000;
  const heightM = height / 1000;
  const depthM = depth / 1000;
  
  // Apply your formula:
  // (Width/1000 * height/1000) * Qty of back parts * HMR Price
  const backCost = (widthM * heightM) * qtyBacks * settings.hmrRate;
  
  // (Width/1000 * Depth/1000) * Qty Bottoms * HMR Price  
  const bottomCost = (widthM * depthM) * qtyBottoms * settings.hmrRate;
  
  // (Width/1000 * Depth/1000) * Qty sides * HMR Price
  const sideCost = (widthM * depthM) * qtySides * settings.hmrRate;
  
  // (Width/1000 * height/1000) * Qty of door parts * door price Price
  const finishRate = finish.rate_per_sqm || 0;
  const doorStyleRate = doorStyle?.base_rate_per_sqm || 0;
  const colorSurcharge = 0; // Color surcharge will be handled separately if needed
  const totalDoorRate = finishRate + doorStyleRate + colorSurcharge;
  const doorCost = (widthM * heightM) * qtyDoors * totalDoorRate;
  
  // Sum all costs
  const subtotal = backCost + bottomCost + sideCost + doorCost + hardwareCost;
  
  // Apply wastage factor and GST
  const subtotalWithWastage = subtotal * (1 + settings.wastageFactor);
  const totalCost = subtotalWithWastage * (1 + settings.gstRate);
  
  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
}

// Generate price data for the static price tables
export function generatePriceTableData(
  cabinetTypes: CabinetType[],
  finishes: Finish[],
  doorStyles: DoorStyle[],
  colors: Color[],
  cabinetParts: CabinetPart[],
  globalSettings: GlobalSettings[]
) {
  const priceData: any = {};
  
  cabinetTypes.forEach(cabinetType => {
    const widthRanges = getWidthRangesForCabinet(cabinetType);
    
    priceData[cabinetType.name] = {
      name: cabinetType.name,
      sizes: widthRanges.map(range => {
        const width = range.minWidth;
        const prices = finishes.map(finish => {
          // Use first door style if available
          const doorStyle = doorStyles[0];
          // Use first color if available  
          const color = colors.find(c => c.door_style_id === doorStyle?.id);
          
          const relevantParts = cabinetParts.filter(p => p.cabinet_type_id === cabinetType.id);
          
          return calculateCabinetPrice(
            cabinetType,
            width,
            cabinetType.default_height_mm,
            cabinetType.default_depth_mm,
            finish,
            doorStyle,
            color,
            relevantParts,
            globalSettings,
            45 // default hardware cost
          );
        });
        
        return {
          range: range.label,
          price: prices
        };
      })
    };
  });
  
  return priceData;
}

// Get width ranges based on cabinet type
function getWidthRangesForCabinet(cabinetType: CabinetType) {
  // Define ranges based on cabinet category
  if (cabinetType.category === 'base') {
    if (cabinetType.name.includes('1 Door') || cabinetType.name.includes('1door')) {
      return [
        { label: "150-199mm", minWidth: 150, maxWidth: 199 },
        { label: "200-249mm", minWidth: 200, maxWidth: 249 },
        { label: "250-299mm", minWidth: 250, maxWidth: 299 },
        { label: "300-349mm", minWidth: 300, maxWidth: 349 },
        { label: "350-399mm", minWidth: 350, maxWidth: 399 },
        { label: "400-449mm", minWidth: 400, maxWidth: 449 },
        { label: "450-499mm", minWidth: 450, maxWidth: 499 },
        { label: "500-549mm", minWidth: 500, maxWidth: 549 },
        { label: "550-599mm", minWidth: 550, maxWidth: 599 },
        { label: "600mm", minWidth: 600, maxWidth: 600 }
      ];
    } else if (cabinetType.name.includes('2 Door') || cabinetType.name.includes('2door')) {
      return [
        { label: "400-449mm", minWidth: 400, maxWidth: 449 },
        { label: "450-499mm", minWidth: 450, maxWidth: 499 },
        { label: "500-549mm", minWidth: 500, maxWidth: 549 },
        { label: "600-649mm", minWidth: 600, maxWidth: 649 },
        { label: "700-749mm", minWidth: 700, maxWidth: 749 },
        { label: "800-849mm", minWidth: 800, maxWidth: 849 },
        { label: "900-949mm", minWidth: 900, maxWidth: 949 },
        { label: "1000-1049mm", minWidth: 1000, maxWidth: 1049 },
        { label: "1200mm", minWidth: 1200, maxWidth: 1200 }
      ];
    } else if (cabinetType.name.includes('Drawer') || cabinetType.name.includes('drawer')) {
      return [
        { label: "600-800mm", minWidth: 600, maxWidth: 800 },
        { label: "800-1000mm", minWidth: 800, maxWidth: 1000 },
        { label: "1000-1200mm", minWidth: 1000, maxWidth: 1200 }
      ];
    }
  }
  
  // Default ranges
  return [
    { label: "300-600mm", minWidth: 300, maxWidth: 600 },
    { label: "600-900mm", minWidth: 600, maxWidth: 900 },
    { label: "900-1200mm", minWidth: 900, maxWidth: 1200 }
  ];
}