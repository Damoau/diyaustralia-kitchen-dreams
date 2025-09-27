import React from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CartConsolidationManager } from '@/components/cart/CartConsolidationManager';
import { CartSystemValidator } from '@/components/testing/CartSystemValidator';
import { CartEndToEndTester } from '@/components/testing/CartEndToEndTester';
import { EnhancedCartConsolidation } from '@/components/cart/EnhancedCartConsolidation';

export default function CartSystemHealth() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cart System Health & Testing</h1>
          <p className="text-muted-foreground">
            Monitor cart system performance and run comprehensive tests to ensure reliability.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CartConsolidationManager />
          <CartSystemValidator />
          <EnhancedCartConsolidation />
        </div>

        <div className="grid gap-6">
          <CartEndToEndTester />
        </div>
      </div>
    </AdminLayout>
  );
}