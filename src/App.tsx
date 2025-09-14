import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import KitchenStyles from "./pages/KitchenStyles";
import CabinetPrices from "./pages/CabinetPrices";
import CabinetPricesNew from "./pages/CabinetPricesNew";
import PricingOverview from "./pages/PricingOverview";
import BaseCabinets from "./pages/BaseCabinets";
import TopCabinets from "./pages/TopCabinets";
import Pantry from "./pages/Pantry";
import PanelsFillers from "./pages/PanelsFillers";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import GetQuote from "./pages/GetQuote";
import Manufacturing from "./pages/Manufacturing";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/get-quote" element={<GetQuote />} />
          <Route path="/manufacturing" element={<Manufacturing />} />
          <Route path="/kitchen-styles" element={<KitchenStyles />} />
          <Route path="/cabinet-prices" element={<CabinetPrices />} />
          <Route path="/cabinet-prices-new" element={<CabinetPricesNew />} />
          <Route path="/base-cabinet-prices" element={<CabinetPricesNew />} />
          <Route path="/pricing" element={<PricingOverview />} />
          <Route path="/pricing/base-cabinets" element={<BaseCabinets />} />
          <Route path="/pricing/top-cabinets" element={<TopCabinets />} />
          <Route path="/pricing/pantry" element={<Pantry />} />
          <Route path="/pricing/panels-fillers" element={<PanelsFillers />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;