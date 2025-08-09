import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthGuard } from "@/components/AuthGuard";
import { RouteGuard } from "@/components/RouteGuard";
import { AudioNotificationProvider } from "@/components/AudioNotificationProvider";
import { AppLayout } from "@/components/AppLayout";
import { StrictAuthProtector } from "@/components/StrictAuthProtector";
import { DashboardHome } from "@/components/DashboardHome";
import Auth from "./pages/Auth";
import CRMIndex from "./pages/crm/index";
import Clients from "./pages/crm/Clients";
import Leads from "./pages/crm/Leads";
import CRMProperties from "./pages/crm/Properties";
import CRMPropertyOwners from "./pages/crm/PropertyOwners";
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
import RentalPropertyOwners from "./pages/rental/PropertyOwners";
import RentalProperties from "./pages/rental/Properties";
import Tenants from "./pages/rental/Tenants";
import RentalContracts from "./pages/rental/RentalContracts";
import GeneratedContracts from "./pages/rental/GeneratedContracts";
import Installments from "./pages/rental/Installments";
import GovernmentServices from "./pages/rental/GovernmentServices";
import EmployeeReports from "./pages/reports/EmployeeReports";
import EmployeeDetails from "./pages/reports/EmployeeDetails";
import VehicleReports from "./pages/reports/VehicleReports";
import CommissionsReports from "./pages/reports/CommissionsReports";
import DebtsReports from "./pages/reports/DebtsReports";
import ExpensesReports from "./pages/reports/ExpensesReports";
import RevenuesReports from "./pages/reports/RevenuesReports";
import TreasuryReports from "./pages/reports/TreasuryReports";
import EmployeeDashboard from "./pages/employee/Dashboard";
import MyCommissions from "./pages/employee/MyCommissions";
import MyDebts from "./pages/employee/MyDebts";
import MyProfile from "./pages/employee/MyProfile";
import Vehicle from "./pages/employee/Vehicle";
import MyRequests from "./pages/employee/MyRequests";
import Complaints from "./pages/employee/Complaints";
import Notifications from "./pages/employee/Notifications";
import MyGoals from "./pages/employee/MyGoals";
import MyEvaluation from "./pages/employee/MyEvaluation";
import MyPerformance from "./pages/employee/MyPerformance";
import MyClients from "./pages/employee/MyClients";
import MyLeads from "./pages/employee/MyLeads";
import MyTasks from "./pages/employee/MyTasks";
import MyProperties from "./pages/employee/MyProperties";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SecurityAuditPage from "./pages/SecurityAudit";
import WhatsAppSmart from "./pages/crm/WhatsAppSmart";
import WhatsAppHome from "./pages/whatsapp/index";
import WhatsAppSettings from "./pages/whatsapp/Settings";
import WhatsAppLogs from "./pages/whatsapp/Logs";
import WhatsAppReminders from "./pages/whatsapp/Reminders";
import WhatsAppTemplates from "./pages/whatsapp/Templates";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="starcity-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <StrictAuthProtector>
                <AppProtector />
              </StrictAuthProtector>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// مكون الحماية الرئيسي مع فحص صارم للغاية
const AppProtector = () => {
  const { user, session, profile, loading } = useAuth();
  const location = useLocation();

  // إذا كان المسار صفحة تسجيل الدخول، اعرضها فقط
  if (location.pathname === "/") {
    return <Auth />;
  }

  // فحص فوري وصارم: إذا لم يكن هناك session صالح
  if (!loading && (!session || !user)) {
    console.log('AppProtector: No valid session detected, redirecting to login');
    // تنظيف كامل لأي بيانات مخزنة محلياً
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/');
    return null;
  }

  // إذا كان التحميل جاري، أظهر شاشة تحميل بسيطة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">جاري التحقق من صحة الهوية...</p>
        </div>
      </div>
    );
  }

  // فحص ثانوي: التأكد من وجود profile صالح
  if (!profile) {
    console.log('AppProtector: No profile found, redirecting to login');
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/');
    return null;
  }

  // فحص نشاط المستخدم
  if (!profile.is_active) {
    console.log('AppProtector: User is not active, redirecting to login');
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/');
    return null;
  }

  // إذا وصل هنا، يعني المستخدم مصادق عليه ونشط
  return (
    <AudioNotificationProvider>
      <RouteGuard>
        <AuthGuard>
          <AppLayout>
            <Routes>
                        <Route path="/admin-dashboard" element={
                          <ProtectedRoute requiredPermission="canManageStaff">
                            <DashboardHome />
                          </ProtectedRoute>
                        } />
              
              {/* CRM Routes - Admin and some for employees */}
               <Route path="/crm" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <CRMIndex />
                 </ProtectedRoute>
               } />
               <Route path="/whatsapp/templates" element={
                 <ProtectedRoute requiredPermission="canManageStaff">
                   <WhatsAppTemplates />
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
               {/* WhatsApp Module */}
               <Route path="/whatsapp" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <WhatsAppHome />
                 </ProtectedRoute>
               } />
               <Route path="/whatsapp/smart" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <WhatsAppSmart />
                 </ProtectedRoute>
               } />
               <Route path="/whatsapp/settings" element={
                 <ProtectedRoute requiredPermission="canManageStaff">
                   <WhatsAppSettings />
                 </ProtectedRoute>
               } />
               <Route path="/whatsapp/logs" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <WhatsAppLogs />
                 </ProtectedRoute>
               } />
               <Route path="/whatsapp/reminders" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <WhatsAppReminders />
                 </ProtectedRoute>
               } />
               <Route path="/crm/properties" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <CRMProperties />
                 </ProtectedRoute>
               } />
               <Route path="/crm/owners" element={
                  <ProtectedRoute requiredPermission="crmAccess">
                    <CRMPropertyOwners />
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
                    <RentalPropertyOwners />
                  </ProtectedRoute>
                } />
              <Route path="/rental/properties" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <RentalProperties />
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
                <Route path="/rental/generated-contracts" element={
                  <ProtectedRoute requiredPermission="canViewFinancials">
                    <GeneratedContracts />
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
              <Route path="/reports/employee/:employeeId" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <EmployeeDetails />
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
               <Route path="/employee/dashboard" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <EmployeeDashboard />
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-commissions" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyCommissions />
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-debts" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyDebts />
                 </ProtectedRoute>
               } />
               <Route path="/employee/vehicle" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Vehicle />
                 </ProtectedRoute>
               } />
               <Route path="/employee/requests" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyRequests />
                 </ProtectedRoute>
               } />
               <Route path="/employee/complaints" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Complaints />
                 </ProtectedRoute>
               } />
               <Route path="/employee/notifications" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Notifications />
                 </ProtectedRoute>
               } />
               <Route path="/tasks" element={
                 <ProtectedRoute requiredPermission="canViewActivityLogs">
                   <TasksIndex />
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
               <Route path="/employee/my-performance" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyPerformance />
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-clients" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyClients />
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-leads" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyLeads />
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-tasks" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyTasks />
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-properties" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyProperties />
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-profile" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <MyProfile />
                 </ProtectedRoute>
               } />
              
              {/* Settings Route - Admin only */}
              <Route path="/settings" element={
                <ProtectedRoute requiredPermission="canManageStaff">
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* Security Audit Route - Admin only */}
              <Route path="/security-audit" element={
                <ProtectedRoute requiredPermission="canManageStaff">
                  <SecurityAuditPage />
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={
                  <ProtectedRoute requiredPermission="crmAccess">
                    <NotFound />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppLayout>
        </AuthGuard>
      </RouteGuard>
    </AudioNotificationProvider>
  );
};

export default App;
