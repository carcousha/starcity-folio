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
const TestPage = lazy(() => import("./pages/TestPage"));
const SecurityAuditPage = lazy(() => import("./pages/SecurityAudit"));


const AIIntelligenceHub = lazy(() => import("./components/ai"));
const AIHubDashboard = lazy(() => import("./components/ai/AIHubDashboard"));

// WhatsApp Module
const WhatsAppModule = lazy(() => import("./pages/whatsapp/index"));

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
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="starcity-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GlobalSelectedBrokersProvider>
                <StrictAuthProtector>
                  <AppProtector />
                </StrictAuthProtector>
              </GlobalSelectedBrokersProvider>
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

  // صفحة اختبار بدون مصادقة
  if (location.pathname === "/test-app") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TestPage />
      </Suspense>
    );
  }

  // إذا كان المسار صفحة تسجيل الدخول، اعرضها فقط
  if (location.pathname === "/") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Auth />
      </Suspense>
    );
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
    console.log('AppProtector: Loading is true, showing loading screen', { user: !!user, session: !!session, profile: !!profile, loading });
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
    console.log('AppProtector: No profile found, continuing with default admin access');
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
                            <Suspense fallback={<LoadingSpinner />}>
                              <DashboardHome />
                            </Suspense>
                          </ProtectedRoute>
                        } />
              
              {/* CRM Routes - Admin and some for employees */}
               <Route path="/crm" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <CRMIndex />
                   </Suspense>
                 </ProtectedRoute>
               } />

               <Route path="/crm/clients" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <Clients />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/crm/leads" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <Leads />
                   </Suspense>
                 </ProtectedRoute>
               } />
                               

               <Route path="/crm/properties" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <CRMProperties />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/crm/owners" element={
                  <ProtectedRoute requiredPermission="crmAccess">
                    <Suspense fallback={<LoadingSpinner />}>
                      <CRMPropertyOwners />
                    </Suspense>
                  </ProtectedRoute>
                } />
              <Route path="/crm/tasks" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <Suspense fallback={<LoadingSpinner />}>
                    <TasksIndex />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Accounting Routes - Admin and Accountant */}
              <Route path="/accounting" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AccountingIndex />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/expenses" element={
                <ProtectedRoute requiredPermission="canManageExpenses">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Expenses />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/revenues" element={
                <ProtectedRoute requiredPermission="canManageRevenues">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Revenues />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/commissions" element={
                <ProtectedRoute requiredPermission="canManageCommissions">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Commissions />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/debts" element={
                <ProtectedRoute requiredPermission="canManageDebts">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Debts />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/advanced-debts" element={
                <ProtectedRoute requiredPermission="canManageDebts">
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdvancedDebts />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/vehicles" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Vehicles />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/vehicle-expenses" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <Suspense fallback={<LoadingSpinner />}>
                    <VehicleExpenses />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/staff" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Staff />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/treasury" element={
                <ProtectedRoute requiredPermission="canViewTreasury">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Treasury />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/daily-journal" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Suspense fallback={<LoadingSpinner />}>
                    <DailyJournal />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/accounting/activity-log" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ActivityLogPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
               {/* Rental Routes - Admin and Accountant */}
               <Route path="/rental" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <Suspense fallback={<LoadingSpinner />}>
                     <RentalIndex />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/rental/property-owners" element={
                  <ProtectedRoute requiredPermission="canViewFinancials">
                    <Suspense fallback={<LoadingSpinner />}>
                      <RentalPropertyOwners />
                    </Suspense>
                  </ProtectedRoute>
                } />
              <Route path="/rental/properties" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Suspense fallback={<LoadingSpinner />}>
                    <RentalProperties />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/rental/tenants" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Tenants />
                  </Suspense>
                </ProtectedRoute>
              } />
               <Route path="/rental/contracts" element={
                 <ProtectedRoute requiredPermission="canManageCommissions">
                   <Suspense fallback={<LoadingSpinner />}>
                     <RentalContracts />
                   </Suspense>
                 </ProtectedRoute>
                } />
                <Route path="/rental/generated-contracts" element={
                  <ProtectedRoute requiredPermission="canViewFinancials">
                    <Suspense fallback={<LoadingSpinner />}>
                      <GeneratedContracts />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/rental/installments" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <Suspense fallback={<LoadingSpinner />}>
                     <Installments />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/rental/government-services" element={
                 <ProtectedRoute requiredPermission="canViewFinancials">
                   <Suspense fallback={<LoadingSpinner />}>
                     <GovernmentServices />
                   </Suspense>
                 </ProtectedRoute>
               } />
              
              {/* WhatsApp Module Routes - Admin and Accountant */}
              <Route path="/whatsapp/*" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Suspense fallback={<LoadingSpinner />}>
                    <WhatsAppModule />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Land Sales Routes - Admin and Accountant */}
              <Route path="/land-sales/*" element={
                <ProtectedRoute requiredPermission="canViewFinancials">
                  <Suspense fallback={<LoadingSpinner />}>
                    <LandSalesIndex />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Reports Routes - Admin and Accountant */}
              <Route path="/reports" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ReportsIndex />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/employees" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <Suspense fallback={<LoadingSpinner />}>
                    <EmployeeReports />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/employee/:employeeId" element={
                <ProtectedRoute requiredPermission="canViewAllStaff">
                  <Suspense fallback={<LoadingSpinner />}>
                    <EmployeeDetails />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/vehicles" element={
                <ProtectedRoute requiredPermission="canViewAllVehicles">
                  <Suspense fallback={<LoadingSpinner />}>
                    <VehicleReports />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/commissions" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CommissionsReports />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/debts" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <Suspense fallback={<LoadingSpinner />}>
                    <DebtsReports />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/expenses" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <Suspense fallback={<LoadingSpinner />}>
                    <ExpensesReports />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/revenues" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <Suspense fallback={<LoadingSpinner />}>
                    <RevenuesReports />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/reports/treasury" element={
                <ProtectedRoute requiredPermission="canViewAllReports">
                  <Suspense fallback={<LoadingSpinner />}>
                    <TreasuryReports />
                  </Suspense>
                </ProtectedRoute>
              } />
               
               {/* Employee Routes */}
               <Route path="/employee/dashboard" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <EmployeeDashboard />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-commissions" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyCommissions />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-debts" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyDebts />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/vehicle" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <Vehicle />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/requests" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyRequests />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/complaints" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <Complaints />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/notifications" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <Notifications />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/tasks" element={
                 <ProtectedRoute requiredPermission="canViewActivityLogs">
                   <Suspense fallback={<LoadingSpinner />}>
                     <TasksIndex />
                   </Suspense>
                 </ProtectedRoute>
               } />
              <Route path="/my-goals" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <Suspense fallback={<LoadingSpinner />}>
                    <MyGoals />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/my-evaluation" element={
                <ProtectedRoute requiredPermission="canViewActivityLogs">
                  <Suspense fallback={<LoadingSpinner />}>
                    <MyEvaluation />
                  </Suspense>
                </ProtectedRoute>
               } />
               <Route path="/employee/my-performance" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyPerformance />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-clients" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyClients />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-leads" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyLeads />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-tasks" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyTasks />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-properties" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyProperties />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/employee/my-profile" element={
                 <ProtectedRoute requiredPermission="crmAccess">
                   <Suspense fallback={<LoadingSpinner />}>
                     <MyProfile />
                   </Suspense>
                 </ProtectedRoute>
               } />
              
              {/* Settings Route - Admin only */}
              <Route path="/settings" element={
                <ProtectedRoute requiredPermission="canManageStaff">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Security Audit Route - Admin only */}
              <Route path="/security-audit" element={
                <ProtectedRoute requiredPermission="canManageStaff">
                  <Suspense fallback={<LoadingSpinner />}>
                    <SecurityAuditPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* AI Intelligence Hub */}
               <Route path="/ai-intelligence-hub" element={
                 <ProtectedRoute requiredPermission="canManageStaff">
                   <Suspense fallback={<LoadingSpinner />}>
                     <AIHubDashboard />
                   </Suspense>
                 </ProtectedRoute>
               } />
               <Route path="/ai-intelligence-hub/:sub" element={
                 <ProtectedRoute requiredPermission="canManageStaff">
                   <Suspense fallback={<LoadingSpinner />}>
                     <AIIntelligenceHub />
                   </Suspense>
                 </ProtectedRoute>
               } />
              

              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={
                  <ProtectedRoute requiredPermission="crmAccess">
                    <Suspense fallback={<LoadingSpinner />}>
                      <NotFound />
                    </Suspense>
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
