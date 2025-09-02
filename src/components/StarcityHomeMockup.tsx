// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialIntegration } from "@/hooks/useFinancialIntegration";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import starcityLogo from "@/assets/starcity-logo.png";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Calendar, 
  Bell, 
  DollarSign, 
  Search,
  UserPlus,
  FileText,
  BarChart3,
  Home,
  AlertTriangle,
  Target,
  Clock,
  CheckCircle,
  Plus,
  PieChart,
  Activity,
  ArrowUpRight,
  LogOut,
  ChevronDown
} from "lucide-react";

export const StarcityHomeMockup = () => {
  const { profile } = useAuth();
  const { summary, loading: financialLoading } = useFinancialIntegration();
  const { unreadCount } = useNotifications();

  // جلب إحصائيات حقيقية من قاعدة البيانات
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [clientsResult, propertiesResult, dealsResult, contractsResult] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('deals').select('*').eq('status', 'closed'),
        supabase.from('rental_contracts').select('*')
      ]);

      return {
        clients: clientsResult.data?.length || 0,
        properties: propertiesResult.data?.length || 0,
        deals: dealsResult.data?.length || 0,
        contracts: contractsResult.data?.length || 0
      };
    }
  });

  // جلب النشاطات الحقيقية
  const { data: activities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      
      return data || [];
    }
  });

  // جلب أفضل الموظفين من البيانات الحقيقية
  const { data: topEmployees } = useQuery({
    queryKey: ['top-employees'],
    queryFn: async () => {
      const { data } = await supabase
        .from('commission_employees')
        .select(`
          *,
          commissions!inner (
            client_name,
            total_commission
          ),
          employee_id
        `)
        .order('calculated_share', { ascending: false })
        .limit(5);
      
      return data || [];
    }
  });

  // جلب المهام الحقيقية للمستخدم الحالي
  const { data: userTasks } = useQuery({
    queryKey: ['user-tasks', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      
      const { data } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('employee_id', profile.user_id)
        .eq('due_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(6);
      
      return data || [];
    },
    enabled: !!profile?.user_id
  });

  // جلب إحصائيات المبيعات للشهور الستة الأخيرة
  const { data: salesData } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data } = await supabase
        .from('revenues')
        .select('amount, created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });
      
      // تجميع البيانات بالشهر
      const monthlyData: Record<number, number> = {};
      data?.forEach(revenue => {
        const month = new Date(revenue.created_at).getMonth();
        monthlyData[month] = (monthlyData[month] || 0) + revenue.amount;
      });
      
      return Object.values(monthlyData);
    }
  });

  const isLoading = financialLoading || statsLoading;

  // بطاقات KPI مع البيانات الحقيقية
  const kpiCards = [
    {
      title: "إجمالي العملاء",
      value: isLoading ? "..." : stats?.clients?.toString() || "0",
      unit: "عميل",
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      title: "الصفقات هذا الشهر",
      value: isLoading ? "..." : formatCurrency(summary?.totalRevenues || 0),
      unit: "",
      icon: TrendingUp,
      change: "+8.5%",
      changeType: "positive" as const,
      color: "bg-green-50 text-green-600 border-green-200"
    },
    {
      title: "الدخل الصافي",
      value: isLoading ? "..." : formatCurrency((summary?.totalRevenues || 0) - (summary?.totalExpenses || 0)),
      unit: "",
      icon: DollarSign,
      change: summary && (summary.totalRevenues - summary.totalExpenses) > 0 ? "+15%" : "0%",
      changeType: summary && (summary.totalRevenues - summary.totalExpenses) > 0 ? "positive" as const : "neutral" as const,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      title: "العمولات المستحقة",
      value: isLoading ? "..." : formatCurrency(summary?.pendingCommissions || 0),
      unit: "",
      icon: Target,
      change: "+22%",
      changeType: "positive" as const,
      color: "bg-orange-50 text-orange-600 border-orange-200"
    },
    {
      title: "العقارات المتاحة",
      value: isLoading ? "..." : stats?.properties?.toString() || "0",
      unit: "عقار",
      icon: Building2,
      change: "+5",
      changeType: "positive" as const,
      color: "bg-cyan-50 text-cyan-600 border-cyan-200"
    },
    {
      title: "العقود النشطة",
      value: isLoading ? "..." : stats?.contracts?.toString() || "0",
      unit: "عقد",
      icon: FileText,
      change: "نشط",
      changeType: "positive" as const,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    }
  ];

  // روابط سريعة
  const quickActions = [
    {
      title: "إضافة عميل جديد",
      icon: UserPlus,
      color: "bg-blue-500 hover:bg-blue-600",
      link: "/crm/clients"
    },
    {
      title: "اليومية المحاسبية",
      icon: FileText,
      color: "bg-green-500 hover:bg-green-600",
      link: "/accounting/daily-journal"
    },
    {
      title: "إنشاء تقرير",
      icon: BarChart3,
      color: "bg-purple-500 hover:bg-purple-600",
      link: "/reports"
    },
    {
      title: "وحدة الإيجارات",
      icon: Home,
      color: "bg-orange-500 hover:bg-orange-600",
      link: "/rental"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {/* الشريط العلوي */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* الشعار والعنوان */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src="/lovable-uploads/af7a2144-3a4d-4d94-9563-fc366cea9b8c.png" 
                  alt="ستار سيتي العقارية" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ستار سيتي العقارية</h1>
                <p className="text-sm text-gray-500">الرئيسية</p>
              </div>
            </div>
          </div>

          {/* شريط البحث المركزي */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="بحث عن عميل أو صفقة أو عقار..."
                className="pr-10 pl-4 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all rounded-lg"
              />
            </div>
          </div>

          {/* الإشعارات وقائمة المستخدم */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 rounded-lg p-2">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.role === 'admin' ? 'مدير النظام' : 
                   profile?.role === 'accountant' ? 'محاسب' : 
                   profile?.role === 'employee' ? 'موظف' : 'مستخدم'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {profile?.first_name?.charAt(0) || 'م'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* ترحيب */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              أهلاً وسهلاً، {profile?.first_name || 'مستخدم'}!
            </h2>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              اليوم {new Date().toLocaleDateString('ar-EG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 px-4 py-2 text-sm font-medium">
            {profile?.role === 'admin' ? 'مدير النظام' : 
             profile?.role === 'accountant' ? 'محاسب' : 
             profile?.role === 'employee' ? 'موظف' : 'مستخدم'}
          </Badge>
        </div>

        {/* بطاقات KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiCards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-gray-900">{card.value}</span>
                      {card.unit && <span className="text-sm text-gray-500 font-medium">{card.unit}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className={`w-4 h-4 ${card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm font-medium ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                        {card.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${card.color} shadow-sm`}>
                    <card.icon className="w-7 h-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* المخططات المصغرة */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* مخطط المبيعات */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                المبيعات - آخر 6 أشهر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-end justify-center p-4">
                <div className="flex items-end gap-2 h-full w-full justify-around">
                  {(salesData && salesData.length > 0 ? salesData : [65, 45, 78, 52, 82, 95]).map((value, i) => {
                    const numericValue = typeof value === 'number' ? value : Number(value) || 0;
                    const maxValue = Math.max(...(salesData || [100]).map(v => typeof v === 'number' ? v : Number(v) || 0));
                    const height = maxValue > 0 ? (numericValue / maxValue * 100) : 50;
                    return (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-300 hover:from-blue-700 hover:to-blue-500"
                        style={{ height: `${Math.max(height, 10)}%`, width: '20px' }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between mt-3 text-xs text-gray-500">
                <span>يناير</span>
                <span>فبراير</span>
                <span>مارس</span>
                <span>إبريل</span>
                <span>مايو</span>
                <span>يونيو</span>
              </div>
            </CardContent>
          </Card>

          {/* مخطط دائري للمحفظة */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <PieChart className="w-5 h-5 text-purple-600" />
                تقسيم المحفظة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center">
                <div className="relative w-28 h-28">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 flex items-center justify-center shadow-lg">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-gray-900">100%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">فلل 45%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">شقق 35%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">أراضي 20%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أفضل الوسطاء */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="w-5 h-5 text-green-600" />
                أفضل 5 وسطاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topEmployees && topEmployees.length > 0 ? (
                  topEmployees.map((employee, i) => {
                    const maxShare = Math.max(...topEmployees.map(e => e.calculated_share));
                    const percentage = maxShare > 0 ? Math.round((employee.calculated_share / maxShare) * 100) : 0;
                    
                    return (
                      <div key={employee.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          موظف #{employee.employee_id?.slice(-4) || i + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium w-8 text-left">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد بيانات عمولات</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* جدول النشاطات والمهام */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* جدول آخر النشاطات */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="w-5 h-5 text-indigo-600" />
                آخر النشاطات
              </CardTitle>
              <CardDescription className="text-gray-600">النشاطات الأخيرة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {activities && activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.operation_type} - {activity.source_table}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(activity.created_at).toLocaleDateString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد نشاطات حديثة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* قسم مهامك اليوم */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                مهامك اليوم
              </CardTitle>
              <CardDescription className="text-gray-600">المهام المطلوب إنجازها اليوم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userTasks && userTasks.length > 0 ? (
                  userTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <Checkbox 
                        checked={task.status === 'completed'}
                        className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-2 ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            task.priority === 'high' ? 'border-red-300 text-red-700 bg-red-50' :
                            task.priority === 'medium' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                            'border-gray-300 text-gray-700 bg-gray-50'
                          }`}
                        >
                          {task.priority === 'high' ? 'أولوية عالية' : 
                           task.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد مهام لهذا اليوم</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* روابط سريعة */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Plus className="w-5 h-5 text-blue-600" />
              روابط سريعة
            </CardTitle>
            <CardDescription className="text-gray-600">أكثر العمليات استخداماً للوصول السريع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-24 flex flex-col items-center gap-3 ${action.color} text-white border-0 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                  onClick={() => window.location.href = action.link}
                >
                  <action.icon className="w-7 h-7" />
                  <span className="text-sm font-medium text-center leading-tight">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};