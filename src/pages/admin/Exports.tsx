import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Download, FileText, Database, Calendar, Clock } from 'lucide-react';

const Exports = () => {
  const mockExports = [
    {
      id: '1',
      name: 'Customer Database Export',
      type: 'customers',
      format: 'CSV',
      status: 'completed',
      created_at: '2024-01-15 10:30',
      file_size: '2.3 MB',
      records: 1245,
      requested_by: 'Sarah Wilson',
    },
    {
      id: '2',
      name: 'Order History Export',
      type: 'orders',
      format: 'Excel',
      status: 'processing',
      created_at: '2024-01-15 11:15',
      file_size: '-',
      records: 890,
      requested_by: 'Mike Johnson',
    },
    {
      id: '3',
      name: 'Product Catalog Export',
      type: 'products',
      format: 'JSON',
      status: 'completed',
      created_at: '2024-01-14 16:45',
      file_size: '1.8 MB',
      records: 456,
      requested_by: 'Tom Davis',
    }
  ];

  const columns = [
    { key: 'name' as keyof typeof mockExports[0], label: 'Export Name' },
    { 
      key: 'type' as keyof typeof mockExports[0], 
      label: 'Type',
      render: (value: string) => <Badge variant="secondary">{value}</Badge>
    },
    { 
      key: 'format' as keyof typeof mockExports[0], 
      label: 'Format',
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
    { 
      key: 'status' as keyof typeof mockExports[0], 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    { 
      key: 'records' as keyof typeof mockExports[0], 
      label: 'Records',
      render: (value: number) => value.toLocaleString()
    },
    { key: 'file_size' as keyof typeof mockExports[0], label: 'Size' },
    { key: 'requested_by' as keyof typeof mockExports[0], label: 'Requested By' },
  ];

  const exportTypes = [
    {
      name: 'Customer Data',
      description: 'Export customer information, contacts, and preferences',
      icon: Database,
      formats: ['CSV', 'Excel', 'JSON']
    },
    {
      name: 'Order History',
      description: 'Export order data, line items, and transaction details',
      icon: FileText,
      formats: ['CSV', 'Excel', 'PDF']
    },
    {
      name: 'Product Catalog',
      description: 'Export product information, pricing, and inventory',
      icon: Database,
      formats: ['CSV', 'Excel', 'JSON', 'XML']
    },
    {
      name: 'Financial Reports',
      description: 'Export revenue, payments, and financial summaries',
      icon: FileText,
      formats: ['Excel', 'PDF', 'CSV']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Exports</h1>
          <p className="text-muted-foreground">Export business data in various formats for analysis and reporting</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          New Export
        </Button>
      </div>
      
      {/* Export Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">In queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Volume</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 GB</div>
            <p className="text-xs text-muted-foreground">Exported this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Types */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Exports</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {exportTypes.map((exportType, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <exportType.icon className="mr-2 h-5 w-5" />
                  {exportType.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{exportType.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {exportType.formats.map((format, formatIndex) => (
                      <Badge key={formatIndex} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm">
                    <Download className="mr-1 h-3 w-3" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Exports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Exports</h2>
        <DataTable
          data={mockExports}
          columns={columns}
          selectable
          emptyState={<div>No exports found</div>}
        />
      </div>
    </div>
  );
};

export default Exports;