/**
 * Volume Calculator for Cabinet Parts
 * 
 * This system calculates the volume of each cabinet part for checkout,
 * using weight per square meter from HMR material settings and door styles.
 */

export interface MaterialSpec {
  material_type: string;
  weight_per_sqm: number; // kg/sqm
  thickness_mm: number;
  weight_factor: number;
}

export interface DoorStyleSpec {
  name: string;
  material_density_kg_per_sqm: number;
  thickness_mm: number;
  weight_factor: number;
}

export interface CabinetPart {
  id: string;
  part_name: string;
  quantity: number;
  width_formula: string;
  height_formula: string;
  is_door: boolean;
  is_hardware: boolean;
}

export interface VolumeBreakdown {
  part_name: string;
  quantity: number;
  area_sqm: number;
  thickness_mm: number;
  volume_cubic_m: number;
  weight_kg: number;
  is_door: boolean;
}

export interface CabinetVolumeResult {
  cabinet_name: string;
  total_volume_cubic_m: number;
  total_weight_kg: number;
  carcass_volume_cubic_m: number;
  doors_volume_cubic_m: number;
  parts_breakdown: VolumeBreakdown[];
}

/**
 * Calculate dimension from formula string
 */
function calculateDimension(formula: string | null, width: number, height: number, depth: number): number {
  if (!formula) return 0;
  
  // Replace variables in formula with actual values
  const expression = formula
    .replace(/width/g, width.toString())
    .replace(/height/g, height.toString())
    .replace(/depth/g, depth.toString())
    .replace(/w/g, width.toString())
    .replace(/h/g, height.toString())
    .replace(/d/g, depth.toString());
  
  try {
    // Simple expression evaluation (only allow basic math)
    return Function('"use strict"; return (' + expression + ')')();
  } catch {
    return 0;
  }
}

/**
 * Calculate volume for a single cabinet
 */
export function calculateCabinetVolume(
  cabinetName: string,
  width_mm: number,
  height_mm: number,
  depth_mm: number,
  quantity: number,
  parts: CabinetPart[],
  hmrMaterial: MaterialSpec,
  doorStyle?: DoorStyleSpec
): CabinetVolumeResult {
  
  const partsBreakdown: VolumeBreakdown[] = [];
  let totalVolumeSum = 0;
  let totalWeightSum = 0;
  let carcassVolumeSum = 0;
  let doorsVolumeSum = 0;

  for (const part of parts) {
    // Calculate part dimensions using formulas
    const partWidth = calculateDimension(part.width_formula, width_mm, height_mm, depth_mm);
    const partHeight = calculateDimension(part.height_formula, width_mm, height_mm, depth_mm);
    
    if (partWidth <= 0 || partHeight <= 0) continue;

    // Calculate area in square meters
    const partAreaSqm = (partWidth * partHeight) / 1000000;
    
    // Determine material specs based on part type
    let materialDensity: number;
    let thickness: number;
    let weightFactor: number;

    if (part.is_door && doorStyle) {
      // Use door style specifications
      materialDensity = doorStyle.material_density_kg_per_sqm;
      thickness = doorStyle.thickness_mm;
      weightFactor = doorStyle.weight_factor;
    } else {
      // Use HMR carcass specifications
      materialDensity = hmrMaterial.weight_per_sqm;
      thickness = hmrMaterial.thickness_mm;
      weightFactor = hmrMaterial.weight_factor;
    }

    // Calculate volume: area × thickness × quantity × weight_factor
    const partVolumePerPiece = (partAreaSqm * thickness / 1000) * weightFactor; // cubic meters
    const totalPartVolume = partVolumePerPiece * part.quantity * quantity;
    
    // Calculate weight: area × density × quantity × weight_factor
    const partWeightPerPiece = partAreaSqm * materialDensity * weightFactor;
    const totalPartWeight = partWeightPerPiece * part.quantity * quantity;

    // Add to breakdown
    partsBreakdown.push({
      part_name: part.part_name,
      quantity: part.quantity * quantity,
      area_sqm: partAreaSqm,
      thickness_mm: thickness,
      volume_cubic_m: totalPartVolume,
      weight_kg: totalPartWeight,
      is_door: part.is_door
    });

    // Add to totals
    totalVolumeSum += totalPartVolume;
    totalWeightSum += totalPartWeight;
    
    if (part.is_door) {
      doorsVolumeSum += totalPartVolume;
    } else {
      carcassVolumeSum += totalPartVolume;
    }
  }

  return {
    cabinet_name: cabinetName,
    total_volume_cubic_m: totalVolumeSum,
    total_weight_kg: totalWeightSum,
    carcass_volume_cubic_m: carcassVolumeSum,
    doors_volume_cubic_m: doorsVolumeSum,
    parts_breakdown: partsBreakdown
  };
}

