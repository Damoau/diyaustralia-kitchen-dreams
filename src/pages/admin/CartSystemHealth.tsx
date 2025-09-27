import React from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CartConsolidationManager } from '@/components/cart/CartConsolidationManager';
import { CartSystemValidator } from '@/components/testing/CartSystemValidator';
import { CartEndToEndTester } from '@/components/testing/CartEndToEndTester';
import { EnhancedCartConsolidation } from '@/components/cart/EnhancedCartConsolidation';
import { MassiveSimulationRunner } from '@/components/testing/MassiveSimulationRunner';

export default function CartSystemHealth() {
  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Cart System Health & Testing
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor cart system performance and run comprehensive tests to ensure reliability.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CartConsolidationManager />
          <CartSystemValidator />
          <EnhancedCartConsolidation />
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <CartEndToEndTester />
          <MassiveSimulationRunner />
        </div>
      </div>
    </AdminLayout>
  );
}