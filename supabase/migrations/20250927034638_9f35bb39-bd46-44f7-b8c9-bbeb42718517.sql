-- Add item naming and hardware support to quote_items table
ALTER TABLE quote_items 
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS job_reference TEXT,
ADD COLUMN IF NOT EXISTS hardware_selections JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS enhanced_notes TEXT;

-- Add hardware options tables for hinges and drawer runners
CREATE TABLE IF NOT EXISTS hardware_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_item_id UUID REFERENCES quote_items(id) ON DELETE CASCADE,
  hardware_type TEXT NOT NULL, -- 'hinges' or 'drawer_runners'
  hardware_product_id UUID REFERENCES hardware_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on hardware_selections
ALTER TABLE hardware_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for hardware_selections
CREATE POLICY "Users can manage hardware selections for their quotes" 
ON hardware_selections 
FOR ALL 
USING (
  quote_item_id IN (
    SELECT qi.id 
    FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    WHERE q.user_id = auth.uid() OR (auth.uid() IS NULL AND q.session_id IS NOT NULL)
  )
);

CREATE POLICY "Admins can manage all hardware selections" 
ON hardware_selections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));