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
  
  // Get part quantities from cabinet type or parts data or defaults
  let qtyBacks = cabinetType.backs_qty || 1;
  let qtyBottoms = cabinetType.bottoms_qty || 1; 
  let qtySides = cabinetType.sides_qty || 2;
  let qtyDoors = cabinetType.door_qty || 0;
  
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
  const colorSurcharge = color?.surcharge_rate_per_sqm || 0;
  const totalDoorRate = finishRate + doorStyleRate + colorSurcharge;
  const doorCost = (widthM * heightM) * qtyDoors * totalDoorRate;
  
  // Sum all costs
  const subtotal = backCost + bottomCost + sideCost + doorCost + hardwareCost;
  
  // Apply wastage factor and GST
  const subtotalWithWastage = subtotal * (1 + settings.wastageFactor);
  const totalCost = subtotalWithWastage * (1 + settings.gstRate);
  
  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
}

// Generate price data for the static price tables using database-driven ranges and finishes
export async function generatePriceTableData(
  cabinetTypes: CabinetType[],
  cabinetParts: CabinetPart[],
  globalSettings: GlobalSettings[],
  priceRanges: any[],
  cabinetTypeFinishes: any[],
  hardwareCost: number = 45
) {
  const { supabase } = await import("@/integrations/supabase/client");
  const priceData: any = {};
  
  for (const cabinetType of cabinetTypes) {
    // Get price ranges for this cabinet type
    const typeRanges = priceRanges
      .filter(range => range.cabinet_type_id === cabinetType.id && range.active)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    // Get finishes for this cabinet type
    const typeFinishes = cabinetTypeFinishes
      .filter(ctf => ctf.cabinet_type_id === cabinetType.id && ctf.active)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    if (typeRanges.length === 0 || typeFinishes.length === 0) {
      continue; // Skip cabinet types without configured ranges or finishes
    }
    
    priceData[cabinetType.name] = {
      name: cabinetType.name,
      sizes: typeRanges.map(range => {
        const width = range.min_width_mm; // Use minimum width for pricing calculation
        const prices = typeFinishes.map(ctf => {
          const relevantParts = cabinetParts.filter(p => p.cabinet_type_id === cabinetType.id);
          
          return calculateCabinetPrice(
            cabinetType,
            width,
            cabinetType.default_height_mm,
            cabinetType.default_depth_mm,
            ctf.finish,
            ctf.door_style,
            ctf.color, // Now include color in calculation
            relevantParts,
            globalSettings,
            hardwareCost
          );
        });
        
        return {
          range: range.label,
          price: prices
        };
      })
    };
  }
  
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