import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Calendar, 
  TrendingUp, 
  Target, 
  BarChart3, 
  BookOpen,
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EmployeeProfileData {
  profile: any;
  monthlyTargets: any[];
  performanceData: any[];
  trainingCourses: any[];
  evaluations: any[];
  statsData: {
    totalDeals: number;
    totalCommissions: number;
    newClients: number;
  };
}

export default function MyProfile() {
  const { profile } = useAuth();
  const [selectedTab, setSelectedTab] = useState('summary');

  // جلب بيانات الملف الشخصي
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['employee-profile', profile?.user_id],
    queryFn: async (): Promise<EmployeeProfileData> => {
      if (!profile?.user_id) throw new Error('لا يوجد معرف مستخدم');

      // البيانات الأساسية
      const { data: profileInfo } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      // الأهداف الشهرية
      const { data: targets } = await supabase
        .from('employee_targets')
        .select('*')
        .eq('employee_id', profile.user_id)
        .eq('target_type', 'monthly')
        .order('target_period', { ascending: false })
        .limit(1);

      // بيانات الأداء (آخر 6 شهور)
      const { data: dealsData } = await supabase
        .from('deals')
        .select('amount, closed_at, deal_type')
        .eq('handled_by', profile.user_id)
        .eq('status', 'closed')
        .gte('closed_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString());

      // إحصائيات عامة
      const { data: totalDealsData } = await supabase
        .from('deals')
        .select('id', { count: 'exact' })
        .eq('handled_by', profile.user_id)
        .eq('status', 'closed');

      const { data: commissionsData } = await supabase
        .from('commission_employees')
        .select('net_share')
        .eq('employee_id', profile.user_id);

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id', { count: 'exact' })
        .eq('assigned_to', profile.user_id);

      // التقييمات
      const { data: evaluations } = await supabase
        .from('employee_evaluations')
        .select('*')
        .eq('employee_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(3);

      const totalCommissions = commissionsData?.reduce((sum, comm) => sum + (comm.net_share || 0), 0) || 0;

      return {
        profile: profileInfo,
        monthlyTargets: targets || [],
        performanceData: dealsData || [],
        trainingCourses: [], // سيتم إضافة جدول الدورات لاحقاً
        evaluations: evaluations || [],
        statsData: {
          totalDeals: totalDealsData?.length || 0,
          totalCommissions,
          newClients: clientsData?.length || 0,
        }
      };
    },
    enabled: !!profile?.user_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">جاري تحميل الملف الشخصي...</div>
      </div>
    );
  }

  const data = profileData!;
  const currentTarget = data.monthlyTargets[0];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {data.profile?.first_name} {data.profile?.last_name}
            </h1>
            <p className="text-muted-foreground">موظف مبيعات عقارية</p>
            <div className="flex items-center space-x-4 space-x-reverse text-sm text-muted-foreground mt-1">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 ml-1" />
                انضم في {format(new Date(data.profile?.created_at || ''), 'MMMM yyyy', { locale: ar })}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 ml-2" />
          تصدير تقرير PDF
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الصفقات</p>
                <p className="text-2xl font-bold">{data.statsData.totalDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
                <p className="text-2xl font-bold">{data.statsData.totalCommissions.toLocaleString()} د.إ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العملاء الجدد</p>
                <p className="text-2xl font-bold">{data.statsData.newClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">الملخص</TabsTrigger>
          <TabsTrigger value="targets">الأهداف</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="development">التطوير</TabsTrigger>
        </TabsList>

        {/* تبويب الملخص */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* البيانات الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle>البيانات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                  <p className="font-medium">{data.profile?.first_name} {data.profile?.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium">{data.profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الدور</p>
                  <Badge variant="outline">{data.profile?.role === 'employee' ? 'موظف' : data.profile?.role}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">حالة الحساب</p>
                  <Badge variant={data.profile?.is_active ? "default" : "secondary"}>
                    {data.profile?.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* آخر التقييمات */}
            <Card>
              <CardHeader>
                <CardTitle>آخر التقييمات الإدارية</CardTitle>
              </CardHeader>
              <CardContent>
                {data.evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {data.evaluations.slice(0, 2).map((evaluation, index) => (
                      <div key={evaluation.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">تقييم {format(new Date(evaluation.created_at), 'MMMM yyyy', { locale: ar })}</p>
                          <Badge variant={evaluation.overall_rating >= 4 ? "default" : evaluation.overall_rating >= 3 ? "secondary" : "destructive"}>
                            {evaluation.overall_rating}/5
                          </Badge>
                        </div>
                        {evaluation.manager_comments && (
                          <p className="text-sm text-muted-foreground mt-1">{evaluation.manager_comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">لا توجد تقييمات متاحة</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب الأهداف */}
        <TabsContent value="targets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 ml-2" />
                الأهداف الشهرية - {format(new Date(), 'MMMM yyyy', { locale: ar })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTarget ? (
                <div className="space-y-6">
                  {/* هدف المبيعات */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">هدف المبيعات</span>
                      <span className="text-sm text-muted-foreground">
                        {(currentTarget.current_sales / currentTarget.sales_target * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(currentTarget.current_sales / currentTarget.sales_target) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{currentTarget.current_sales.toLocaleString()} د.إ</span>
                      <span>{currentTarget.sales_target.toLocaleString()} د.إ</span>
                    </div>
                  </div>

                  {/* هدف الصفقات */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">عدد الصفقات</span>
                      <span className="text-sm text-muted-foreground">
                        {(currentTarget.current_deals / currentTarget.deals_target * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(currentTarget.current_deals / currentTarget.deals_target) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{currentTarget.current_deals} صفقة</span>
                      <span>{currentTarget.deals_target} صفقة</span>
                    </div>
                  </div>

                  {/* هدف العمولات */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">هدف العمولات</span>
                      <span className="text-sm text-muted-foreground">
                        {(currentTarget.current_commission / currentTarget.commission_target * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(currentTarget.current_commission / currentTarget.commission_target) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{currentTarget.current_commission.toLocaleString()} د.إ</span>
                      <span>{currentTarget.commission_target.toLocaleString()} د.إ</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">لا توجد أهداف محددة لهذا الشهر</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الأداء */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* رسم بياني للصفقات */}
            <Card>
              <CardHeader>
                <CardTitle>أداء الصفقات - آخر 6 شهور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  سيتم إضافة الرسم البياني قريباً
                </div>
              </CardContent>
            </Card>

            {/* توزيع أنواع العقارات */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع أنواع العقارات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['فلل', 'شقق', 'أراضي'].map((type, index) => {
                    const count = data.performanceData.filter(deal => deal.deal_type === type).length;
                    const percentage = data.performanceData.length > 0 ? (count / data.performanceData.length * 100) : 0;
                    
                    return (
                      <div key={type}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{type}</span>
                          <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أفضل شهر أداءً */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل أداء شهري</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {format(new Date(), 'MMMM yyyy', { locale: ar })}
                </p>
                <p className="text-muted-foreground">بإجمالي {data.statsData.totalDeals} صفقة</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التطوير */}
        <TabsContent value="development" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الدورات التدريبية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 ml-2" />
                  الدورات التدريبية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground py-8">
                    لا توجد دورات تدريبية مسجلة
                  </div>
                  <Button className="w-full" variant="outline">
                    طلب تسجيل في دورة جديدة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* خطة التطوير */}
            <Card>
              <CardHeader>
                <CardTitle>خطة التطوير الشخصي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground py-8">
                    سيتم إضافة خطة التطوير قريباً
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}