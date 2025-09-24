import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at?: string;
  last_sign_in_at?: string;
  roles: Array<{
    id: string;
    user_id: string;
    role: 'admin' | 'sales_rep' | 'fulfilment' | 'customer';
    created_at?: string;
  }>;
  orders_count?: number;
  quotes_count?: number;
  total_spent?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newThisMonth: number;
  customerUsers: number;
  salesReps: number;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newThisMonth: 0,
    customerUsers: 0,
    salesReps: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('admin-get-users');

      if (error) throw error;

      const usersWithStats = await Promise.all(
        data.users.map(async (user: UserProfile) => {
          // Fetch order count
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Fetch quote count
          const { count: quotesCount } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Fetch total spent
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id)
            .eq('status', 'completed');

          const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

          return {
            ...user,
            orders_count: ordersCount || 0,
            quotes_count: quotesCount || 0,
            total_spent: totalSpent
          };
        })
      );

      setUsers(usersWithStats);

      // Calculate stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const newStats: UserStats = {
        totalUsers: usersWithStats.length,
        activeUsers: usersWithStats.filter(u => !!u.email_confirmed_at).length,
        adminUsers: usersWithStats.filter(u => u.roles.some(r => r.role === 'admin')).length,
        newThisMonth: usersWithStats.filter(u => 
          u.created_at && new Date(u.created_at) >= thisMonth
        ).length,
        customerUsers: usersWithStats.filter(u => 
          u.roles.length === 0 || u.roles.some(r => r.role === 'customer')
        ).length,
        salesReps: usersWithStats.filter(u => u.roles.some(r => r.role === 'sales_rep')).length
      };

      setStats(newStats);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const assignRole = useCallback(async (userId: string, role: 'admin' | 'sales_rep' | 'fulfilment' | 'customer') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role ${role} assigned successfully`
      });

      fetchUsers();
    } catch (err: any) {
      console.error('Error assigning role:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to assign role",
        variant: "destructive"
      });
    }
  }, [fetchUsers, toast]);

  const removeRole = useCallback(async (userId: string, role: 'admin' | 'sales_rep' | 'fulfilment' | 'customer') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role ${role} removed successfully`
      });

      fetchUsers();
    } catch (err: any) {
      console.error('Error removing role:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to remove role",
        variant: "destructive"
      });
    }
  }, [fetchUsers, toast]);

  const deleteUser = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${email} deleted successfully`
      });

      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  }, [fetchUsers, toast]);

  const updateUserStatus = useCallback(async (userId: string, action: 'activate' | 'deactivate') => {
    try {
      // This would typically involve calling a Supabase admin function
      // For now, we'll just refresh the data
      toast({
        title: "Info",
        description: `User ${action} functionality would be implemented here`
      });
    } catch (err: any) {
      console.error('Error updating user status:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update user status",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Set up real-time subscription for user_roles changes
  useEffect(() => {
    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  return {
    users,
    stats,
    isLoading,
    error,
    fetchUsers,
    assignRole,
    removeRole,
    updateUserStatus,
    deleteUser
  };
};