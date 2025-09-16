import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Users as UsersIcon, UserPlus, Shield, Mail } from 'lucide-react';

const Users = () => {
  const mockUsers = [
    {
      id: '1',
      full_name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'customer',
      status: 'active',
      last_login: '2024-01-15 14:30',
      created_at: '2024-01-01',
      orders_count: 5,
    },
    {
      id: '2',
      full_name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com', 
      role: 'admin',
      status: 'active',
      last_login: '2024-01-15 09:15',
      created_at: '2023-12-15',
      orders_count: 0,
    },
    {
      id: '3',
      full_name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'sales_rep',
      status: 'active',
      last_login: '2024-01-14 16:45',
      created_at: '2024-01-10',
      orders_count: 12,
    }
  ];

  const columns = [
    { key: 'full_name' as keyof typeof mockUsers[0], label: 'Name' },
    { key: 'email' as keyof typeof mockUsers[0], label: 'Email' },
    { 
      key: 'role' as keyof typeof mockUsers[0], 
      label: 'Role',
      render: (value: string) => {
        const colors = {
          admin: 'destructive',
          sales_rep: 'secondary', 
          customer: 'default'
        };
        return <Badge variant={colors[value as keyof typeof colors] as any}>{value}</Badge>
      }
    },
    { 
      key: 'status' as keyof typeof mockUsers[0], 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    { 
      key: 'orders_count' as keyof typeof mockUsers[0], 
      label: 'Orders',
      render: (value: number) => <Badge variant="outline">{value}</Badge>
    },
    { key: 'last_login' as keyof typeof mockUsers[0], label: 'Last Login' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,189</div>
            <p className="text-xs text-muted-foreground">95.5% active rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">43</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <DataTable
        data={mockUsers}
        columns={columns}
        selectable
        emptyState={<div>No users found</div>}
      />
    </div>
  );
};

export default Users;