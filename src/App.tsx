import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { DashboardHome } from "@/components/DashboardHome";
import Auth from "./pages/Auth";
import CRMIndex from "./pages/crm/index";
import Clients from "./pages/crm/Clients";
import Leads from "./pages/crm/Leads";
import TasksIndex from "./pages/tasks/index";
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
import AdvancedDebts from "./pages/accounting/AdvancedDebts";
import DailyJournal from "./pages/accounting/DailyJournal";
import ReportsIndex from "./pages/reports/index";
import RentalIndex from "./pages/rental/index";
import PropertyOwners from "./pages/rental/PropertyOwners";
import Properties from "./pages/rental/Properties";
import Tenants from "./pages/rental/Tenants";
import RentalContracts from "./pages/rental/RentalContracts";
import Installments from "./pages/rental/Installments";
import GovernmentServices from "./pages/rental/GovernmentServices";
import EmployeeReports from "./pages/reports/EmployeeReports";
import VehicleReports from "./pages/reports/VehicleReports";
import CommissionsReports from "./pages/reports/CommissionsReports";
import DebtsReports from "./pages/reports/DebtsReports";
import ExpensesReports from "./pages/reports/ExpensesReports";
import RevenuesReports from "./pages/reports/RevenuesReports";
import TreasuryReports from "./pages/reports/TreasuryReports";
import MyCommissions from "./pages/employee/MyCommissions";
import MyGoals from "./pages/employee/MyGoals";
import MyEvaluation from "./pages/employee/MyEvaluation";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
              
              {/* CRM Routes - Admin and some for employees */}
               <Route path="/crm" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <CRMIndex />
                 </ProtectedRoute>
               } />
               <Route path="/crm/clients" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Clients />
                 </ProtectedRoute>
               } />
              <Route path="/crm/leads" element={
                <ProtectedRoute requiredPermission="crmAccess">
                  <Leads />
                </ProtectedRoute>
              } />
              <Route path="/crm/tasks" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <TasksIndex />
                </ProtectedRoute>
              } />
              
              {/* Accounting Routes - Admin and Accountant */}
              <Route path="/accounting" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <AccountingIndex />
                </ProtectedRoute>
              } />
              <Route path="/accounting/expenses" element={
                <ProtectedRoute requiredPermission="canManageExpenses">
                  <Expenses />
                </ProtectedRoute>
              } />
              <Route path="/accounting/revenues" element={
                <ProtectedRoute requiredPermission="canManageRevenues">
                  <Revenues />
                </ProtectedRoute>
              } />
              <Route path="/accounting/commissions" element={
                <ProtectedRoute requiredPermission="canManageCommissions">
                  <Commissions />
                </ProtectedRoute>
              } />
              <Route path="/accounting/debts" element={
                <ProtectedRoute requiredPermission="canManageDebts">
                  <Debts />
                </ProtectedRoute>
              } />
              <Route path="/accounting/advanced-debts" element={
                <ProtectedRoute requiredPermission="canManageDebts">
                  <AdvancedDebts />
                </ProtectedRoute>
              } />
              <Route path="/accounting/vehicles" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <Vehicles />
                </ProtectedRoute>
              } />
              <Route path="/accounting/vehicle-expenses" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <VehicleExpenses />
                </ProtectedRoute>
              } />
              <Route path="/accounting/staff" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <Staff />
                </ProtectedRoute>
              } />
              <Route path="/accounting/treasury" element={
                <ProtectedRoute requiredPermission="canViewTreasury">
                  <Treasury />
                </ProtectedRoute>
              } />
              <Route path="/accounting/daily-journal" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <DailyJournal />
                </ProtectedRoute>
              } />
              <Route path="/accounting/activity-log" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <ActivityLogPage />
                </ProtectedRoute>
              } />
              
               {/* Rental Routes - Admin and Accountant */}
               <Route path="/rental" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <RentalIndex />
                 </ProtectedRoute>
               } />
               <Route path="/rental/property-owners" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <PropertyOwners />
                 </ProtectedRoute>
               } />
              <Route path="/rental/properties" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Properties />
                </ProtectedRoute>
              } />
              <Route path="/rental/tenants" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Tenants />
                </ProtectedRoute>
              } />
              <Route path="/rental/contracts" element={
                <ProtectedRoute requiredPermission="canManageCommissions">
                  <RentalContracts />
                </ProtectedRoute>
               } />
               <Route path="/rental/installments" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <Installments />
                 </ProtectedRoute>
               } />
               <Route path="/rental/government-services" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <GovernmentServices />
                 </ProtectedRoute>
               } />
              
              {/* Reports Routes - Admin and Accountant */}
              <Route path="/reports" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <ReportsIndex />
                </ProtectedRoute>
              } />
              <Route path="/reports/employees" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <EmployeeReports />
                </ProtectedRoute>
              } />
              <Route path="/reports/vehicles" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <VehicleReports />
                </ProtectedRoute>
              } />
              <Route path="/reports/commissions" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <CommissionsReports />
                </ProtectedRoute>
              } />
              <Route path="/reports/debts" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <DebtsReports />
                </ProtectedRoute>
              } />
              <Route path="/reports/expenses" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <ExpensesReports />
                </ProtectedRoute>
              } />
              <Route path="/reports/revenues" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <RevenuesReports />
                </ProtectedRoute>
              } />
              <Route path="/reports/treasury" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <TreasuryReports />
                </ProtectedRoute>
              } />
               
               {/* Employee Routes */}
               <Route path="/my-commissions" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyCommissions />
                 </ProtectedRoute>
               } />
              <Route path="/my-goals" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <MyGoals />
                </ProtectedRoute>
              } />
              <Route path="/my-evaluation" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <MyEvaluation />
                </ProtectedRoute>
              } />
              
              {/* Settings Route - Admin only */}
              <Route path="/settings" element={
                <ProtectedRoute requiredPermission="canManageStaff">
                  <Settings />
                </ProtectedRoute>
              } />
              
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
