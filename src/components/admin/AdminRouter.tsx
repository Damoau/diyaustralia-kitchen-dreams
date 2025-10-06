import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';
import { AdminLayout } from '@/components/admin/AdminLayout';

import { UserRoleProvider } from './UserRoleContext';

// Lazy load admin components for better performance
const Production = lazy(() => import('@/pages/admin/Production'));
const CartsList = lazy(() => import('@/pages/admin/CartsList'));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const AdminShipping = lazy(() => import('@/components/admin/AdminShipping'));
const SecurityDashboard = lazy(() => import('@/components/admin/SecurityDashboard'));
const EnhancedRoleManagement = lazy(() => import('@/components/admin/EnhancedRoleManagement'));
const AdminAIAssistant = lazy(() => import('@/pages/AdminAIAssistant'));

// Create placeholder components for missing pages
const QuotesList = lazy(() => import('@/pages/admin/QuotesList'));
const Assembly = lazy(() => import('@/pages/admin/Assembly'));
const UnifiedCategoriesManager = lazy(() => import('@/components/admin/UnifiedCategoriesManager'));
const RoomCategoriesManager = lazy(() => import('@/components/admin/RoomCategoriesManager'));
// Lazy loaded admin components  
const LazyOrderManagement = lazy(() => import('../../pages/admin/OrderManagement'));
const LazyProductionManagement = lazy(() => import('../../pages/admin/ProductionManagement')); 
const LazyAdminAnalytics = lazy(() => import('../../pages/admin/AdminAnalytics'));
const CabinetManager = lazy(() => import('./CabinetManager'));

const HardwareManager = lazy(() => import('@/components/admin/HardwareManager'));

const Discounts = lazy(() => import('@/pages/admin/Discounts'));
const Users = lazy(() => import('@/pages/admin/Users'));
const ProductsManager = lazy(() => import('@/components/admin/ProductsManager'));
const Reports = lazy(() => import('@/pages/admin/Reports'));
const Exports = lazy(() => import('@/pages/admin/Exports'));
const Notifications = lazy(() => import('@/pages/admin/Notifications'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const EditCabinetType = lazy(() => import('@/pages/admin/EditCabinetType'));
const Pricing = lazy(() => import('@/pages/admin/Pricing'));
const DoorStyles = lazy(() => import('@/pages/admin/DoorStyles'));
const ConfigurationMigrationPlaceholder = lazy(() => import('@/components/admin/ConfigurationMigrationPlaceholder'));
const TestingPlaceholder = lazy(() => import('@/components/admin/TestingPlaceholder'));
const CartActivity = lazy(() => import('@/pages/admin/CartActivity'));
const LazySEOManagement = lazy(() => import('@/pages/admin/SEOManagement'));
import CartSystemHealth from "@/pages/admin/CartSystemHealth";
import UserBehaviorAnalytics from "@/pages/admin/UserBehaviorAnalytics";
const DocumentApprovals = lazy(() => import("@/pages/admin/DocumentApprovals"));
const AIWorkflowAnalyzer = lazy(() => import("@/pages/admin/AIWorkflowAnalyzer"));

export const AdminRouter = () => {
  return (
    <UserRoleProvider>
      <AdminLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            
            {/* Redirect old quotes route to correct location */}
            <Route path="quotes" element={<Navigate to="sales/quotes" replace />} />
            
            {/* Sales */}
            <Route path="sales/carts" element={<CartsList />} />
            <Route path="sales/quotes" element={<QuotesList />} />
            <Route path="sales/cart-activity" element={<CartActivity />} />
            
            {/* Operations */}
            <Route path="orders" element={<Suspense fallback={<PageLoader />}><LazyOrderManagement /></Suspense>} />
            <Route path="document-approvals" element={<Suspense fallback={<PageLoader />}><DocumentApprovals /></Suspense>} />
            <Route path="production" element={<Production />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="assembly" element={<Assembly />} />
          {/* Configuration */}
          <Route path="categories" element={<UnifiedCategoriesManager />} />
          <Route path="room-categories" element={<RoomCategoriesManager />} />
          <Route path="cabinets" element={
            <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <CabinetManager />
            </Suspense>
          } />
          <Route path="cabinets/:id" element={<EditCabinetType />} />
          <Route path="door-styles" element={<DoorStyles />} />
            <Route path="hardware-manager" element={
              <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <HardwareManager />
              </Suspense>
            } />
            <Route path="materials" element={<Pricing />} />
            <Route path="configuration-migration" element={<ConfigurationMigrationPlaceholder />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="seo-management" element={<Suspense fallback={<PageLoader />}><LazySEOManagement /></Suspense>} />
            <Route path="users" element={<Users />} />
            <Route path="order-management" element={<Suspense fallback={<PageLoader />}><LazyOrderManagement /></Suspense>} />
            <Route path="production-management" element={<Suspense fallback={<PageLoader />}><LazyProductionManagement /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<PageLoader />}><LazyAdminAnalytics /></Suspense>} />
            <Route path="roles" element={
              <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <EnhancedRoleManagement />
              </Suspense>
            } />
            
            {/* Analytics */}
            <Route path="reports" element={<Reports />} />
            <Route path="exports" element={<Exports />} />
            
            {/* System */}
            <Route path="security" element={<SecurityDashboard />} />
            <Route path="ai-assistant" element={<AdminAIAssistant />} />
            <Route path="ai-analyzer" element={<AIWorkflowAnalyzer />} />
            <Route path="testing" element={<TestingPlaceholder />} />
            <Route path="cart-system-health" element={<CartSystemHealth />} />
            <Route path="user-behavior-analytics" element={<UserBehaviorAnalytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    </UserRoleProvider>
  );
};

export default AdminRouter;