import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  handle: string;
  product_type: string;
  status: string;
  description?: string;
  thumbnail_url?: string;
}

interface ProductOption {
  id: string;
  name: string;
  display_type: string;
  position: number;
  option_values: OptionValue[];
}

interface OptionValue {
  id: string;
  value: string;
  code: string;
  swatch_hex?: string;
  sort_order: number;
  is_active: boolean;
}

interface Variant {
  id: string;
  sku: string;
  option_value_ids: string[];
  width_mm?: number;
  height_mm?: number;
  length_mm?: number;
  weight_kg?: number;
  is_active: boolean;
}

interface CabinetTypeLink {
  cabinet_type_id: string;
  variant_id: string;
}

export function useProductIntegration() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cabinetProducts, setCabinetProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setProducts(data);
        setCabinetProducts(data.filter(p => p.product_type === 'cabinet'));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const getProductOptions = async (productId: string): Promise<ProductOption[]> => {
    try {
      const { data, error } = await supabase
        .from('product_options')
        .select(`
          *,
          option_values (*)
        `)
        .eq('product_id', productId)
        .order('position');

      if (error) throw error;
      
      return data?.map(option => ({
        ...option,
        option_values: option.option_values.sort((a: any, b: any) => a.sort_order - b.sort_order)
      })) || [];
    } catch (error) {
      console.error('Error fetching product options:', error);
      return [];
    }
  };

  const getVariants = async (productId: string): Promise<Variant[]> => {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching variants:', error);
      return [];
    }
  };

  const getCabinetTypeFromVariant = async (variantId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('variant_metafields')
        .select('value_json')
        .eq('variant_id', variantId)
        .eq('key', 'cabinet_type_id')
        .single();

      if (error) throw error;
      return data?.value_json ? String(data.value_json).replace(/"/g, '') : null;
    } catch (error) {
      console.error('Error fetching cabinet type link:', error);
      return null;
    }
  };

  const createVariantForConfiguration = async (
    productId: string, 
    optionSelections: Record<string, string>,
    dimensions?: { width: number; height: number; depth: number }
  ): Promise<Variant | null> => {
    try {
      // Get the option value IDs from selections
      const optionValueIds: string[] = [];
      
      for (const [optionName, selectedCode] of Object.entries(optionSelections)) {
        const { data, error } = await supabase
          .from('option_values')
          .select('id')
          .eq('code', selectedCode)
          .single();
        
        if (error) throw error;
        if (data) optionValueIds.push(data.id);
      }

      // Generate SKU based on selections
      const timestamp = Date.now().toString().slice(-6);
      const sku = `VAR-${productId.slice(0, 8).toUpperCase()}-${timestamp}`;

      const variantData = {
        product_id: productId,
        sku,
        option_value_ids: optionValueIds,
        width_mm: dimensions?.width,
        height_mm: dimensions?.height,
        length_mm: dimensions?.depth,
        is_active: true,
        lead_time_days: 14
      };

      const { data, error } = await supabase
        .from('variants')
        .insert(variantData)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating variant:', error);
      toast({
        title: "Error",
        description: "Failed to create product variant",
        variant: "destructive",
      });
      return null;
    }
  };

  const calculatePriceFromVariant = async (variantId: string): Promise<number> => {
    try {
      // Get cabinet type from variant metafields
      const cabinetTypeId = await getCabinetTypeFromVariant(variantId);
      if (!cabinetTypeId) return 0;

      // Get variant details
      const { data: variant, error: variantError } = await supabase
        .from('variants')
        .select('*, option_value_ids')
        .eq('id', variantId)
        .single();

      if (variantError) throw variantError;

      // Get cabinet type for base pricing
      const { data: cabinetType, error: cabinetError } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', cabinetTypeId)
        .single();

      if (cabinetError) throw cabinetError;

      // Get global settings for pricing calculation
      const { data: settings, error: settingsError } = await supabase
        .from('global_settings')
        .select('*');

      if (settingsError) throw settingsError;

      // Use existing pricing calculation logic 
      const { calculateCabinetPrice } = await import('@/lib/dynamicPricing');
      
      const price = calculateCabinetPrice(
        cabinetType as any, // Cast to avoid type mismatch with DB vs TypeScript types
        variant.width_mm || cabinetType.default_width_mm,
        variant.height_mm || cabinetType.default_height_mm,
        variant.length_mm || cabinetType.default_depth_mm,
        null, // finish
        null, // doorStyle
        null, // color
        [], // parts
        settings || []
      );

      return price;
    } catch (error) {
      console.error('Error calculating price:', error);
      return 0;
    }
  };

  return {
    products,
    cabinetProducts,
    loading,
    fetchProducts,
    getProductOptions,
    getVariants,
    getCabinetTypeFromVariant,
    createVariantForConfiguration,
    calculatePriceFromVariant,
    refreshProducts: fetchProducts
  };
}