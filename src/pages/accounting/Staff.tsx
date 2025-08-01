import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useFinancialIntegration, useEmployeeFinancialData } from '@/hooks/useFinancialIntegration';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import AvatarUpload from '@/components/AvatarUpload';
import { 
  Plus, 
  Users, 
  UserCheck, 
  User, 
  BarChart3, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Activity,
  Camera
} from 'lucide-react';

interface Staff {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'accountant' | 'employee';
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
}

interface EmployeeStats {
  totalCommissions: number;
  pendingDebts: number;
  dealsClosed: number;
  monthlyTarget: number;
  targetAchievement: number;
}

interface NewEmployeeForm {
  firstName: string;
  lastName: string;
  email: string; // إجباري الآن
  phone: string;
  role: 'admin' | 'accountant' | 'employee';
}

interface EditEmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'accountant' | 'employee';
  isActive: boolean;
}

export default function Staff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkPermission } = useRoleAccess();
  const [selectedEmployee, setSelectedEmployee] = useState<Staff | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; employee: Staff | null }>({
    open: false,
    employee: null
  });
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'employee'
  });
  
  const [editEmployee, setEditEmployee] = useState<EditEmployeeForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'employee',
    isActive: true
  });
  
  const [avatarDialogOpen, setAvatarDialogOpen] = useState<string | null>(null);

  const canManageStaff = checkPermission('canManageStaff');

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaff
  });

  async function fetchStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('user_id', 'is', null) // فقط الموظفين الذين لديهم user_id صالح
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات الموظفين",
        variant: "destructive",
      });
      throw error;
    }

    return data || [];
  }

  async function fetchEmployeeStats(employeeId: string): Promise<EmployeeStats> {
    // Placeholder implementation - replace with actual data fetching
    return {
      totalCommissions: 25000,
      pendingDebts: 5000,
      dealsClosed: 12,
      monthlyTarget: 50000,
      targetAchievement: 75
    };
  }

  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: NewEmployeeForm) => {
      // Validate required fields
      if (!employee.firstName?.trim()) {
        throw new Error('الاسم الأول مطلوب');
      }
      if (!employee.lastName?.trim()) {
        throw new Error('الاسم الأخير مطلوب');
      }
      if (!employee.email?.trim()) {
        throw new Error('البريد الإلكتروني مطلوب');
      }

      // Generate a strong random password
      const password = generateRandomPassword();
      
      console.log('🔄 Creating employee via Edge Function:', employee.email);
      
      // Call Edge Function to create user securely
      const { data, error } = await supabase.functions.invoke('create-employee-user', {
        body: {
          email: employee.email.trim(),
          password: password,
          first_name: employee.firstName.trim(),
          last_name: employee.lastName.trim(),
          role: employee.role,
          phone: employee.phone?.trim() || null
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'فشل في إنشاء الموظف');
      }

      if (!data?.success) {
        console.error('❌ Edge function failed:', data?.error);
        throw new Error(data?.error || 'فشل في إنشاء الموظف');
      }

      console.log('✅ Employee created successfully:', data.user_id);

      return { 
        ...data.profile,
        temporary_password: data.generated_password,
        user_id: data.user_id 
      };
    },
    onSuccess: (data) => {
      toast({
        title: "تم الإضافة بنجاح",
        description: `تم إضافة الموظف ${data.first_name} ${data.last_name} بنجاح مع user_id: ${data.user_id}`,
      });
      
      // عرض كلمة المرور المؤقتة للمدير (إذا تم إنشاء كلمة مرور جديدة)
      if (data.temporary_password) {
        toast({
          title: "كلمة المرور المؤقتة",
          description: `كلمة المرور: ${data.temporary_password} - يرجى إعطاؤها للموظف`,
          duration: 10000, // عرض لـ 10 ثوان
        });
      } else {
        toast({
          title: "ملاحظة",
          description: "تم ربط الموظف بحساب موجود - لا حاجة لكلمة مرور جديدة",
          duration: 5000,
        });
      }
      
      setAddDialogOpen(false);
      setNewEmployee({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'employee'
      });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: any) => {
      console.error('❌ Employee addition failed:', error);
      
      let errorMessage = "فشل في إضافة الموظف";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      toast({
        title: "خطأ في إضافة الموظف",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const editEmployeeMutation = useMutation({
    mutationFn: async (employee: EditEmployeeForm & { id: string; user_id: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: employee.firstName,
          last_name: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          role: employee.role,
          is_active: employee.isActive
        })
        .eq('id', employee.id);

      if (error) throw error;
      return employee;
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الموظف بنجاح",
      });
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات الموظف",
        variant: "destructive",
      });
    }
  });

  const openEmployeeProfile = (employee: Staff) => {
    setSelectedEmployee(employee);
    setProfileDialogOpen(true);
  };

  // دالة إنشاء كلمة مرور عشوائية قوية
  const generateRandomPassword = (): string => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleAddEmployee = () => {
    // التحقق من الحقول المطلوبة مع التركيز على البريد الإلكتروني
    if (!newEmployee.firstName.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال الاسم الأول",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.lastName.trim()) {
      toast({
        title: "خطأ في البيانات", 
        description: "يرجى إدخال الاسم الأخير",
        variant: "destructive",
      });
      return;
    }
    
    if (!newEmployee.email.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "البريد الإلكتروني مطلوب وإجباري",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployee.email)) {
      toast({
        title: "خطأ في البريد الإلكتروني",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Starting employee creation process...');
    addEmployeeMutation.mutate(newEmployee);
  };

  if (staffLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة الموظفين</h1>
            <p className="text-muted-foreground">
              إدارة الموظفين وتتبع أداءهم المالي
            </p>
          </div>
        </div>
        {canManageStaff && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            إضافة موظف
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">موظف</p>
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
                      <AvatarUpload
                        currentAvatarUrl={employee.avatar_url}
                        employeeId={employee.user_id}
                        employeeName={`${employee.first_name} ${employee.last_name}`}
                        size="sm"
                        canEdit={false}
                        onAvatarUpdate={(newUrl) => {
                          queryClient.invalidateQueries({ queryKey: ['staff'] });
                        }}
                      />
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
                        <>
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => {
                               // فتح dialog تعديل الصورة للموظف المحدد
                               setSelectedEmployee(employee);
                               // استخدام state منفصل لـ avatar dialog
                               setAvatarDialogOpen(employee.user_id);
                             }}
                             title="تعديل الصورة الشخصية"
                           >
                             <Camera className="h-4 w-4" />
                           </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setEditEmployee({
                                firstName: employee.first_name,
                                lastName: employee.last_name,
                                email: employee.email,
                                phone: employee.phone || '',
                                role: employee.role,
                                isActive: employee.is_active
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setConfirmDelete({ open: true, employee })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
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
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              ملف الموظف: {selectedEmployee?.first_name} {selectedEmployee?.last_name}
            </DialogTitle>
            <DialogDescription>
              عرض تفاصيل الموظف ومعلوماته المالية
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
                <TabsTrigger value="financial">الملف المالي</TabsTrigger>
                <TabsTrigger value="commissions">العمولات</TabsTrigger>
                <TabsTrigger value="activities">النشاطات</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <AvatarUpload
                        currentAvatarUrl={selectedEmployee.avatar_url}
                        employeeId={selectedEmployee.user_id}
                        employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                        size="lg"
                        canEdit={canManageStaff}
                        onAvatarUpdate={(newUrl) => {
                          queryClient.invalidateQueries({ queryKey: ['staff'] });
                        }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </h3>
                        <p className="text-muted-foreground">{selectedEmployee.email}</p>
                        <p className="text-muted-foreground">{selectedEmployee.phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>المنصب</Label>
                        <Badge variant="outline" className="mt-1">
                          {selectedEmployee.role === 'admin' ? 'مدير' : 
                           selectedEmployee.role === 'accountant' ? 'محاسب' : 'موظف'}
                        </Badge>
                      </div>
                      <div>
                        <Label>الحالة</Label>
                        <Badge 
                          variant={selectedEmployee.is_active ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {selectedEmployee.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial">
                <Card>
                  <CardHeader>
                    <CardTitle>الملف المالي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium">إجمالي العمولات</h4>
                          <p className="text-2xl font-bold text-primary">--</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium">الديون المعلقة</h4>
                          <p className="text-2xl font-bold text-destructive">--</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        سيتم تطوير هذا القسم لعرض تفاصيل مالية شاملة
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commissions">
                <Card>
                  <CardHeader>
                    <CardTitle>سجل العمولات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      سيتم عرض عمولات الموظف هنا قريباً
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities">
                <Card>
                  <CardHeader>
                    <CardTitle>سجل النشاطات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      سيتم عرض نشاطات الموظف هنا قريباً
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>
              أدخل معلومات الموظف الجديد
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  value={newEmployee.firstName}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="الاسم الأول"
                />
              </div>
              <div>
                <Label htmlFor="lastName">الاسم الأخير</Label>
                <Input
                  id="lastName"
                  value={newEmployee.lastName}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="الاسم الأخير"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@company.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 50 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="role">المنصب</Label>
              <Select value={newEmployee.role} onValueChange={(value: any) => setNewEmployee(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنصب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="accountant">محاسب</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddEmployee} disabled={addEmployeeMutation.isPending}>
              {addEmployeeMutation.isPending ? 'جاري الإضافة...' : 'إضافة الموظف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            <DialogDescription>
              تعديل معلومات {selectedEmployee?.first_name} {selectedEmployee?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">الاسم الأول</Label>
                <Input
                  id="editFirstName"
                  value={editEmployee.firstName}
                  onChange={(e) => setEditEmployee(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="الاسم الأول"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">الاسم الأخير</Label>
                <Input
                  id="editLastName"
                  value={editEmployee.lastName}
                  onChange={(e) => setEditEmployee(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="الاسم الأخير"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editEmail">البريد الإلكتروني</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmployee.email}
                onChange={(e) => setEditEmployee(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@company.com"
              />
            </div>

            <div>
              <Label htmlFor="editPhone">رقم الهاتف</Label>
              <Input
                id="editPhone"
                value={editEmployee.phone}
                onChange={(e) => setEditEmployee(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 50 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="editRole">المنصب</Label>
              <Select value={editEmployee.role} onValueChange={(value: any) => setEditEmployee(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنصب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="accountant">محاسب</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editStatus">الحالة</Label>
              <Select value={editEmployee.isActive ? 'active' : 'inactive'} onValueChange={(value) => setEditEmployee(prev => ({ ...prev, isActive: value === 'active' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => {
                if (selectedEmployee) {
                  editEmployeeMutation.mutate({
                    ...editEmployee,
                    id: selectedEmployee.id,
                    user_id: selectedEmployee.user_id
                  });
                }
              }} 
              disabled={editEmployeeMutation.isPending}
            >
              {editEmployeeMutation.isPending ? 'جاري التحديث...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, employee: null })}
        title="تأكيد الحذف"
        description={`هل أنت متأكد من حذف الموظف ${confirmDelete.employee?.first_name} ${confirmDelete.employee?.last_name}؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={async () => {
          if (confirmDelete.employee) {
            try {
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', confirmDelete.employee.id);

              if (error) throw error;

              toast({
                title: "تم الحذف",
                description: "تم حذف الموظف بنجاح",
              });
              setConfirmDelete({ open: false, employee: null });
              queryClient.invalidateQueries({ queryKey: ['staff'] });
            } catch (error) {
              toast({
                title: "خطأ",
                description: "فشل في حذف الموظف",
                variant: "destructive",
              });
            }
          }
        }}
      />

      {/* Avatar Upload Dialog for table actions */}
      {avatarDialogOpen && (
        <Dialog open={!!avatarDialogOpen} onOpenChange={() => setAvatarDialogOpen(null)}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تحديث الصورة الشخصية</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <AvatarUpload
                currentAvatarUrl={selectedEmployee.avatar_url}
                employeeId={selectedEmployee.user_id}
                employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                size="lg"
                canEdit={true}
                onAvatarUpdate={(newUrl) => {
                  queryClient.invalidateQueries({ queryKey: ['staff'] });
                  setAvatarDialogOpen(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}