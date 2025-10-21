# Shopify Migration Guide: Cabinet Pricing System

## Overview

This guide shows how to migrate your existing cabinet pricing system (built on Lovable/Supabase backend) to a new Shopify-integrated project while maintaining all your custom pricing logic, formulas, and configuration workflows.

## Architecture: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    SHOPIFY (Product Catalog)                 │
│  - Product listings & discovery                              │
│  - Basic product info (name, images, description)            │
│  - SEO & marketing                                           │
│  - Inventory tracking                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              LOVABLE BACKEND (Configuration Engine)          │
│  - Custom dimension calculations                             │
│  - Formula-based pricing (parts: backs, bottoms, doors)      │
│  - Material specifications & rates                           │
│  - 3-tier door pricing (style + color + finish)             │
│  - Hardware requirements                                     │
│  - Real-time price calculations                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT & ORDERS                         │
│  - Custom checkout UI (Lovable)                             │
│  - Order creation in both systems                           │
│  - Payment processing (Stripe/PayPal)                       │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Migration

### Step 1: Core Pricing Tables (Direct Port)

These tables migrate **exactly as-is** from your current project:

#### Material Specifications
```sql
-- Already exists in your current project
CREATE TABLE material_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type text NOT NULL, -- 'MDF', 'HMR', etc.
  cost_per_sqm numeric NOT NULL DEFAULT 45.0,
  weight_per_sqm numeric DEFAULT 12.0,
  density_kg_per_cubic_m numeric NOT NULL DEFAULT 600.0,
  standard_thickness_mm integer NOT NULL DEFAULT 18,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### Door Styles (Base Rate)
```sql
CREATE TABLE door_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- '20mm Shaker', 'Laminex', 'Polytec'
  base_rate_per_sqm numeric NOT NULL DEFAULT 120.0, -- Base door style cost
  active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  image_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Colors (Surcharge Rate)
```sql
CREATE TABLE colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'Jet Black', 'Light Oak', 'Pure White'
  hex_code text,
  surcharge_rate_per_sqm numeric NOT NULL DEFAULT 0, -- Color surcharge
  door_style_id uuid REFERENCES door_styles(id),
  active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Finishes (Finish Rate)
```sql
CREATE TABLE finishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'Matt Black', 'Gloss White', 'Natural Oak'
  rate_per_sqm numeric NOT NULL DEFAULT 0, -- Finish cost
  door_style_id uuid REFERENCES door_styles(id),
  active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Junction Tables (Many-to-Many Relationships)
```sql
-- Which colors work with which door styles
CREATE TABLE color_door_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color_id uuid NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  door_style_id uuid NOT NULL REFERENCES door_styles(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(color_id, door_style_id)
);

-- Which finishes work with which door styles
CREATE TABLE door_style_finishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  door_style_id uuid NOT NULL REFERENCES door_styles(id) ON DELETE CASCADE,
  finish_id uuid NOT NULL REFERENCES finishes(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(door_style_id, finish_id)
);
```

### Step 2: Cabinet Products with Shopify Integration

```sql
CREATE TABLE cabinet_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name text NOT NULL, -- '4 door base'
  description text,
  category text NOT NULL, -- 'base', 'wall', 'tall'
  room_category text, -- 'Kitchen Cabinets', 'Bathroom Cabinets'
  subcategory text, -- For menu organization
  
  -- Shopify Integration
  shopify_product_id text UNIQUE, -- Sync with Shopify
  shopify_handle text,
  is_synced_to_shopify boolean DEFAULT false,
  last_synced_at timestamptz,
  
  -- Physical Properties
  default_width_mm integer NOT NULL DEFAULT 600,
  default_height_mm integer NOT NULL DEFAULT 720,
  default_depth_mm integer NOT NULL DEFAULT 560,
  min_width_mm integer DEFAULT 100,
  max_width_mm integer DEFAULT 1200,
  min_height_mm integer DEFAULT 200,
  max_height_mm integer DEFAULT 1000,
  min_depth_mm integer DEFAULT 200,
  max_depth_mm integer DEFAULT 1200,
  
  -- Door/Drawer Configuration
  door_count integer DEFAULT 0,
  drawer_count integer DEFAULT 0,
  
  -- Pricing & Status
  base_price numeric DEFAULT 0, -- Fallback price
  active boolean NOT NULL DEFAULT true,
  featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  -- SEO (also sync to Shopify)
  seo_title text,
  seo_description text,
  seo_keywords text[],
  
  -- Media
  primary_image_url text,
  gallery_images text[],
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Step 3: Cabinet Parts & Formulas

```sql
CREATE TABLE cabinet_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_type_id uuid NOT NULL REFERENCES cabinet_types(id) ON DELETE CASCADE,
  
  part_name text NOT NULL, -- 'Backs', 'Bottoms', 'Doors', 'Sides'
  quantity integer NOT NULL DEFAULT 1,
  is_door boolean DEFAULT false, -- Special handling for doors
  
  -- Formula for area calculation (uses W=width, H=height, D=depth in mm)
  -- Examples:
  --   Backs: '(H/1000)*(W/1000)*qty*mat_rate_per_sqm'
  --   Bottoms: '((D/1000)*(W/1000)*qty*mat_rate_per_sqm) + D'
  --   Doors: '((H/1000)*(W/1000)*qty*door_cost) + H + H'
  --   Sides: '((H/1000)*(D/1000)*qty*mat_rate_per_sqm) + H + H'
  area_formula text NOT NULL,
  
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Step 4: Hardware Requirements

