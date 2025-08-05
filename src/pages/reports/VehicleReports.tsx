import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Car, 
  Receipt, 
  TrendingDown,
  Fuel,
  Wrench,
  Download,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Bell,
  FileText,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  monthly_average: number;
  budget_limit?: number;
  is_over_budget: boolean;
  budget_usage_percentage: number;
}

interface MonthlyReport {
  month: string;
  total_expenses: number;
  vehicle_count: number;
  avg_per_vehicle: number;
  fuel_percentage: number;
  maintenance_percentage: number;
}

interface BudgetAlert {
  vehicle_id: string;
  vehicle_name: string;
  current_expenses: number;
  budget_limit: number;
  usage_percentage: number;
  alert_type: 'warning' | 'danger';
}

export default function VehicleReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [reportType, setReportType] = useState("current"); // current, monthly, budget
  const { toast } = useToast();

  const { data: vehicleReports, isLoading } = useQuery({
    queryKey: ['vehicle-reports', selectedMonth, selectedEmployee],
    queryFn: async () => {
      // Get vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!vehicles) return [];

      // Get expenses for each vehicle with date filtering
      const startDate = selectedMonth + '-01';
      const endDate = new Date(selectedMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const reports = await Promise.all(
        vehicles.map(async (vehicle) => {
          let expensesQuery = supabase
            .from('vehicle_expenses')
            .select('*')
            .eq('vehicle_id', vehicle.id)
            .gte('expense_date', startDate)
            .lt('expense_date', endDateStr);

          const { data: expenses } = await expensesQuery;

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

          // Calculate budget info
          const budgetLimit = (vehicle as any).monthly_budget_limit || 5000; // Default 5000 AED
          const budgetUsagePercentage = budgetLimit > 0 ? (totalExpenses / budgetLimit) * 100 : 0;
          const isOverBudget = budgetUsagePercentage > 100;
          const monthlyAverage = totalExpenses; // Current month expenses

          return {
            ...vehicle,
            assigned_name: assignedName,
            total_expenses: totalExpenses,
            fuel_expenses: fuelExpenses,
            maintenance_expenses: maintenanceExpenses,
            violation_expenses: violationExpenses,
            expense_count: expenses?.length || 0,
            monthly_average: monthlyAverage,
            budget_limit: budgetLimit,
            is_over_budget: isOverBudget,
            budget_usage_percentage: budgetUsagePercentage
          };
        })
      );

      return reports;
    }
  });

  // Get monthly reports data
  const { data: monthlyReports } = useQuery({
    queryKey: ['monthly-vehicle-reports'],
    queryFn: async () => {
      const { data: expenses } = await supabase
        .from('vehicle_expenses')
        .select('*, vehicles(make, model)')
        .gte('expense_date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().slice(0, 10));

      if (!expenses) return [];

      const monthlyData: { [key: string]: MonthlyReport } = {};
      
      expenses.forEach(expense => {
        const month = expense.expense_date.slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            total_expenses: 0,
            vehicle_count: 0,
            avg_per_vehicle: 0,
            fuel_percentage: 0,
            maintenance_percentage: 0
          };
        }
        
        monthlyData[month].total_expenses += expense.amount;
        if (expense.expense_type === 'fuel') {
          monthlyData[month].fuel_percentage += expense.amount;
        }
        if (expense.expense_type === 'maintenance') {
          monthlyData[month].maintenance_percentage += expense.amount;
        }
      });

      // Calculate percentages and averages
      Object.values(monthlyData).forEach(report => {
        report.fuel_percentage = (report.fuel_percentage / report.total_expenses) * 100;
        report.maintenance_percentage = (report.maintenance_percentage / report.total_expenses) * 100;
        // Get unique vehicles count for this month
        const monthExpenses = expenses.filter(exp => exp.expense_date.slice(0, 7) === report.month);
        const uniqueVehicles = new Set(monthExpenses.map(exp => exp.vehicle_id));
        report.vehicle_count = uniqueVehicles.size;
        report.avg_per_vehicle = report.vehicle_count > 0 ? report.total_expenses / report.vehicle_count : 0;
      });

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    }
  });

  // Get budget alerts
  const budgetAlerts: BudgetAlert[] = vehicleReports?.filter(report => 
    report.budget_usage_percentage > 80
  ).map(report => ({
    vehicle_id: report.id,
    vehicle_name: `${report.make} ${report.model} (${report.license_plate})`,
    current_expenses: report.total_expenses,
    budget_limit: report.budget_limit || 0,
    usage_percentage: report.budget_usage_percentage,
    alert_type: report.budget_usage_percentage > 100 ? 'danger' : 'warning'
  })) || [];

  // Get employees list for filtering
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true);
      return data || [];
    }
  });

  const filteredReports = vehicleReports?.filter(report => {
    const matchesSearch = `${report.make} ${report.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.assigned_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmployee = !selectedEmployee || report.assigned_to === selectedEmployee;
    
    return matchesSearch && matchesEmployee;
  }) || [];

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add Arabic font support
    doc.setFont('Arial', 'normal');
    doc.text('تقرير مصروفات السيارات', 20, 20);
    doc.text(`الشهر: ${selectedMonth}`, 20, 30);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-AE')}`, 20, 40);

    const tableData = filteredReports.map(report => [
      `${report.make} ${report.model}`,
      report.license_plate,
      report.assigned_name,
      formatCurrency(report.total_expenses),
      formatCurrency(report.fuel_expenses),
      formatCurrency(report.maintenance_expenses),
      report.expense_count.toString()
    ]);

    (doc as any).autoTable({
      head: [['السيارة', 'اللوحة', 'المخصصة لـ', 'المجموع', 'الوقود', 'الصيانة', 'العمليات']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 }
    });

    doc.save(`vehicle-report-${selectedMonth}.pdf`);
    
    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير بصيغة PDF بنجاح",
    });
  };

  const exportToExcel = () => {
    const data = filteredReports.map(report => ({
      'السيارة': `${report.make} ${report.model}`,
      'رقم اللوحة': report.license_plate,
      'المخصصة لـ': report.assigned_name,
      'إجمالي المصروفات': report.total_expenses,
      'مصروفات الوقود': report.fuel_expenses,
      'مصروفات الصيانة': report.maintenance_expenses,
      'مصروفات المخالفات': report.violation_expenses,
      'عدد العمليات': report.expense_count,
      'الحد الشهري': report.budget_limit,
      'نسبة الاستخدام': `${report.budget_usage_percentage.toFixed(1)}%`,
      'تجاوز الحد': report.is_over_budget ? 'نعم' : 'لا'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير السيارات');
    XLSX.writeFile(wb, `vehicle-report-${selectedMonth}.xlsx`);
    
    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير بصيغة Excel بنجاح",
    });
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير السيارات</h1>
          <p className="text-muted-foreground">
            مصاريف وصيانة السيارات والمقارنات التفصيلية مع التنبيهات التلقائية
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Alert className={budgetAlerts.some(alert => alert.alert_type === 'danger') ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">تنبيهات تجاوز الحدود المالية:</p>
              {budgetAlerts.map(alert => (
                <div key={alert.vehicle_id} className="text-sm">
                  <span className="font-medium">{alert.vehicle_name}</span>: 
                  <span className={alert.alert_type === 'danger' ? "text-red-600 mr-2" : "text-yellow-600 mr-2"}>
                    {alert.usage_percentage.toFixed(1)}% من الحد المسموح
                  </span>
                  <span className="text-muted-foreground">
                    ({formatCurrency(alert.current_expenses)} من {formatCurrency(alert.budget_limit)})
                  </span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن سيارة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger>
            <Calendar className="h-4 w-4 ml-2" />
            <SelectValue placeholder="اختر الشهر" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const monthStr = date.toISOString().slice(0, 7);
              return (
                <SelectItem key={monthStr} value={monthStr}>
                  {date.toLocaleDateString('ar-AE', { year: 'numeric', month: 'long' })}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger>
            <SelectValue placeholder="كل الموظفين" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل الموظفين</SelectItem>
            {employees?.map(employee => (
              <SelectItem key={employee.user_id} value={employee.user_id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger>
            <SelectValue placeholder="نوع التقرير" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">التقرير الحالي</SelectItem>
            <SelectItem value="monthly">التقارير الشهرية</SelectItem>
            <SelectItem value="budget">تحليل الميزانية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-xs text-muted-foreground">
                  تجاوزت الحد: {filteredReports.filter(r => r.is_over_budget).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20">
                <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                  {formatCurrency(filteredReports.reduce((sum, report) => sum + report.total_expenses, 0))}
                </p>
                <p className="text-xs text-muted-foreground">
                  متوسط السيارة: {formatCurrency(filteredReports.length > 0 ? filteredReports.reduce((sum, report) => sum + report.total_expenses, 0) / filteredReports.length : 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
                <Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
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
                  {formatCurrency(filteredReports.reduce((sum, report) => sum + report.fuel_expenses, 0))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filteredReports.length > 0 ? 
                    Math.round((filteredReports.reduce((sum, report) => sum + report.fuel_expenses, 0) / 
                    filteredReports.reduce((sum, report) => sum + report.total_expenses, 0)) * 100) || 0 : 0}% من المجموع
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50 dark:bg-yellow-900/20">
                <Fuel className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
                  {formatCurrency(filteredReports.reduce((sum, report) => sum + report.maintenance_expenses, 0))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filteredReports.length > 0 ? 
                    Math.round((filteredReports.reduce((sum, report) => sum + report.maintenance_expenses, 0) / 
                    filteredReports.reduce((sum, report) => sum + report.total_expenses, 0)) * 100) || 0 : 0}% من المجموع
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/20">
                <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Reports Section */}
      {reportType === 'monthly' && monthlyReports && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              التقارير الشهرية التلقائية
            </CardTitle>
            <CardDescription>
              مقارنة المصروفات الشهرية لآخر 6 أشهر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyReports.slice(-6).map(report => (
                <div key={report.month} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(report.month + '-01').toLocaleDateString('ar-AE', { year: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {report.vehicle_count} سيارات نشطة
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">المجموع</p>
                      <p className="font-bold">{formatCurrency(report.total_expenses)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">متوسط السيارة</p>
                      <p className="font-bold">{formatCurrency(report.avg_per_vehicle)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">وقود/صيانة</p>
                      <p className="font-bold">
                        {report.fuel_percentage.toFixed(0)}% / {report.maintenance_percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            تفاصيل السيارات والمصروفات
          </CardTitle>
          <CardDescription>
            تقرير شامل بمصاريف كل سيارة مع مؤشرات الميزانية وربط الموظفين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className={`p-4 border rounded-lg ${report.is_over_budget ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10' : 'border-border'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${report.is_over_budget ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                      {report.is_over_budget ? (
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      ) : (
                        <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {report.make} {report.model} ({report.year})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        لوحة: {report.license_plate}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          {report.assigned_name}
                        </Badge>
                        {report.is_over_budget && (
                          <Badge variant="destructive" className="text-xs">
                            تجاوز الحد
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">المجموع</p>
                      <p className={`font-bold ${report.is_over_budget ? 'text-red-600' : 'text-foreground'}`}>
                        {formatCurrency(report.total_expenses)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">الوقود</p>
                      <p className="font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(report.fuel_expenses)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">الصيانة</p>
                      <p className="font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(report.maintenance_expenses)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">المخالفات</p>
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(report.violation_expenses)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">العمليات</p>
                      <p className="font-bold text-foreground">
                        {report.expense_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">الحد الشهري</p>
                      <p className="font-bold text-foreground">
                        {formatCurrency(report.budget_limit || 0)}
                      </p>
                      <div className={`text-xs mt-1 ${report.budget_usage_percentage > 100 ? 'text-red-600' : report.budget_usage_percentage > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {report.budget_usage_percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>استخدام الميزانية الشهرية</span>
                    <span>{report.budget_usage_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        report.budget_usage_percentage > 100 ? 'bg-red-500' : 
                        report.budget_usage_percentage > 80 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(report.budget_usage_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredReports.length === 0 && (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد سيارات مسجلة للفترة المحددة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}