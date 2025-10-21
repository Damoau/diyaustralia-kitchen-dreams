# Cabinet Pricing System - Complete Documentation

## Overview
This document provides a comprehensive explanation of the cabinet pricing calculation system. This system handles custom-sized cabinets with configurable dimensions, materials, door styles, colors, finishes, and hardware.

---

## 1. Core Pricing Components

### 1.1 Material Specifications
**Database Table:** `material_specifications`

Each material type (MDF, Plywood, etc.) has specific properties:
- **material_type**: Material name (e.g., "MDF", "Plywood")
- **cost_per_sqm**: Base cost per square meter (e.g., $45.00/m²)
- **density_kg_per_cubic_m**: Density for weight calculations (e.g., 600 kg/m³)
- **standard_thickness_mm**: Standard sheet thickness (e.g., 18mm)
- **weight_per_sqm**: Weight per square meter (e.g., 12.0 kg/m²)
- **weight_factor**: Multiplier for weight adjustments (default: 1.0)

**Default Material:** MDF at $45.00/m² is used as the default carcass material.

---

## 2. Cabinet Dimensions & Area Calculations

### 2.1 Custom Dimensions
Each cabinet can have custom dimensions:
- **Width (w)**: Cabinet width in millimeters
- **Height (h)**: Cabinet height in millimeters  
- **Depth (d)**: Cabinet depth in millimeters
- **Quantity (qty)**: Number of identical cabinets

### 2.2 Area Calculation Method
The system calculates the total material area by summing all cabinet parts:

**Cabinet Parts Include:**
- **Sides** (left and right)
- **Back panel**
- **Bottom shelf**
- **Top (if applicable)**
- **Internal shelves/dividers**
- **Doors** (separate pricing)
- **Drawer fronts** (if applicable)

**Formula Variables:**
```javascript
{
  width: dimensions.width,        // w
  height: dimensions.height,      // h
  depth: dimensions.depth,        // d
  qty: quantity,                  // Number of cabinets
  mat_rate_per_sqm: 45.0,        // Material cost per m²
  door_cost: 120.0,              // Door rate per m² (combined)
}
```

### 2.3 Part-by-Part Calculation
Each cabinet part uses a formula to calculate its area:

**Example - Left Side Panel:**
```javascript
// Formula: (height/1000) * (depth/1000) * mat_rate_per_sqm
// For 720mm H × 560mm D cabinet:
Area = (720 / 1000) * (560 / 1000) = 0.4032 m²
Cost = 0.4032 m² × $45.00/m² = $18.14
```

**Example - Back Panel:**
```javascript
// Formula: (width/1000) * (height/1000) * mat_rate_per_sqm
// For 600mm W × 720mm H cabinet:
Area = (600 / 1000) * (720 / 1000) = 0.432 m²
Cost = 0.432 m² × $45.00/m² = $19.44
```

**Example - Bottom Panel:**
```javascript
// Formula: (width/1000) * (depth/1000) * mat_rate_per_sqm
// For 600mm W × 560mm D cabinet:
Area = (600 / 1000) * (560 / 1000) = 0.336 m²
Cost = 0.336 m² × $45.00/m² = $15.12
```

**Total Carcass Cost = Sum of all parts**

---

## 3. Door Pricing System

### 3.1 Three-Tier Selection Process

#### Step 1: Door Style Selection
**Database Table:** `door_styles`

The customer selects a door style, which has:
- **name**: Style name (e.g., "Shaker", "Flat Panel", "Shadowline")
- **base_rate_per_sqm**: Base door cost per m² (e.g., $120.00/m²)
- **door_thickness_mm**: Door thickness (e.g., 19mm)
- **material_density_kg_per_sqm**: Door weight per m² (e.g., 12.0 kg/m²)
- **active**: Whether available for selection

#### Step 2: Color Selection
**Database Table:** `colors`

After selecting a style, customer chooses a color:
- **name**: Color name (e.g., "White", "Natural Oak", "Charcoal")
- **hex_code**: Color preview hex code
- **surcharge_rate_per_sqm**: Additional cost per m² (e.g., +$15.00/m²)
- **door_style_id**: Links to specific door styles
- **image_url**: Visual preview

#### Step 3: Finish Selection (Optional)
**Database Table:** `finishes`

