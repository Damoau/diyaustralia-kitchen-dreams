-- Create cabinet product options table
CREATE TABLE public.cabinet_product_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_type_id UUID NOT NULL,
  option_name TEXT NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('select', 'text', 'textarea', 'file_upload')),
  display_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cabinet option values table for select-type options
CREATE TABLE public.cabinet_option_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabinet_option_id UUID NOT NULL REFERENCES public.cabinet_product_options(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  display_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cabinet_product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinet_option_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cabinet_product_options
CREATE POLICY "Admins can manage cabinet product options"
ON public.cabinet_product_options
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active cabinet product options"
ON public.cabinet_product_options
FOR SELECT
USING (active = true);

-- RLS Policies for cabinet_option_values
CREATE POLICY "Admins can manage cabinet option values"
ON public.cabinet_option_values
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active cabinet option values"
ON public.cabinet_option_values
FOR SELECT
USING (active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_cabinet_product_options_updated_at
BEFORE UPDATE ON public.cabinet_product_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_cabinet_product_options_cabinet_type_id ON public.cabinet_product_options(cabinet_type_id);
CREATE INDEX idx_cabinet_product_options_active ON public.cabinet_product_options(active);
CREATE INDEX idx_cabinet_option_values_cabinet_option_id ON public.cabinet_option_values(cabinet_option_id);
CREATE INDEX idx_cabinet_option_values_active ON public.cabinet_option_values(active);