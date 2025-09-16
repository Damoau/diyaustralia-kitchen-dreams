import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/lib/errorBoundary";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import BaseCabinets from "./pages/shop/BaseCabinets";
import TopCabinets from "./pages/shop/TopCabinets";
import PantryCabinets from "./pages/shop/PantryCabinets";
import DressPanels from "./pages/shop/DressPanels";
import KitchenStyles from "./pages/KitchenStyles";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutFlow from "./pages/CheckoutFlow";
import GetQuote from "./pages/GetQuote";
import Manufacturing from "./pages/Manufacturing";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PriceList from "./pages/PriceList";
import BaseCabinetsPricing from "./pages/price-list/BaseCabinetsPricing";
import TopCabinetsPricing from "./pages/price-list/TopCabinetsPricing";
import PantryCabinetsPricing from "./pages/price-list/PantryCabinetsPricing";
import DressPanelsPricing from "./pages/price-list/DressPanelsPricing";
import Portal from "./pages/Portal";
import PortalQuotes from "./pages/portal/Quotes";
import PortalQuoteDetail from "./pages/portal/QuoteDetail";
import PortalOrders from "./pages/portal/Orders";
import PortalOrderDetail from "./pages/portal/OrderDetail";
import PortalFiles from "./pages/portal/Files";
import PortalMessages from "./pages/portal/Messages";
import PortalProfile from "./pages/portal/Profile";
import PortalAddresses from "./pages/portal/Addresses";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/base-cabinets" element={<BaseCabinets />} />
          <Route path="/shop/top-cabinets" element={<TopCabinets />} />
          <Route path="/shop/pantry-cabinets" element={<PantryCabinets />} />
          <Route path="/shop/dress-panels" element={<DressPanels />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-flow" element={<CheckoutFlow />} />
          <Route path="/get-quote" element={<GetQuote />} />
          <Route path="/manufacturing" element={<Manufacturing />} />
          <Route path="/kitchen-styles" element={<KitchenStyles />} />
          <Route path="/price-list" element={<PriceList />} />
          <Route path="/price-list/base-cabinets" element={<BaseCabinetsPricing />} />
          <Route path="/price-list/top-cabinets" element={<TopCabinetsPricing />} />
          <Route path="/price-list/pantry-cabinets" element={<PantryCabinetsPricing />} />
          <Route path="/price-list/dress-panels" element={<DressPanelsPricing />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/production" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;