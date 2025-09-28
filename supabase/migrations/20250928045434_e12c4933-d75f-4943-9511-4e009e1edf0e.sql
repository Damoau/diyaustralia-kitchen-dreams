-- Populate the empty hardware sets with actual products and quantities

-- First, get the set IDs and product IDs we need
DO $$
DECLARE
    titus_hinge_set_id UUID;
    titus_runner_set_id UUID;
    blum_hinge_set_id UUID;
    blum_runner_set_id UUID;
    
    titus_hinge_product_id UUID;
    titus_soft_close_hinge_id UUID;
    blum_hinge_product_id UUID;
    blum_soft_close_hinge_id UUID;
    
    titus_runner_product_id UUID;
    titus_premium_runner_id UUID;
    blum_runner_product_id UUID;
    blum_antaro_runner_id UUID;
BEGIN
    -- Get hardware set IDs
    SELECT id INTO titus_hinge_set_id FROM hardware_brand_sets WHERE set_name = 'Titus Standard Hinge Set';
    SELECT id INTO titus_runner_set_id FROM hardware_brand_sets WHERE set_name = 'Titus Premium Runner Set';
    SELECT id INTO blum_hinge_set_id FROM hardware_brand_sets WHERE set_name = 'Blum Standard Hinge Set';
    SELECT id INTO blum_runner_set_id FROM hardware_brand_sets WHERE set_name = 'Blum Antaro Runner Set';
    
    -- Get product IDs for Titus hinges
    SELECT hp.id INTO titus_hinge_product_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Titus' AND hp.name = 'Titus 110° Hinge';
    
    SELECT hp.id INTO titus_soft_close_hinge_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Titus' AND hp.name = 'Titus Soft Close Hinge';
    
    -- Get product IDs for Blum hinges  
    SELECT hp.id INTO blum_hinge_product_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Blum' AND hp.name = 'Blum 110 Hinge ';
    
    SELECT hp.id INTO blum_soft_close_hinge_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Blum' AND hp.name = 'Blum Clip Top Soft Close';
    
    -- Get product IDs for runners
    SELECT hp.id INTO titus_runner_product_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Titus' AND hp.name = 'Titus Full Extension Runner';
    
    SELECT hp.id INTO titus_premium_runner_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Titus' AND hp.name = 'Titus Premium Runner';
    
    SELECT hp.id INTO blum_runner_product_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Blum' AND hp.name = 'Blum Antaro Runner (500mm)';
    
    SELECT hp.id INTO blum_antaro_runner_id 
    FROM hardware_products hp
    JOIN hardware_brands hb ON hp.hardware_brand_id = hb.id
    WHERE hb.name = 'Blum' AND hp.name = 'Blum Antaro Drawer System';
    
    -- Clear existing items first (in case some exist)
    DELETE FROM hardware_set_items WHERE hardware_set_id IN (
        titus_hinge_set_id, titus_runner_set_id, blum_hinge_set_id, blum_runner_set_id
    );
    
    -- Populate Titus Standard Hinge Set (2 hinges per door is standard)
    INSERT INTO hardware_set_items (hardware_set_id, hardware_product_id, quantity, display_name) VALUES
    (titus_hinge_set_id, titus_hinge_product_id, 2, 'Standard Hinges (2 per door)');
    
    -- Populate Blum Standard Hinge Set (premium soft close, 2 per door)
    INSERT INTO hardware_set_items (hardware_set_id, hardware_product_id, quantity, display_name) VALUES
    (blum_hinge_set_id, blum_soft_close_hinge_id, 2, 'Soft Close Hinges (2 per door)');
    
    -- Populate Titus Runner Set (1 pair per drawer)
    INSERT INTO hardware_set_items (hardware_set_id, hardware_product_id, quantity, display_name) VALUES
    (titus_runner_set_id, titus_premium_runner_id, 2, 'Premium Runners (1 pair per drawer)');
    
    -- Populate Blum Runner Set (premium system, 1 pair per drawer)  
    INSERT INTO hardware_set_items (hardware_set_id, hardware_product_id, quantity, display_name) VALUES
    (blum_runner_set_id, blum_antaro_runner_id, 1, 'Antaro Drawer System (1 per drawer)');
    
    RAISE NOTICE 'Hardware sets populated successfully';
END $$;