import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, CheckCircle, DollarSign, TrendingUp, Users, Wrench, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { CommissionsFixed } from "./CommissionsFixed";

export default function Commissions() {
  const { checkPermission } = useRoleAccess();

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
          <p>لا تملك صلاحية إدارة العمولات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة العمولات</h1>
          <p className="text-muted-foreground">حساب وإدارة عمولات الصفقات بشكل محدث وآمن</p>
        </div>
      </div>

      {/* رسالة تنبيه */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            تم إصلاح نظام العمولات
          </CardTitle>
          <CardDescription className="text-amber-700">
            تم حل جميع المشاكل في نظام العمولات وإنشاء نظام محدث وآمن. جميع العمولات ستُحسب تلقائياً عند إغلاق الصفقات.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="new-system" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-system" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            النظام المحدث (مُستحسن)
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            النظام القديم (للمراجعة)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-system">
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  النظام المحدث والمحكم
                </CardTitle>
                <CardDescription className="text-green-700">
                  ✅ حساب تلقائي للعمولات عند إغلاق الصفقات<br/>
                  ✅ حماية من الأخطاء والمشاكل<br/>
                  ✅ تسجيل آمن للبيانات<br/>
                  ✅ واجهة سهلة الاستخدام<br/>
                  ✅ إمكانية إضافة عمولات يدوياً للصفقات المكتملة
                </CardDescription>
              </CardHeader>
            </Card>
            
            {/* إضافة المحتوى مباشرة بدلاً من Component منفصل */}
            <CommissionsFixed />
          </div>
        </TabsContent>
        
        <TabsContent value="legacy">
          <LegacyCommissions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// النظام القديم للمراجعة فقط
const LegacyCommissions = () => {
  const { checkPermission } = useRoleAccess();
  const queryClient = useQueryClient();

  // جلب البيانات القديمة للمراجعة
  const { data: legacyCommissions = [], isLoading } = useQuery({
    queryKey: ['legacy-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canManageCommissions')
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-amber-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          النظام القديم (للمراجعة فقط)
        </CardTitle>
        <CardDescription className="text-amber-700">
          هذا النظام القديم محفوظ للمراجعة فقط. يرجى استخدام النظام المحدث أعلاه لإضافة عمولات جديدة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">جارٍ التحميل...</div>
        ) : legacyCommissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عمولات في النظام القديم
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-amber-600 mb-4 p-3 bg-amber-100 rounded-lg">
              📊 عدد العمولات في النظام القديم: {legacyCommissions.length}<br/>
              💡 هذه البيانات محفوظة للمراجعة والتحليل فقط
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">إجمالي العمولات القديمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {legacyCommissions.reduce((sum: number, c: any) => sum + (c.total_commission || 0), 0).toFixed(2)} د.إ
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">العمولات المعلقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {legacyCommissions.filter((c: any) => c.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">العمولات المدفوعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {legacyCommissions.filter((c: any) => c.status === 'paid').length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {legacyCommissions.slice(0, 5).map((commission: any) => (
              <div key={commission.id} className="border rounded-lg p-4 bg-amber-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{commission.client_name || 'عميل غير محدد'}</h3>
                    <p className="text-sm text-muted-foreground">
                      المبلغ: {commission.amount || 0} د.إ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      العمولة الإجمالية: {commission.total_commission || 0} د.إ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      تاريخ الإنشاء: {new Date(commission.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Badge variant="outline">{commission.status || 'غير محدد'}</Badge>
                </div>
                {commission.notes && (
                  <div className="mt-2 text-sm text-amber-700 bg-amber-100 p-2 rounded">
                    ملاحظات: {commission.notes}
                  </div>
                )}
              </div>
            ))}
            {legacyCommissions.length > 5 && (
              <div className="text-sm text-amber-600 text-center p-3 bg-amber-100 rounded-lg">
                ... و {legacyCommissions.length - 5} عمولة أخرى في النظام القديم
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { Commissions };