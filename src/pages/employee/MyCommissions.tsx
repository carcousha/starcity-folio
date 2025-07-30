import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HandCoins, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MyCommissions() {
  const { profile } = useAuth();

  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ['my-commissions', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const [commissionsResult, debtsResult] = await Promise.all([
        supabase
          .from('commission_employees')
          .select(`
            *,
            commissions (
              client_name,
              total_commission,
              created_at,
              status
            )
          `)
          .eq('employee_id', profile.user_id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('debts')
          .select('*')
          .eq('debtor_id', profile.user_id)
          .order('created_at', { ascending: false })
      ]);

      if (commissionsResult.error) throw commissionsResult.error;
      if (debtsResult.error) throw debtsResult.error;

      return {
        commissions: commissionsResult.data || [],
        debts: debtsResult.data || []
      };
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const totalCommissions = commissionsData?.commissions.reduce((sum, c) => sum + Number(c.calculated_share), 0) || 0;
  const totalNetCommissions = commissionsData?.commissions.reduce((sum, c) => sum + Number(c.net_share), 0) || 0;
  const totalDeductions = commissionsData?.commissions.reduce((sum, c) => sum + Number(c.deducted_debt), 0) || 0;
  const pendingDebts = commissionsData?.debts.filter(d => d.status === 'pending').reduce((sum, d) => sum + Number(d.amount), 0) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">مدفوعة</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">معلقة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <HandCoins className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">عمولاتي</h1>
          <p className="text-muted-foreground">عرض تفاصيل العمولات والمديونيات الخاصة بي</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي العمولات</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalCommissions.toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الصافي المستحق</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalNetCommissions.toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المخصومات</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalDeductions.toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المديونيات المعلقة</p>
                <p className="text-2xl font-bold text-foreground">
                  {pendingDebts.toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <HandCoins className="h-5 w-5" />
            <span>تفاصيل العمولات</span>
          </CardTitle>
          <CardDescription>
            عرض جميع العمولات المستحقة والمدفوعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
            </div>
          ) : !commissionsData?.commissions.length ? (
            <div className="text-center py-8">
              <HandCoins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عمولات مسجلة حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissionsData.commissions.map((commission: any) => (
                <div key={commission.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {commission.commissions?.client_name || 'عميل غير محدد'}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 ml-1" />
                        {new Date(commission.created_at).toLocaleDateString('ar-AE')}
                      </p>
                    </div>
                    {getStatusBadge(commission.commissions?.status || 'pending')}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">نسبتي</p>
                      <p className="font-semibold">{commission.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المبلغ المحسوب</p>
                      <p className="font-semibold">{Number(commission.calculated_share).toLocaleString()} د.إ</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المخصوم</p>
                      <p className="font-semibold text-red-600">{Number(commission.deducted_debt).toLocaleString()} د.إ</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الصافي</p>
                      <p className="font-semibold text-green-600">{Number(commission.net_share).toLocaleString()} د.إ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debts List */}
      {commissionsData?.debts && commissionsData.debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="h-5 w-5" />
              <span>مديونياتي</span>
            </CardTitle>
            <CardDescription>
              عرض المديونيات المستحقة والمسددة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissionsData.debts.map((debt: any) => (
                <div key={debt.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{debt.description}</h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 ml-1" />
                        {new Date(debt.created_at).toLocaleDateString('ar-AE')}
                      </p>
                    </div>
                    {getStatusBadge(debt.status)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">المبلغ</p>
                      <p className="text-lg font-bold text-foreground">
                        {Number(debt.amount).toLocaleString()} د.إ
                      </p>
                    </div>
                    {debt.due_date && (
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">تاريخ الاستحقاق</p>
                        <p className="text-sm font-semibold">
                          {new Date(debt.due_date).toLocaleDateString('ar-AE')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}