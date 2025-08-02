import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, HandCoins, TrendingUp, PieChart, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AccountantDashboard() {
  const { profile } = useAuth();

  // جلب إحصائيات المحاسب فقط
  const { data: accountantStats } = useQuery({
    queryKey: ['accountant-stats', profile?.user_id],
    queryFn: async () => {
      const userId = profile?.user_id;
      if (!userId) return null;

      // الإيرادات التي سجلها المحاسب
      const { data: revenues } = await supabase
        .from('revenues')
        .select('amount')
        .eq('recorded_by', userId);

      // المصروفات التي سجلها المحاسب
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('recorded_by', userId);

      // العمولات التي يديرها
      const { data: commissions } = await supabase
        .from('commissions')
        .select('total_commission')
        .eq('employee_id', userId);

      // المديونيات التي يديرها
      const { data: debts } = await supabase
        .from('debts')
        .select('amount')
        .eq('recorded_by', userId)
        .eq('status', 'pending');

      const totalRevenues = revenues?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const totalCommissions = commissions?.reduce((sum, c) => sum + (c.total_commission || 0), 0) || 0;
      const totalDebts = debts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

      return {
        totalRevenues,
        totalExpenses,
        totalCommissions,
        totalDebts,
        revenueCount: revenues?.length || 0,
        expenseCount: expenses?.length || 0,
        commissionCount: commissions?.length || 0,
        debtCount: debts?.length || 0,
      };
    },
    enabled: !!profile?.user_id,
  });

  if (!accountantStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const netBalance = accountantStats.totalRevenues - accountantStats.totalExpenses;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-right mb-2">لوحة تحكم المحاسب</h1>
        <p className="text-muted-foreground text-right">
          مرحباً {profile?.first_name} {profile?.last_name} - إليك ملخص العمليات المالية التي تديرها
        </p>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {accountantStats.totalRevenues.toLocaleString()} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              {accountantStats.revenueCount} معاملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {accountantStats.totalExpenses.toLocaleString()} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              {accountantStats.expenseCount} معاملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العمولات</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {accountantStats.totalCommissions.toLocaleString()} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              {accountantStats.commissionCount} عمولة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديونيات المعلقة</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {accountantStats.totalDebts.toLocaleString()} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              {accountantStats.debtCount} دين معلق
            </p>
          </CardContent>
        </Card>
      </div>

      {/* بطاقة الرصيد الصافي */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            الرصيد الصافي
          </CardTitle>
          <CardDescription>
            الفرق بين إجمالي الإيرادات والمصروفات التي سجلتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString()} د.إ
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {netBalance >= 0 ? 'رصيد إيجابي' : 'رصيد سالب'}
          </p>
        </CardContent>
      </Card>

      {/* ملاحظات مهمة */}
      <Card>
        <CardHeader>
          <CardTitle>ملاحظات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <p className="text-sm text-muted-foreground">
              هذه الإحصائيات تظهر العمليات المالية التي سجلتها أنت فقط
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <p className="text-sm text-muted-foreground">
              يمكنك الوصول لتفاصيل أكثر من القوائم الجانبية
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <p className="text-sm text-muted-foreground">
              تابع المديونيات المعلقة وتأكد من تحصيلها في الوقت المناسب
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}