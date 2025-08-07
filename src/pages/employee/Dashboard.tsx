import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Target, 
  Users, 
  Building,
  HandCoins,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function EmployeeDashboard() {
  const { profile } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['employee-dashboard', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const [dealsResult, commissionsResult, debtsResult, leadsResult] = await Promise.all([
        // Deals
        supabase
          .from('deals')
          .select('*')
          .eq('handled_by', profile.user_id)
          .order('created_at', { ascending: false }),
        
        // Commissions
        supabase
          .from('commission_employees')
          .select(`
            *,
            commissions (
              client_name,
              total_commission,
              status
            )
          `)
          .eq('employee_id', profile.user_id),
        
        // Debts
        supabase
          .from('debts')
          .select('*')
          .eq('debtor_id', profile.user_id),

        // Leads
        supabase
          .from('leads')
          .select('*')
          .eq('assigned_to', profile.user_id)
      ]);

      return {
        deals: dealsResult.data || [],
        commissions: commissionsResult.data || [],
        debts: debtsResult.data || [],
        leads: leadsResult.data || []
      };
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const openDeals = dashboardData?.deals.filter(d => d.status === 'open').length || 0;
  const closedDeals = dashboardData?.deals.filter(d => d.status === 'closed').length || 0;
  const totalCommissions = dashboardData?.commissions.reduce((sum, c) => sum + Number(c.net_share), 0) || 0;
  const pendingDebts = dashboardData?.debts.filter(d => d.status === 'pending').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  const newLeads = dashboardData?.leads.filter(l => l.stage === 'new').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Home className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً {profile.first_name} {profile.last_name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الصفقات المفتوحة</p>
                <p className="text-2xl font-bold text-foreground">{openDeals}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الصفقات المغلقة</p>
                <p className="text-2xl font-bold text-foreground">{closedDeals}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">العمولات الصافية</p>
                <p className="text-2xl font-bold text-foreground">{totalCommissions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <HandCoins className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المديونيات المعلقة</p>
                <p className="text-2xl font-bold text-foreground">{pendingDebts.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">عملاء جدد</p>
                <p className="text-2xl font-bold text-foreground">{newLeads}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-5 w-5" />
              <span>الصفقات الأخيرة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : !dashboardData?.deals.length ? (
              <p className="text-muted-foreground text-center py-4">لا توجد صفقات</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.deals.slice(0, 5).map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">صفقة #{deal.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{deal.deal_type}</p>
                    </div>
                    <div className="text-left">
                      <Badge variant={deal.status === 'closed' ? 'default' : 'secondary'}>
                        {deal.status === 'closed' ? 'مغلقة' : 'مفتوحة'}
                      </Badge>
                      <p className="text-sm font-semibold mt-1">{Number(deal.amount).toLocaleString()} د.إ</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <HandCoins className="h-5 w-5" />
              <span>العمولات الأخيرة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : !dashboardData?.commissions.length ? (
              <p className="text-muted-foreground text-center py-4">لا توجد عمولات</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.commissions.slice(0, 5).map((commission: any) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{commission.commissions?.client_name || 'عميل غير محدد'}</p>
                      <p className="text-sm text-muted-foreground">نسبة: {commission.percentage}%</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-green-600">{Number(commission.net_share).toLocaleString()} د.إ</p>
                      <p className="text-xs text-muted-foreground">صافي</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}