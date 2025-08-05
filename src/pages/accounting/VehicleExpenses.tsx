import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Fuel, Wrench, Shield, AlertTriangle, Download, Search, Filter, Car, BarChart3, TrendingDown, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface VehicleExpense {
  id: string;
  vehicle_id: string;
  expense_type: string;
  amount: number;
  expense_date: string;
  odometer_reading?: number;
  description?: string;
  receipt_url?: string;
  debt_assignment?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  assigned_to?: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
}

export default function VehicleExpenses() {
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<VehicleExpense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<VehicleExpense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    vehicle_id: "",
    expense_type: "",
    amount: "",
    expense_date: new Date().toISOString().split('T')[0],
    odometer_reading: "",
    description: "",
    debt_assignment: "company",
    assigned_employee: ""
  });

  const expenseTypes = [
    { value: "fuel", label: "وقود", icon: Fuel, color: "bg-blue-100 text-blue-800" },
    { value: "maintenance", label: "صيانة", icon: Wrench, color: "bg-orange-100 text-orange-800" },
    { value: "insurance", label: "تأمين", icon: Shield, color: "bg-green-100 text-green-800" },
    { value: "fines", label: "مخالفات", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
    { value: "repairs", label: "إصلاحات", icon: Wrench, color: "bg-purple-100 text-purple-800" },
    { value: "other", label: "أخرى", icon: Car, color: "bg-gray-100 text-gray-800" }
  ];

  useEffect(() => {
    fetchExpenses();
    fetchVehicles();
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, typeFilter, vehicleFilter, dateFilter]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, user_id')
        .eq('is_active', true);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, assigned_to')
        .eq('status', 'active');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicles.find(v => v.id === expense.vehicle_id)?.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicles.find(v => v.id === expense.vehicle_id)?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicles.find(v => v.id === expense.vehicle_id)?.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(expense => expense.expense_type === typeFilter);
    }

    if (vehicleFilter && vehicleFilter !== "all") {
      filtered = filtered.filter(expense => expense.vehicle_id === vehicleFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const filterMonth = filterDate.getMonth();
      const filterYear = filterDate.getFullYear();
      
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate.getMonth() === filterMonth && expenseDate.getFullYear() === filterYear;
      });
    }

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.expense_type || !formData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (formData.debt_assignment === 'employee' && !formData.assigned_employee) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الموظف المخصص له الدين",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.user_id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const insertData = {
        vehicle_id: formData.vehicle_id,
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
        description: formData.description || null,
        recorded_by: profile.user_id
      };

      const { error } = await supabase
        .from('vehicle_expenses')
        .insert([insertData]);

      if (error) throw error;

      // Also add to general expenses
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
      const expenseTypeLabel = expenseTypes.find(t => t.value === formData.expense_type)?.label;
      
      const expenseData = {
        title: `مصروف سيارة - ${expenseTypeLabel}`,
        description: `${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate}) - ${formData.description || ''}`,
        amount: parseFloat(formData.amount),
        category: "مواصلات",
        expense_date: formData.expense_date,
        recorded_by: profile.user_id
      };
      
      console.log('Expense data to insert:', expenseData);
      
      await supabase
        .from('expenses')
        .insert([expenseData]);

      // If assigned to employee, add to debts
      if (formData.debt_assignment === 'employee' && formData.assigned_employee) {
        const employee = profiles.find(p => p.user_id === formData.assigned_employee);
        if (employee) {
          await supabase
            .from('debts')
            .insert([{
              debtor_type: 'employee',
              debtor_name: `${employee.first_name} ${employee.last_name}`,
              debtor_id: formData.assigned_employee,
              amount: parseFloat(formData.amount),
              description: `مصروف سيارة: ${expenseTypeLabel} - ${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate})`,
              recorded_by: profile.user_id,
              status: 'pending'
            }]);
        }
      }

      toast({
        title: "نجح الحفظ",
        description: `تم إضافة مصروف السيارة بنجاح${formData.debt_assignment === 'employee' ? ' وتم إضافته للمديونيات' : ''}`,
      });

      setIsDialogOpen(false);
      setFormData({
        vehicle_id: "",
        expense_type: "",
        amount: "",
        expense_date: new Date().toISOString().split('T')[0],
        odometer_reading: "",
        description: "",
        debt_assignment: "company",
        assigned_employee: ""
      });
      fetchExpenses();
    } catch (error: any) {
      console.error('Error saving vehicle expense:', error);
      toast({
        title: "خطأ",
        description: `فشل في حفظ البيانات: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: VehicleExpense) => {
    setEditingExpense(expense);
    setFormData({
      vehicle_id: expense.vehicle_id,
      expense_type: expense.expense_type,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      odometer_reading: expense.odometer_reading?.toString() || "",
      description: expense.description || "",
      debt_assignment: expense.debt_assignment || "company",
      assigned_employee: ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingExpense || !formData.vehicle_id || !formData.expense_type || !formData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData = {
        vehicle_id: formData.vehicle_id,
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
        description: formData.description || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicle_expenses')
        .update(updateData)
        .eq('id', editingExpense.id);

      if (error) throw error;

      // Update general expenses entry as well
      const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
      const expenseTypeLabel = expenseTypes.find(t => t.value === formData.expense_type)?.label;
      
      await supabase
        .from('expenses')
        .update({
          title: `مصروف سيارة - ${expenseTypeLabel}`,
          description: `${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate}) - ${formData.description || ''}`,
          amount: parseFloat(formData.amount),
          category: "مواصلات",
          expense_date: formData.expense_date,
        })
        .ilike('description', `%${vehicle?.license_plate}%`)
        .eq('category', 'مواصلات')
        .eq('amount', editingExpense.amount);

      toast({
        title: "نجح التحديث",
        description: "تم تحديث مصروف السيارة بنجاح",
      });

      setIsEditDialogOpen(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error: any) {
      console.error('Error updating vehicle expense:', error);
      toast({
        title: "خطأ",
        description: `فشل في تحديث البيانات: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (expense: VehicleExpense) => {
    try {
      const { error } = await supabase
        .from('vehicle_expenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;

      // Delete related general expense entry
      const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
      await supabase
        .from('expenses')
        .delete()
        .ilike('description', `%${vehicle?.license_plate}%`)
        .eq('category', 'مواصلات')
        .eq('amount', expense.amount);

      toast({
        title: "نجح الحذف",
        description: "تم حذف مصروف السيارة بنجاح",
      });

      fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting vehicle expense:', error);
      toast({
        title: "خطأ",
        description: `فشل في حذف البيانات: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  
  const expensesByType = expenseTypes.map(type => ({
    ...type,
    total: expenses.filter(exp => exp.expense_type === type.value).reduce((sum, exp) => sum + exp.amount, 0),
    count: expenses.filter(exp => exp.expense_type === type.value).length
  })).filter(type => type.total > 0);

  const expensesByVehicle = vehicles.map(vehicle => ({
    ...vehicle,
    total: expenses.filter(exp => exp.vehicle_id === vehicle.id).reduce((sum, exp) => sum + exp.amount, 0),
    count: expenses.filter(exp => exp.vehicle_id === vehicle.id).length
  })).filter(vehicle => vehicle.total > 0);

  const monthlyData = expenses.reduce((acc: any[], expense) => {
    const date = new Date(expense.expense_date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('ar-AE', { year: 'numeric', month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
      existing.count += 1;
    } else {
      acc.push({ month, monthName, amount: expense.amount, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  const exportToCSV = () => {
    const headers = ['السيارة', 'نوع المصروف', 'المبلغ', 'التاريخ', 'قراءة العداد', 'تخصيص الدين', 'الوصف'];
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(expense => {
        const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
        const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'سيارة محذوفة';
        const expenseTypeLabel = expenseTypes.find(t => t.value === expense.expense_type)?.label || expense.expense_type;
        return [
          vehicleName,
          expenseTypeLabel,
          expense.amount,
          expense.expense_date,
          expense.odometer_reading || '-',
          (expense.debt_assignment || 'company') === 'company' ? 'الشركة' : 'الموظف',
          expense.description || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vehicle_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مصروفات السيارات</h1>
          <p className="text-gray-600 mt-2">إدارة وتتبع مصروفات أسطول السيارات</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مصروف
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مصروف سيارة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المصروف الجديد
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vehicle_id">السيارة</Label>
                  <Select value={formData.vehicle_id} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السيارة" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expense_type">نوع المصروف</Label>
                  <Select value={formData.expense_type} onValueChange={(value) => setFormData(prev => ({ ...prev, expense_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">المبلغ (درهم)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="expense_date">تاريخ المصروف</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="odometer_reading">قراءة العداد (اختياري)</Label>
                  <Input
                    id="odometer_reading"
                    type="number"
                    value={formData.odometer_reading}
                    onChange={(e) => setFormData(prev => ({ ...prev, odometer_reading: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="debt_assignment">تخصيص الدين</Label>
                  <Select value={formData.debt_assignment} onValueChange={(value) => setFormData(prev => ({ ...prev, debt_assignment: value, assigned_employee: "" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">على الشركة</SelectItem>
                      <SelectItem value="employee">على الموظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.debt_assignment === 'employee' && (
                  <div>
                    <Label htmlFor="assigned_employee">اختيار الموظف</Label>
                    <Select value={formData.assigned_employee} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_employee: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.user_id} value={profile.user_id}>
                            {profile.first_name} {profile.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  حفظ المصروف
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalExpenses.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} مصروف
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط المصروف</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageExpense.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              لكل مصروف
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أكثر نوع إنفاقاً</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expensesByType.length > 0 ? expensesByType.reduce((prev, current) => (prev.total > current.total) ? prev : current).label : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {expensesByType.length > 0 ? `${expensesByType.reduce((prev, current) => (prev.total > current.total) ? prev : current).total.toLocaleString('ar-AE')} درهم` : 'لا توجد بيانات'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات الشهرية</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].amount.toLocaleString('ar-AE') : '0'} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              الشهر الحالي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {monthlyData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                المصروفات الشهرية
              </CardTitle>
              <CardDescription>تطور مصروفات السيارات خلال الشهور الماضية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month, index) => {
                  const maxAmount = Math.max(...monthlyData.map(m => m.amount));
                  const percentage = (month.amount / maxAmount) * 100;
                  return (
                    <div key={month.month} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{month.monthName}</span>
                        <span className="text-red-600 font-semibold">
                          {month.amount.toLocaleString('ar-AE')} درهم
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {month.count} مصروف
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                توزيع المصروفات حسب النوع
              </CardTitle>
              <CardDescription>نسبة كل نوع من إجمالي المصروفات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expensesByType.map((type, index) => {
                  const totalAmount = expensesByType.reduce((sum, t) => sum + t.total, 0);
                  const percentage = ((type.total / totalAmount) * 100).toFixed(1);
                  return (
                    <div key={type.value} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <span className="text-red-600 font-semibold">
                          {type.total.toLocaleString('ar-AE')} درهم
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{percentage}% من الإجمالي</span>
                        <span>{type.count} مصروف</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicle Expenses Summary */}
      {expensesByVehicle.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              مصروفات السيارات الفردية
            </CardTitle>
            <CardDescription>تكلفة تشغيل كل سيارة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expensesByVehicle.map((vehicle, index) => (
                <div key={vehicle.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                      <div className="text-xs text-gray-500">{vehicle.license_plate}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-red-600">
                      {vehicle.total.toLocaleString('ar-AE')} درهم
                    </div>
                    <div className="text-xs text-gray-500">
                      {vehicle.count} مصروف
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في المصروفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {expenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[200px]">
                <Car className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب السيارة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع السيارات</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[200px]"
              placeholder="تصفية حسب الشهر"
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات</CardTitle>
          <CardDescription>جميع مصروفات السيارات</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>السيارة</TableHead>
                <TableHead>نوع المصروف</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>قراءة العداد</TableHead>
                <TableHead>تخصيص الدين</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => {
                const vehicle = vehicles.find(v => v.id === expense.vehicle_id);
                const expenseType = expenseTypes.find(t => t.value === expense.expense_type);
                
                return (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {vehicle ? (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <div>
                            <div>{vehicle.make} {vehicle.model}</div>
                            <div className="text-xs text-gray-500">{vehicle.license_plate}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">سيارة محذوفة</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {expenseType && (
                        <Badge variant="outline" className={expenseType.color}>
                          {expenseType.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {expense.amount.toLocaleString('ar-AE')} درهم
                    </TableCell>
                    <TableCell>{new Date(expense.expense_date).toLocaleDateString('ar-AE')}</TableCell>
                    <TableCell>{expense.odometer_reading || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={(expense.debt_assignment || 'company') === 'company' ? 'default' : 'secondary'}>
                        {(expense.debt_assignment || 'company') === 'company' ? 'الشركة' : 'الموظف'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {expense.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(expense)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    لا توجد مصروفات لعرضها
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل مصروف السيارة</DialogTitle>
            <DialogDescription>
              تعديل تفاصيل المصروف
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit_vehicle_id">السيارة</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السيارة" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_expense_type">نوع المصروف</Label>
              <Select value={formData.expense_type} onValueChange={(value) => setFormData(prev => ({ ...prev, expense_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المصروف" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_amount">المبلغ (درهم)</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_expense_date">تاريخ المصروف</Label>
              <Input
                id="edit_expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_odometer_reading">قراءة العداد (اختياري)</Label>
              <Input
                id="edit_odometer_reading"
                type="number"
                value={formData.odometer_reading}
                onChange={(e) => setFormData(prev => ({ ...prev, odometer_reading: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit_description">الوصف</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                تحديث المصروف
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}