/**
 * Example calculation for a standard base cabinet
 */
export function generateVolumeExample(): string {
  // Example: 600mm wide × 720mm high × 560mm deep base cabinet
  const width = 600, height = 720, depth = 560, qty = 1;
  
  // Example HMR material specs (from Global Settings)
  const hmrMaterial: MaterialSpec = {
    material_type: "HMR",
    weight_per_sqm: 12.0, // kg/sqm 
    thickness_mm: 18,
    weight_factor: 1.0
  };

  // Example door style specs
  const doorStyle: DoorStyleSpec = {
    name: "Shaker",
    material_density_kg_per_sqm: 14.0,
    thickness_mm: 20,
    weight_factor: 1.0
  };

  // Example cabinet parts with current formulas converted to volume calculation
  const parts: CabinetPart[] = [
    {
      id: "1",
      part_name: "Sides",
      quantity: 2,
      width_formula: "height", // 720mm
      height_formula: "depth", // 560mm  
      is_door: false,
              is_hardware: false
    },
    {
      id: "2", 
      part_name: "Back",
      quantity: 1,
      width_formula: "width", // 600mm
      height_formula: "height", // 720mm
      is_door: false,
      is_hardware: false
    },
    {
      id: "3",
      part_name: "Bottom", 
      quantity: 1,
      width_formula: "width", // 600mm
      height_formula: "depth", // 560mm
      is_door: false,
      is_hardware: false
    },
    {
      id: "4",
      part_name: "Door",
      quantity: 1, 
      width_formula: "width", // 600mm
      height_formula: "height", // 720mm
      is_door: true,
      is_hardware: false
    }
  ];

  const result = calculateCabinetVolume(
    "Base Cabinet 600mm",
    width,
    height, 
    depth,
    qty,
    parts,
    hmrMaterial,
    doorStyle
  );

  // Format the example output
  let example = `## Volume Calculation Example\n\n`;
  example += `**Cabinet:** ${result.cabinet_name} (${width}×${height}×${depth}mm)\n\n`;
  example += `**Material Specifications:**\n`;
  example += `- HMR Carcass: ${hmrMaterial.weight_per_sqm}kg/sqm @ ${hmrMaterial.thickness_mm}mm thick\n`;
  example += `- ${doorStyle.name} Doors: ${doorStyle.material_density_kg_per_sqm}kg/sqm @ ${doorStyle.thickness_mm}mm thick\n\n`;
  
  example += `**Volume Breakdown:**\n`;
  result.parts_breakdown.forEach(part => {
    example += `- ${part.part_name} (×${part.quantity}): ${part.area_sqm.toFixed(4)}sqm × ${part.thickness_mm}mm = ${part.volume_cubic_m.toFixed(6)}m³ (${part.weight_kg.toFixed(2)}kg)\n`;
  });
  
  example += `\n**Totals:**\n`;
  example += `- Carcass Volume: ${result.carcass_volume_cubic_m.toFixed(6)}m³\n`;
  example += `- Doors Volume: ${result.doors_volume_cubic_m.toFixed(6)}m³\n`;
  example += `- **Total Volume: ${result.total_volume_cubic_m.toFixed(6)}m³**\n`;
  example += `- **Total Weight: ${result.total_weight_kg.toFixed(2)}kg**\n\n`;
  
  example += `**In Checkout:**\n`;
  example += `This volume (${result.total_volume_cubic_m.toFixed(6)}m³) and weight (${result.total_weight_kg.toFixed(2)}kg) would be used for:\n`;
  example += `- Shipping calculations\n`;
  example += `- Material optimization\n`;
  example += `- Packaging requirements\n`;
  example += `- Freight quotes\n`;

  return example;
}