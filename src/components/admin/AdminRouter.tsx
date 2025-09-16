import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import Production from '@/pages/admin/Production';

// Placeholder components for other admin routes
const AdminOverview = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>
    <p>Welcome to the admin dashboard.</p>
  </div>
);

const AdminOrders = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Orders Management</h1>
    <p>Order management interface coming soon.</p>
  </div>
);

const AdminShipping = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Shipping Management</h1>
    <p>Shipping management interface coming soon.</p>
  </div>
);

export const AdminRouter = () => {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="production" element={<Production />} />
        <Route path="shipping" element={<AdminShipping />} />
      </Route>
    </Routes>
  );
};