```sql
CREATE TABLE hardware_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'Blum', 'Titus', etc.
  description text,
  website_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hardware_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'Hinges', 'Drawer Runners', 'Handles'
  category text NOT NULL, -- 'hinges', 'runners', 'handles', 'accessories'
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hardware_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_type_id uuid NOT NULL REFERENCES hardware_types(id),
  hardware_brand_id uuid NOT NULL REFERENCES hardware_brands(id),
  name text NOT NULL,
  model_number text,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  markup_percentage numeric DEFAULT 0,
  specifications jsonb, -- Store additional specs
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cabinet_hardware_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_type_id uuid NOT NULL REFERENCES cabinet_types(id) ON DELETE CASCADE,
  hardware_type_id uuid NOT NULL REFERENCES hardware_types(id),
  
  -- Quantity formula (can be static or dynamic)
  -- Examples:
  --   Hinges for 2-door cabinet: '2' or 'door_count * 2'
  --   Drawer runners: 'drawer_count * 2'
  quantity_formula text NOT NULL,
  
  is_optional boolean DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cabinet_hardware_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES cabinet_hardware_requirements(id) ON DELETE CASCADE,
  hardware_brand_id uuid NOT NULL REFERENCES hardware_brands(id),
  hardware_product_id uuid NOT NULL REFERENCES hardware_products(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Frontend Code Migration

### Step 1: Hooks (Direct Port)

Copy these files **exactly** from your current project:

```typescript
// src/hooks/useMaterialSpecifications.ts
// ✅ No changes needed - works as-is

// src/hooks/usePricing.ts
// ✅ No changes needed - works as-is

// src/lib/pricingCalculator.ts
// ✅ No changes needed - works as-is
```

### Step 2: Product Configuration Component

**Port from:** `src/components/product/ProductConfigurator.tsx`

**Key modifications:**
1. Add Shopify product ID tracking
2. Keep all pricing logic identical
3. Add "Add to Shopify Cart" vs "Add to Custom Cart" option

```typescript
// src/components/product/ShopifyProductConfigurator.tsx
import { usePricing } from '@/hooks/usePricing';
import { useMaterialSpecifications } from '@/hooks/useMaterialSpecifications';

interface ShopifyProductConfiguratorProps {
  cabinetType: CabinetType; // From Supabase (includes shopify_product_id)
  shopifyProductId?: string;
  onAddToCart: (configuration: Configuration, price: number) => void;
}

export const ShopifyProductConfigurator = ({
  cabinetType,
  shopifyProductId,
  onAddToCart
}: ShopifyProductConfiguratorProps) => {
  // State for 3-step dialog
  const [step, setStep] = useState<'style' | 'color' | 'finish'>('style');
  const [dimensions, setDimensions] = useState({
    width: cabinetType.default_width_mm,
    height: cabinetType.default_height_mm,
    depth: cabinetType.default_depth_mm
  });
  
  const [selectedDoorStyle, setSelectedDoorStyle] = useState<DoorStyle | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<Finish | null>(null);

  // Real-time pricing calculation (uses existing hook)
  const { pricing, loading } = usePricing({
    cabinetType,
    dimensions,
    quantity: 1,
    selectedDoorStyle,
    selectedColor,
    selectedFinish
  });

  // 3-step dialog logic (identical to current implementation)
  const handleStyleSelect = (style: DoorStyle) => {
    setSelectedDoorStyle(style);
    setStep('color');
  };

  const handleColorSelect = (color: Color) => {
    setSelectedColor(color);
    setStep('finish');
  };

  const handleFinishSelect = (finish: Finish) => {
    setSelectedFinish(finish);
    
    // Create configuration object
    const configuration = {
      cabinetTypeId: cabinetType.id,
      dimensions,
      doorStyle: selectedDoorStyle,
      color: selectedColor,
      finish: finish,
      shopifyProductId // Include for order sync
    };
    
    onAddToCart(configuration, pricing?.totalPrice || 0);
  };

  // ... rest of component (render 3-step dialog)
};
```

### Step 3: Shopify Integration Service

**NEW FILE:** `src/services/shopifyIntegration.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  variants: ShopifyVariant[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  sku: string;
}

