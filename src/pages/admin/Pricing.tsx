import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/shared/DataTable';
import { DollarSign, TrendingUp, Settings, AlertCircle } from 'lucide-react';

const Pricing = () => {
  const mockPricingData = [
    {
      id: '1',
      category: 'Base Cabinets',
      base_price: 299.99,
      markup_percentage: 25,
      final_price: 374.99,
      last_updated: '2024-01-15',
      status: 'active',
    },
    {
      id: '2',
      category: 'Wall Cabinets', 
      base_price: 189.99,
      markup_percentage: 30,
      final_price: 246.99,
      last_updated: '2024-01-14',
      status: 'active',
    },
    {
      id: '3',
      category: 'Pantry Cabinets',
      base_price: 449.99,
      markup_percentage: 20,
      final_price: 539.99,
      last_updated: '2024-01-13',
      status: 'pending_review',
    }
  ];

  const columns = [
    { key: 'category' as keyof typeof mockPricingData[0], label: 'Category' },
    { 
      key: 'base_price' as keyof typeof mockPricingData[0], 
      label: 'Base Price',
      render: (value: number) => `$${value.toFixed(2)}`
    },
    { 
      key: 'markup_percentage' as keyof typeof mockPricingData[0], 
      label: 'Markup %',
      render: (value: number) => `${value}%`
    },
    { 
      key: 'final_price' as keyof typeof mockPricingData[0], 
      label: 'Final Price',
      render: (value: number) => `$${value.toFixed(2)}`
    },
    { key: 'last_updated' as keyof typeof mockPricingData[0], label: 'Last Updated' },
    { 
      key: 'status' as keyof typeof mockPricingData[0], 
      label: 'Status',
      render: (value: string) => <Badge variant={value === 'active' ? 'default' : 'secondary'}>{value}</Badge>
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">Manage product pricing, markups, and pricing strategies</p>
        </div>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Update Pricing Rules
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Markup</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Updates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Need approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">Monthly increase</p>
          </CardContent>
        </Card>
      </div>
      
      <DataTable
        data={mockPricingData}
        columns={columns}
        selectable
        emptyState={<div>No pricing data found</div>}
      />
    </div>
  );
};

export default Pricing;