Finally, customer can choose a finish:
- **name**: Finish name (e.g., "Matte", "Gloss", "Satin")
- **finish_type**: Type of finish (e.g., "standard", "premium")
- **rate_per_sqm**: Additional cost per m² (e.g., +$8.00/m²)
- **door_style_id**: Links to specific door styles

### 3.2 Combined Door Rate Calculation

**Formula:**
```javascript
Total Door Rate = Base Rate + Color Surcharge + Finish Rate

Example:
- Base Rate (Shaker style): $120.00/m²
- Color Surcharge (Natural Oak): +$15.00/m²
- Finish Rate (Matte): +$8.00/m²
─────────────────────────────────────────
Total Door Rate: $143.00/m²
```

### 3.3 Door Area Calculation

**For Standard Doors:**
```javascript
// Single door cabinet
Door Area = (width/1000) * (height/1000) * door_count

// For 600mm W × 720mm H cabinet with 2 doors:
Door Area = (600/1000) * (720/1000) * 2 = 0.864 m²
Door Cost = 0.864 m² × $143.00/m² = $123.55
```

**For Formula-Based Doors:**
If the cabinet has custom door formulas in `cabinet_parts`:
```javascript
// Door width and height calculated from formulas
// Example: width_formula = "width/2 - 2", height_formula = "height - 4"
Part Width = (600/2 - 2) = 298mm
Part Height = (720 - 4) = 716mm
Door Area = (298/1000) * (716/1000) = 0.2134 m²

// If 2 doors:
Total Door Area = 0.2134 m² × 2 = 0.4268 m²
Door Cost = 0.4268 m² × $143.00/m² = $61.03
```

---

## 4. Hardware Pricing

### 4.1 Hardware Requirements System
**Database Table:** `cabinet_hardware_requirements`

Each cabinet type defines what hardware it needs:
- **hardware_type_id**: Type of hardware (hinge, runner, etc.)
- **unit_scope**: Calculation scope ("cabinet", "door", "drawer")
- **units_per_scope**: Quantity per scope (e.g., 2 hinges per door)
- **active**: Whether this requirement is active

### 4.2 Hardware Products
**Database Table:** `hardware_products`

Individual hardware items have:
- **name**: Product name (e.g., "Blum Clip-Top Hinge")
- **model_number**: SKU/Model
- **hardware_brand_id**: Manufacturer (Blum, Titus, etc.)
- **hardware_type_id**: Category (hinge, runner)
- **cost_per_unit**: Base cost per unit (e.g., $5.50)
- **markup_percentage**: Retail markup (e.g., 25%)

### 4.3 Hardware Calculation Examples

**Example 1: Cabinet-Scoped Hardware**
```javascript
// Plastic legs - 4 per cabinet
Unit Scope: "cabinet"
Units Per Scope: 4
Quantity: 1 cabinet

Total Units = 4 × 1 = 4 units
Cost = 4 units × $2.40/unit = $9.60
```

**Example 2: Door-Scoped Hardware**
```javascript
// Hinges - 2 per door
Unit Scope: "door"
Units Per Scope: 2
Door Count: 2 doors
Cabinet Quantity: 1

Total Units = 2 × 2 × 1 = 4 hinges
Cost = 4 hinges × $5.50/hinge = $22.00
```

**Example 3: Drawer-Scoped Hardware**
```javascript
// Drawer runners - 1 pair per drawer
Unit Scope: "drawer"
Units Per Scope: 1
Drawer Count: 3 drawers
Cabinet Quantity: 2

Total Units = 1 × 3 × 2 = 6 pairs
Cost = 6 pairs × $12.50/pair = $75.00
```

---

## 5. Product Options System

### 5.1 Visible Options
**Database Table:** `cabinet_product_options`

Customer-facing configuration options:
- **option_name**: Option identifier (e.g., "hinge_side", "cut_out_for_sink")
- **option_type**: Input type ("select", "text", "file_upload")
- **required**: Whether must be selected
- **display_to_customers**: Whether shown in UI (true)
- **display_order**: Sort order in UI

**Linked Table:** `cabinet_option_values`
- **value**: Internal value
- **display_text**: Customer-facing text
- **price_adjustment**: Additional cost (e.g., +$50.00 for sink cutout)
- **is_default**: Whether selected by default

### 5.2 Hidden Options (Auto-Applied)
Options with `display_to_customers: false` are automatically included:

