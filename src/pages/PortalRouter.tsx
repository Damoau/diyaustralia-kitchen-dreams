import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';
import { PortalNavigation } from '@/components/portal/PortalNavigation';

// Lazy load portal components
const PortalDashboard = lazy(() => import('@/components/portal/PortalDashboard').then(module => ({ default: module.PortalDashboard })));
const QuotesList = lazy(() => import('@/components/portal/QuotesList').then(module => ({ default: module.QuotesList })));
const QuoteDetail = lazy(() => import('@/components/portal/QuoteDetail').then(module => ({ default: module.QuoteDetail })));
const OrdersList = lazy(() => import('@/components/portal/OrdersList').then(module => ({ default: module.OrdersList })));
const OrderDetail = lazy(() => import('@/components/portal/OrderDetail').then(module => ({ default: module.OrderDetail })));
const FilesList = lazy(() => import('@/components/portal/FilesList').then(module => ({ default: module.FilesList })));
const PortalMessages = lazy(() => import('@/pages/portal/PortalMessages').then(module => ({ default: module.PortalMessages })));
const AddressBook = lazy(() => import('@/components/portal/AddressBook').then(module => ({ default: module.AddressBook })));
const ProfileSettings = lazy(() => import('@/components/portal/ProfileSettings').then(module => ({ default: module.ProfileSettings })));

export const PortalRouter = () => {
  return (
    <div className="min-h-screen bg-background">
      <PortalNavigation />
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="quotes" element={<QuotesList />} />
            <Route path="quotes/:quoteId" element={<QuoteDetailWrapper />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/:orderId" element={<OrderDetailWrapper />} />
            <Route path="files" element={<FilesList />} />
            <Route path="messages" element={<PortalMessages />} />
            <Route path="addresses" element={<AddressBook />} />
            <Route path="profile" element={<ProfileSettings />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

// Wrapper components to handle route params
const QuoteDetailWrapper = () => {
  const { quoteId } = useParams();
  return <QuoteDetail quoteId={quoteId!} />;
};

const OrderDetailWrapper = () => {
  const { orderId } = useParams();
  return <OrderDetail orderId={orderId!} />;
};

export default PortalRouter;