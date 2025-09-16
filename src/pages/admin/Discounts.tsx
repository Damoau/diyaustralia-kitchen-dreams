import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Percent, Plus, Users, Calendar } from 'lucide-react';

const Discounts = () => {
  const mockDiscounts = [
    {
      id: '1',
      code: 'SUMMER2024',
      description: 'Summer Sale - 15% Off All Cabinets',
      type: 'percentage',
      value: 15,
      min_order_amount: 500,
      usage_count: 23,
      max_uses: 100,
      valid_from: '2024-01-01',
      valid_until: '2024-02-29',
      status: 'active',
    },
    {
      id: '2',
      code: 'BULK50',
      description: '$50 Off Orders Over $1000',
      type: 'fixed',
      value: 50,
      min_order_amount: 1000,
      usage_count: 8,
      max_uses: 50,
      valid_from: '2024-01-15',
      valid_until: '2024-03-15',
      status: 'active',
    },
    {
      id: '3',
      code: 'NEWCUSTOMER',
      description: 'New Customer 10% Discount',
      type: 'percentage',
      value: 10,
      min_order_amount: 0,
      usage_count: 45,
      max_uses: 200,
      valid_from: '2024-01-01',
      valid_until: '2024-12-31',
      status: 'active',
    }
  ];

  const columns = [
    { key: 'code' as keyof typeof mockDiscounts[0], label: 'Discount Code' },
    { key: 'description' as keyof typeof mockDiscounts[0], label: 'Description' },
    { 
      key: 'value' as keyof typeof mockDiscounts[0], 
      label: 'Value',
      render: (value: number, row: typeof mockDiscounts[0]) => 
        row.type === 'percentage' ? `${value}%` : `$${value}`
    },
    { 
      key: 'usage_count' as keyof typeof mockDiscounts[0], 
      label: 'Usage',
      render: (value: number, row: typeof mockDiscounts[0]) => `${value}/${row.max_uses}`
    },
    { 
      key: 'valid_until' as keyof typeof mockDiscounts[0], 
      label: 'Expires',
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
    { 
      key: 'status' as keyof typeof mockDiscounts[0], 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discount Management</h1>
          <p className="text-muted-foreground">Create and manage discount codes and promotional offers</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Discount
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discounts</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount Savings</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,240</div>
            <p className="text-xs text-muted-foreground">Customer savings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
      </div>
      
      <DataTable
        data={mockDiscounts}
        columns={columns}
        selectable
        emptyState={<div>No discounts found</div>}
      />
    </div>
  );
};

export default Discounts;