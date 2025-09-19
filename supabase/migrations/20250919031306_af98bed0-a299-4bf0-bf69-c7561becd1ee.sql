-- Insert test data with correct database constraint values
INSERT INTO public.quotes (
  quote_number,
  user_id,
  status,
  subtotal,
  tax_amount,
  total_amount,
  notes,
  valid_until,
  version_number
) VALUES 
  (
    'QUO-20240115-0001',
    gen_random_uuid(),
    'draft',
    2272.73,
    227.27,
    2500.00,
    'Kitchen renovation quote - base cabinets',
    CURRENT_DATE + INTERVAL '30 days',
    1
  ),
  (
    'QUO-20240114-0002',
    gen_random_uuid(),
    'sent',
    1681.82,
    168.18,
    1850.00,
    'Laundry cabinets with custom finishes',
    CURRENT_DATE + INTERVAL '25 days',
    1
  ),
  (
    'QUO-20240113-0003',
    gen_random_uuid(),
    'accepted',
    8090.91,
    809.09,
    8900.00,
    'Full kitchen with pantry storage',
    CURRENT_DATE + INTERVAL '20 days',
    2
  );

-- Insert orders with valid production_status values from constraint
INSERT INTO public.orders (
  order_number,
  user_id, 
  status,
  subtotal,
  tax_amount,
  total_amount,
  production_status,
  notes
) VALUES 
  (
    'ORD-20240115-0001',
    gen_random_uuid(),
    'confirmed',
    4545.45,
    454.55,
    5000.00,
    'cnc',
    'High priority kitchen order'
  ),
  (
    'ORD-20240114-0002', 
    gen_random_uuid(),
    'in_production',
    2727.27,
    272.73,
    3000.00,
    'paint',
    'Standard bathroom vanity'
  ),
  (
    'ORD-20240113-0003',
    gen_random_uuid(),
    'in_production',
    1818.18,
    181.82,
    2000.00,
    'qc',
    'Small laundry project'
  );