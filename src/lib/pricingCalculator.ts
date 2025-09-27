interface PricingVariables {
  width: number;          // w - Cabinet width in mm
  height: number;         // h - Cabinet height in mm  
  depth: number;          // d - Cabinet depth in mm
  left_width?: number;    // Left side width for corner cabinets
  right_width?: number;   // Right side width for corner cabinets
  left_depth?: number;    // Left side depth for corner cabinets
  right_depth?: number;   // Right side depth for corner cabinets
  qty: number;           // Quantity
  mat_rate_per_sqm: number; // Material rate per square meter
  door_cost: number;     // Door cost per square meter
  color_cost: number;    // Color surcharge
  finish_cost: number;   // Finish cost
  left_side?: number;    // Left side thickness
  right_side?: number;   // Right side thickness
}

interface HardwareRequirement {
  id: string;
  hardware_type_id: string;
  unit_scope: string;
  units_per_scope: number;
  hardware_type?: {
    name: string;
    category: string;
  };
}

/**
 * Formula Variables Explained:
 * - w, width = Cabinet width in mm
 * - h, height = Cabinet height in mm
 * - d, depth = Cabinet depth in mm
 * - qty = Quantity of items
 * - mat_rate_per_sqm = Material cost per square meter
 * - door_cost = Door cost per square meter
 * - color_cost = Additional color cost
 * - finish_cost = Additional finish cost
 * 
 * Area calculations convert mm to meters by dividing by 1000
 * Example: (width/1000 * height/1000) gives area in square meters
 */

export class PricingCalculator {
  static evaluateFormula(formula: string, variables: PricingVariables): number {
    if (!formula || formula.trim() === '') return 0;
    
    try {
      // Replace variable names with their values
      let expression = formula.toLowerCase();
      
      // Replace variables in order of specificity (longer names first)
      const replacements = [
        ['mat_rate_per_sqm', variables.mat_rate_per_sqm.toString()],
        ['left_width', (variables.left_width || variables.width).toString()],
        ['right_width', (variables.right_width || variables.width).toString()],
        ['left_depth', (variables.left_depth || variables.depth).toString()],
        ['right_depth', (variables.right_depth || variables.depth).toString()],
        ['left_side', (variables.left_side || 18).toString()],
        ['right_side', (variables.right_side || 18).toString()],
        ['door_cost', variables.door_cost.toString()],
        ['color_cost', variables.color_cost.toString()],
        ['finish_cost', variables.finish_cost.toString()],
        ['width', variables.width.toString()],
        ['height', variables.height.toString()],
        ['depth', variables.depth.toString()],
        ['qty', variables.qty.toString()],
        // Single letter variables
        ['w', variables.width.toString()],
        ['h', variables.height.toString()],
        ['d', variables.depth.toString()],
      ];
      
      replacements.forEach(([variable, value]) => {
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        expression = expression.replace(regex, value);
      });
      
      // Evaluate the mathematical expression safely
      return this.safeEvaluate(expression);
      
    } catch (error) {
      console.error('Error evaluating formula:', formula, error);
      return 0;
    }
  }
  
  private static safeEvaluate(expression: string): number {
    // Remove any potentially dangerous characters
    const cleanExpression = expression.replace(/[^0-9+\-*/().]/g, '');
    
    try {
      // Use Function constructor for safe evaluation
      return new Function(`return ${cleanExpression}`)();
    } catch (error) {
      console.error('Safe evaluation failed:', cleanExpression, error);
      return 0;
    }
  }

