import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileText, CheckCircle, AlertCircle, Calendar, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const RentalManagement = () => {
  const modules = [
    {
      title: "إدارة العقارات",
      description: "إضافة وإدارة العقارات المتاحة للإيجار",
      icon: Building2,
      link: "/rental/properties",
      color: "bg-blue-500",
      stats: { total: 0, active: 0 }
    },
    {
      title: "إدارة المستأجرين",
      description: "إدارة بيانات العملاء والمستأجرين المحتملين",
      icon: Users,
      link: "/rental/tenants",
      color: "bg-green-500",
      stats: { total: 0, active: 0 }
    },
    {
      title: "عقود الإيجار",
      description: "إنشاء ومتابعة عقود الإيجار",
      icon: FileText,
      link: "/rental/contracts",
      color: "bg-purple-500",
      stats: { total: 0, active: 0 }
    },
    {
      title: "جدول الأقساط",
      description: "متابعة أقساط الإيجار والمدفوعات",
      icon: CreditCard,
      link: "/rental/installments",
      color: "bg-orange-500",
      stats: { pending: 0, paid: 0 }
    },
    {
      title: "الخدمات الحكومية",
      description: "متابعة إجراءات الخدمات الحكومية",
      icon: CheckCircle,
      link: "/rental/government-services",
      color: "bg-indigo-500",
      stats: { pending: 0, completed: 0 }
    },
    {
      title: "التجديدات",
      description: "إدارة تجديدات العقود والإشعارات",
      icon: Calendar,
      link: "/rental/renewals",
      color: "bg-red-500",
      stats: { upcoming: 0, expired: 0 }
    }
  ];

  const alerts = [
    {
      type: "warning",
      message: "لا توجد عقود مستحقة التجديد حالياً",
      count: 0
    },
    {
      type: "info", 
      message: "لا توجد أقساط مستحقة الدفع",
      count: 0
    },
    {
      type: "error",
      message: "لا توجد معاملات حكومية متأخرة",
      count: 0
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">وحدة الإيجارات الشاملة</h1>
          <p className="text-muted-foreground mt-1">
            إدارة شاملة لعقود الإيجار والمستأجرين والخدمات الحكومية
          </p>
        </div>
      </div>

      {/* التنبيهات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert, index) => (
          <Card key={index} className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <Badge variant="outline" className="mt-1">
                    {alert.count} عنصر
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الوحدات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`p-2 rounded-lg ${module.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-4 space-x-reverse text-sm text-muted-foreground">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <span key={key}>
                        {key}: <span className="font-medium text-foreground">{value}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <Link to={module.link}>
                  <Button className="w-full" variant="outline">
                    فتح الوحدة
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* إحصائيات سريعة */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات الوحدة</CardTitle>
          <CardDescription>
            ملخص سريع لأداء وحدة الإيجارات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">0</div>
              <div className="text-sm text-muted-foreground">إجمالي العقارات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-muted-foreground">عقود نشطة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0 د.إ</div>
              <div className="text-sm text-muted-foreground">الإيرادات الشهرية</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0%</div>
              <div className="text-sm text-muted-foreground">معدل الإشغال</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalManagement;