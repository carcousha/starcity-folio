import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MyDebts() {
  const { profile } = useAuth();

  const { data: debtsData, isLoading } = useQuery({
    queryKey: ['my-debts', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('debtor_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const totalDebts = debtsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  const pendingDebts = debtsData?.filter(d => d.status === 'pending').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  const paidDebts = debtsData?.filter(d => d.status === 'paid').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  const overdueDebts = debtsData?.filter(d => d.status === 'pending' && d.due_date && new Date(d.due_date) < new Date()).length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">مسددة</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">معلقة</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-100 text-blue-800">مسددة جزئياً</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 3:
        return <Badge variant="destructive">عالية</Badge>;
      case 2:
        return <Badge className="bg-orange-100 text-orange-800">متوسطة</Badge>;
      case 1:
      default:
        return <Badge variant="secondary">منخفضة</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <AlertTriangle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">مديونياتي</h1>
          <p className="text-muted-foreground">عرض وإدارة مديونياتي الشخصية</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي المديونيات</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalDebts.toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-50">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المعلقة</p>
                <p className="text-2xl font-bold text-foreground">
                  {pendingDebts.toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المسددة</p>
                <p className="text-2xl font-bold text-foreground">
                  {paidDebts.toLocaleString()} د.إ
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
                <p className="text-sm font-medium text-muted-foreground">المتأخرة</p>
                <p className="text-2xl font-bold text-foreground">{overdueDebts}</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <FileText className="h-5 w-5" />
            <span>تفاصيل المديونيات</span>
          </CardTitle>
          <CardDescription>
            عرض جميع المديونيات الخاصة بي مع تفاصيل كل مديونية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
            </div>
          ) : !debtsData?.length ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مديونيات مسجلة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {debtsData.map((debt: any) => (
                <div key={debt.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg mb-2">
                        {debt.description || 'مديونية'}
                      </h3>
                      <div className="flex items-center space-x-4 space-x-reverse text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 ml-1" />
                          تاريخ الإنشاء: {new Date(debt.created_at).toLocaleDateString('ar-AE')}
                        </span>
                        {debt.due_date && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 ml-1" />
                            تاريخ الاستحقاق: {new Date(debt.due_date).toLocaleDateString('ar-AE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(debt.status)}
                      {getPriorityBadge(debt.priority_level)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">المبلغ</p>
                      <p className="text-xl font-bold text-foreground">
                        {Number(debt.amount).toLocaleString()} د.إ
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">نوع المديونية</p>
                      <p className="font-medium">
                        {debt.debt_category === 'debt' ? 'مديونية عامة' : debt.debt_category}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الخصم التلقائي</p>
                      <p className="font-medium">
                        {debt.auto_deduct_from_commission ? 'مفعل' : 'غير مفعل'}
                      </p>
                    </div>
                  </div>

                  {debt.guarantor_name && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">بيانات الضامن</p>
                      <p className="font-medium">{debt.guarantor_name}</p>
                      {debt.guarantor_phone && (
                        <p className="text-sm text-muted-foreground">{debt.guarantor_phone}</p>
                      )}
                    </div>
                  )}

                  {debt.contract_reference && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">مرجع العقد</p>
                      <p className="font-medium">{debt.contract_reference}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}