export class ShopifyIntegrationService {
  
  /**
   * Sync cabinet type to Shopify as a base product
   * The actual pricing happens in Lovable backend
   */
  static async syncCabinetToShopify(cabinetTypeId: string) {
    const { data: cabinetType } = await supabase
      .from('cabinet_types')
      .select('*')
      .eq('id', cabinetTypeId)
      .single();

    if (!cabinetType) throw new Error('Cabinet type not found');

    // Create basic Shopify product (no pricing variants)
    const shopifyProduct = {
      title: cabinetType.name,
      body_html: cabinetType.description,
      vendor: 'DIY Kitchens',
      product_type: 'Custom Cabinet',
      tags: [cabinetType.category, cabinetType.room_category].filter(Boolean),
      variants: [{
        title: 'Custom Configuration',
        price: '0.00', // Price calculated in Lovable
        sku: `CABINET-${cabinetType.id.substring(0, 8).toUpperCase()}`,
        inventory_management: null, // No inventory tracking for custom items
        requires_shipping: true
      }],
      metafields: [
        {
          namespace: 'custom',
          key: 'lovable_cabinet_id',
          value: cabinetType.id,
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'requires_configuration',
          value: 'true',
          type: 'boolean'
        },
        {
          namespace: 'dimensions',
          key: 'default_width_mm',
          value: cabinetType.default_width_mm.toString(),
          type: 'number_integer'
        },
        {
          namespace: 'dimensions',
          key: 'default_height_mm',
          value: cabinetType.default_height_mm.toString(),
          type: 'number_integer'
        },
        {
          namespace: 'dimensions',
          key: 'default_depth_mm',
          value: cabinetType.default_depth_mm.toString(),
          type: 'number_integer'
        }
      ]
    };

    // Call Shopify Admin API (via edge function)
    const { data, error } = await supabase.functions.invoke('shopify-sync-product', {
      body: { product: shopifyProduct }
    });

    if (error) throw error;

    // Update cabinet_types with Shopify ID
    await supabase
      .from('cabinet_types')
      .update({
        shopify_product_id: data.product.id,
        shopify_handle: data.product.handle,
        is_synced_to_shopify: true,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', cabinetTypeId);

    return data.product;
  }

  /**
   * When customer adds to cart, create a custom line item with pricing
   */
  static async addConfiguredCabinetToCart(configuration: any, calculatedPrice: number) {
    // Store full configuration in Lovable database
    const { data: cartItem } = await supabase
      .from('cart_items')
      .insert({
        user_id: 'current-user-id', // Or session_id for anonymous
        cabinet_type_id: configuration.cabinetTypeId,
        width_mm: configuration.dimensions.width,
        height_mm: configuration.dimensions.height,
        depth_mm: configuration.dimensions.depth,
        door_style_id: configuration.doorStyle?.id,
        color_id: configuration.color?.id,
        finish_id: configuration.finish?.id,
        unit_price: calculatedPrice,
        total_price: calculatedPrice,
        quantity: 1,
        configuration: configuration // Full config as JSON
      })
      .select()
      .single();

    return cartItem;
  }
}
```

## Step-by-Step Implementation Plan

### Phase 1: Setup New Project (Week 1)

1. **Create new Lovable project**
   - Start fresh project
   - Enable Shopify integration in Lovable

2. **Database migration**
   - Run all SQL migrations above
   - Import existing data from current project:
     ```sql
     -- Export from current project
     COPY material_specifications TO '/tmp/materials.csv' CSV HEADER;
     COPY door_styles TO '/tmp/door_styles.csv' CSV HEADER;
     COPY colors TO '/tmp/colors.csv' CSV HEADER;
     COPY finishes TO '/tmp/finishes.csv' CSV HEADER;
     
     -- Import to new project
     COPY material_specifications FROM '/tmp/materials.csv' CSV HEADER;
     -- ... repeat for all tables
     ```

3. **Copy pricing logic files**
   ```bash
   # Copy these files exactly as-is:
   src/hooks/useMaterialSpecifications.ts
   src/hooks/usePricing.ts
   src/lib/pricingCalculator.ts
   src/types/cabinet.ts
   ```

### Phase 2: Shopify Catalog Sync (Week 2)

1. **Sync existing cabinets to Shopify**
   ```typescript
   // Admin script to sync all cabinet types
   const syncAllCabinets = async () => {
     const { data: cabinets } = await supabase
       .from('cabinet_types')
       .select('*')
       .eq('active', true);
     
     for (const cabinet of cabinets) {
       await ShopifyIntegrationService.syncCabinetToShopify(cabinet.id);
     }
   };
   ```

2. **Set up Shopify product templates**
   - Create custom product template for configurable cabinets
   - Add "Configure & Price" button that opens Lovable configurator
   - Embed Lovable configurator widget in Shopify product pages

### Phase 3: Frontend Integration (Week 3)

1. **Build product listing page**
   - Fetch from Shopify for catalog display
   - Link to configuration workflow

2. **Port 3-step configuration dialog**
   - Copy existing `StyleColorFinishSelector` component
   - Connect to Shopify product metafields
   - Maintain all pricing calculations

3. **Custom cart system**
   - Store configurations in Lovable database
   - Display in custom cart UI
   - Include full configuration details + calculated price

### Phase 4: Checkout & Orders (Week 4)

1. **Custom checkout flow**
   - Use Lovable checkout (not Shopify checkout)
   - Calculate final prices including shipping
   - Process payments via Stripe/PayPal

2. **Dual order creation**
   ```typescript
   // Create order in both systems
   const createOrder = async (cartItems, customerInfo) => {
     // 1. Create in Lovable (master record)
     const { data: lovableOrder } = await supabase
       .from('orders')
       .insert({...})
       .select()
       .single();
     
     // 2. Sync to Shopify for fulfillment tracking
     await supabase.functions.invoke('shopify-create-order', {
       body: {
         order: {
           line_items: cartItems.map(item => ({
             variant_id: item.shopify_variant_id,
             price: item.total_price,
             properties: [
               { name: 'Width (mm)', value: item.width_mm },
               { name: 'Height (mm)', value: item.height_mm },
               { name: 'Depth (mm)', value: item.depth_mm },
               { name: 'Door Style', value: item.door_style_name },
               { name: 'Color', value: item.color_name },
               { name: 'Finish', value: item.finish_name }
             ]
           })),
           customer: customerInfo,
           financial_status: 'paid'
         }
       }
     });
   };
   ```

## Door Pricing Flow Summary

```
Customer Flow:
1. Browse product → Shopify product page
2. Click "Configure" → Opens Lovable configurator
3. Set dimensions → Real-time price updates
4. Step 1: Select door style → Base rate applied
   ↓
5. Step 2: Select color → Surcharge added
   ↓
6. Step 3: Select finish → Finish rate added
   ↓
7. See final price → Add to cart
8. Checkout → Lovable checkout (custom)
9. Order created → Synced to both systems

Pricing Calculation (Backend):
- Material cost = (sides + back + bottom area) × material_rate_per_sqm
- Door cost = door_area × (door_style_rate + color_surcharge + finish_rate)
- Hardware cost = Σ(hardware_requirements × unit_costs)
- Total = material_cost + door_cost + hardware_cost
```

## Key Advantages of This Approach

✅ **Keep all custom pricing logic** - No compromises on formulas
✅ **Shopify for marketing** - SEO, catalog, discovery
✅ **Lovable for configuration** - Complex customization workflows
✅ **Single source of truth** - Lovable database is master
✅ **Shopify as fulfillment tool** - Order tracking, shipping labels
✅ **No Shopify app limitations** - Full control over pricing engine
✅ **Real-time calculations** - Instant price updates as user configures

## Testing Checklist

- [ ] Material rates load correctly
- [ ] Door styles/colors/finishes load correctly
- [ ] 3-step dialog works with proper filtering (colors per style)
- [ ] Dimension inputs update price in real-time
- [ ] Formula evaluation works for all cabinet parts
- [ ] Hardware requirements calculate correctly
- [ ] Price breakdown displays accurately
- [ ] Cart stores full configuration
- [ ] Shopify sync creates products with correct metafields
- [ ] Orders sync to both Lovable + Shopify
- [ ] Customer can view configuration in order history

## Next Steps

1. **Set up new Lovable project**
2. **Enable Shopify integration** (Lovable will guide you)
3. **Run database migrations** (copy SQL from this guide)
4. **Import your existing data** (materials, door styles, colors, finishes)
5. **Copy pricing logic files** (hooks + calculator)
6. **Sync first cabinet to Shopify** (test the flow)
7. **Build custom configurator** (port existing 3-step dialog)
8. **Test end-to-end** (product → configure → price → cart → checkout)

## Support & Resources

- Lovable Shopify Integration Docs: [Will be provided]
- Your current project code: Reference implementation
- Shopify Admin API: https://shopify.dev/docs/api/admin-rest
- Pricing system documentation: `docs/CABINET_PRICING_SYSTEM.md`
