-- Add inventory management to cabinet_types
ALTER TABLE cabinet_types 
ADD COLUMN stock_quantity integer DEFAULT 0,
ADD COLUMN min_stock_level integer DEFAULT 10,
ADD COLUMN max_stock_level integer DEFAULT 1000,
ADD COLUMN is_featured boolean DEFAULT false,
ADD COLUMN product_image_url text,
ADD COLUMN short_description text,
ADD COLUMN long_description text,
ADD COLUMN base_price numeric DEFAULT 0,
ADD COLUMN display_order integer DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX idx_cabinet_types_featured ON cabinet_types(is_featured);
CREATE INDEX idx_cabinet_types_category_active ON cabinet_types(category, active);
CREATE INDEX idx_cabinet_types_stock ON cabinet_types(stock_quantity);

-- Create orders table for e-commerce functionality  
CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  shipping_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  shipping_address jsonb,
  billing_address jsonb,
  payment_method text,
  payment_status text DEFAULT 'pending',
  stripe_session_id text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Admins can manage all orders"
ON public.orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  cabinet_type_id uuid REFERENCES cabinet_types(id) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  width_mm integer NOT NULL,
  height_mm integer NOT NULL,
  depth_mm integer NOT NULL,
  finish_id uuid REFERENCES finishes(id),
  color_id uuid REFERENCES colors(id),
  door_style_id uuid REFERENCES door_styles(id),
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  configuration jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view their order items"
ON public.order_items
FOR SELECT
USING (order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL)));

CREATE POLICY "Users can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL)));

CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create inventory_transactions table for tracking stock changes
CREATE TABLE public.inventory_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_type_id uuid REFERENCES cabinet_types(id) NOT NULL,
  transaction_type text NOT NULL, -- 'sale', 'restock', 'adjustment'
  quantity_change integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reference_id uuid, -- order_id or other reference
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS for inventory_transactions
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_transactions
CREATE POLICY "Admins can manage inventory transactions"
ON public.inventory_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
    order_num text;
BEGIN
    order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to update inventory on order completion
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS trigger AS $$
BEGIN
    -- Only reduce inventory when order status changes to 'completed' or 'paid'
    IF NEW.status IN ('completed', 'paid') AND OLD.status != NEW.status THEN
        -- Update stock for each item in the order
        UPDATE cabinet_types 
        SET stock_quantity = stock_quantity - oi.quantity
        FROM order_items oi 
        WHERE cabinet_types.id = oi.cabinet_type_id 
        AND oi.order_id = NEW.id;
        
        -- Create inventory transactions
        INSERT INTO inventory_transactions (
            cabinet_type_id, 
            transaction_type, 
            quantity_change, 
            previous_stock,
            new_stock,
            reference_id,
            notes
        )
        SELECT 
            oi.cabinet_type_id,
            'sale',
            -oi.quantity,
            ct.stock_quantity + oi.quantity,
            ct.stock_quantity,
            NEW.id,
            'Order completion: ' || NEW.order_number
        FROM order_items oi
        JOIN cabinet_types ct ON ct.id = oi.cabinet_type_id
        WHERE oi.order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER update_inventory_on_order_completion
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_order();

-- Add some sample inventory data to existing cabinet types (using subquery to avoid LIMIT)
UPDATE cabinet_types 
SET 
    stock_quantity = 50,
    min_stock_level = 10,
    max_stock_level = 100,
    is_featured = true,
    short_description = 'Quality ' || name || ' cabinet perfect for any kitchen',
    base_price = 299.00
WHERE id IN (
    SELECT id FROM cabinet_types WHERE active = true ORDER BY created_at LIMIT 5
);

-- Update remaining cabinet types with basic inventory
UPDATE cabinet_types 
SET 
    stock_quantity = 25,
    min_stock_level = 5,
    max_stock_level = 50,
    base_price = 199.00,
    short_description = 'Durable ' || name || ' cabinet for modern homes'
WHERE stock_quantity IS NULL AND active = true;