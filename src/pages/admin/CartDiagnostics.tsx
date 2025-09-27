import React from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CartConsolidationManager } from '@/components/cart/CartConsolidationManager';
import { CartSystemValidator } from '@/components/testing/CartSystemValidator';
import { EnhancedCartConsolidation } from '@/components/cart/EnhancedCartConsolidation';

export default function CartDiagnostics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cart System Diagnostics</h1>
          <p className="text-muted-foreground">
            Manage and validate the cart system health and performance.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CartConsolidationManager />
          <CartSystemValidator />
          <EnhancedCartConsolidation />
        </div>
      </div>
    </AdminLayout>
  );
}