import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const Assembly = () => {
  const mockAssemblyItems = [
    {
      id: '1',
      order_number: 'ORD-20240115-0001',
      customer: 'John Smith',
      items: 'Base Cabinet x2, Wall Cabinet x3',
      status: 'in_progress',
      assembler: 'Mike Wilson',
      started_at: '2024-01-15 09:00',
      estimated_completion: '2024-01-15 17:00',
    },
    {
      id: '2',
      order_number: 'ORD-20240114-0002', 
      customer: 'Sarah Johnson',
      items: 'Pantry Cabinet x1, Base Cabinet x4',
      status: 'completed',
      assembler: 'Tom Davis',
      started_at: '2024-01-14 08:00',
      estimated_completion: '2024-01-14 16:00',
    }
  ];

  const columns = [
    { key: 'order_number' as keyof typeof mockAssemblyItems[0], label: 'Order Number' },
    { key: 'customer' as keyof typeof mockAssemblyItems[0], label: 'Customer' },
    { key: 'items' as keyof typeof mockAssemblyItems[0], label: 'Items' },
    { 
      key: 'status' as keyof typeof mockAssemblyItems[0], 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    { key: 'assembler' as keyof typeof mockAssemblyItems[0], label: 'Assembler' },
    { 
      key: 'estimated_completion' as keyof typeof mockAssemblyItems[0], 
      label: 'Est. Completion',
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assembly Management</h1>
        <p className="text-muted-foreground">Track cabinet assembly progress and workstation assignments</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Currently being assembled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Awaiting assembly</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Ready for QC</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behind Schedule</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>
      
      <DataTable
        data={mockAssemblyItems}
        columns={columns}
        selectable
        emptyState={<div>No assembly items found</div>}
      />
    </div>
  );
};

export default Assembly;