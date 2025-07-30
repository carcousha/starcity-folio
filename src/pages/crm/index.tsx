import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Building, CheckSquare, Megaphone, FileText, PieChart } from "lucide-react";
import { Link } from "react-router-dom";

export default function CRMIndex() {
  const crmModules = [
    {
      title: "العملاء",
      description: "إدارة قاعدة بيانات العملاء والتواصل معهم",
      icon: Users,
      href: "/crm/clients",
      color: "bg-blue-500",
      count: "0 عميل"
    },
    {
      title: "الليدات",
      description: "متابعة العملاء المحتملين ومراحل التحويل",
      icon: Target,
      href: "/crm/leads",
      color: "bg-green-500",
      count: "0 ليد"
    },
    {
      title: "العقارات",
      description: "إدارة العقارات وربطها بالعملاء والصفقات",
      icon: Building,
      href: "/crm/properties",
      color: "bg-purple-500",
      count: "0 عقار"
    },
    {
      title: "المهام",
      description: "تنظيم المهام ومتابعة إنجازها",
      icon: CheckSquare,
      href: "/crm/tasks",
      color: "bg-orange-500",
      count: "0 مهمة"
    },
    {
      title: "الحملات التسويقية",
      description: "إنشاء وإدارة الحملات التسويقية",
      icon: Megaphone,
      href: "/crm/campaigns",
      color: "bg-pink-500",
      count: "0 حملة"
    },
    {
      title: "الصفقات",
      description: "متابعة الصفقات ومراحل إتمامها",
      icon: FileText,
      href: "/crm/deals",
      color: "bg-indigo-500",
      count: "0 صفقة"
    },
    {
      title: "التحليلات والتقارير",
      description: "تقارير شاملة وتحليلات الأداء",
      icon: PieChart,
      href: "/crm/analytics",
      color: "bg-yellow-500",
      count: "تقارير"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">إدارة العلاقات العامة (CRM)</h1>
        <p className="text-muted-foreground">
          مركز إدارة شامل للعملاء والليدات والصفقات والأنشطة التسويقية
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الليدات النشطة</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الصفقات المفتوحة</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المهام المعلقة</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <CheckSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM Modules */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">وحدات CRM</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crmModules.map((module, index) => (
            <Link key={index} to={module.href}>
              <Card className="hover-scale hover-glow cursor-pointer transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${module.color} text-white`}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm text-muted-foreground">{module.count}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="text-lg mb-2">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}