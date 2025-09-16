import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';

// Lazy load admin components for better performance
const Production = lazy(() => import('@/pages/admin/Production'));
const CartsList = lazy(() => import('@/pages/admin/CartsList'));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const AdminOrders = lazy(() => import('@/components/admin/AdminOrders'));
const AdminShipping = lazy(() => import('@/components/admin/AdminShipping'));
const SecurityDashboard = lazy(() => import('@/components/admin/SecurityDashboard'));
const RoleManagement = lazy(() => import('@/components/admin/RoleManagement'));

// Create placeholder components for missing pages
const QuotesList = lazy(() => import('@/pages/admin/QuotesList'));
const Assembly = lazy(() => import('@/pages/admin/Assembly'));
const Pricing = lazy(() => import('@/pages/admin/Pricing'));
const Discounts = lazy(() => import('@/pages/admin/Discounts'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Reports = lazy(() => import('@/pages/admin/Reports'));
const Exports = lazy(() => import('@/pages/admin/Exports'));
const Notifications = lazy(() => import('@/pages/admin/Notifications'));
const Settings = lazy(() => import('@/pages/admin/Settings'));

export const AdminRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        
        {/* Sales */}
        <Route path="sales/carts" element={<CartsList />} />
        <Route path="sales/quotes" element={<QuotesList />} />
        
        {/* Operations */}
        <Route path="orders" element={<AdminOrders />} />
        <Route path="production" element={<Production />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="assembly" element={<Assembly />} />
        
        {/* Configuration */}
        <Route path="pricing" element={<Pricing />} />
        <Route path="discounts" element={<Discounts />} />
        <Route path="users" element={<Users />} />
        <Route path="roles" element={<RoleManagement />} />
        
        {/* Analytics */}
        <Route path="reports" element={<Reports />} />
        <Route path="exports" element={<Exports />} />
        
        {/* System */}
        <Route path="security" element={<SecurityDashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
};

export default AdminRouter;