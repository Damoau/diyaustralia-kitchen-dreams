import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerApproval {
  id: string;
  order_id: string;
  final_measurements_confirmed: boolean;
  style_colour_finish_confirmed: boolean;
  final_measurements_confirmed_at: string | null;
  style_colour_finish_confirmed_at: string | null;
  signature_required: boolean;
  signature_completed_at: string | null;
  all_approvals_completed_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const useApprovals = (orderId: string) => {
  const [approvals, setApprovals] = useState<CustomerApproval | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchApprovals = async () => {
    if (!orderId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('customer_approvals')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      setApprovals(data);
    } catch (err: any) {
      console.error('Error fetching approvals:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateApproval = async (field: string, value: boolean) => {
    if (!approvals) return;
    
    try {
      const user = await supabase.auth.getUser();
      
      const updateData: any = {
        [field]: value,
        [`${field}_at`]: value ? new Date().toISOString() : null,
        [`${field}_by`]: value ? user.data.user?.id : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('customer_approvals')
        .update(updateData)
        .eq('id', approvals.id);

      if (error) throw error;

      // Optimistically update local state
      setApprovals(prev => prev ? { ...prev, ...updateData } : null);

      toast({
        title: "Approval Updated",
        description: `${field.replace(/_/g, ' ')} has been ${value ? 'confirmed' : 'reset'}.`,
      });

      // Refresh to get computed fields like all_approvals_completed_at
      await fetchApprovals();
      
    } catch (error: any) {
      console.error('Error updating approval:', error);
      toast({
        title: "Error",
        description: "Failed to update approval. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = () => {
    if (!approvals) return 0;
    
    let completed = 0;
    let total = 2; // measurements + style_colour_finish
    
    if (approvals.final_measurements_confirmed) completed++;
    if (approvals.style_colour_finish_confirmed) completed++;
    
    if (approvals.signature_required) {
      total++;
      if (approvals.signature_completed_at) completed++;
    }
    
    return Math.round((completed / total) * 100);
  };

  const isFullyApproved = () => {
    return !!approvals?.all_approvals_completed_at;
  };

  const canProceedToProduction = () => {
    if (!approvals) return false;
    return approvals.final_measurements_confirmed && 
           approvals.style_colour_finish_confirmed && 
           (!approvals.signature_required || approvals.signature_completed_at);
  };

  // Set up real-time subscription for approvals updates
  useEffect(() => {
    if (!orderId) return;

    fetchApprovals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`approvals-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_approvals',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('Approvals updated:', payload);
          fetchApprovals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return {
    approvals,
    isLoading,
    error,
    updateApproval,
    fetchApprovals,
    getProgressPercentage,
    isFullyApproved,
    canProceedToProduction
  };
};