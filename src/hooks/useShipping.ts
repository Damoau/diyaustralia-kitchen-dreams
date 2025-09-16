import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShippingQuote {
  carrier: string;
  service_name: string;
  total_weight_kg: number;
  total_cubic_m: number;
  total_ex_gst: number;
  gst: number;
  total_inc_gst: number;
  base_cost?: number;
  weight_cost?: number;
  cubic_cost?: number;
  fuel_levy?: number;
  surcharges?: number;
}

export interface ShipmentPackage {
  kind: 'carton' | 'pallet' | 'bundle' | 'crate';
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
  cubic_m?: number;
  fragile?: boolean;
  stackable?: boolean;
  contents?: any;
}

export interface PostcodeZone {
  id: string;
  state: string;
  postcode: string;
  zone: string;
  assembly_eligible: boolean;
  delivery_eligible: boolean;
  lead_time_days: number;
  metro: boolean;
  remote: boolean;
}

export const useShipping = () => {
  const [loading, setLoading] = useState(false);
  const [postcodeZones, setPostcodeZones] = useState<PostcodeZone[]>([]);
  const { toast } = useToast();

  const getShippingQuote = useCallback(async (
    packages: ShipmentPackage[],
    fromZone: string,
    toZone: string,
    options: {
      residential?: boolean;
      tailLift?: boolean;
      twoMan?: boolean;
    } = {}
  ): Promise<ShippingQuote | null> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('calculate_shipping_quote', {
        p_packages: JSON.parse(JSON.stringify(packages)), // Ensure JSON compatibility
        p_from_zone: fromZone,
        p_to_zone: toZone,
        p_residential: options.residential || false,
        p_tail_lift: options.tailLift || false
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data) {
        toast({
          title: "Quote Error",
          description: data.error as string,
          variant: "destructive",
        });
        return null;
      }

      return data ? (data as unknown as ShippingQuote) : null;
    } catch (error: any) {
      console.error('Error getting shipping quote:', error);
      toast({
        title: "Error",
        description: "Failed to get shipping quote",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getPostcodeZone = useCallback(async (postcode: string): Promise<PostcodeZone | null> => {
    try {
      const { data, error } = await supabase
        .from('postcode_zones')
        .select('*')
        .eq('postcode', postcode)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting postcode zone:', error);
      return null;
    }
  }, []);

  const loadPostcodeZones = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('postcode_zones')
        .select('*')
        .order('state', { ascending: true })
        .order('postcode', { ascending: true });

      if (error) throw error;

      setPostcodeZones(data || []);
    } catch (error: any) {
      console.error('Error loading postcode zones:', error);
      toast({
        title: "Error",
        description: "Failed to load postcode zones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createShipment = useCallback(async (shipmentData: {
    order_id: string;
    method: 'pickup' | 'depot' | 'door' | 'assembly';
    carrier?: string;
    delivery_address?: any;
    packages?: ShipmentPackage[];
    notes?: string;
  }) => {
    try {
      setLoading(true);

      const response = await supabase.functions.invoke('orders-fulfilment', {
        body: {
          ...shipmentData,
          action: 'shipments'
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Shipment created successfully",
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create shipment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateShipmentStatus = useCallback(async (shipmentId: string, updates: any) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipment updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to update shipment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getOrderShipments = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          shipment_packages(*),
          exceptions(*)
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting order shipments:', error);
      return [];
    }
  }, []);

  const autoPackOrder = useCallback(async (orderId: string) => {
    try {
      setLoading(true);

      // For now, implement a simple auto-pack logic
      // In a real system, this would be more sophisticated
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          *,
          cabinet_types(*)
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      const packages: ShipmentPackage[] = [];
      
      // Group items by category and create packages
      const baseItems = orderItems.filter(item => item.cabinet_types?.category === 'base-cabinets');
      const topItems = orderItems.filter(item => item.cabinet_types?.category === 'top-cabinets');
      const otherItems = orderItems.filter(item => 
        item.cabinet_types?.category !== 'base-cabinets' && 
        item.cabinet_types?.category !== 'top-cabinets'
      );

      // Base cabinets - typically go on pallets
      if (baseItems.length > 0) {
        packages.push({
          kind: 'pallet',
          length_mm: 1200,
          width_mm: 800,
          height_mm: Math.max(...baseItems.map(item => item.height_mm || 800)),
          weight_kg: baseItems.reduce((total, item) => total + (item.quantity * 25), 0), // 25kg per base cabinet
          fragile: false,
          stackable: false,
          contents: baseItems.map(item => ({
            item_id: item.id,
            cabinet_name: item.cabinet_types?.name,
            quantity: item.quantity
          }))
        });
      }

      // Top cabinets - can go in cartons
      if (topItems.length > 0) {
        packages.push({
          kind: 'carton',
          length_mm: 800,
          width_mm: 600,
          height_mm: Math.max(...topItems.map(item => item.height_mm || 600)),
          weight_kg: topItems.reduce((total, item) => total + (item.quantity * 15), 0), // 15kg per top cabinet
          fragile: false,
          stackable: true,
          contents: topItems.map(item => ({
            item_id: item.id,
            cabinet_name: item.cabinet_types?.name,
            quantity: item.quantity
          }))
        });
      }

      // Other items
      if (otherItems.length > 0) {
        packages.push({
          kind: 'carton',
          length_mm: 600,
          width_mm: 400,
          height_mm: 300,
          weight_kg: otherItems.reduce((total, item) => total + (item.quantity * 5), 0),
          fragile: false,
          stackable: true,
          contents: otherItems.map(item => ({
            item_id: item.id,
            cabinet_name: item.cabinet_types?.name,
            quantity: item.quantity
          }))
        });
      }

      return packages;
    } catch (error: any) {
      console.error('Error auto-packing order:', error);
      toast({
        title: "Error",
        description: "Failed to auto-pack order",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    postcodeZones,
    getShippingQuote,
    getPostcodeZone,
    loadPostcodeZones,
    createShipment,
    updateShipmentStatus,
    getOrderShipments,
    autoPackOrder
  };
};
