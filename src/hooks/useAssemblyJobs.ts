import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AssemblyJob {
  id: string;
  order_id: string;
  shipment_id?: string;
  status: string;
  components_included: string;
  hours_estimated?: number;
  hours_actual?: number;
  price_ex_gst: number;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  assigned_team?: string;
  customer_notes?: string;
  technician_notes?: string;
  site_photos?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Relations
  orders?: {
    order_number: string;
    customer_email: string;
  };
  shipments?: {
    tracking_number?: string;
    delivery_address?: any;
  };
}

export interface AssemblyStats {
  inProgress: number;
  pending: number;
  completedToday: number;
  behindSchedule: number;
  totalRevenue: number;
}

export const useAssemblyJobs = () => {
  const [jobs, setJobs] = useState<AssemblyJob[]>([]);
  const [stats, setStats] = useState<AssemblyStats>({
    inProgress: 0,
    pending: 0,
    completedToday: 0,
    behindSchedule: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAssemblyJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('assembly_jobs')
        .select(`
          *,
          orders!inner (
            order_number
          ),
          shipments (
            tracking_number,
            delivery_address
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const typedData = (data || []).map(item => ({
        ...item,
        orders: item.orders ? {
          order_number: item.orders.order_number,
          customer_email: 'N/A', // Not available in orders table
        } : undefined
      })) as AssemblyJob[];

      setJobs(typedData);
      calculateStats(typedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assembly jobs';
      setError(errorMessage);
      console.error('Error loading assembly jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (jobsData: AssemblyJob[]) => {
    const today = new Date().toDateString();
    const now = new Date();

    const stats: AssemblyStats = {
      inProgress: jobsData.filter(job => job.status === 'in_progress').length,
      pending: jobsData.filter(job => job.status === 'pending' || job.status === 'scheduled').length,
      completedToday: jobsData.filter(job => {
        if (job.status !== 'completed' || !job.completed_at) return false;
        return new Date(job.completed_at).toDateString() === today;
      }).length,
      behindSchedule: jobsData.filter(job => {
        if (job.status === 'completed' || job.status === 'cancelled') return false;
        if (!job.scheduled_for) return false;
        return new Date(job.scheduled_for) < now;
      }).length,
      totalRevenue: jobsData
        .filter(job => job.status === 'completed')
        .reduce((total, job) => total + (job.price_ex_gst * 1.1), 0), // Include GST
    };

    setStats(stats);
  };

  const createAssemblyJob = async (jobData: any) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('assembly-jobs-manager', {
        body: jobData
      });

      if (error) throw error;

      if (data?.job) {
        const typedData = {
          ...data.job,
          orders: data.job.orders ? {
            order_number: data.job.orders.order_number,
            customer_email: 'N/A',
          } : undefined
        } as AssemblyJob;

        setJobs(prev => [typedData, ...prev]);
        calculateStats([typedData, ...jobs]);
      }

      toast({
        title: "Success",
        description: data?.message || "Assembly job created successfully",
      });

      return data?.job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create assembly job';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAssemblyJob = async (id: string, updates: any) => {
    try {
      setLoading(true);

      const updateData = {
        status: updates.status,
        components_included: updates.components_included,
        hours_estimated: updates.hours_estimated,
        hours_actual: updates.hours_actual,
        price_ex_gst: updates.price_ex_gst,
        scheduled_for: updates.scheduled_for,
        started_at: updates.started_at,
        completed_at: updates.completed_at,
        assigned_team: updates.assigned_team,
        customer_notes: updates.customer_notes,
        technician_notes: updates.technician_notes,
        site_photos: updates.site_photos,
      };

      const { data, error } = await supabase
        .from('assembly_jobs')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          orders!inner (
            order_number
          )
        `)
        .single();

      if (error) throw error;

      if (!data) throw new Error('No data returned from update');

      const typedData = {
        ...data,
        orders: data.orders ? {
          order_number: data.orders.order_number,
          customer_email: 'N/A',
        } : undefined
      } as AssemblyJob;

      setJobs(prev => prev.map(job => job.id === id ? typedData : job));
      calculateStats(jobs.map(job => job.id === id ? typedData : job));

      toast({
        title: "Success",
        description: "Assembly job updated successfully",
      });

      return typedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assembly job';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssemblyJob = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('assembly_jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobs(prev => prev.filter(job => job.id !== id));
      calculateStats(jobs.filter(job => job.id !== id));

      toast({
        title: "Success",
        description: "Assembly job deleted successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete assembly job';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const scheduleJob = async (id: string, scheduledFor: string, assignedTeam?: string) => {
    return updateAssemblyJob(id, {
      status: 'scheduled',
      scheduled_for: scheduledFor,
      assigned_team: assignedTeam,
    });
  };

  const startJob = async (id: string, notes?: string) => {
    return updateAssemblyJob(id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
      technician_notes: notes,
    });
  };

  const completeJob = async (id: string, hoursActual?: number, notes?: string, photos?: any) => {
    return updateAssemblyJob(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      hours_actual: hoursActual,
      technician_notes: notes,
      site_photos: photos,
    });
  };

  useEffect(() => {
    loadAssemblyJobs();
  }, []);

  return {
    jobs,
    stats,
    loading,
    error,
    loadAssemblyJobs,
    createAssemblyJob,
    updateAssemblyJob,
    deleteAssemblyJob,
    scheduleJob,
    startJob,
    completeJob,
  };
};