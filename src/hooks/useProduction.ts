import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductionOrder {
  id: string;
  order_number: string;
  customer_name: string;
  production_status: string;
  stage: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  cutlist_generated: boolean;
  qc_passed: boolean;
  notes: string;
}

export interface ProductionUpdate {
  id: string;
  order_id: string;
  stage: string;
  notes: string;
  created_at: string;
  created_by: string;
}

export interface CutlistItem {
  id: string;
  part_name: string;
  material: string;
  width_mm: number;
  height_mm: number;
  thickness_mm: number;
  quantity: number;
  grain_direction: string;
  edge_banding: string;
  notes: string;
}

export const useProduction = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getProductionOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          production_status,
          created_at,
          notes
        `)
        .in('status', ['confirmed', 'in_production', 'ready_for_shipping'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedOrders: ProductionOrder[] = data.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: 'Customer', // Simplified for now
        production_status: order.production_status || 'pending',
        stage: order.production_status || 'pending',
        priority: 'medium',
        due_date: null,
        created_at: order.created_at,
        cutlist_generated: false,
        qc_passed: false,
        notes: order.notes || ''
      }));

      return formattedOrders;
    } catch (error) {
      console.error('Error fetching production orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch production orders",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateProductionStage = async (orderId: string, stage: string, notes?: string) => {
    setLoading(true);
    try {
      const updateData = {
        orderId,
        stage,
        notes: notes || undefined
      };

      const { error } = await supabase.functions.invoke('orders-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Production stage updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating production stage:', error);
      toast({
        title: "Error",
        description: "Failed to update production stage",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getProductionUpdates = async (orderId: string) => {
    try {
      const { data } = await supabase.functions.invoke('orders-production', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      return data?.updates || [];
    } catch (error) {
      console.error('Error fetching production updates:', error);
      return [];
    }
  };

  const generateCutlist = async (orderId: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would generate a cutlist based on order items
      // For now, we'll just mark the cutlist as generated
      const { error } = await supabase
        .from('orders')
        .update({ notes: 'Cut list generated' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cut list generated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error generating cutlist:', error);
      toast({
        title: "Error",
        description: "Failed to generate cut list",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const scheduleTask = async (orderId: string, taskType: string, scheduledFor: Date) => {
    setLoading(true);
    try {
      // This would integrate with a scheduling system
      // For now, we'll update the production stage
      await updateProductionStage(orderId, taskType, `Scheduled for ${scheduledFor.toLocaleString()}`);
      
      return true;
    } catch (error) {
      console.error('Error scheduling task:', error);
      toast({
        title: "Error",
        description: "Failed to schedule task",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getProductionOrders,
    updateProductionStage,
    getProductionUpdates,
    generateCutlist,
    scheduleTask
  };
};