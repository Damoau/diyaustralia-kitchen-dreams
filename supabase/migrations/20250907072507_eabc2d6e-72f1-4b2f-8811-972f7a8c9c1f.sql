-- Fix security warnings for functions by setting proper search_path

-- Update generate_order_number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    order_num text;
BEGIN
    order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 LPAD((SELECT COUNT(*) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE)::text, 4, '0');
    RETURN order_num;
END;
$$;

-- Update inventory trigger function
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;