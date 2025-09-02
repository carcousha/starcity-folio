import React, { Suspense, lazy } from "react";
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
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GlobalSelectedBrokersProvider } from "@/hooks/useGlobalSelectedBrokers";
import LoadingErrorBoundary from "@/components/ui/LoadingErrorBoundary";
import { connectionManager } from "@/services/connectionManager";

// Lazy Loading Components
const Auth = lazy(() => import("./pages/Auth"));
const CRMIndex = lazy(() => import("./pages/crm/index"));
const Clients = lazy(() => import("./pages/crm/Clients"));
const Leads = lazy(() => import("./pages/crm/Leads"));
const CRMProperties = lazy(() => import("./pages/crm/Properties"));
const CRMPropertyOwners = lazy(() => import("./pages/crm/PropertyOwners"));
const TasksIndex = lazy(() => import("./pages/tasks/index"));
const AccountingIndex = lazy(() => import("./pages/accounting/index"));
const Expenses = lazy(() => import("./pages/accounting/Expenses"));
const Revenues = lazy(() => import("./pages/accounting/Revenues"));
const Commissions = lazy(() => import("./pages/accounting/Commissions"));
const Debts = lazy(() => import("./pages/accounting/Debts"));
const Vehicles = lazy(() => import("./pages/accounting/Vehicles"));
const VehicleExpenses = lazy(() => import("./pages/accounting/VehicleExpenses"));
const Staff = lazy(() => import("./pages/accounting/Staff"));
const Treasury = lazy(() => import("./pages/accounting/Treasury"));
const ActivityLogPage = lazy(() => import("./pages/accounting/ActivityLog"));
const AdvancedDebts = lazy(() => import("./pages/accounting/AdvancedDebts"));
const DailyJournal = lazy(() => import("./pages/accounting/DailyJournal"));
const ReportsIndex = lazy(() => import("./pages/reports/index"));
const RentalIndex = lazy(() => import("./pages/rental/index"));
const RentalPropertyOwners = lazy(() => import("./pages/rental/PropertyOwners"));
const RentalProperties = lazy(() => import("./pages/rental/Properties"));
const Tenants = lazy(() => import("./pages/rental/Tenants"));
const RentalContracts = lazy(() => import("./pages/rental/RentalContracts"));
const GeneratedContracts = lazy(() => import("./pages/rental/GeneratedContracts"));
const Installments = lazy(() => import("./pages/rental/Installments"));
const GovernmentServices = lazy(() => import("./pages/rental/GovernmentServices"));
const EmployeeReports = lazy(() => import("./pages/reports/EmployeeReports"));
const EmployeeDetails = lazy(() => import("./pages/reports/EmployeeDetails"));
const VehicleReports = lazy(() => import("./pages/reports/VehicleReports"));
const CommissionsReports = lazy(() => import("./pages/reports/CommissionsReports"));
const DebtsReports = lazy(() => import("./pages/reports/DebtsReports"));
const ExpensesReports = lazy(() => import("./pages/reports/ExpensesReports"));
const RevenuesReports = lazy(() => import("./pages/reports/RevenuesReports"));
const TreasuryReports = lazy(() => import("./pages/reports/TreasuryReports"));
const EmployeeDashboard = lazy(() => import("./pages/employee/Dashboard"));
const MyCommissions = lazy(() => import("./pages/employee/MyCommissions"));
const MyDebts = lazy(() => import("./pages/employee/MyDebts"));
const MyProfile = lazy(() => import("./pages/employee/MyProfile"));
const Vehicle = lazy(() => import("./pages/employee/Vehicle"));
const MyRequests = lazy(() => import("./pages/employee/MyRequests"));
const Complaints = lazy(() => import("./pages/employee/Complaints"));
const Notifications = lazy(() => import("./pages/employee/Notifications"));
const MyGoals = lazy(() => import("./pages/employee/MyGoals"));
const MyEvaluation = lazy(() => import("./pages/employee/MyEvaluation"));
const MyPerformance = lazy(() => import("./pages/employee/MyPerformance"));
const MyClients = lazy(() => import("./pages/employee/MyClients"));
const MyLeads = lazy(() => import("./pages/employee/MyLeads"));
const MyTasks = lazy(() => import("./pages/employee/MyTasks"));
const MyProperties = lazy(() => import("./pages/employee/MyProperties"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));
const SecurityAuditPage = lazy(() => import("./pages/SecurityAudit"));


const AIIntelligenceHub = lazy(() => import("./components/ai"));
const AIHubDashboard = lazy(() => import("./components/ai/AIHubDashboard"));

