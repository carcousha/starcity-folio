// @ts-nocheck
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Fuel,
  Wrench,
  Calendar,
  MapPin,
  FileText,
  Plus,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function Vehicle() {
  const { profile } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);

  const { data: vehicleData, isLoading } = useQuery({
    queryKey: ['employee-vehicle', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      // جلب السيارة المخصصة للموظف
      const { data: assignment } = await supabase
        .from('employee_vehicles')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('employee_id', profile.user_id)
        .eq('status', 'active')
        .single();

      if (!assignment || !assignment.vehicles) {
        return { assignedVehicle: null, recentExpenses: [], totalExpenses: 0 };
      }

      // جلب المصروفات الحديثة للسيارة
      const { data: expenses } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .eq('vehicle_id', assignment.vehicle_id)
        .order('expense_date', { ascending: false })
        .limit(10);

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      const vehicle = assignment.vehicles as any;
      return {
        assignedVehicle: vehicle ? {
          ...vehicle,
          assigned_date: assignment.assigned_date,
          assignment_notes: assignment.notes
        } : null,
        recentExpenses: expenses || [],
        totalExpenses
      };
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const vehicle = vehicleData?.assignedVehicle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Car className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">سيارتي</h1>
            <p className="text-muted-foreground">إدارة السيارة المخصصة لي</p>
          </div>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          طلب صيانة
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
        </div>
      ) : !vehicle ? (
        <Card>
          <CardContent className="text-center py-8">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لم يتم تخصيص سيارة لك بعد</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vehicle Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Car className="h-5 w-5" />
                <span>معلومات السيارة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
                  <p className="text-muted-foreground">موديل {vehicle.year}</p>
                  <p className="font-mono text-sm mt-2">{vehicle.license_plate}</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(vehicle.assigned_date).toLocaleDateString('ar-AE')}
                  </p>
                  <p className="text-muted-foreground text-sm">تاريخ التخصيص</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Wrench className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">{vehicle.mileage || 'غير محدد'}</p>
                  <p className="text-muted-foreground text-sm">العداد (كم)</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Car className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">{vehicle.status === 'active' ? 'نشطة' : 'غير نشطة'}</p>
                  <p className="text-muted-foreground text-sm">الحالة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Expenses Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-5 w-5" />
                  <span>ملخص المصروفات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {vehicleData?.totalExpenses.toLocaleString()} د.إ
                    </p>
                    <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-lg font-semibold text-foreground">
                      {vehicleData?.recentExpenses.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">عدد المصروفات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="h-5 w-5" />
                  <span>المصروفات الأخيرة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!vehicleData?.recentExpenses.length ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">لا توجد مصروفات مسجلة</p>
                    </div>
                  ) : (
                    vehicleData.recentExpenses.map((expense: any) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(expense.expense_date).toLocaleDateString('ar-AE')}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{Number(expense.amount).toLocaleString()} د.إ</p>
                          <p className="text-xs text-muted-foreground">{expense.category}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="h-5 w-5" />
                <span>تنبيهات الصيانة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Car className="h-5 w-5 text-blue-600 ml-3" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">السيارة مخصصة لك</p>
                    <p className="text-sm text-blue-600">
                      {vehicle.assignment_notes || 'تم تخصيص هذه السيارة لاستخدامك في العمل'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    تقرير حالة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}