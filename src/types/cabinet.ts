export interface DoorStyle {
  id: string;
  name: string;
  description?: string;
  base_rate_per_sqm: number;
  active: boolean;
  created_at: string;
  image_url?: string;
}

export interface Finish {
  id: string;
  door_style_id: string;
  name: string;
  finish_type: string;
  rate_per_sqm: number;
  active: boolean;
  created_at: string;
  door_style?: DoorStyle;
}

export interface Color {
  id: string;
  door_style_id: string;
  name: string;
  hex_code?: string;
  image_url?: string;
  surcharge_rate_per_sqm: number;
  active: boolean;
  created_at: string;
  door_style?: DoorStyle;
}

export interface CabinetType {
  id: string;
  name: string;
  category: 'base' | 'wall' | 'tall' | 'panels';
  subcategory?: string;
  subcategory_display_order?: number;
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  min_width_mm?: number;
  max_width_mm?: number;
  min_height_mm?: number;
  max_height_mm?: number;
  min_depth_mm?: number;
  max_depth_mm?: number;
  door_count: number;
  drawer_count: number;
  active: boolean;
  created_at: string;
  range_id?: string;
  pricing_formula?: any;
  default_hardware_brand_id?: string;
  backs_qty?: number;
  bottoms_qty?: number;
  sides_qty?: number;
  door_qty?: number;
  // Corner cabinet support
  cabinet_style?: 'standard' | 'corner';
  right_side_width_mm?: number;
  left_side_width_mm?: number;
  right_side_depth_mm?: number;
  left_side_depth_mm?: number;
  qty_left_back?: number;
  qty_right_back?: number;
  qty_left_side?: number;
  qty_right_side?: number;
  // E-commerce fields
  is_featured: boolean;
  product_image_url?: string;
  short_description?: string;
  long_description?: string;
  display_order: number;
  // Assembly fields
  assembly_available?: boolean;
  assembly_carcass_only_price?: number;
  assembly_with_doors_price?: number;
}


export interface CabinetPart {
  id: string;
  cabinet_type_id: string;
  part_name: string;
  quantity: number;
  width_formula?: string;
  height_formula?: string;
  is_door: boolean;
  is_hardware: boolean;
  created_at: string;
}

export interface GlobalSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id?: string;
  session_id?: string;
  name: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  cabinet_type_id: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  quantity: number;
  finish_id?: string;
  color_id?: string;
  door_style_id?: string;
  unit_price: number;
  total_price: number;
  configuration?: string;
  created_at: string;
  updated_at: string;
  cabinet_type?: CabinetType;
  finish?: Finish;
  color?: Color;
  door_style?: DoorStyle;
  // Product integration fields
  product_variant?: ProductVariant;
  product_options?: Record<string, string>;
  product_title?: string;
  is_product_based?: boolean;
}

// Product-related interfaces for cart integration
export interface Product {
  id: string;
  title: string;
  handle: string;
  product_type: string;
  status: string;
  vendor: string;
  description?: string;
  thumbnail_url?: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  display_type: string;
  position: number;
  option_values?: OptionValue[];
}

export interface OptionValue {
  id: string;
  product_option_id: string;
  value: string;
  code: string;
  swatch_hex?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  option_value_ids: string[];
  is_active: boolean;
  width_mm?: number;
  height_mm?: number;
  length_mm?: number;
  weight_kg?: number;
  lead_time_days?: number;
  media_url?: string;
}

// Add hardware brand interface
export interface HardwareBrand {
  id: string;
  name: string;
  website_url?: string;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface HardwareType {
  id: string;
  name: string;
  category: string;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface HardwareProduct {
  id: string;
  name: string;
  model_number?: string;
  hardware_type_id: string;
  hardware_brand_id: string;
  cost_per_unit: number;
  description?: string;
  specifications?: any;
  active: boolean;
  created_at: string;
}

export interface CabinetHardwareRequirement {
  id: string;
  cabinet_type_id: string;
  hardware_type_id: string;
  unit_scope: 'per_cabinet' | 'per_door' | 'per_drawer';
  units_per_scope: number;
  notes?: string;
  // Additional product options for specific cabinet configurations
  product_options?: Record<string, {
    type: 'select' | 'text' | 'textarea' | 'file_upload';
    value: string | File | null;
    textValue?: string;
  }>;
  active: boolean;
  created_at: string;
}

export interface CabinetHardwareOption {
  id: string;
  requirement_id: string;
  hardware_brand_id: string;
  hardware_product_id: string;
  active: boolean;
  created_at: string;
}

// Junction table interfaces for relationships
export interface DoorStyleFinish {
  id: string;
  door_style_id: string;
  finish_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  door_style?: DoorStyle;
  finish?: Finish;
}

export interface ColorFinish {
  id: string;
  color_id: string;
  finish_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  color?: Color;
  finish?: Finish;
}

export interface CabinetConfiguration {
  cabinetType: CabinetType;
  width: number;
  height: number;
  depth: number;
  // Corner cabinet dimensions (for corner cabinets only)
  rightSideWidth?: number;
  leftSideWidth?: number;
  rightSideDepth?: number;
  leftSideDepth?: number;
  quantity: number;
  finish?: Finish;
  color?: Color;
  doorStyle?: DoorStyle;
  hardwareBrand?: HardwareBrand;
}

export interface PartCutlist {
  partName: string;
  width: number;
  height: number;
  quantity: number;
  area: number;
  isDoor: boolean;
  isHardware: boolean;
}

export interface CabinetCutlist {
  configuration: CabinetConfiguration;
  parts: PartCutlist[];
  carcassCost: number;
  doorCost: number;
  hardwareCost: number;
  totalCost: number;
}