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
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHome() {
  const { profile } = useAuth();

  if (!profile) return null;

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "مساء الخير";
    return "مساء الخير";
  };

  const getRoleSpecificStats = () => {
    switch (profile.role) {
      case 'admin':
        return [
          { title: "إجمالي العقارات", value: "0", icon: Building, color: "text-blue-600", bgColor: "bg-blue-50" },
          { title: "إجمالي العملاء", value: "0", icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
          { title: "إجمالي الصفقات", value: "0", icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50" },
          { title: "إجمالي الإيرادات", value: "0 درهم", icon: DollarSign, color: "text-yellow-600", bgColor: "bg-yellow-50" },
          { title: "عدد الموظفين", value: "0", icon: Users, color: "text-indigo-600", bgColor: "bg-indigo-50" },
          { title: "عدد السيارات", value: "0", icon: Car, color: "text-red-600", bgColor: "bg-red-50" },
        ];
      case 'accountant':
        return [
          { title: "الإيرادات الشهرية", value: "0 درهم", icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-50" },
          { title: "المصروفات الشهرية", value: "0 درهم", icon: BarChart3, color: "text-red-600", bgColor: "bg-red-50" },
          { title: "العمولات المستحقة", value: "0 درهم", icon: HandCoins, color: "text-yellow-600", bgColor: "bg-yellow-50" },
          { title: "مصروفات السيارات", value: "0 درهم", icon: Car, color: "text-blue-600", bgColor: "bg-blue-50" },
        ];
      case 'employee':
        return [
          { title: "عقاراتي النشطة", value: "0", icon: Building, color: "text-blue-600", bgColor: "bg-blue-50" },
          { title: "عملائي", value: "0", icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
          { title: "صفقاتي المفتوحة", value: "0", icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50" },
          { title: "عمولاتي المستحقة", value: "0 درهم", icon: HandCoins, color: "text-yellow-600", bgColor: "bg-yellow-50" },
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    const commonActions = [
      { title: "إضافة عقار جديد", description: "أضف عقار للنظام", icon: Building, href: "/properties/new" },
      { title: "إضافة عميل جديد", description: "سجل عميل جديد", icon: Users, href: "/clients/new" },
    ];

    switch (profile.role) {
      case 'admin':
        return [
          ...commonActions,
          { title: "إضافة موظف جديد", description: "تسجيل موظف في النظام", icon: Users, href: "/users/new" },
          { title: "إضافة سيارة", description: "تسجيل سيارة جديدة", icon: Car, href: "/vehicles/new" },
        ];
      case 'accountant':
        return [
          ...commonActions,
          { title: "إضافة مصروف", description: "تسجيل مصروف جديد", icon: FileText, href: "/expenses/new" },
          { title: "إضافة إيراد", description: "تسجيل إيراد جديد", icon: TrendingUp, href: "/revenues/new" },
        ];
      case 'employee':
        return [
          ...commonActions,
          { title: "إضافة صفقة جديدة", description: "تسجيل صفقة جديدة", icon: FileText, href: "/deals/new" },
        ];
      default:
        return commonActions;
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
            <Card key={index} className="hover-scale hover-glow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <PlusCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardContent>
            </Card>
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