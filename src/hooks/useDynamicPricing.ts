import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CabinetType, CabinetPart, GlobalSettings } from '@/types/cabinet';
import { pricingService } from '@/services/pricingService';

interface UseDynamicPricingProps {
  cabinetTypeId?: string;
  width?: number;
  height?: number;
  depth?: number;
  doorStyleId?: string;
  colorId?: string;
  quantity?: number;
  refreshInterval?: number; // Auto-refresh interval in ms
}

export function useDynamicPricing({
  cabinetTypeId,
  width,
  height,
  depth,
  doorStyleId,
  colorId,
  quantity = 1,
  refreshInterval = 30000 // 30 seconds default
}: UseDynamicPricingProps = {}) {
  const [lastCalculation, setLastCalculation] = useState<any>(null);

  // Fetch cabinet type data
  const { data: cabinetType } = useQuery({
    queryKey: ['cabinetType', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return null;
      const { data, error } = await supabase
        .from('cabinet_types')
        .select('*')
        .eq('id', cabinetTypeId)
        .eq('active', true)
        .single();
      
      if (error) throw error;
      return data as CabinetType;
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval,
  });

  // Fetch cabinet parts
  const { data: cabinetParts } = useQuery({
    queryKey: ['cabinetParts', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return [];
      const { data, error } = await supabase
        .from('cabinet_parts')
        .select('*')
        .eq('cabinet_type_id', cabinetTypeId);
      
      if (error) throw error;
      return data as CabinetPart[];
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval,
  });

  // Fetch global settings
  const { data: globalSettings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*');
      
      if (error) throw error;
      return data as GlobalSettings[];
    },
    refetchInterval: refreshInterval,
  });

  // Fetch door style
  const { data: doorStyle } = useQuery({
    queryKey: ['doorStyle', doorStyleId],
    queryFn: async () => {
      if (!doorStyleId) return null;
      const { data, error } = await supabase
        .from('door_styles')
        .select('*')
        .eq('id', doorStyleId)
        .eq('active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!doorStyleId,
    refetchInterval: refreshInterval,
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
        .eq('active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!colorId,
    refetchInterval: refreshInterval,
  });

  // Fetch price ranges for the cabinet type
  const { data: priceRanges } = useQuery({
    queryKey: ['priceRanges', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return [];
      const { data, error } = await supabase
        .from('cabinet_type_price_ranges')
        .select('*')
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval,
  });

  // Fetch cabinet type finishes
  const { data: cabinetTypeFinishes } = useQuery({
    queryKey: ['cabinetTypeFinishes', cabinetTypeId],
    queryFn: async () => {
      if (!cabinetTypeId) return [];
      const { data, error } = await supabase
        .from('cabinet_type_finishes')
        .select(`
          *,
          door_style:door_styles(*),
          color:colors(*),
          door_style_finish:door_style_finishes(*)
        `)
        .eq('cabinet_type_id', cabinetTypeId)
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!cabinetTypeId,
    refetchInterval: refreshInterval,
  });

  // Calculate price dynamically
  const calculatedPrice = useMemo(() => {
    if (!cabinetType || !cabinetParts || !globalSettings) {
      return null;
    }

    const effectiveWidth = width || cabinetType.default_width_mm;
    const effectiveHeight = height || cabinetType.default_height_mm;
    const effectiveDepth = depth || cabinetType.default_depth_mm;

    try {
      const price = pricingService.calculatePrice({
        cabinetType,
        width: effectiveWidth,
        height: effectiveHeight,
        depth: effectiveDepth,
        cabinetParts,
        globalSettings,
        doorStyle,
        color,
        quantity
      });

      const calculation = {
        price,
        breakdown: pricingService.getLastBreakdown(),
        timestamp: new Date().toISOString(),
        parameters: {
          cabinetTypeId,
          width: effectiveWidth,
          height: effectiveHeight,
          depth: effectiveDepth,
          doorStyleId,
          colorId,
          quantity
        }
      };

      setLastCalculation(calculation);
      return calculation;
    } catch (error) {
      console.error('Price calculation error:', error);
      return null;
    }
  }, [
    cabinetType,
    cabinetParts,
    globalSettings,
    doorStyle,
    color,
    width,
    height,
    depth,
    quantity,
    cabinetTypeId,
    doorStyleId,
    colorId
  ]);

  // Generate price table data for all finishes and ranges
  const priceTableData = useMemo(() => {
    if (!cabinetType || !cabinetParts || !globalSettings || !priceRanges || !cabinetTypeFinishes) {
      return null;
    }

    try {
      return pricingService.generateTableData({
        cabinetType,
        cabinetParts,
        globalSettings,
        priceRanges,
        cabinetTypeFinishes
      });
    } catch (error) {
      console.error('Price table generation error:', error);
      return null;
    }
  }, [cabinetType, cabinetParts, globalSettings, priceRanges, cabinetTypeFinishes]);

  return {
    // Data
    cabinetType,
    cabinetParts,
    globalSettings,
    doorStyle,
    color,
    priceRanges,
    cabinetTypeFinishes,
    
    // Calculated results
    price: calculatedPrice?.price || 0,
    priceBreakdown: calculatedPrice?.breakdown || null,
    priceTableData,
    lastCalculation,
    
    // Loading states
    isLoading: !cabinetType && !!cabinetTypeId,
    
    // Utility functions
    calculateCustomPrice: (customParams: {
      width?: number;
      height?: number;
      depth?: number;
      doorStyleId?: string;
      colorId?: string;
      quantity?: number;
    }) => {
      if (!cabinetType || !cabinetParts || !globalSettings) return 0;
      
      return pricingService.calculatePrice({
        cabinetType,
        width: customParams.width || cabinetType.default_width_mm,
        height: customParams.height || cabinetType.default_height_mm,
        depth: customParams.depth || cabinetType.default_depth_mm,
        cabinetParts,
        globalSettings,
        doorStyle: customParams.doorStyleId === doorStyleId ? doorStyle : null,
        color: customParams.colorId === colorId ? color : null,
        quantity: customParams.quantity || 1
      });
    }
  };
}