**Example - Plastic Legs:**
```javascript
Option: "plastic_legs"
Display to Customers: false
Default Value: "4_legs"
Price Adjustment: +$9.60

// Automatically added to every base cabinet
// Included in final price without customer selection
```

---

## 6. Complete Pricing Formula

### 6.1 Breakdown Structure
```javascript
// 1. CARCASS COST
Carcass = Sum of all carcass parts × material rate

// 2. DOOR COST  
Doors = Door area × (base_rate + color_surcharge + finish_rate)

// 3. HARDWARE COST
Hardware = Sum of all hardware requirements × unit costs

// 4. SURCHARGES
Surcharges = Sum of option price adjustments

// 5. SUBTOTAL (Ex GST)
Subtotal = Carcass + Doors + Hardware + Surcharges

// 6. GST (10% for Australia)
GST = Subtotal × 0.10

// 7. TOTAL (Inc GST)
Total = Subtotal + GST
    = Subtotal × 1.10
```

### 6.2 Example Calculation Walkthrough

**Cabinet Specifications:**
- Type: Base Cabinet (2 doors)
- Dimensions: 600mm W × 720mm H × 560mm D
- Quantity: 1
- Door Style: Shadowline ($120/m²)
- Color: Natural Oak (+$15/m²)
- Finish: Matte (+$8/m²)

**Step 1: Calculate Carcass**
```javascript
Left Side:   (720/1000) × (560/1000) × $45 = $18.14
Right Side:  (720/1000) × (560/1000) × $45 = $18.14
Back:        (600/1000) × (720/1000) × $45 = $19.44
Bottom:      (600/1000) × (560/1000) × $45 = $15.12
Top:         (600/1000) × (560/1000) × $45 = $15.12
───────────────────────────────────────────────
Carcass Total: $85.96
```

**Step 2: Calculate Doors**
```javascript
Door Rate = $120 + $15 + $8 = $143/m²
Door Area = (600/1000) × (720/1000) × 2 doors = 0.864 m²
Door Cost = 0.864 m² × $143/m² = $123.55
```

**Step 3: Calculate Hardware**
```javascript
Hinges:       4 hinges × $5.50 = $22.00
Plastic Legs: 4 legs × $2.40 = $9.60
───────────────────────────────────────
Hardware Total: $31.60
```

**Step 4: Apply Options**
```javascript
No additional options selected
Surcharges: $0.00
```

**Step 5: Calculate Total**
```javascript
Subtotal (Ex GST) = $85.96 + $123.55 + $31.60 + $0.00 = $241.11
GST (10%)         = $241.11 × 0.10 = $24.11
Total (Inc GST)   = $241.11 + $24.11 = $265.22
```

**Final Breakdown:**
```
Carcass:     $94.56  (inc GST)
Doors:       $135.91 (inc GST)
Hardware:    $34.76  (inc GST)
Surcharges:  $0.00   (inc GST)
─────────────────────────────
TOTAL:       $265.22 (inc GST)
```

---

## 7. Database Schema Requirements

### 7.1 Core Tables

#### `cabinet_types`
```sql
- id (uuid)
- name (text)
- category (text) -- "base", "wall", "tall"
- default_width_mm (integer)
- default_height_mm (integer)
- default_depth_mm (integer)
- door_count (integer)
- drawer_count (integer)
- price_calculation_method (text) -- "formula" or "fixed"
- base_price (numeric) -- For fixed pricing
- active (boolean)
```

#### `cabinet_parts`
```sql
- id (uuid)
- cabinet_type_id (uuid) FK
- part_name (text) -- "Left Side", "Door", etc.
- width_formula (text) -- "width/2 - 2"
- height_formula (text) -- "height - 4"
- quantity (integer) -- How many of this part
- is_door (boolean)
- is_hardware (boolean)
- material_density_kg_per_sqm (numeric)
- weight_multiplier (numeric)
```

#### `material_specifications`
```sql
- id (uuid)
- material_type (text) -- "MDF", "Plywood"
- cost_per_sqm (numeric)
- density_kg_per_cubic_m (numeric)
- standard_thickness_mm (integer)
- weight_per_sqm (numeric)
- weight_factor (numeric)
- active (boolean)
```

#### `door_styles`
```sql
- id (uuid)
- name (text)
- base_rate_per_sqm (numeric)
- door_thickness_mm (integer)
- material_density_kg_per_sqm (numeric)
- image_url (text)
- active (boolean)
```

