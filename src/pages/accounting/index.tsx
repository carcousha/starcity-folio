import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandCoins, TrendingUp, Calculator, FileText, Car, UserCheck, Plus, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import AccountantDashboard from "./AccountantDashboard";

export default function AccountingOverview() {
  const navigate = useNavigate();
  const { isAdmin, isAccountant } = useRoleAccess();

  // إظهار لوحة المحاسب الخاصة للمحاسبين
  if (isAccountant && !isAdmin) {
    return <AccountantDashboard />;
  }

  const modules = [
    {
      title: "اليومية",
      description: "سجل يومي لجميع المعاملات المالية للمكتب",
      icon: FileText,
      path: "/accounting/daily-journal",
      color: "bg-blue-600"
    },
    {
      title: "المصروفات",
      description: "إدارة جميع مصروفات الشركة والموظفين",
      icon: HandCoins,
      path: "/accounting/expenses",
      color: "bg-red-500"
    },
    {
      title: "الإيرادات", 
      description: "تسجيل ومتابعة الإيرادات من جميع المصادر",
      icon: TrendingUp,
      path: "/accounting/revenues",
      color: "bg-green-500"
    },
    {
      title: "العمولات",
      description: "إدارة وتوزيع العمولات على الموظفين",
      icon: Calculator,
      path: "/accounting/commissions", 
      color: "bg-blue-500"
    },
    {
      title: "المديونيات",
      description: "متابعة مديونيات الموظفين والعملاء",
      icon: FileText,
      path: "/accounting/debts",
      color: "bg-orange-500"
    },
    {
      title: "السيارات",
      description: "إدارة أسطول السيارات ومصروفاته",
      icon: Car,
      path: "/accounting/vehicles",
      color: "bg-purple-500"
    },
    {
      title: "مصروفات السيارات",
      description: "تفاصيل مصروفات كل سيارة والربط مع الديون",
      icon: FileText,
      path: "/accounting/vehicle-expenses", 
      color: "bg-cyan-500"
    },
    {
      title: "الموظفين",
      description: "إدارة الموظفين ونسب العمولات",
      icon: UserCheck,
      path: "/accounting/staff",
      color: "bg-indigo-500"
    },
    {
      title: "الخزينة والبنوك",
      description: "إدارة الأرصدة والحركات المالية",
      icon: Wallet,
      path: "/accounting/treasury",
      color: "bg-emerald-500"
    },
    {
      title: "سجل النشاطات",
      description: "متابعة جميع العمليات المالية والتغييرات",
      icon: TrendingUp,
      path: "/accounting/activity-log",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الحسابات</h1>
          <p className="text-gray-600 mt-2">نظام شامل لإدارة الشؤون المالية للشركة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.title} 
            className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => navigate(module.path)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`p-3 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-600 leading-relaxed">
                {module.description}
              </CardDescription>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(module.path);
                }}
              >
                <Plus className="h-4 w-4 ml-2" />
                إدارة {module.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}