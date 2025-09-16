import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Badge } from '@/components/ui/badge';

const QuotesList = () => {
  const mockQuotes = [
    {
      id: '1',
      quote_number: 'QUO-20240115-0001',
      customer: 'Jane Smith',
      total_amount: 2500.00,
      status: 'pending',
      created_at: '2024-01-15',
      valid_until: '2024-02-15',
    },
    {
      id: '2', 
      quote_number: 'QUO-20240114-0002',
      customer: 'Mike Johnson',
      total_amount: 1850.50,
      status: 'approved',
      created_at: '2024-01-14',
      valid_until: '2024-02-14',
    }
  ];

  const columns = [
    { key: 'quote_number' as keyof typeof mockQuotes[0], label: 'Quote Number' },
    { key: 'customer' as keyof typeof mockQuotes[0], label: 'Customer' },
    { 
      key: 'total_amount' as keyof typeof mockQuotes[0], 
      label: 'Total',
      render: (value: number) => `$${value.toFixed(2)}`
    },
    { 
      key: 'status' as keyof typeof mockQuotes[0], 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    { key: 'created_at' as keyof typeof mockQuotes[0], label: 'Created' },
    { 
      key: 'valid_until' as keyof typeof mockQuotes[0], 
      label: 'Valid Until',
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Quotes</h1>
        <p className="text-muted-foreground">Manage customer quotes and approvals</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Ready for orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,230</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <DataTable
        data={mockQuotes}
        columns={columns}
        selectable
        emptyState={<div>No quotes found</div>}
      />
    </div>
  );
};

export default QuotesList;