#### `colors`
```sql
- id (uuid)
- name (text)
- door_style_id (uuid) FK -- Optional, can be null for universal colors
- hex_code (text)
- surcharge_rate_per_sqm (numeric)
- image_url (text)
- sort_order (integer)
- active (boolean)
```

#### `finishes`
```sql
- id (uuid)
- name (text)
- door_style_id (uuid) FK
- finish_type (text) -- "standard", "premium"
- rate_per_sqm (numeric)
- active (boolean)
```

#### `hardware_brands`
```sql
- id (uuid)
- name (text) -- "Blum", "Titus", "Laminex"
- description (text)
- website_url (text)
- active (boolean)
```

#### `hardware_types`
```sql
- id (uuid)
- name (text) -- "Hinge", "Drawer Runner"
- category (text) -- "hinge", "runner", "handle"
- active (boolean)
```

#### `hardware_products`
```sql
- id (uuid)
- hardware_type_id (uuid) FK
- hardware_brand_id (uuid) FK
- name (text)
- model_number (text)
- cost_per_unit (numeric)
- markup_percentage (numeric)
- specifications (jsonb)
- active (boolean)
```

#### `cabinet_hardware_requirements`
```sql
- id (uuid)
- cabinet_type_id (uuid) FK
- hardware_type_id (uuid) FK
- unit_scope (text) -- "cabinet", "door", "drawer"
- units_per_scope (integer)
- active (boolean)
```

#### `cabinet_product_options`
```sql
- id (uuid)
- cabinet_type_id (uuid) FK
- option_name (text)
- option_type (text) -- "select", "text", "file_upload"
- description (text)
- display_name (text)
- display_order (integer)
- required (boolean)
- display_to_customers (boolean)
- active (boolean)
```

#### `cabinet_option_values`
```sql
- id (uuid)
- option_id (uuid) FK
- value (text) -- Internal identifier
- display_text (text) -- Customer-facing text
- price_adjustment (numeric)
- display_order (integer)
- is_default (boolean)
- active (boolean)
```

---

## 8. Frontend Implementation Flow

### 8.1 Customer Configuration Process

**Step 1: Select Cabinet Type**
```javascript
// Load cabinet types by category
GET /cabinet_types?category=base&active=true

// Customer selects: "Base Cabinet 2 Door"
```

**Step 2: Enter Custom Dimensions**
```javascript
// Show input fields with min/max constraints
Width:  600mm  (min: 300, max: 1200)
Height: 720mm  (min: 600, max: 900)
Depth:  560mm  (min: 400, max: 650)
Quantity: 1
```

**Step 3: Select Door Style**
```javascript
// Load active door styles
GET /door_styles?active=true

// Customer selects: "Shadowline"
// base_rate_per_sqm: $120.00
```

**Step 4: Select Color**
```javascript
// Load colors for selected door style
GET /colors?door_style_id=XXX&active=true

// Customer selects: "Natural Oak"
// surcharge_rate_per_sqm: +$15.00
```

**Step 5: Select Finish (Optional)**
```javascript
// Load finishes for selected door style
GET /finishes?door_style_id=XXX&active=true

// Customer selects: "Matte"
// rate_per_sqm: +$8.00
```

**Step 6: Configure Options**
```javascript
// Load product options for cabinet type
GET /cabinet_product_options?cabinet_type_id=XXX&active=true&display_to_customers=true

// Display options to customer
Option: "Hinge Side" (required)
  Values: ["Left", "Right"]
  
Option: "Cut Out for Sink"
  Values: ["Yes (+$50)", "No"]
```

**Step 7: Calculate Pricing**
```javascript
// Call pricing calculator
PricingCalculator.calculateCabinetPrice(
  cabinetType,
  { width: 600, height: 720, depth: 560 },
  quantity: 1,
  rates: {
    materialRate: 45,
    doorRate: 143, // 120 + 15 + 8
    colorSurcharge: 0,
    finishSurcharge: 0
  },
  hardwareRequirements,
  doorStyle,
  selectedHardware
)

// Returns:
{
  totalPrice: 265.22,
  breakdown: {
    carcass: 94.56,
    doors: 135.91,
    hardware: 34.76,
    surcharges: 0.00
  },
  weight: {
    totalWeight: 28.5,
    breakdown: {
      carcass: 18.2,
      doors: 8.8,
      hardware: 1.5
    }
  }
}
```