  // Calculate weight for cabinet configuration
  static calculateCabinetWeight(
    cabinetType: any,
    dimensions: { width: number; height: number; depth: number },
    quantity: number,
    doorStyle?: any
  ): { totalWeight: number; breakdown: { carcass: number; doors: number; hardware: number } } {
    let carcassWeight = 0;
    let doorWeight = 0;
    let hardwareWeight = 0;

    if (cabinetType.cabinet_parts) {
      for (const part of cabinetType.cabinet_parts) {
        // Calculate part dimensions using formula
        const partWidth = this.evaluateFormula(part.width_formula || '0', {
          width: dimensions.width,
          height: dimensions.height,
          depth: dimensions.depth,
          left_width: dimensions.width,
          right_width: dimensions.width,
          left_depth: dimensions.depth,
          right_depth: dimensions.depth,
          qty: quantity,
          mat_rate_per_sqm: 50,
          door_cost: 100,
          color_cost: 0,
          finish_cost: 0,
        });
        
        const partHeight = this.evaluateFormula(part.height_formula || '0', {
          width: dimensions.width,
          height: dimensions.height,
          depth: dimensions.depth,
          left_width: dimensions.width,
          right_width: dimensions.width,
          left_depth: dimensions.depth,
          right_depth: dimensions.depth,
          qty: quantity,
          mat_rate_per_sqm: 50,
          door_cost: 100,
          color_cost: 0,
          finish_cost: 0,
        });

        if (part.is_door && doorStyle) {
          // Calculate door weight using door style specifications
          const doorAreaM2 = (partWidth / 1000) * (partHeight / 1000);
          const doorDensity = doorStyle.material_density_kg_per_sqm || 12.0;
          const doorWeightFactor = doorStyle.weight_factor || 1.0;
          const partQuantity = part.quantity || 1;
          
          doorWeight += doorAreaM2 * doorDensity * doorWeightFactor * partQuantity;
        } else if (part.is_hardware) {
          // Hardware weight estimation
          const baseHardwareWeight = 2.5; // kg
          const sizeMultiplier = (dimensions.width * dimensions.height) / (600 * 720);
          hardwareWeight += baseHardwareWeight * sizeMultiplier * (part.quantity || 1);
        } else {
          // Carcass parts weight calculation
          const partAreaM2 = (partWidth / 1000) * (partHeight / 1000);
          const density = part.material_density_kg_per_sqm || 12.0;
          const weightMultiplier = part.weight_multiplier || 1.0;
          const partQuantity = part.quantity || 1;
          
          carcassWeight += partAreaM2 * density * weightMultiplier * partQuantity;
        }
      }
    }

    const totalWeight = (carcassWeight + doorWeight + hardwareWeight) * quantity;

    return {
      totalWeight,
      breakdown: {
        carcass: carcassWeight * quantity,
        doors: doorWeight * quantity,
        hardware: hardwareWeight * quantity,
      },
    };
  }
  
