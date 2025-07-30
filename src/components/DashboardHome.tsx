import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Users, 
  HandCoins, 
  TrendingUp, 
  Car, 
  FileText,
  PlusCircle,
  Calendar,
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export function DashboardHome() {
  const { profile } = useAuth();
  const { checkPermission } = useRoleAccess();

  // Fetch real data based on user role
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const results: any = {};
      
      try {
        // Get basic counts for admin/accountant
        if (checkPermission('canViewAllClients')) {
          const [clientsCount, propertiesCount] = await Promise.all([
            supabase.from('clients').select('id', { count: 'exact' }),
            supabase.from('properties').select('id', { count: 'exact' })
          ]);
          results.clientsCount = clientsCount.count || 0;
          results.propertiesCount = propertiesCount.count || 0;
        }
        
        // Get financial data for admin/accountant
        if (checkPermission('canViewFinancials')) {
          const [revenues, expenses, commissions] = await Promise.all([
            supabase.from('revenues').select('amount'),
            supabase.from('expenses').select('amount'),
            supabase.from('commissions').select('total_commission')
          ]);
          
          results.totalRevenues = revenues.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
          results.totalExpenses = expenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          results.totalCommissions = commissions.data?.reduce((sum, c) => sum + Number(c.total_commission), 0) || 0;
        }
        
        // Get employee-specific data
        if (profile.role === 'employee') {
          const [myClients, myProperties, myCommissions, myDebts] = await Promise.all([
            supabase.from('clients').select('id').eq('assigned_to', profile.user_id),
            supabase.from('properties').select('id').eq('listed_by', profile.user_id),
            supabase.from('commission_employees').select('calculated_share, net_share').eq('employee_id', profile.user_id),
            supabase.from('debts').select('amount').eq('debtor_id', profile.user_id).eq('status', 'pending')
          ]);
          
          results.myClientsCount = myClients.data?.length || 0;
          results.myPropertiesCount = myProperties.data?.length || 0;
          results.myTotalCommissions = myCommissions.data?.reduce((sum, c) => sum + Number(c.calculated_share), 0) || 0;
          results.myNetCommissions = myCommissions.data?.reduce((sum, c) => sum + Number(c.net_share), 0) || 0;
          results.myDebts = myDebts.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        }
        
        // Get staff count for admin
        if (checkPermission('canViewAllStaff')) {
          const staffCount = await supabase.from('profiles').select('id', { count: 'exact' });
          results.staffCount = staffCount.count || 0;
        }
        
        // Get vehicles count for admin/accountant
        if (checkPermission('canViewAllVehicles')) {
          const vehiclesCount = await supabase.from('vehicles').select('id', { count: 'exact' });
          results.vehiclesCount = vehiclesCount.count || 0;
        }
        
        return results;
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        return {};
      }
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "مساء الخير";
    return "مساء الخير";
  };

  const getRoleSpecificStats = () => {
    if (isLoading || !dashboardData) {
      return [
        { title: "جارٍ التحميل...", value: "...", icon: Clock, color: "text-gray-400", bgColor: "bg-gray-50" }
      ];
    }

    switch (profile.role) {
      case 'admin':
        return [
          { title: "إجمالي العقارات", value: dashboardData.propertiesCount?.toString() || "0", icon: Building, color: "text-blue-600", bgColor: "bg-blue-50" },
          { title: "إجمالي العملاء", value: dashboardData.clientsCount?.toString() || "0", icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
          { title: "إجمالي الإيرادات", value: `${dashboardData.totalRevenues?.toLocaleString() || "0"} د.إ`, icon: DollarSign, color: "text-yellow-600", bgColor: "bg-yellow-50" },
          { title: "إجمالي المصروفات", value: `${dashboardData.totalExpenses?.toLocaleString() || "0"} د.إ`, icon: BarChart3, color: "text-red-600", bgColor: "bg-red-50" },
          { title: "عدد الموظفين", value: dashboardData.staffCount?.toString() || "0", icon: Users, color: "text-indigo-600", bgColor: "bg-indigo-50" },
          { title: "عدد السيارات", value: dashboardData.vehiclesCount?.toString() || "0", icon: Car, color: "text-purple-600", bgColor: "bg-purple-50" },
        ];
      case 'accountant':
        return [
          { title: "إجمالي الإيرادات", value: `${dashboardData.totalRevenues?.toLocaleString() || "0"} د.إ`, icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-50" },
          { title: "إجمالي المصروفات", value: `${dashboardData.totalExpenses?.toLocaleString() || "0"} د.إ`, icon: BarChart3, color: "text-red-600", bgColor: "bg-red-50" },
          { title: "إجمالي العمولات", value: `${dashboardData.totalCommissions?.toLocaleString() || "0"} د.إ`, icon: HandCoins, color: "text-yellow-600", bgColor: "bg-yellow-50" },
          { title: "عدد السيارات", value: dashboardData.vehiclesCount?.toString() || "0", icon: Car, color: "text-blue-600", bgColor: "bg-blue-50" },
        ];
      case 'employee':
        return [
          { title: "عقاراتي", value: dashboardData.myPropertiesCount?.toString() || "0", icon: Building, color: "text-blue-600", bgColor: "bg-blue-50" },
          { title: "عملائي", value: dashboardData.myClientsCount?.toString() || "0", icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
          { title: "عمولاتي الإجمالية", value: `${dashboardData.myTotalCommissions?.toLocaleString() || "0"} د.إ`, icon: HandCoins, color: "text-yellow-600", bgColor: "bg-yellow-50" },
          { title: "عمولاتي الصافية", value: `${dashboardData.myNetCommissions?.toLocaleString() || "0"} د.إ`, icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50" },
          { title: "مديونياتي", value: `${dashboardData.myDebts?.toLocaleString() || "0"} د.إ`, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" },
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    switch (profile.role) {
      case 'admin':
        return [
          { title: "إدارة العملاء", description: "عرض وإدارة جميع العملاء", icon: Users, href: "/crm/clients" },
          { title: "إدارة الموظفين", description: "عرض وإدارة الموظفين", icon: Users, href: "/accounting/staff" },
          { title: "إدارة السيارات", description: "عرض وإدارة السيارات", icon: Car, href: "/accounting/vehicles" },
          { title: "التقارير المالية", description: "عرض التقارير والإحصائيات", icon: BarChart3, href: "/reports" },
        ];
      case 'accountant':
        return [
          { title: "إدارة المصروفات", description: "عرض وإضافة المصروفات", icon: FileText, href: "/accounting/expenses" },
          { title: "إدارة الإيرادات", description: "عرض وإضافة الإيرادات", icon: TrendingUp, href: "/accounting/revenues" },
          { title: "إدارة العمولات", description: "عرض وإدارة العمولات", icon: HandCoins, href: "/accounting/commissions" },
          { title: "إدارة الخزينة", description: "عرض حسابات الخزينة", icon: DollarSign, href: "/accounting/treasury" },
        ];
      case 'employee':
        return [
          { title: "عمولاتي", description: "عرض تفاصيل عمولاتي", icon: HandCoins, href: "/my-commissions" },
          { title: "مديونياتي", description: "عرض المديونيات المستحقة", icon: AlertTriangle, href: "/accounting/debts" },
          { title: "أهدافي", description: "عرض الأهداف والإنجازات", icon: Target, href: "/my-goals" },
          { title: "تقييمي", description: "عرض التقييم الشخصي", icon: CheckCircle, href: "/my-evaluation" },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {getWelcomeMessage()}، {profile.first_name}!
            </h1>
            <p className="text-muted-foreground flex items-center mt-2">
              <Calendar className="h-4 w-4 ml-2" />
              {new Date().toLocaleDateString('ar-AE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {profile.role === 'admin' ? 'مدير النظام' : 
             profile.role === 'accountant' ? 'محاسب' : 'موظف مبيعات'}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getRoleSpecificStats().map((stat, index) => (
          <Card key={index} className="hover-scale hover-glow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">الإجراءات السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getQuickActions().map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="hover-scale hover-glow cursor-pointer group h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity (Placeholder) */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">النشاط الأخير</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد أنشطة حديثة</p>
              <p className="text-sm text-muted-foreground mt-2">
                سيظهر هنا آخر الأنشطة والتحديثات عند بدء استخدام النظام
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}