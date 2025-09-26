import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PostcodeZone {
  id: string;
  postcode: string;
  state: string;
  zone: string;
  assembly_eligible: boolean;
  delivery_eligible: boolean;
  depot_delivery_available: boolean;
  home_delivery_available: boolean;
  assembly_price_per_cabinet: number;
  lead_time_days: number;
  metro: boolean;
  remote: boolean;
}

interface ServiceAvailability {
  postcode: string;
  flat_pack_available: boolean;
  assembly_available: boolean;
  depot_delivery_available: boolean;
  door_delivery_available: boolean;
  assembly_lead_time_days: number | null;
  depot_delivery_cost: number;
  door_delivery_cost: number;
  assembly_carcass_surcharge_pct: number;
  assembly_doors_surcharge_pct: number;
}

export const usePostcodeServices = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentServices, setCurrentServices] = useState<ServiceAvailability | null>(null);

  const checkPostcodeServices = async (postcode: string): Promise<ServiceAvailability | null> => {
    setLoading(true);
    setError(null);

    try {
      // Query only postcode_zones table - single source of truth
      const { data, error } = await supabase
        .from('postcode_zones')
        .select('*')
        .eq('postcode', postcode)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return {
          postcode,
          flat_pack_available: false,
          assembly_available: false,
          depot_delivery_available: false,
          door_delivery_available: false,
          assembly_lead_time_days: null,
          depot_delivery_cost: 0,
          door_delivery_cost: 0,
          assembly_carcass_surcharge_pct: 0,
          assembly_doors_surcharge_pct: 0,
        };
      }

      const serviceAvailability: ServiceAvailability = {
        postcode: data.postcode,
        flat_pack_available: data.flat_pack_eligible || false,
        assembly_available: data.assembly_eligible || false,
        depot_delivery_available: data.depot_delivery_eligible || false,
        door_delivery_available: data.door_delivery_eligible || false,
        assembly_lead_time_days: data.assembly_lead_time_days,
        depot_delivery_cost: data.depot_delivery_cost || 0,
        door_delivery_cost: data.door_delivery_cost || 0,
        assembly_carcass_surcharge_pct: data.assembly_carcass_surcharge_pct || 0,
        assembly_doors_surcharge_pct: data.assembly_doors_surcharge_pct || 0,
      };

      setCurrentServices(serviceAvailability);
      return serviceAvailability;
    } catch (error) {
      console.error('Error checking postcode services:', error);
      setError('Failed to check postcode services');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getShippingQuote = async (
    fromPostcode: string,
    toPostcode: string,
    packages: Array<{
      weight_kg: number;
      cubic_m: number;
      length_mm: number;
      width_mm: number;
      height_mm: number;
    }>,
    options: {
      residential?: boolean;
      tailLift?: boolean;
      twoMan?: boolean;
    } = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Get zones for both postcodes
      const [fromZone, toZone] = await Promise.all([
        supabase.from('postcode_zones').select('zone').eq('postcode', fromPostcode).maybeSingle(),
        supabase.from('postcode_zones').select('zone').eq('postcode', toPostcode).maybeSingle(),
      ]);

      if (!fromZone.data?.zone || !toZone.data?.zone) {
        throw new Error('Shipping not available for selected postcodes');
      }

      // Calculate shipping quote using the existing RPC function
      const { data: quote, error: quoteError } = await supabase.rpc(
        'calculate_shipping_quote',
        {
          p_packages: packages,
          p_from_zone: fromZone.data.zone,
          p_to_zone: toZone.data.zone,
          p_residential: options.residential || false,
          p_tail_lift: options.tailLift || false,
        }
      );

      if (quoteError) throw quoteError;

      return quote;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get shipping quote');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkPostcodeServices,
    getShippingQuote,
    currentServices,
    loading,
    error,
  };
};