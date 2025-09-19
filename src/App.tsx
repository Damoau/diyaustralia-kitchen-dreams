import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { Suspense, lazy } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { AdminImpersonationProvider } from "@/contexts/AdminImpersonationContext";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const BaseCabinets = lazy(() => import("./pages/shop/BaseCabinets"));
const TopCabinets = lazy(() => import("./pages/shop/TopCabinets"));
const PantryCabinets = lazy(() => import("./pages/shop/PantryCabinets"));
const DressPanels = lazy(() => import("./pages/shop/DressPanels"));
const KitchenStyles = lazy(() => import("./pages/KitchenStyles"));
const Products = lazy(() => import("./pages/Products"));
const CheckoutFlow = lazy(() => import("./pages/CheckoutFlow"));
const GetQuote = lazy(() => import("./pages/GetQuote"));
const Manufacturing = lazy(() => import("./pages/Manufacturing"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin components
const AdminRouter = lazy(() => import("./components/admin/AdminRouter"));
const Portal = lazy(() => import("./pages/Portal"));
const PortalQuotes = lazy(() => import("./pages/portal/Quotes"));
const PortalQuoteDetail = lazy(() => import("./pages/portal/QuoteDetail"));
const PortalOrders = lazy(() => import("./pages/portal/Orders"));
const PortalOrderDetail = lazy(() => import("./pages/portal/OrderDetail"));
const PortalFiles = lazy(() => import("./pages/portal/Files"));
const PortalMessages = lazy(() => import("./pages/portal/Messages"));
const PortalProfile = lazy(() => import("./pages/portal/Profile"));
const PortalAddresses = lazy(() => import("./pages/portal/Addresses"));

// Lazy load ProtectedRoute
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

// Enhanced QueryClient with performance optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminImpersonationProvider>
          <Toaster />
          <Sonner />
            <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/base-cabinets" element={<BaseCabinets />} />
                <Route path="/shop/top-cabinets" element={<TopCabinets />} />
                <Route path="/shop/pantry-cabinets" element={<PantryCabinets />} />
                <Route path="/shop/dress-panels" element={<DressPanels />} />
                <Route path="/products" element={<Products />} />
                <Route path="/checkout-flow" element={<CheckoutFlow />} />
                <Route path="/get-quote" element={<GetQuote />} />
                <Route path="/manufacturing" element={<Manufacturing />} />
                <Route path="/kitchen-styles" element={<KitchenStyles />} />
                <Route path="/auth" element={<Auth />} />
                <Route 
                  path="/admin/*" 
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requireAdmin>
                        <AdminRouter />
                      </ProtectedRoute>
                    </Suspense>
                  } 
                />
                <Route path="/portal" element={<Portal />} />
                <Route path="/portal/quotes" element={<PortalQuotes />} />
                <Route path="/portal/quotes/:id" element={<PortalQuoteDetail />} />
                <Route path="/portal/orders" element={<PortalOrders />} />
                <Route path="/portal/orders/:id" element={<PortalOrderDetail />} />
                <Route path="/portal/files" element={<PortalFiles />} />
                <Route path="/portal/messages" element={<PortalMessages />} />
                <Route path="/portal/profile" element={<PortalProfile />} />
                <Route path="/portal/addresses" element={<PortalAddresses />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AdminImpersonationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;