  static calculateCabinetPrice(
    cabinetType: any,
    dimensions: { width: number; height: number; depth: number },
    quantity: number = 1,
    rates: {
      materialRate?: number;
      doorRate?: number;
      colorSurcharge?: number;
      finishSurcharge?: number;
    } = {},
    hardwareRequirements: HardwareRequirement[] = [],
    doorStyle?: any
  ): { 
    totalPrice: number; 
    breakdown: { 
      carcass: number; 
      doors: number; 
      hardware: number; 
      surcharges: number; 
    };
    weight: { totalWeight: number; breakdown: { carcass: number; doors: number; hardware: number } };
  } {
    const variables: PricingVariables = {
      width: dimensions.width,
      height: dimensions.height,
      depth: dimensions.depth,
      left_width: cabinetType.left_side_width_mm || dimensions.width,
      right_width: cabinetType.right_side_width_mm || dimensions.width,
      left_depth: cabinetType.left_side_depth_mm || dimensions.depth,
      right_depth: cabinetType.right_side_depth_mm || dimensions.depth,
      qty: quantity,
      mat_rate_per_sqm: rates.materialRate || 45, // Use actual material rate from specifications
      door_cost: rates.doorRate || 120, // Combined door rate (style + color + finish)
      color_cost: rates.colorSurcharge || 0,
      finish_cost: rates.finishSurcharge || 0,
    };
    
    let carcassPrice = 0;
    let doorPrice = 0;
    let hardwarePrice = 0;
    let surcharges = (rates.colorSurcharge || 0) + (rates.finishSurcharge || 0);
    
    // Calculate based on cabinet parts if available
    if (cabinetType.cabinet_parts && cabinetType.cabinet_parts.length > 0) {
      console.log('Using cabinet parts for pricing calculation:', cabinetType.cabinet_parts);
      
      cabinetType.cabinet_parts.forEach((part: any) => {
        const partCost = this.evaluateFormula(part.width_formula || '', variables);
        const partTotal = partCost * (part.quantity || 1);
        
        console.log(`${part.part_name} (Qty: ${part.quantity}): Formula: ${part.width_formula} = $${partCost.toFixed(2)} × ${part.quantity} = $${partTotal.toFixed(2)}`);
        
        if (part.is_door) {
          doorPrice += partTotal;
        } else if (part.is_hardware) {
          hardwarePrice += partTotal;
        } else {
          carcassPrice += partTotal;
        }
      });
      
      console.log('Parts breakdown:', {
        carcassPrice: carcassPrice.toFixed(2),
        doorPrice: doorPrice.toFixed(2),
        hardwarePrice: hardwarePrice.toFixed(2),
        surcharges: surcharges.toFixed(2)
      });
    } else {
      // Fallback calculation for basic carcass
      const area = (dimensions.width / 1000) * (dimensions.height / 1000);
      carcassPrice = area * variables.mat_rate_per_sqm * quantity;
      
      // Basic door calculation - ensure door_count is at least 1 if not set
      const doorCount = Math.max(cabinetType.door_qty || cabinetType.door_count || 1, 1);
      const doorArea = area * doorCount;
      doorPrice = doorArea * variables.door_cost;
      
      console.log('Pricing calculation:', {
        area: area.toFixed(4),
        doorCount,
        doorArea: doorArea.toFixed(4), 
        materialRate: variables.mat_rate_per_sqm,
        doorRate: variables.door_cost,
        carcassPrice: carcassPrice.toFixed(2),
        doorPrice: doorPrice.toFixed(2)
      });
    }
    
    // Calculate hardware requirements cost
    if (hardwareRequirements && hardwareRequirements.length > 0) {
      console.log('Calculating hardware requirements:', hardwareRequirements);
      
      hardwareRequirements.forEach((req: HardwareRequirement) => {
        let units = 0;
        
        // Calculate units needed based on scope
        switch (req.unit_scope?.toLowerCase()) {
          case 'cabinet':
          case 'custom':
            units = req.units_per_scope * quantity;
            break;
          case 'door':
            const doorCount = Math.max(cabinetType.door_qty || cabinetType.door_count || 1, 1);
            units = req.units_per_scope * doorCount * quantity;
            break;
          case 'drawer':
            const drawerCount = cabinetType.drawer_count || 0;
            units = req.units_per_scope * drawerCount * quantity;
            break;
          default:
            units = req.units_per_scope * quantity;
        }
        
        // Use a default cost per unit for hardware (this should come from hardware_products table)
        const costPerUnit = 5.50; // Default hinge cost - should be looked up from database
        const reqCost = units * costPerUnit;
        
        console.log(`${req.hardware_type?.name || 'Hardware'} (${req.unit_scope}): ${units} units × $${costPerUnit} = $${reqCost.toFixed(2)}`);
        hardwarePrice += reqCost;
      });
    }
    
    const totalPrice = carcassPrice + doorPrice + hardwarePrice + surcharges;
    
    // Calculate weight information
    const weightInfo = this.calculateCabinetWeight(cabinetType, dimensions, quantity, doorStyle);
    
    return {
      totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
      breakdown: {
        carcass: Math.round(carcassPrice * 100) / 100,
        doors: Math.round(doorPrice * 100) / 100,
        hardware: Math.round(hardwarePrice * 100) / 100,
        surcharges: Math.round(surcharges * 100) / 100,
      },
      weight: weightInfo,
    };
  }
}

export default PricingCalculator;