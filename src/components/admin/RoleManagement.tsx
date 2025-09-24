import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { UserInviteDialog } from './UserInviteDialog';
import { InviteAdminButton } from './InviteAdminButton';
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserCheck,
  UserX
} from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'sales_rep' | 'fulfilment' | 'customer';
  created_at?: string;
}

interface UserProfile {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at?: string;
  last_sign_in_at?: string;
  roles: UserRole[];
}

const ROLE_PERMISSIONS = {
  admin: {
    label: 'Administrator',
    description: 'Full system access',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    permissions: [
      'Manage all users and roles',
      'Access all admin functions',
      'View all data and reports',
      'Modify system settings',
      'Access security dashboard'
    ]
  },
  sales_rep: {
    label: 'Sales Representative',
    description: 'Sales and customer management',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    permissions: [
      'Manage customer quotes',
      'Process orders',
      'View customer data',
      'Generate reports',
      'Manage pricing'
    ]
  },
  fulfilment: {
    label: 'Fulfilment Team',
    description: 'Order processing and shipping',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    permissions: [
      'Manage production queue',
      'Process shipments',
      'Update order status',
      'Handle exceptions',
      'Manage assembly jobs'
    ]
  },
  customer: {
    label: 'Customer',
    description: 'Standard customer access',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    permissions: [
      'View own orders',
      'Manage own profile',
      'Submit quotes',
      'Upload files',
      'Track shipments'
    ]
  }
};

const RoleManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [assigningRoles, setAssigningRoles] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { logEvent } = useAuditLog();

  useEffect(() => {
    loadUsers();

    // Set up real-time subscription for user_roles changes
    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('User roles changed:', payload);
          // Reload users when roles change
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://nqxsfmnvdfdfvndrodvs.supabase.co/functions/v1/admin-get-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.roles.some(r => r.role === selectedRole);
    return matchesSearch && matchesRole;
  });

  const assignRole = async (userId: string, role: 'admin' | 'sales_rep' | 'fulfilment' | 'customer') => {
    try {
      setAssigningRoles(prev => ({ ...prev, [userId]: true }));
      
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;

      await logEvent({
        scope: 'user_management',
        scope_id: userId,
        action: 'role_assigned',
        after_data: { role, assigned_at: new Date().toISOString() }
      });

      toast({
        title: 'Success',
        description: `${ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.label || role} role assigned successfully`
      });

      // Real-time will handle the update, but we can also refresh manually
      loadUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive'
      });
    } finally {
      setAssigningRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  const removeRole = async (userId: string, roleId: string, roleToRemove: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await logEvent({
        scope: 'user_management',
        scope_id: userId,
        action: 'role_removed',
        before_data: { role: roleToRemove, removed_at: new Date().toISOString() }
      });

      toast({
        title: 'Success',
        description: 'Role removed successfully'
      });

      loadUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => {
          const count = users.filter(u => u.roles.some(r => r.role === role)).length;
          return (
            <Card key={role}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Role Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions across the system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <InviteAdminButton />
              <UserInviteDialog onUserInvited={loadUsers} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => (
                  <SelectItem key={role} value={role}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{user.email}</p>
                      {user.email_confirmed_at ? (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((userRole) => {
                        const roleConfig = ROLE_PERMISSIONS[userRole.role as keyof typeof ROLE_PERMISSIONS];
                        return (
                          <div key={userRole.id} className="flex items-center">
                            <Badge 
                              className={`${roleConfig.color} pr-1`}
                              variant="secondary"
                            >
                              <span>{roleConfig.label}</span>
                              <button
                                onClick={() => removeRole(user.id, userRole.id, userRole.role)}
                                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                                title={`Remove ${roleConfig.label} role`}
                              >
                                <UserX className="h-3 w-3" />
                              </button>
                            </Badge>
                          </div>
                        );
                      })}
                      {user.roles.length === 0 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          No roles assigned
                        </Badge>
                      )}
                    </div>
                    {user.last_sign_in_at && (
                      <p className="text-xs text-muted-foreground">
                        Last sign in: {new Date(user.last_sign_in_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select 
                    key={`${user.id}-${user.roles.length}`} // Force re-render when roles change
                    onValueChange={(role) => assignRole(user.id, role as 'admin' | 'sales_rep' | 'fulfilment' | 'customer')}
                    disabled={assigningRoles[user.id]}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={
                        assigningRoles[user.id] ? "Assigning..." : "Assign role"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => {
                        const isDisabled = user.roles.some(r => r.role === role);
                        return (
                          <SelectItem 
                            key={role} 
                            value={role}
                            disabled={isDisabled}
                            className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{config.label}</span>
                              {isDisabled && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Assigned
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Reference</CardTitle>
          <CardDescription>
            Overview of permissions granted to each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(ROLE_PERMISSIONS).map(([role, config]) => (
              <div key={role} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge className={config.color} variant="secondary">
                    {config.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{config.description}</span>
                </div>
                <ul className="text-sm space-y-1 ml-4">
                  {config.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <UserCheck className="h-3 w-3 text-green-600" />
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;