import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Skeleton } from '@/components/ui/skeleton';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { UserActions } from '@/components/admin/UserActions';
import { UserInviteDialog } from '@/components/admin/UserInviteDialog';
import { useUsers, UserProfile } from '@/hooks/useUsers';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Mail, 
  Search,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';

const Users = () => {
  const { users, stats, isLoading, error, assignRole, removeRole, updateUserStatus } = useUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'customer' && user.roles.length === 0) ||
        user.roles.some(role => role.role === roleFilter);
      
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.email_confirmed_at) ||
        (statusFilter === 'pending' && !user.email_confirmed_at);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const columns = [
    { 
      key: 'email' as keyof UserProfile, 
      label: 'Email',
      render: (value: string, user: UserProfile) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          <span className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</span>
        </div>
      )
    },
    { 
      key: 'email_confirmed_at' as keyof UserProfile, 
      label: 'Status',
      render: (value: string | undefined) => (
        <StatusChip status={value ? 'active' : 'pending'} />
      )
    },
    { 
      key: 'roles' as keyof UserProfile, 
      label: 'Roles',
      render: (value: UserProfile['roles']) => (
        <div className="flex flex-wrap gap-1">
          {value.length > 0 ? (
            value.map((roleObj) => (
              <Badge key={roleObj.id} variant="secondary" className="text-xs">
                {roleObj.role.replace('_', ' ')}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="text-xs">customer</Badge>
          )}
        </div>
      )
    },
    { 
      key: 'orders_count' as keyof UserProfile, 
      label: 'Orders',
      render: (value: number = 0) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    { 
      key: 'total_spent' as keyof UserProfile, 
      label: 'Total Spent',
      render: (value: number = 0) => (
        <span className="font-medium">${value.toLocaleString()}</span>
      )
    },
    { 
      key: 'last_sign_in_at' as keyof UserProfile, 
      label: 'Last Login',
      render: (value: string | undefined) => (
        <span className="text-sm text-muted-foreground">
          {value ? format(new Date(value), 'MMM d, yyyy') : 'Never'}
        </span>
      )
    },
    {
      key: 'id' as keyof UserProfile,
      label: 'Actions',
      render: (value: string, user: UserProfile) => (
        <UserActions
          user={user}
          onViewDetails={setSelectedUser}
          onAssignRole={assignRole}
          onRemoveRole={removeRole}
          onUpdateStatus={updateUserStatus}
          isLoading={isLoading}
        />
      )
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">Error loading users: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Reps</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.salesReps}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.customerUsers}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  <SelectItem value="fulfilment">Fulfilment</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Users Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        selectable
        loading={isLoading}
        emptyState={
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No users have been created yet'}
            </p>
          </div>
        }
      />

      {/* Modals */}
      <UserDetailModal
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
      
      <UserInviteDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
    </div>
  );
};

export default Users;