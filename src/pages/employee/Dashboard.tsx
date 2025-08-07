import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  FileText,
  Bell,
  Clock,
  Plus,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function EmployeeDashboard() {
  const { profile } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['employee-dashboard', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const [dealsResult, commissionsResult, debtsResult, leadsResult, tasksResult, targetsResult] = await Promise.all([
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
          .eq('assigned_to', profile.user_id),

        // Daily Tasks
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('employee_id', profile.user_id)
          .gte('due_date', new Date().toISOString().split('T')[0])
          .order('due_date', { ascending: true }),

        // Employee Targets
        supabase
          .from('employee_targets')
          .select('*')
          .eq('employee_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      return {
        deals: dealsResult.data || [],
        commissions: commissionsResult.data || [],
        debts: debtsResult.data || [],
        leads: leadsResult.data || [],
        tasks: tasksResult.data || [],
        targets: targetsResult.data || []
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
  const todayTasks = dashboardData?.tasks.filter(t => t.due_date === new Date().toISOString().split('T')[0]) || [];
  const pendingTasks = dashboardData?.tasks.filter(t => t.status === 'pending').length || 0;
  const completedTasks = dashboardData?.tasks.filter(t => t.status === 'completed').length || 0;
  const currentTarget = dashboardData?.targets[0];

  const StatCard = ({ title, value, icon: Icon, color, progress, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    progress?: number;
    subtitle?: string;
  }) => (
    <Card className="hover-glow hover-scale transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">التقدم</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="p-3 rounded-full bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground">مرحباً {profile.first_name} {profile.last_name} - {new Date().toLocaleDateString('ar-AE')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {pendingTasks > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <Bell className="h-3 w-3 mr-1" />
              {pendingTasks} مهام معلقة
            </Badge>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      {currentTarget && (
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Target className="h-5 w-5 text-primary" />
              <span>نظرة عامة على الأداء</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">المبيعات</span>
                  <span className="text-sm text-muted-foreground">
                    {Number(currentTarget.current_sales).toLocaleString()} / {Number(currentTarget.sales_target).toLocaleString()}
                  </span>
                </div>
                <Progress value={(currentTarget.current_sales / currentTarget.sales_target) * 100} className="h-3" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">الصفقات</span>
                  <span className="text-sm text-muted-foreground">
                    {currentTarget.current_deals} / {currentTarget.deals_target}
                  </span>
                </div>
                <Progress value={(currentTarget.current_deals / currentTarget.deals_target) * 100} className="h-3" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">العمولات</span>
                  <span className="text-sm text-muted-foreground">
                    {Number(currentTarget.current_commission).toLocaleString()} / {Number(currentTarget.commission_target).toLocaleString()}
                  </span>
                </div>
                <Progress value={(currentTarget.current_commission / currentTarget.commission_target) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="الصفقات المفتوحة"
          value={openDeals}
          icon={FileText}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          subtitle="نشطة حالياً"
        />
        <StatCard
          title="الصفقات المغلقة"
          value={closedDeals}
          icon={CheckCircle}
          color="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          subtitle="مكتملة"
        />
        <StatCard
          title="العمولات الصافية"
          value={`${totalCommissions.toLocaleString()} د.إ`}
          icon={HandCoins}
          color="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
          subtitle="إجمالي المكاسب"
        />
        <StatCard
          title="المديونيات المعلقة"
          value={`${pendingDebts.toLocaleString()} د.إ`}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
          subtitle="تحتاج متابعة"
        />
      </div>

      {/* Daily Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Clock className="h-5 w-5 text-primary" />
            <span>مهام اليوم</span>
          </CardTitle>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Badge variant="outline">{completedTasks} مكتملة</Badge>
            <Badge variant="secondary">{pendingTasks} معلقة</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مهام لليوم</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 6).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' : 
                      task.priority_level === 3 ? 'bg-red-500' : 
                      task.priority_level === 2 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                      {task.status === 'completed' ? 'مكتمل' : 'معلق'}
                    </Badge>
                    {task.priority_level === 3 && (
                      <Badge variant="destructive" className="text-xs">عالي</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>الصفقات الأخيرة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : !dashboardData?.deals.length ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد صفقات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.deals.slice(0, 5).map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">صفقة #{deal.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{deal.deal_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deal.created_at).toLocaleDateString('ar-AE')}
                      </p>
                    </div>
                    <div className="text-left space-y-2">
                      <Badge variant={deal.status === 'closed' ? 'default' : 'secondary'}>
                        {deal.status === 'closed' ? 'مغلقة' : 'مفتوحة'}
                      </Badge>
                      <p className="text-sm font-semibold">{Number(deal.amount).toLocaleString()} د.إ</p>
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
              <PieChart className="h-5 w-5 text-primary" />
              <span>العمولات الأخيرة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : !dashboardData?.commissions.length ? (
              <div className="text-center py-8">
                <HandCoins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد عمولات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.commissions.slice(0, 5).map((commission: any) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">{commission.commissions?.client_name || 'عميل غير محدد'}</p>
                      <p className="text-sm text-muted-foreground">نسبة: {commission.percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(commission.created_at).toLocaleDateString('ar-AE')}
                      </p>
                    </div>
                    <div className="text-left space-y-2">
                      <Badge variant={commission.commissions?.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.commissions?.status === 'paid' ? 'مدفوع' : 'معلق'}
                      </Badge>
                      <p className="font-semibold text-green-600">
                        {Number(commission.net_share).toLocaleString()} د.إ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Activity className="h-5 w-5 text-primary" />
            <span>إجراءات سريعة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm">عميل جديد</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">صفقة جديدة</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">مهمة جديدة</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">تقرير الأداء</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}