-- Step 1b: Create Core Data Model Tables

-- 1. User Addresses Table
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

-- 2. Files Management Table
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

-- 3. Products Catalog Table
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

-- 4. Product Options Table (Style, Colour, Finish)
CREATE TABLE public.product_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Door Style', 'Colour', 'Finish'
    display_type TEXT NOT NULL DEFAULT 'dropdown' CHECK (display_type IN ('dropdown', 'swatch', 'button', 'image_swatch')),
    position INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- 5. Option Values Table
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

-- 6. Variants Table (specific product combinations)
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

-- 7. Variant Metafields Table (door.style, door.colour, etc.)
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