---

## 9. Key Implementation Files

### 9.1 Core Calculator
**File:** `src/lib/pricingCalculator.ts`
- `evaluateFormula()`: Evaluates part formulas
- `calculateCabinetPrice()`: Main pricing calculation
- `calculateCabinetWeight()`: Weight calculations

### 9.2 React Hooks
**File:** `src/hooks/usePricing.ts`
- Fetches material specifications
- Fetches hardware requirements
- Calculates pricing when dependencies change

**File:** `src/hooks/useMaterialSpecifications.ts`
- Loads material specifications from database
- Provides default material rate

**File:** `src/hooks/useProductOptions.ts`
- Loads product options for cabinet type
- Manages visible and hidden options
- Calculates hidden option costs

### 9.3 UI Components
**File:** `src/components/product/PricingDisplay.tsx`
- Displays pricing breakdown to customer
- Shows carcass, door, hardware, and surcharge costs
- Displays total with GST

**File:** `src/components/product/StyleColorFinishSelector.tsx`
- Three-step door selection UI
- Shows base rates and surcharges
- Visual color/finish preview

---

## 10. Shopify Integration Considerations

### 10.1 Product Variants Mapping
Each configured cabinet becomes a unique Shopify variant:

```javascript
{
  product_id: "cabinet-base-2-door",
  variant_id: "600x720x560-shadowline-oak-matte",
  sku: "BC2D-600-720-560-SHD-OAK-MAT",
  price: "265.22",
  inventory_quantity: 999, // Made to order
  option1: "600mm × 720mm × 560mm",
  option2: "Shadowline | Natural Oak | Matte",
  metafields: {
    dimensions: { width: 600, height: 720, depth: 560 },
    door_config: { style: "Shadowline", color: "Natural Oak", finish: "Matte" },
    price_breakdown: { carcass: 94.56, doors: 135.91, hardware: 34.76 },
    weight_kg: 28.5
  }
}
```

### 10.2 Dynamic Pricing Updates
When material costs or door rates change:
1. Update `material_specifications` or `door_styles` in database
2. Recalculate all product variant prices
3. Sync updated prices to Shopify via API
4. Maintain price history for existing orders

### 10.3 Custom Product Builder
Shopify app/theme integration:
- Embedded configurator on product pages
- Live price updates as customer configures
- "Add to Cart" creates Shopify line item with custom properties
- Cart shows detailed breakdown

---

## 11. Testing Scenarios

### 11.1 Standard Base Cabinet
```
Cabinet: Base 2 Door
Size: 600mm W × 720mm H × 560mm D
Style: Shadowline ($120/m²)
Color: Natural Oak (+$15/m²)
Finish: Matte (+$8/m²)
Expected: ~$265 inc GST
```

### 11.2 Large Pantry Cabinet
```
Cabinet: Tall Pantry 2 Door
Size: 900mm W × 2100mm H × 560mm D
Style: Flat Panel ($110/m²)
Color: White (+$0/m²)
Finish: Standard ($0/m²)
Expected: ~$580 inc GST
```

### 11.3 Drawer Base Cabinet
```
Cabinet: Drawer Base 3 Drawer
Size: 600mm W × 720mm H × 560mm D
Style: Shaker ($135/m²)
Color: Charcoal (+$20/m²)
Finish: Gloss (+$12/m²)
Hardware: Soft-close runners (6 pairs)
Expected: ~$420 inc GST
```

---

## 12. Summary

This pricing system provides:

✅ **Accurate Material Costing**: Per square meter rates based on actual material area
✅ **Flexible Door Pricing**: Three-tier selection (style + color + finish)
✅ **Hardware Integration**: Automatic calculation based on cabinet configuration
✅ **Custom Sizing**: Supports any dimensions within constraints
✅ **Formula-Based**: Precise part-by-part calculations
✅ **GST Compliant**: Australian 10% GST included in final pricing
✅ **Hidden Options**: Auto-applied components (legs, assembly)
✅ **Weight Calculations**: For shipping cost estimation
✅ **Shopify Ready**: Designed for e-commerce integration

---

## Contact & Support

For implementation questions or pricing formula assistance:
- Review code in `src/lib/pricingCalculator.ts`
- Check database schema in Supabase migrations
- Test with `src/components/product/PricingDisplay.tsx`

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Compatible With:** React + Supabase + Shopify
