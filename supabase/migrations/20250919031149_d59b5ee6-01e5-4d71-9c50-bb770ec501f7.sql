-- Insert test quotes with correct status values
INSERT INTO public.quotes (
  id,
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
    gen_random_uuid(),
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
    gen_random_uuid(), 
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
    gen_random_uuid(),
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

-- Insert test orders for production system
INSERT INTO public.orders (
  id,
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
    gen_random_uuid(),
    'ORD-20240115-0001',
    gen_random_uuid(),
    'confirmed',
    4545.45,
    454.55,
    5000.00,
    'cutting',
    'High priority kitchen order'
  ),
  (
    gen_random_uuid(),
    'ORD-20240114-0002', 
    gen_random_uuid(),
    'in_production',
    2727.27,
    272.73,
    3000.00,
    'painting',
    'Standard bathroom vanity'
  ),
  (
    gen_random_uuid(),
    'ORD-20240113-0003',
    gen_random_uuid(),
    'in_production', 
    1818.18,
    181.82,
    2000.00,
    'quality_check',
    'Small laundry project'
  );