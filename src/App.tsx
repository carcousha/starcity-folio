import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { DashboardHome } from "@/components/DashboardHome";
import Auth from "./pages/Auth";
import CRMIndex from "./pages/crm/index";
import Clients from "./pages/crm/Clients";
import AccountingIndex from "./pages/accounting/index";
import Expenses from "./pages/accounting/Expenses";
import Revenues from "./pages/accounting/Revenues";
import Commissions from "./pages/accounting/Commissions";
import Debts from "./pages/accounting/Debts";
import Vehicles from "./pages/accounting/Vehicles";
import VehicleExpenses from "./pages/accounting/VehicleExpenses";
import Staff from "./pages/accounting/Staff";
import Treasury from "./pages/accounting/Treasury";
import ActivityLogPage from "./pages/accounting/ActivityLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/crm" element={<CRMIndex />} />
              <Route path="/crm/clients" element={<Clients />} />
              <Route path="/accounting" element={<AccountingIndex />} />
              <Route path="/accounting/expenses" element={<Expenses />} />
              <Route path="/accounting/revenues" element={<Revenues />} />
              <Route path="/accounting/commissions" element={<Commissions />} />
              <Route path="/accounting/debts" element={<Debts />} />
              <Route path="/accounting/vehicles" element={<Vehicles />} />
              <Route path="/accounting/vehicle-expenses" element={<VehicleExpenses />} />
          <Route path="/accounting/staff" element={<Staff />} />
          <Route path="/accounting/treasury" element={<Treasury />} />
          <Route path="/accounting/activity-log" element={<ActivityLogPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
