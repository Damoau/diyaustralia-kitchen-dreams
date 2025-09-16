export const createMockOrder = (overrides?: any) => ({
  id: 'test-order-id',
  customer_id: 'test-customer-id',
  total_amount: 1200.50,
  status: 'pending',
  payment_status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [],
  customer_details: {
    full_name: 'Test Customer',
    email: 'customer@example.com',
    phone: '+1234567890',
  },
  shipping_details: {
    address: '123 Test Street',
    city: 'Test City',
    postcode: '12345',
    state: 'Test State',
  },
  ...overrides,
});

export const createMockOrderItem = (overrides?: any) => ({
  id: 'test-order-item-id',
  order_id: 'test-order-id',
  cabinet_type_id: 'test-cabinet-type-id',
  door_style_id: 'test-door-style-id',
  color_id: 'test-color-id',
  hardware_brand_id: 'test-hardware-id',
  quantity: 2,
  unit_price: 299.99,
  total_price: 599.98,
  specifications: {
    width: 600,
    height: 720,
    depth: 560,
  },
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockQuote = (overrides?: any) => ({
  id: 'test-quote-id',
  customer_id: 'test-customer-id',
  total_amount: 2500.00,
  status: 'pending',
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [],
  notes: 'Test quote notes',
  ...overrides,
});