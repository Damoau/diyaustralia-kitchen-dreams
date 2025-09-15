import React from 'react';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';

const CartsList = () => {
  const mockCarts = [
    {
      id: '1',
      customer: 'John Smith',
      label: 'Kitchen Renovation',
      status: 'active',
      items: 5,
      subtotal: 1200,
      updated: '2024-01-15',
    }
  ];

  const columns = [
    { key: 'customer' as keyof typeof mockCarts[0], label: 'Customer' },
    { key: 'label' as keyof typeof mockCarts[0], label: 'Label' },
    { 
      key: 'status' as keyof typeof mockCarts[0], 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Carts</h1>
        <p className="text-muted-foreground">Manage customer carts and convert to quotes or orders</p>
      </div>
      
      <DataTable
        data={mockCarts}
        columns={columns}
        selectable
        emptyState={<div>No carts found</div>}
      />
    </div>
  );
};

export default CartsList;