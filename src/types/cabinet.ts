export interface Brand {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface DoorStyle {
  id: string;
  name: string;
  description?: string;
  base_rate_per_sqm: number;
  active: boolean;
  created_at: string;
}

export interface Finish {
  id: string;
  brand_id: string;
  name: string;
  finish_type: string;
  rate_per_sqm: number;
  active: boolean;
  created_at: string;
  brand?: Brand;
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
  category: 'base' | 'wall' | 'pantry' | 'dress_panel';
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
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
}

export interface CabinetTypePriceRange {
  id: string;
  cabinet_type_id: string;
  label: string;
  min_width_mm: number;
  max_width_mm: number;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface CabinetTypeFinish {
  id: string;
  cabinet_type_id: string;
  finish_id: string;
  door_style_id?: string;
  color_id?: string;
  depth_mm?: number;
  sort_order: number;
  active: boolean;
  created_at: string;
  finish?: Finish;
  door_style?: DoorStyle;
  color?: Color;
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

export interface CabinetConfiguration {
  cabinetType: CabinetType;
  width: number;
  height: number;
  depth: number;
  quantity: number;
  finish?: Finish;
  color?: Color;
  doorStyle?: DoorStyle;
  hardwareBrand?: string;
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