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
  finish_id: string;
  name: string;
  hex_code?: string;
  image_url?: string;
  active: boolean;
  created_at: string;
  finish?: Finish;
}

export interface CabinetType {
  id: string;
  name: string;
  category: 'base' | 'wall' | 'pantry' | 'dress_panel';
  default_width_mm: number;
  default_height_mm: number;
  default_depth_mm: number;
  active: boolean;
  created_at: string;
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

export interface CabinetConfiguration {
  cabinetType: CabinetType;
  width: number;
  height: number;
  depth: number;
  quantity: number;
  finish?: Finish;
  color?: Color;
  doorStyle?: DoorStyle;
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