import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, CheckCircle, Clock, AlertTriangle, Settings } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';

const TasksDashboard = () => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { isAdmin, isAccountant } = useRoleAccess();

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      {/* العنوان والأزرار */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المهام</h1>
          <p className="text-muted-foreground">
            متابعة وتنظيم جميع المهام والأنشطة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isAccountant) && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              مهمة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="إجمالي المهام"
          value={0}
          icon={Calendar}
          color="text-blue-600"
          description="جميع المهام"
        />
        <StatCard
          title="مهام جديدة"
          value={0}
          icon={Plus}
          color="text-green-600"
          description="لم تبدأ بعد"
        />
        <StatCard
          title="قيد التنفيذ"
          value={0}
          icon={Clock}
          color="text-yellow-600"
          description="جاري العمل عليها"
        />
        <StatCard
          title="مكتملة"
          value={0}
          icon={CheckCircle}
          color="text-green-600"
          description="تم إنجازها"
        />
        <StatCard
          title="متأخرة"
          value={0}
          icon={AlertTriangle}
          color="text-red-600"
          description="تجاوزت الموعد المحدد"
        />
      </div>

      {/* رسالة حالة النظام */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            نظام المهام قيد التطوير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-orange-700">
              تم إنشاء قاعدة البيانات بنجاح! الخطوات التالية:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>✅ إنشاء جداول المهام وسياسات الأمان</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>✅ إنشاء دوال الأتمتة والإشعارات</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>⏳ انتظار تحديث ملف الأنواع من Supabase</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>⏳ تفعيل واجهات المهام</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <h4 className="font-medium text-blue-800 mb-2">المميزات المنجزة:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• إدارة المهام مع الصلاحيات</li>
                <li>• تعيين المهام لموظفين متعددين</li>
                <li>• الأتمتة عند إنشاء العقود</li>
                <li>• نظام إشعارات شامل</li>
                <li>• تعليقات ومرفقات للمهام</li>
                <li>• تقارير وإحصائيات</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* محتوى مؤقت */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'kanban' | 'list')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="kanban">لوحة Kanban</TabsTrigger>
          <TabsTrigger value="list">عرض القائمة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['مهام جديدة', 'قيد التنفيذ', 'مكتملة', 'ملغية'].map((status, index) => (
              <Card key={index} className="min-h-[400px]">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-sm">{status}</CardTitle>
                  <Badge variant="secondary">0</Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-center text-muted-foreground text-sm">
                    لا توجد مهام
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد مهام</h3>
              <p className="text-muted-foreground">
                سيتم عرض المهام هنا بعد تحديث النظام
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksDashboard;