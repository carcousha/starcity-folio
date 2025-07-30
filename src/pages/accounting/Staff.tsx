import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  Plus, 
  Edit, 
  Eye, 
  Download,
  TrendingUp,
  HandCoins,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeeFinancialData } from "@/hooks/useFinancialIntegration";
import ActivityLog from "@/components/ActivityLog";

interface Staff {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'accountant' | 'employee';
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

interface EmployeeStats {
  totalCommissions: number;
  totalDebts: number;
  totalDeals: number;
  avgCommissionRate: number;
  netEarnings: number;
}

interface NewEmployeeForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'accountant' | 'employee';
  commission_rate: number;
}

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'employee',
    commission_rate: 2.5
  });
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
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

  const fetchEmployeeStats = async (employeeId: string) => {
    try {
      // Get commissions
      const { data: commissions } = await supabase
        .from('commission_employees')
        .select('calculated_share, net_share')
        .eq('employee_id', employeeId);

      // Get debts
      const { data: debts } = await supabase
        .from('debts')
        .select('amount')
        .eq('debtor_id', employeeId)
        .eq('status', 'pending');

      // Get deals count
      const { data: deals } = await supabase
        .from('deals')
        .select('id, commission_rate')
        .eq('handled_by', employeeId);

      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.calculated_share || 0), 0) || 0;
      const totalDebts = debts?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
      const netEarnings = commissions?.reduce((sum, c) => sum + Number(c.net_share || 0), 0) || 0;
      const avgCommissionRate = deals?.length ? 
        deals.reduce((sum, d) => sum + Number(d.commission_rate || 0), 0) / deals.length : 0;

      setEmployeeStats({
        totalCommissions,
        totalDebts,
        totalDeals: deals?.length || 0,
        avgCommissionRate,
        netEarnings
      });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const handleAddEmployee = async () => {
    try {
      // Note: In a real app, you'd need to create auth user first
      // For now, we'll just create the profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          first_name: newEmployee.first_name,
          last_name: newEmployee.last_name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          role: newEmployee.role,
          user_id: crypto.randomUUID() // Temporary - should be real auth user ID
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الموظف بنجاح",
      });

      setShowAddDialog(false);
      setNewEmployee({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'employee',
        commission_rate: 2.5
      });
      fetchStaff();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الموظف",
        variant: "destructive",
      });
    }
  };

  const openEmployeeProfile = async (employee: Staff) => {
    setSelectedEmployee(employee);
    await fetchEmployeeStats(employee.user_id);
    setShowProfileDialog(true);
  };

  const EmployeeProfileContent = ({ employee }: { employee: Staff }) => {
    const { data: financialData, loading: financialLoading } = useEmployeeFinancialData(employee.user_id);

    return (
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">البيانات الشخصية</TabsTrigger>
          <TabsTrigger value="financial">الملف المالي</TabsTrigger>
          <TabsTrigger value="commissions">العمولات</TabsTrigger>
          <TabsTrigger value="activities">النشاطات</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={employee.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {employee.first_name[0]}{employee.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <Badge variant="outline">
                      {employee.role === 'admin' ? 'مدير' : 
                       employee.role === 'accountant' ? 'محاسب' : 'موظف'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>انضم في {new Date(employee.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {financialData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الملخص المالي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {financialData.totalDeals}
                      </div>
                      <div className="text-sm text-gray-500">إجمالي الصفقات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {financialData.totalCommissions.toFixed(2)} د.إ
                      </div>
                      <div className="text-sm text-gray-500">إجمالي العمولات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {financialData.totalDebts.toFixed(2)} د.إ
                      </div>
                      <div className="text-sm text-gray-500">المديونيات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {financialData.netCommissions.toFixed(2)} د.إ
                      </div>
                      <div className="text-sm text-gray-500">صافي الأرباح</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>التفاصيل المالية</CardTitle>
            </CardHeader>
            <CardContent>
              {financialLoading ? (
                <div className="text-center py-8">جاري تحميل البيانات المالية...</div>
              ) : financialData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">العمولات والأرباح</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>إجمالي العمولات المحسوبة:</span>
                        <span className="font-medium text-green-600">
                          {financialData.totalCommissions.toFixed(2)} د.إ
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>المديونيات المخصومة:</span>
                        <span className="font-medium text-red-600">
                          {financialData.totalDebts.toFixed(2)} د.إ
                        </span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>صافي الأرباح:</span>
                        <span className="text-purple-600">
                          {financialData.netCommissions.toFixed(2)} د.إ
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">إحصائيات الأداء</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>عدد الصفقات المنجزة:</span>
                        <span className="font-medium">{financialData.totalDeals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>متوسط العمولة لكل صفقة:</span>
                        <span className="font-medium">
                          {financialData.totalDeals > 0 
                            ? (financialData.totalCommissions / financialData.totalDeals).toFixed(2)
                            : '0.00'
                          } د.إ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات مالية متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>سجل العمولات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>سيتم عرض تفاصيل العمولات هنا</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <ActivityLog userId={employee.user_id} limit={20} showHeader={false} />
        </TabsContent>
      </Tabs>
    );
  };

  const exportStaffReport = () => {
    const csvContent = [
      ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'المنصب', 'الحالة', 'تاريخ الإنضمام'],
      ...staff.map(emp => [
        `${emp.first_name} ${emp.last_name}`,
        emp.email,
        emp.phone || '',
        emp.role === 'admin' ? 'مدير' : emp.role === 'accountant' ? 'محاسب' : 'موظف',
        emp.is_active ? 'نشط' : 'غير نشط',
        new Date(emp.created_at).toLocaleDateString('ar-EG')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const canManageStaff = profile?.role === 'admin' || profile?.role === 'accountant';

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الموظفين</h1>
          <p className="text-gray-600 mt-2">متابعة الموظفين وأدائهم المالي</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportStaffReport} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          {canManageStaff && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة موظف
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة موظف جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">الاسم الأول</Label>
                      <Input
                        id="first_name"
                        value={newEmployee.first_name}
                        onChange={(e) => setNewEmployee({...newEmployee, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">الاسم الأخير</Label>
                      <Input
                        id="last_name"
                        value={newEmployee.last_name}
                        onChange={(e) => setNewEmployee({...newEmployee, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">الهاتف</Label>
                    <Input
                      id="phone"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">المنصب</Label>
                    <Select value={newEmployee.role} onValueChange={(value: 'admin' | 'accountant' | 'employee') => setNewEmployee({...newEmployee, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">موظف</SelectItem>
                        <SelectItem value="accountant">محاسب</SelectItem>
                        <SelectItem value="admin">مدير</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddEmployee} className="w-full">
                    إضافة الموظف
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">موظف مسجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموظفين النشطين</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">موظف نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديرين</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {staff.filter(s => s.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">مدير</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المحاسبين</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {staff.filter(s => s.role === 'accountant').length}
            </div>
            <p className="text-xs text-muted-foreground">محاسب</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>المنصب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar_url} />
                        <AvatarFallback>
                          {employee.first_name[0]}{employee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                        <div className="text-sm text-gray-500">
                          منذ {new Date(employee.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {employee.role === 'admin' ? 'مدير' : 
                       employee.role === 'accountant' ? 'محاسب' : 'موظف'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={employee.is_active ? 'default' : 'secondary'}
                      className={employee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {employee.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEmployeeProfile(employee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManageStaff && (
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              ملف الموظف: {selectedEmployee?.first_name} {selectedEmployee?.last_name}
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <EmployeeProfileContent employee={selectedEmployee} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}