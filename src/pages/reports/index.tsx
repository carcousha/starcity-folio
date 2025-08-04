import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Car, 
  Receipt, 
  TrendingUp, 
  HandCoins, 
  FileText, 
  Wallet,
  Download,
  Filter,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";

const reportSections = [
  {
    id: "employees",
    title: "تقارير الموظفين",
    description: "العمولات والمديونيات وأداء الموظفين",
    icon: Users,
    path: "/reports/employees",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    requiredPermission: "canViewAllStaff" as const
  },
  {
    id: "vehicles",
    title: "تقارير السيارات",
    description: "مصاريف وصيانة السيارات والمقارنات",
    icon: Car,
    path: "/reports/vehicles",
    color: "text-green-600",
    bgColor: "bg-green-50",
    requiredPermission: "canViewAllVehicles" as const
  },
  {
    id: "expenses",
    title: "تقارير المصروفات",
    description: "تحليل شامل للمصروفات حسب الأقسام والتواريخ",
    icon: Receipt,
    path: "/reports/expenses",
    color: "text-red-600",
    bgColor: "bg-red-50",
    requiredPermission: "canViewAllReports" as const
  },
  {
    id: "revenues",
    title: "تقارير الإيرادات",
    description: "تحليل الإيرادات وحساب صافي الربح",
    icon: TrendingUp,
    path: "/reports/revenues",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    requiredPermission: "canViewAllReports" as const
  },
  {
    id: "commissions",
    title: "تقارير العمولات",
    description: "توزيع العمولات بين المكتب والموظفين",
    icon: HandCoins,
    path: "/reports/commissions",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    requiredPermission: "canViewAllCommissions" as const
  },
  {
    id: "debts",
    title: "تقارير المديونيات",
    description: "حالة الديون والتسويات المالية",
    icon: FileText,
    path: "/reports/debts",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    requiredPermission: "canViewAllReports" as const
  },
  {
    id: "treasury",
    title: "تقارير الخزينة والبنوك",
    description: "كشوف الحسابات والحركات المالية",
    icon: Wallet,
    path: "/reports/treasury",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    requiredPermission: "canViewTreasury" as const
  }
];

export default function ReportsIndex() {
  const { checkPermission } = useRoleAccess();

  // Filter sections based on user permissions
  const availableSections = reportSections.filter(section =>
    checkPermission(section.requiredPermission)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">التقارير المالية</h1>
          <p className="text-muted-foreground">
            تقارير شاملة وتحليلات مالية متقدمة للمؤسسة
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline">
            <Filter className="h-4 w-4 ml-2" />
            فلتر متقدم
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 ml-2" />
            فترة زمنية
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي الإيرادات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  0 درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي المصروفات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  0 درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <Receipt className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  صافي الربح
                </p>
                <p className="text-2xl font-bold text-foreground">
                  0 درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي العمولات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  0 درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <HandCoins className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Sections */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">أقسام التقارير</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableSections.map((section) => (
            <Card key={section.id} className="hover-scale hover-glow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${section.bgColor} group-hover:scale-110 transition-transform`}>
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-lg mb-2">{section.title}</CardTitle>
                <CardDescription className="mb-4">
                  {section.description}
                </CardDescription>
                <Link to={section.path}>
                  <Button className="w-full">
                    عرض التقرير
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">النشاط الأخير</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد تقارير حديثة</p>
              <p className="text-sm text-muted-foreground mt-2">
                سيظهر هنا آخر التقارير التي تم إنشاؤها أو تصديرها
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}