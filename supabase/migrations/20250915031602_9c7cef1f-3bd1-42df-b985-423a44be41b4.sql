-- Step 1c: Add RLS Policies for Core Data Model

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