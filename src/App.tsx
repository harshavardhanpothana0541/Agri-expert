import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import VoiceAssistant from "@/components/VoiceAssistant";
import VoiceTour from "@/components/VoiceTour";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProblemInput from "./pages/ProblemInput";
import AnalysisReport from "./pages/AnalysisReport";
import ExpertResults from "./pages/ExpertResults";
import Experts from "./pages/Experts";
import Marketplace from "./pages/Marketplace";
import Checkout from "./pages/Checkout";
import Rentals from "./pages/Rentals";
import AddRentalPage from "./pages/AddRental";
import Weather from "./pages/Weather";
import Prices from "./pages/Prices";
import Notifications from "./pages/Notifications";
import SoilMonitor from "./pages/SoilMonitor";
import ExpertDashboard from "./pages/ExpertDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <VoiceAssistant />
          <VoiceTour />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/problem-input" element={<ProblemInput />} />
              <Route path="/analysis-report" element={<AnalysisReport />} />
              <Route path="/expert-results" element={<ExpertResults />} />
              <Route path="/experts" element={<Experts />} />
              <Route path="/experts/chat/:id" element={<Experts />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/rentals" element={<Rentals />} />
              <Route path="/rentals/add" element={<AddRentalPage />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/prices" element={<Prices />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/soil-monitor" element={<SoilMonitor />} />
              <Route path="/expert-dashboard" element={<ExpertDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
