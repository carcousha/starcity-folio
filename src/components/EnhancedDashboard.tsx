import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/loading-skeleton";
import { useEnhancedToast } from "@/components/ui/enhanced-toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Car, 
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialIntegration } from "@/hooks/useFinancialIntegration";

interface DashboardStats {
  totalRevenues: number;
  totalExpenses: number;
  netProfit: number;
  totalStaff: number;
  totalVehicles: number;
  totalProperties: number;
  pendingDeals: number;
  recentActivity: number;
}

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color: "primary" | "success" | "warning" | "danger";
  loading?: boolean;
}

const EnhancedDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { summary } = useFinancialIntegration();
  const { success, error } = useEnhancedToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls for demo
      const mockStats: DashboardStats = {
        totalRevenues: 125000,
        totalExpenses: 85000,
        netProfit: 40000,
        totalStaff: 12,
        totalVehicles: 8,
        totalProperties: 45,
        pendingDeals: 7,
        recentActivity: 23
      };

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStats(mockStats);
      success("تم تحديث البيانات", "تم تحميل أحدث إحصائيات النظام");
    } catch (err) {
      error("خطأ في تحميل البيانات", "تعذر تحميل إحصائيات النظام");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCardColor = (color: string): string => {
    switch (color) {
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950";
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950";
      case "danger":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";
      default:
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950";
    }
  };

  const getIconColor = (color: string): string => {
    switch (color) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "danger":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const dashboardCards: DashboardCard[] = [
    {
      title: "إجمالي الإيرادات",
      value: stats ? formatCurrency(stats.totalRevenues) : 0,
      subtitle: "هذا الشهر",
      icon: <TrendingUp className="h-6 w-6" />,
      trend: "up",
      trendValue: "+12.5%",
      color: "success",
      loading
    },
    {
      title: "إجمالي المصروفات",
      value: stats ? formatCurrency(stats.totalExpenses) : 0,
      subtitle: "هذا الشهر",
      icon: <TrendingDown className="h-6 w-6" />,
      trend: "down",
      trendValue: "-8.2%",
      color: "warning",
      loading
    },
    {
      title: "صافي الربح",
      value: stats ? formatCurrency(stats.netProfit) : 0,
      subtitle: "هذا الشهر",
      icon: <DollarSign className="h-6 w-6" />,
      trend: "up",
      trendValue: "+18.3%",
      color: "success",
      loading
    },
    {
      title: "عدد الموظفين",
      value: stats?.totalStaff || 0,
      subtitle: "موظف نشط",
      icon: <Users className="h-6 w-6" />,
      color: "primary",
      loading
    },
    {
      title: "عدد المركبات",
      value: stats?.totalVehicles || 0,
      subtitle: "مركبة في الأسطول",
      icon: <Car className="h-6 w-6" />,
      color: "primary",
      loading
    },
    {
      title: "عدد العقارات",
      value: stats?.totalProperties || 0,
      subtitle: "عقار متاح",
      icon: <Building className="h-6 w-6" />,
      color: "primary",
      loading
    },
    {
      title: "الصفقات المعلقة",
      value: stats?.pendingDeals || 0,
      subtitle: "بانتظار المعالجة",
      icon: <Clock className="h-6 w-6" />,
      color: "warning",
      loading
    },
    {
      title: "النشاطات الأخيرة",
      value: stats?.recentActivity || 0,
      subtitle: "في آخر 24 ساعة",
      icon: <Activity className="h-6 w-6" />,
      color: "primary",
      loading
    }
  ];

  const StatCard: React.FC<{ card: DashboardCard }> = ({ card }) => {
    if (card.loading) {
      return <SkeletonCard />;
    }

    return (
      <Card className={`transition-all duration-200 hover:shadow-lg ${getCardColor(card.color)}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {card.title}
          </CardTitle>
          <div className={getIconColor(card.color)}>
            {card.icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {card.value}
          </div>
          {card.subtitle && (
            <p className="text-xs text-muted-foreground">
              {card.subtitle}
            </p>
          )}
          {card.trend && card.trendValue && (
            <div className="flex items-center pt-1">
              {card.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ml-1 ${
                card.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {card.trendValue}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              مرحباً {profile?.first_name}
            </h1>
            <p className="text-muted-foreground">
              إليك نظرة عامة على أداء شركتك اليوم
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            النظام يعمل بطريقة مثالية
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardCards.map((card, index) => (
            <StatCard key={index} card={card} />
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              الإجراءات السريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <h3 className="font-semibold">إدارة الموظفين</h3>
                <p className="text-sm text-muted-foreground">إضافة وتعديل بيانات الموظفين</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                <h3 className="font-semibold">الإيرادات والمصروفات</h3>
                <p className="text-sm text-muted-foreground">تسجيل العمليات المالية</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Car className="h-8 w-8 text-purple-500 mb-2" />
                <h3 className="font-semibold">إدارة المركبات</h3>
                <p className="text-sm text-muted-foreground">متابعة الأسطول والصيانة</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Building className="h-8 w-8 text-orange-500 mb-2" />
                <h3 className="font-semibold">إدارة العقارات</h3>
                <p className="text-sm text-muted-foreground">إضافة ومتابعة العقارات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedDashboard;