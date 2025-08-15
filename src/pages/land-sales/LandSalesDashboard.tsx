import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Users, 
  UserCheck, 
  CheckSquare, 
  BarChart3,
  TrendingUp,
  Building2,
  DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function LandSalesDashboard() {
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['land-sales-stats'],
    queryFn: async () => {
      const [
        { count: totalLands },
        { count: availableLands },
        { count: totalBrokers },
        { count: totalClients },
        { count: pendingTasks },
        { count: totalDeals }
      ] = await Promise.all([
        supabase.from('land_properties').select('*', { count: 'exact', head: true }),
        supabase.from('land_properties').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('land_brokers').select('*', { count: 'exact', head: true }),
        supabase.from('land_clients').select('*', { count: 'exact', head: true }),
        supabase.from('land_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('land_deals').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalLands: totalLands || 0,
        availableLands: availableLands || 0,
        totalBrokers: totalBrokers || 0,
        totalClients: totalClients || 0,
        pendingTasks: pendingTasks || 0,
        totalDeals: totalDeals || 0
      };
    }
  });

  const modules = [
    {
      title: "إدارة الأراضي",
      description: "عرض وإدارة جميع الأراضي المتاحة للبيع",
      icon: MapPin,
      path: "/land-sales/properties",
      color: "bg-blue-500",
      stat: stats?.totalLands,
      statLabel: "إجمالي الأراضي"
    },
    {
      title: "إدارة الوسطاء",
      description: "إدارة شبكة الوسطاء والتواصل معهم",
      icon: Users,
      path: "/land-sales/brokers",
      color: "bg-green-500",
      stat: stats?.totalBrokers,
      statLabel: "إجمالي الوسطاء"
    },
    {
      title: "إدارة العملاء",
      description: "متابعة العملاء المهتمين وتفضيلاتهم",
      icon: UserCheck,
      path: "/land-sales/clients",
      color: "bg-purple-500",
      stat: stats?.totalClients,
      statLabel: "إجمالي العملاء"
    },
    {
      title: "المهمات اليومية",
      description: "تنظيم ومتابعة المهام اليومية",
      icon: CheckSquare,
      path: "/land-sales/tasks",
      color: "bg-orange-500",
      stat: stats?.pendingTasks,
      statLabel: "مهام معلقة"
    },
    {
      title: "التقارير والإحصائيات",
      description: "تقارير شاملة عن الأداء والمبيعات",
      icon: BarChart3,
      path: "/land-sales/reports",
      color: "bg-red-500",
      stat: stats?.totalDeals,
      statLabel: "إجمالي الصفقات"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="وحدة بيع الأراضي" 
          description="إدارة شاملة لعمليات بيع الأراضي والوسطاء والعملاء"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="وحدة بيع الأراضي" 
        description="إدارة شاملة لعمليات بيع الأراضي والوسطاء والعملاء"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأراضي المتاحة</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.availableLands}</div>
            <p className="text-xs text-muted-foreground">من أصل {stats?.totalLands} أرض</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الوسطاء النشطين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBrokers}</div>
            <p className="text-xs text-muted-foreground">إجمالي الوسطاء</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء المهتمين</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients}</div>
            <p className="text-xs text-muted-foreground">عملاء مسجلين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المهام المعلقة</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">تحتاج متابعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card key={module.path} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className={`p-2 rounded-lg ${module.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{module.stat}</div>
                    <div className="text-sm text-muted-foreground">{module.statLabel}</div>
                  </div>
                  <Button 
                    onClick={() => navigate(module.path)}
                    variant="outline"
                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    دخول القسم
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}