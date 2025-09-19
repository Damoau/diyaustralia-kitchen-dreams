import type { CabinetType, DoorStyle, Color, HardwareBrand } from '@/types/cabinet';

export const createMockCabinetType = (overrides?: Partial<CabinetType>): CabinetType => ({
  id: 'test-cabinet-type-id',
  name: 'Test Base Cabinet',
  category: 'base',
  subcategory: 'standard',
  default_width_mm: 600,
  default_height_mm: 720,
  default_depth_mm: 560,
  door_count: 2,
  drawer_count: 0,
  active: true,
  is_featured: false,
  short_description: 'Test cabinet description',
  display_order: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockDoorStyle = (overrides?: Partial<DoorStyle>): DoorStyle => ({
  id: 'test-door-style-id',
  name: 'Test Shaker',
  description: 'Test door style description',
  base_rate_per_sqm: 120.0,
  active: true,
  image_url: '/test-door-style.jpg',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockColor = (overrides?: Partial<Color>): Color => ({
  id: 'test-color-id',
  door_style_id: 'test-door-style-id',
  name: 'Test White',
  hex_code: '#FFFFFF',
  surcharge_rate_per_sqm: 0.0,
  active: true,
  image_url: '/test-color.jpg',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockHardwareBrand = (overrides?: Partial<HardwareBrand>): HardwareBrand => ({
  id: 'test-hardware-id',
  name: 'Test Hardware',
  description: 'Test hardware description',
  active: true,
  website_url: 'https://test-hardware.com',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockCartItem = (overrides?: any) => ({
  id: 'test-cart-item-id',
  cabinet_type_id: 'test-cabinet-type-id',
  door_style_id: 'test-door-style-id',
  color_id: 'test-color-id',
  hardware_brand_id: 'test-hardware-id',
  quantity: 1,
  width: 600,
  height: 720,
  depth: 560,
  base_price: 299.99,
  final_price: 359.99,
  created_at: new Date().toISOString(),
  ...overrides,
});