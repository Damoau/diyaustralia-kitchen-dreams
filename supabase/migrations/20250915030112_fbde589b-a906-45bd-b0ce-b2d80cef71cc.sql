-- Step 1: Enhanced Roles & Core Data Model Foundation

-- 1. Expand Role System
ALTER TYPE public.app_role ADD VALUE 'customer';
ALTER TYPE public.app_role ADD VALUE 'sales_rep';
ALTER TYPE public.app_role ADD VALUE 'fulfilment';

-- 2. User Addresses Table
CREATE TABLE public.addresses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('billing', 'shipping')),
    name TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    suburb TEXT NOT NULL,
    state TEXT NOT NULL,
    postcode TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Australia',
    phone TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 3. Files Management Table
CREATE TABLE public.files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('plan', 'photo', 'spec', 'other')),
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    sha256_hash TEXT,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'customer')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 4. Products Catalog Table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    description TEXT,
    vendor TEXT DEFAULT 'DIY Australia',
    product_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    thumbnail_url TEXT,
    tax_exempt BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Product Options Table (Style, Colour, Finish)
CREATE TABLE public.product_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Door Style', 'Colour', 'Finish'
    display_type TEXT NOT NULL DEFAULT 'dropdown' CHECK (display_type IN ('dropdown', 'swatch', 'button', 'image_swatch')),
    position INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- 6. Option Values Table
CREATE TABLE public.option_values (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    value TEXT NOT NULL, -- e.g., 'Shadowline', 'White', 'Matte'
    code TEXT, -- normalized code for system use
    swatch_hex TEXT, -- for colour swatches
    image_url TEXT, -- for image swatches
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.option_values ENABLE ROW LEVEL SECURITY;

-- 7. Variants Table (specific product combinations)
CREATE TABLE public.variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    option_value_ids UUID[] NOT NULL, -- array of option_value IDs
    barcode TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    lead_time_days INTEGER DEFAULT 14,
    weight_kg DECIMAL(10,3),
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;

-- 8. Variant Metafields Table (door.style, door.colour, etc.)
CREATE TABLE public.variant_metafields (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
    key TEXT NOT NULL, -- e.g., 'door.style', 'door.colour', 'hardware.package'
    value_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(variant_id, key)
);

ALTER TABLE public.variant_metafields ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_addresses_type ON public.addresses(type);
CREATE INDEX idx_files_owner_user_id ON public.files(owner_user_id);
CREATE INDEX idx_files_kind ON public.files(kind);
CREATE INDEX idx_products_handle ON public.products(handle);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_product_options_product_id ON public.product_options(product_id);
CREATE INDEX idx_option_values_product_option_id ON public.option_values(product_option_id);
CREATE INDEX idx_variants_product_id ON public.variants(product_id);
CREATE INDEX idx_variants_sku ON public.variants(sku);
CREATE INDEX idx_variant_metafields_variant_id ON public.variant_metafields(variant_id);
CREATE INDEX idx_variant_metafields_key ON public.variant_metafields(key);

-- RLS Policies

-- Addresses: Users can manage their own addresses
CREATE POLICY "Users can manage their own addresses"
    ON public.addresses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and sales reps can manage all addresses"
    ON public.addresses
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales_rep'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales_rep'::app_role));

-- Files: Users can manage their own files, staff can see customer files
CREATE POLICY "Users can manage their own files"
    ON public.files
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Staff can view customer files"
    ON public.files
    FOR SELECT
    USING (
        has_role(auth.uid(), 'admin'::app_role) OR 
        has_role(auth.uid(), 'sales_rep'::app_role) OR 
        has_role(auth.uid(), 'fulfilment'::app_role)
    );

CREATE POLICY "Admins can manage all files"
    ON public.files
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Products: Public read for active, admin/sales manage all
CREATE POLICY "Anyone can view active products"
    ON public.products
    FOR SELECT
    USING (status = 'active');

CREATE POLICY "Admins can manage all products"
    ON public.products
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales reps can view all products"
    ON public.products
    FOR SELECT
    USING (has_role(auth.uid(), 'sales_rep'::app_role));

-- Product Options: Public read for active products, admin manage
CREATE POLICY "Anyone can view product options for active products"
    ON public.product_options
    FOR SELECT
    USING (
        product_id IN (SELECT id FROM public.products WHERE status = 'active')
    );

CREATE POLICY "Admins can manage product options"
    ON public.product_options
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Option Values: Public read for active, admin manage
CREATE POLICY "Anyone can view active option values"
    ON public.option_values
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage option values"
    ON public.option_values
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Variants: Public read for active, admin manage
CREATE POLICY "Anyone can view active variants"
    ON public.variants
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage variants"
    ON public.variants
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Variant Metafields: Public read, admin manage
CREATE POLICY "Anyone can view variant metafields"
    ON public.variant_metafields
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage variant metafields"
    ON public.variant_metafields
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update triggers for updated_at columns
CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_variants_updated_at
    BEFORE UPDATE ON public.variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();