import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';

// Lazy load admin components for better performance
const Production = lazy(() => import('@/pages/admin/Production'));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const AdminOrders = lazy(() => import('@/components/admin/AdminOrders'));
const AdminShipping = lazy(() => import('@/components/admin/AdminShipping'));
const SecurityDashboard = lazy(() => import('@/components/admin/SecurityDashboard'));
const RoleManagement = lazy(() => import('@/components/admin/RoleManagement'));

export const AdminRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="production" element={<Production />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="security" element={<SecurityDashboard />} />
        <Route path="roles" element={<RoleManagement />} />
      </Routes>
    </Suspense>
  );
};