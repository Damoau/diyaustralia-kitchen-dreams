import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { pricingService } from '@/services/pricingService';

interface UseDynamicPricingProps {
  cabinetTypeId?: string;
  width?: number;
  height?: number;
  depth?: number;
  doorStyleId?: string;
  colorId?: string;
  quantity?: number;
  refreshInterval?: number;
  hardwareBrandId?: string;
}

export const useDynamicPricing = ({
  cabinetTypeId,
  width = 300,
  height = 720,
  depth = 560,
  doorStyleId,
  colorId,
  quantity = 1,
  refreshInterval = 0,
  hardwareBrandId
}: UseDynamicPricingProps = {}) => {

  // Fetch cabinet type
  const { data: cabinetType } = useQuery({
    queryKey: ['cabinet-type', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return null;
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', cabinetTypeId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval
  });

  // Fetch cabinet parts
  const { data: cabinetParts } = useQuery({
    queryKey: ['cabinet-parts', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return [];
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', cabinetTypeId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval
  });

  // Fetch global settings
  const { data: globalSettings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: refreshInterval
  });

  // Fetch door style
  const { data: doorStyle } = useQuery({
    queryKey: ['door-style', doorStyleId],
    queryFn: async () => {
      if (!doorStyleId) return null;
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('id', doorStyleId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!doorStyleId,
    refetchInterval: refreshInterval
  });

  // Fetch color
  const { data: color } = useQuery({
    queryKey: ['color', colorId],
    queryFn: async () => {
      if (!colorId) return null;
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('id', colorId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!colorId,
    refetchInterval: refreshInterval
  });

  // Fetch price ranges
  const { data: priceRanges } = useQuery({
    queryKey: ['price-ranges', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return [];
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval
  });

  // Fetch hardware requirements for this cabinet type
  const { data: hardwareRequirements } = useQuery({
    queryKey: ['hardware-requirements', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return [];
      const { data, error } = await supabase
        .from('cabinet_hardware_requirements')
        .select(`
          *,
          hardware_type:hardware_types(*)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval
  });

  // Fetch hardware options for the selected brand and cabinet type
  const { data: hardwareOptions } = useQuery({
    queryKey: ['hardware-options', cabinetTypeId, hardwareBrandId],
    queryFn: async () => {
      if (!cabinetTypeId || !hardwareBrandId || hardwareBrandId === 'none') return [];
      
      // First get the requirements for this cabinet type
      const { data: requirements, error: reqError } = await supabase
        .from('cabinet_hardware_requirements')
        .select('id')
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true);
      
      if (reqError) throw reqError;
      if (!requirements?.length) return [];
      
      const requirementIds = requirements.map(r => r.id);
      
      // Then get options that match both the brand and these requirements
      const { data, error } = await supabase
        .from('cabinet_hardware_options')
        .select(`
          *,
          hardware_product:hardware_products(*),
          requirement:cabinet_hardware_requirements(
            *,
            hardware_type:hardware_types(*)
          )
        `)
        .eq('hardware_brand_id', hardwareBrandId)
        .eq('active', true)
        .in('requirement_id', requirementIds);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!cabinetTypeId && !!hardwareBrandId && hardwareBrandId !== 'none',
    refetchInterval: refreshInterval
  });

  // Fetch cabinet type finishes
  const { data: cabinetTypeFinishes } = useQuery({
    queryKey: ['cabinet-type-finishes', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return [];
      const { data, error } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(*),
          door_style_finish:door_style_finishes(*),
          color:colors(*)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval
  });

  // Calculate price dynamically
  const calculatedPrice = useMemo(() => {
    if (!cabinetType || !cabinetParts || !globalSettings) {
      return 0;
    }

    try {
      const price = pricingService.calculatePrice({
        cabinetType,
        width,
        height,
        depth,
        cabinetParts,
        globalSettings,
        doorStyle,
        color,
        quantity,
        hardwareBrandId,
        hardwareRequirements: hardwareRequirements || [],
        hardwareOptions: hardwareOptions || []
      });

      console.log('Dynamic pricing result:', {
        cabinetType: cabinetType.name,
        dimensions: { width, height, depth },
        doorStyle: doorStyle?.name,
        color: color?.name,
        quantity,
        calculatedPrice: price
      });

      return price;
    } catch (error) {
      console.error('Error calculating price:', error);
      return 0;
    }
  }, [cabinetType, width, height, depth, cabinetParts, globalSettings, doorStyle, color, quantity, hardwareBrandId, hardwareRequirements, hardwareOptions]);

  // Get price breakdown
  const priceBreakdown = useMemo(() => {
    if (!cabinetType || !cabinetParts || !globalSettings) {
      return null;
    }

    // Trigger calculation to get breakdown
    pricingService.calculatePrice({
      cabinetType,
      width,
      height,
      depth,
      cabinetParts,
      globalSettings,
      doorStyle,
      color,
      quantity,
      hardwareBrandId,
      hardwareRequirements: hardwareRequirements || [],
      hardwareOptions: hardwareOptions || []
    });

    return pricingService.getLastBreakdown();
  }, [cabinetType, width, height, depth, cabinetParts, globalSettings, doorStyle, color, quantity, hardwareBrandId, hardwareRequirements, hardwareOptions]);

  // Generate price table data
  const priceTableData = useMemo(() => {
    if (!cabinetType || !cabinetParts || !globalSettings || !cabinetTypeFinishes) {
      return null;
    }

    try {
      return pricingService.generateTableData({
        cabinetType,
        cabinetParts,
        globalSettings,
        priceRanges: priceRanges || [],
        cabinetTypeFinishes
      });
    } catch (error) {
      console.error('Error generating price table data:', error);
      return null;
    }
  }, [cabinetType, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes]);

  // Loading state
  const isLoading = !cabinetType || !cabinetParts || !globalSettings;

  // Function to calculate price with custom parameters
  const calculateCustomPrice = useMemo(() => {
    return (params: {
      width?: number;
      height?: number;
      depth?: number;
      doorStyleId?: string;
      colorId?: string;
      quantity?: number;
      hardwareBrandId?: string;
    }) => {
      if (!cabinetType || !cabinetParts || !globalSettings) {
        return 0;
      }

      return pricingService.calculatePrice({
        cabinetType,
        width: params.width || width,
        height: params.height || height,
        depth: params.depth || depth,
        cabinetParts,
        globalSettings,
        doorStyle: params.doorStyleId === doorStyleId ? doorStyle : null,
        color: params.colorId === colorId ? color : null,
        quantity: params.quantity || quantity,
        hardwareBrandId: params.hardwareBrandId || hardwareBrandId,
        hardwareRequirements: hardwareRequirements || [],
        hardwareOptions: hardwareOptions || []
      });
    };
  }, [cabinetType, cabinetParts, globalSettings, doorStyle, color, width, height, depth, quantity, doorStyleId, colorId, hardwareBrandId, hardwareRequirements, hardwareOptions]);

  return {
    // Data
    cabinetType,
    cabinetParts,
    globalSettings,
    doorStyle,
    color,
    priceRanges,
    cabinetTypeFinishes,
    hardwareRequirements,
    hardwareOptions,
    
    // Calculated values
    price: calculatedPrice,
    priceBreakdown,
    priceTableData,
    
    // State
    isLoading,
    
    // Functions
    calculateCustomPrice
  };
};