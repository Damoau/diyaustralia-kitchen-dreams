-- Create test order data for development (using correct schedule_type values)
INSERT INTO orders (
  id,
  order_number, 
  user_id,
  status,
  subtotal,
  tax_amount, 
  total_amount,
  billing_address,
  created_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'ORD-2023-089',
  NULL, -- Allow access for testing
  'shipped',
  3818.18,
  381.82,
  4200.00,
  '{"street": "123 Test St", "city": "Sydney", "state": "NSW", "postcode": "2000"}'::jsonb,
  '2023-11-15 10:00:00+00'
) ON CONFLICT (id) DO NOTHING;

-- Create test order items
INSERT INTO order_items (
  id,
  order_id,
  cabinet_type_id,
  quantity,
  width_mm,
  height_mm, 
  depth_mm,
  unit_price,
  total_price,
  created_at
) VALUES (
  gen_random_uuid(),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  (SELECT id FROM cabinet_types LIMIT 1), -- Use first available cabinet type
  2,
  600,
  720,
  560,
  1909.09,
  3818.18,
  '2023-11-15 10:00:00+00'
) ON CONFLICT DO NOTHING;

-- Create test payment schedule (using valid schedule_type values)
INSERT INTO payment_schedules (
  id,
  order_id,
  schedule_type,
  percentage,
  amount,
  status,
  due_date,
  created_at
) VALUES (
  gen_random_uuid(),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'deposit',
  20,
  840.00,
  'paid',
  '2023-11-15'::date,
  '2023-11-15 10:00:00+00'
),
(
  gen_random_uuid(), 
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'balance', -- Use 'balance' instead of 'final'
  80,
  3360.00,
  'paid',
  '2023-12-01'::date,
  '2023-11-15 10:00:00+00'
) ON CONFLICT DO NOTHING;