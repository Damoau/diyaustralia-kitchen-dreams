import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { Suspense, lazy } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { AdminImpersonationProvider } from "@/contexts/AdminImpersonationContext";
import { HelmetProvider } from "react-helmet-async";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const RoomCategories = lazy(() => import("./pages/RoomCategories"));
const RoomCategory = lazy(() => import("./pages/RoomCategory"));
const ShopCategory = lazy(() => import("./pages/ShopCategory"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const KitchenStyles = lazy(() => import("./pages/KitchenStyles"));
const GetQuote = lazy(() => import("./pages/GetQuote"));
const Manufacturing = lazy(() => import("./pages/Manufacturing"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PriceList = lazy(() => import("./pages/PriceList"));

// Admin components
const AdminRouter = lazy(() => import("./components/admin/AdminRouter"));

// Portal components
const PortalRouter = lazy(() => import("./pages/PortalRouter"));

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
          <HelmetProvider>
            <Toaster />
            <Sonner />
              <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
            <Route path="/shop-legacy" element={<Shop />} />
            <Route path="/shop" element={<RoomCategories />} />
            <Route path="/shop/:room" element={<RoomCategory />} />
            <Route path="/shop/:room/:category" element={<ShopCategory />} />
                  <Route path="/shop/:room/:category/:productSlug" element={<ProductPage />} />
                  <Route path="/price-list" element={<PriceList />} />
                  <Route path="/get-quote" element={<GetQuote />} />
                  <Route path="/manufacturing" element={<Manufacturing />} />
                  <Route path="/kitchen-styles" element={<KitchenStyles />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route 
                    path="/portal/*" 
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <PortalRouter />
                        </ProtectedRoute>
                      </Suspense>
                    } 
                  />
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </HelmetProvider>
        </AdminImpersonationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;