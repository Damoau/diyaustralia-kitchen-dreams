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
  zone: PostcodeZone | null;
  services: {
    flatPack: boolean;
    assembly: boolean;
    depotDelivery: boolean;
    homeDelivery: boolean;
  };
  pricing: {
    assemblyPerCabinet: number;
    deliveryOptions: Array<{
      type: 'depot' | 'home';
      available: boolean;
      basePrice?: number;
    }>;
  };
  leadTime: number;
}

export const usePostcodeServices = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentServices, setCurrentServices] = useState<ServiceAvailability | null>(null);

  const checkPostcodeServices = async (postcode: string): Promise<ServiceAvailability | null> => {
    if (!postcode || postcode.length < 4) {
      setError('Please enter a valid postcode');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Look up postcode in zones table
      const { data: zoneData, error: zoneError } = await supabase
        .from('postcode_zones')
        .select('*')
        .eq('postcode', postcode)
        .maybeSingle();

      if (zoneError) throw zoneError;

      const serviceAvailability: ServiceAvailability = {
        postcode,
        zone: zoneData,
        services: {
          flatPack: true, // Always available
          assembly: zoneData?.assembly_eligible || false,
          depotDelivery: zoneData?.depot_delivery_available || false,
          homeDelivery: zoneData?.home_delivery_available || false,
        },
        pricing: {
          assemblyPerCabinet: zoneData?.assembly_price_per_cabinet || 150.00,
          deliveryOptions: [
            {
              type: 'depot',
              available: zoneData?.depot_delivery_available || false,
              basePrice: zoneData ? 45.00 : undefined, // Base depot pickup fee
            },
            {
              type: 'home',
              available: zoneData?.home_delivery_available || false,
            },
          ],
        },
        leadTime: zoneData?.lead_time_days || 14, // Default to 2 weeks if not in zone
      };

      setCurrentServices(serviceAvailability);
      return serviceAvailability;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check postcode services';
      setError(errorMessage);
      
      // Return basic availability for unknown postcodes
      const fallbackServices: ServiceAvailability = {
        postcode,
        zone: null,
        services: {
          flatPack: true,
          assembly: false,
          depotDelivery: false,
          homeDelivery: false,
        },
        pricing: {
          assemblyPerCabinet: 0,
          deliveryOptions: [
            { type: 'depot', available: false },
            { type: 'home', available: false },
          ],
        },
        leadTime: 21, // Extended lead time for unsupported areas
      };

      setCurrentServices(fallbackServices);
      return fallbackServices;
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