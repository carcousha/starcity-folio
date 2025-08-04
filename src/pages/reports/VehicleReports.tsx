import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  Receipt, 
  TrendingDown,
  Fuel,
  Wrench,
  Download,
  Search,
  Filter,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VehicleReport {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  assigned_to?: string;
  assigned_name?: string;
  total_expenses: number;
  fuel_expenses: number;
  maintenance_expenses: number;
  violation_expenses: number;
  expense_count: number;
}

export default function VehicleReports() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vehicleReports, isLoading } = useQuery({
    queryKey: ['vehicle-reports'],
    queryFn: async () => {
      // Get vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!vehicles) return [];

      // Get expenses for each vehicle and get assigned user info
      const reports = await Promise.all(
        vehicles.map(async (vehicle) => {
          const { data: expenses } = await supabase
            .from('vehicle_expenses')
            .select('*')
            .eq('vehicle_id', vehicle.id);

          // Get assigned user info if vehicle is assigned
          let assignedName = 'غير مخصصة';
          if (vehicle.assigned_to) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', vehicle.assigned_to)
              .single();
            
            if (profile) {
              assignedName = `${profile.first_name} ${profile.last_name}`;
            }
          }

          const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
          const fuelExpenses = expenses?.filter(exp => exp.expense_type === 'fuel')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
          const maintenanceExpenses = expenses?.filter(exp => exp.expense_type === 'maintenance')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
          const violationExpenses = expenses?.filter(exp => exp.expense_type === 'violation')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

          return {
            ...vehicle,
            assigned_name: assignedName,
            total_expenses: totalExpenses,
            fuel_expenses: fuelExpenses,
            maintenance_expenses: maintenanceExpenses,
            violation_expenses: violationExpenses,
            expense_count: expenses?.length || 0
          };
        })
      );

      return reports;
    }
  });

  const filteredReports = vehicleReports?.filter(report =>
    `${report.make} ${report.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.assigned_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جارٍ تحميل تقارير السيارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير السيارات</h1>
          <p className="text-muted-foreground">
            مصاريف وصيانة السيارات والمقارنات التفصيلية
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            PDF
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن سيارة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 ml-2" />
          فلتر
        </Button>
        <Button variant="outline">
          <Calendar className="h-4 w-4 ml-2" />
          الفترة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي السيارات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي المصاريف
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.reduce((sum, report) => sum + report.total_expenses, 0).toLocaleString()} د.إ
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
                  مصاريف الوقود
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.reduce((sum, report) => sum + report.fuel_expenses, 0).toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Fuel className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  مصاريف الصيانة
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.reduce((sum, report) => sum + report.maintenance_expenses, 0).toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل السيارات</CardTitle>
          <CardDescription>
            تقرير شامل بمصاريف كل سيارة وتكلفتها التشغيلية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {report.make} {report.model} ({report.year})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      لوحة: {report.license_plate}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {report.assigned_name}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">المجموع</p>
                    <p className="font-bold text-red-600">
                      {report.total_expenses.toLocaleString()} د.إ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">الوقود</p>
                    <p className="font-bold text-yellow-600">
                      {report.fuel_expenses.toLocaleString()} د.إ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">الصيانة</p>
                    <p className="font-bold text-orange-600">
                      {report.maintenance_expenses.toLocaleString()} د.إ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">المخالفات</p>
                    <p className="font-bold text-purple-600">
                      {report.violation_expenses.toLocaleString()} د.إ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">العمليات</p>
                    <p className="font-bold text-foreground">
                      {report.expense_count}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد سيارات مسجلة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}