// WhatsApp Module
const WhatsAppModule = lazy(() => import("./pages/whatsapp/index"));
const WhatsAppContacts = lazy(() => import("./pages/whatsapp/Contacts"));

// Land Sales Module
const LandSalesIndex = lazy(() => import("./pages/land-sales/index"));


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
      <ThemeProvider defaultTheme="system" storageKey="starcity-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <GlobalSelectedBrokersProvider>
                <StrictAuthProtector>
                  <AppProtector />
                </StrictAuthProtector>
              </GlobalSelectedBrokersProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// مكون الحماية الرئيسي مع فحص صارم للغاية
const AppProtector = () => {
  const { user, session, profile, loading } = useAuth();
  const location = useLocation();
  const [authTimeout, setAuthTimeout] = React.useState(false);

  // إضافة timeout لتجنب التحميل اللانهائي
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Auth timeout reached, proceeding...');
        setAuthTimeout(true);
      }
    }, 8000); // 8 ثوان timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // إذا كان المسار صفحة تسجيل الدخول، اعرضها فقط
  if (location.pathname === "/") {
    return (
      <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Auth">
        <Auth />
      </LoadingErrorBoundary>
    );
  }

  // فحص فوري وصارم: إذا لم يكن هناك session صالح
  if (!loading && (!session || !user)) {
    // تنظيف كامل لأي بيانات مخزنة محلياً
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/');
    return null;
  }

  // إذا كان التحميل جاري ولم ينته الوقت المحدد، أظهر شاشة تحميل بسيطة
  if (loading && !authTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">جاري التحقق من صحة الهوية...</p>
        </div>
      </div>
    );
  }

  // فحص ثانوي: إذا لم يوجد profile، وجه للوحة الادارة افتراضياً
  if (!profile) {
    // لا نريد إعادة توجيه، بل نسمح بالمرور للوحة الادارة الافتراضية
  }

  // إذا وصل هنا، يعني المستخدم مصادق عليه ونشط
  return (
    <div dir="rtl">
      <AudioNotificationProvider>
        <RouteGuard>
          <AuthGuard>
            <AppLayout>
              <Routes>
                        <Route path="/admin-dashboard" element={
                          <ProtectedRoute requiredPermission="canManageStaff">
                            <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="DashboardHome">
                              <DashboardHome />
                            </LoadingErrorBoundary>
                          </ProtectedRoute>
                        } />
              
              {/* CRM Routes - Admin and some for employees */}
               <Route path="/crm" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="CRMIndex">
                     <CRMIndex />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />

               <Route path="/crm/clients" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Clients">
                     <Clients />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/crm/leads" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Leads">
                     <Leads />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
                               

               <Route path="/crm/properties" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="CRMProperties">
                     <CRMProperties />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/crm/owners" element={
                  <ProtectedRoute requiredPermission="crmAccess">
                    <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="CRMPropertyOwners">
                      <CRMPropertyOwners />
                    </LoadingErrorBoundary>
                  </ProtectedRoute>
                } />
              <Route path="/crm/tasks" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="TasksIndex">
                    <TasksIndex />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              
              {/* Contacts Route - Standalone */}
              <Route path="/contacts" element={
                <ProtectedRoute requiredPermission="crmAccess">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="WhatsAppContacts">
                    <WhatsAppContacts />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              
              {/* Accounting Routes - Admin and Accountant */}
              <Route path="/accounting" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="AccountingIndex">
                    <AccountingIndex />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/expenses" element={
                <ProtectedRoute requiredPermission="canManageExpenses">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Expenses">
                    <Expenses />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/revenues" element={
                <ProtectedRoute requiredPermission="canManageRevenues">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Revenues">
                    <Revenues />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/commissions" element={
                <ProtectedRoute requiredPermission="canManageCommissions">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Commissions">
                    <Commissions />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/debts" element={
                <ProtectedRoute requiredPermission="canManageDebts">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Debts">
                    <Debts />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/advanced-debts" element={
                <ProtectedRoute requiredPermission="canManageDebts">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="AdvancedDebts">
                    <AdvancedDebts />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/vehicles" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Vehicles">
                    <Vehicles />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/vehicle-expenses" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="VehicleExpenses">
                    <VehicleExpenses />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/staff" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Staff">
                    <Staff />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/treasury" element={
                <ProtectedRoute requiredPermission="canViewTreasury">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Treasury">
                    <Treasury />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/daily-journal" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="DailyJournal">
                    <DailyJournal />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounting/activity-log" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="ActivityLogPage">
                    <ActivityLogPage />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              
               {/* Rental Routes - Admin and Accountant */}
               <Route path="/rental" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="RentalIndex">
                     <RentalIndex />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/rental/property-owners" element={
                  <ProtectedRoute requiredPermission="canViewFinancials">
                    <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="RentalPropertyOwners">
                      <RentalPropertyOwners />
                    </LoadingErrorBoundary>
                  </ProtectedRoute>
                } />
              <Route path="/rental/properties" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="RentalProperties">
                    <RentalProperties />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/rental/tenants" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Tenants">
                    <Tenants />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
               <Route path="/rental/contracts" element={
                 <ProtectedRoute requiredPermission="canManageCommissions">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="RentalContracts">
                     <RentalContracts />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
                } />
                <Route path="/rental/generated-contracts" element={
                  <ProtectedRoute requiredPermission="canViewFinancials">
                    <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="GeneratedContracts">
                      <GeneratedContracts />
                    </LoadingErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/rental/installments" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Installments">
                     <Installments />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/rental/government-services" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="GovernmentServices">
                     <GovernmentServices />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
              
              {/* WhatsApp Module Routes - Admin and Accountant */}
              <Route path="/whatsapp/*" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="WhatsAppModule">
                    <WhatsAppModule />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />

              {/* Land Sales Routes - Admin and Accountant */}
              <Route path="/land-sales/*" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="LandSalesIndex">
                    <LandSalesIndex />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              
              {/* Reports Routes - Admin and Accountant */}
              <Route path="/reports" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="ReportsIndex">
                    <ReportsIndex />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/employees" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="EmployeeReports">
                    <EmployeeReports />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/employee/:employeeId" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="EmployeeDetails">
                    <EmployeeDetails />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/vehicles" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="VehicleReports">
                    <VehicleReports />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/commissions" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="CommissionsReports">
                    <CommissionsReports />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/debts" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="DebtsReports">
                    <DebtsReports />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/expenses" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="ExpensesReports">
                    <ExpensesReports />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/revenues" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="RevenuesReports">
                    <RevenuesReports />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/reports/treasury" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="TreasuryReports">
                    <TreasuryReports />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
               
               {/* Employee Routes */}
               <Route path="/employee/dashboard" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="EmployeeDashboard">
                     <EmployeeDashboard />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-commissions" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyCommissions">
                     <MyCommissions />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-debts" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyDebts">
                     <MyDebts />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/vehicle" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Vehicle">
                     <Vehicle />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/requests" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyRequests">
                     <MyRequests />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/complaints" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Complaints">
                     <Complaints />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/notifications" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Notifications">
                     <Notifications />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/tasks" element={
                 <ProtectedRoute requiredPermission="canViewActivityLogs">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="TasksIndex">
                     <TasksIndex />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
              <Route path="/my-goals" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyGoals">
                    <MyGoals />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/my-evaluation" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyEvaluation">
                    <MyEvaluation />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
               } />
               <Route path="/employee/my-performance" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyPerformance">
                     <MyPerformance />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-clients" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyClients">
                     <MyClients />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-leads" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyLeads">
                     <MyLeads />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-tasks" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyTasks">
                     <MyTasks />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-properties" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyProperties">
                     <MyProperties />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-profile" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="MyProfile">
                     <MyProfile />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
              
              {/* Settings Route - Admin only */}
              <Route path="/settings" element={
                <ProtectedRoute requiredPermission="canManageStaff">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="Settings">
                    <Settings />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              
              {/* Security Audit Route - Admin only */}
              <Route path="/security-audit" element={
                <ProtectedRoute requiredPermission="canManageStaff">
                  <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="SecurityAuditPage">
                    <SecurityAuditPage />
                  </LoadingErrorBoundary>
                </ProtectedRoute>
              } />
              
              {/* AI Intelligence Hub */}
               <Route path="/ai-intelligence-hub" element={
                 <ProtectedRoute requiredPermission="canManageStaff">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="AIHubDashboard">
                     <AIHubDashboard />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
               <Route path="/ai-intelligence-hub/:sub" element={
                 <ProtectedRoute requiredPermission="canManageStaff">
                   <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="AIIntelligenceHub">
                     <AIIntelligenceHub />
                   </LoadingErrorBoundary>
                 </ProtectedRoute>
               } />
              

              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={
                  <ProtectedRoute requiredPermission="crmAccess">
                    <LoadingErrorBoundary fallback={<LoadingSpinner />} modulePath="NotFound">
                      <NotFound />
                    </LoadingErrorBoundary>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppLayout>
        </AuthGuard>
      </RouteGuard>
    </AudioNotificationProvider>
  </div>
  );
};

export default App;
