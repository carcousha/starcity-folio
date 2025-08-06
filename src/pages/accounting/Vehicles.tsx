import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, Fuel, Wrench, AlertTriangle, Calendar, Users, Download, Search, Filter, Bell, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color?: string;
  status: string;
  assigned_to?: string;
  purchase_price?: number;
  purchase_date?: string;
  license_expiry?: string;
  insurance_expiry?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  odometer_reading?: number;
  notes?: string;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
}

interface VehicleExpense {
  id: string;
  vehicle_id: string;
  expense_type: string;
  amount: number;
  expense_date: string;
  description?: string;
  odometer_reading?: number;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [vehicleExpenses, setVehicleExpenses] = useState<VehicleExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    license_plate: "",
    color: "",
    assigned_to: "",
    purchase_price: "",
    purchase_date: "",
    license_expiry: "",
    insurance_expiry: "",
    next_maintenance: "",
    odometer_reading: "",
    notes: ""
  });

  const statusOptions = [
    { value: "active", label: "نشطة", color: "bg-green-100 text-green-800" },
    { value: "maintenance", label: "صيانة", color: "bg-orange-100 text-orange-800" },
    { value: "retired", label: "خارج الخدمة", color: "bg-red-100 text-red-800" }
  ];

  useEffect(() => {
    fetchVehicles();
    fetchProfiles();
    fetchVehicleExpenses();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, statusFilter]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, user_id')
        .eq('is_active', true); // Get all active profiles

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchVehicleExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setVehicleExpenses(data || []);
    } catch (error) {
      console.error('Error fetching vehicle expenses:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
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

  const filterVehicles = () => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(vehicle => 
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    setFilteredVehicles(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.make || !formData.model || !formData.year || !formData.license_plate) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }

      const vehicleData: any = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        license_plate: formData.license_plate.trim(),
        color: formData.color ? formData.color.trim() : null,
        assigned_to: (formData.assigned_to && formData.assigned_to !== "unassigned") ? formData.assigned_to : null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        purchase_date: formData.purchase_date || null,
        license_expiry: formData.license_expiry || null,
        insurance_expiry: formData.insurance_expiry || null,
        next_maintenance: formData.next_maintenance || null,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : 0,
        notes: formData.notes ? formData.notes.trim() : null
      };

      // If not editing, set default status
      if (!isEditMode) {
        vehicleData.status = 'active';
      }

      let data, error;

      if (isEditMode && selectedVehicle) {
        // Update existing vehicle
        const response = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', selectedVehicle.id)
          .select();
        
        data = response.data;
        error = response.error;
      } else {
        // Insert new vehicle
        const response = await supabase
          .from('vehicles')
          .insert([vehicleData])
          .select();
        
        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`خطأ في قاعدة البيانات: ${error.message}`);
      }

      toast({
        title: "نجح الحفظ",
        description: isEditMode ? "تم تحديث السيارة بنجاح" : "تم إضافة السيارة بنجاح",
      });

      closeDialog();
      await fetchVehicles();
      
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      
      let errorMessage = "فشل في حفظ البيانات";
      if (error.message.includes('unique')) {
        errorMessage = "رقم اللوحة مستخدم مسبقاً";
      } else if (error.message.includes('foreign key')) {
        errorMessage = "الموظف المحدد غير صحيح";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setIsEditMode(false);
    setSelectedVehicle(null);
    setFormData({
      make: "",
      model: "",
      year: "",
      license_plate: "",
      color: "",
      assigned_to: "",
      purchase_price: "",
      purchase_date: "",
      license_expiry: "",
      insurance_expiry: "",
      next_maintenance: "",
      odometer_reading: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setIsEditMode(true);
    setSelectedVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      license_plate: vehicle.license_plate,
      color: vehicle.color || "",
      assigned_to: vehicle.assigned_to || "",
      purchase_price: vehicle.purchase_price?.toString() || "",
      purchase_date: vehicle.purchase_date || "",
      license_expiry: vehicle.license_expiry || "",
      insurance_expiry: vehicle.insurance_expiry || "",
      next_maintenance: vehicle.next_maintenance || "",
      odometer_reading: vehicle.odometer_reading?.toString() || "",
      notes: vehicle.notes || ""
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setSelectedVehicle(null);
    setFormData({
      make: "",
      model: "",
      year: "",
      license_plate: "",
      color: "",
      assigned_to: "",
      purchase_price: "",
      purchase_date: "",
      license_expiry: "",
      insurance_expiry: "",
      next_maintenance: "",
      odometer_reading: "",
      notes: ""
    });
  };

  const handleDelete = async (vehicle: Vehicle) => {
    // Check if there are associated expenses
    const expenseCount = vehicleExpenses.filter(exp => exp.vehicle_id === vehicle.id).length;
    
    let confirmMessage = `هل أنت متأكد من حذف السيارة ${vehicle.make} ${vehicle.model}؟`;
    if (expenseCount > 0) {
      confirmMessage += `\n\nملاحظة: سيتم حذف ${expenseCount} مصروف مرتبط بهذه السيارة أيضاً.`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Use the safe delete function
      const { data, error } = await supabase.rpc('delete_vehicle_with_expenses', {
        vehicle_id_param: vehicle.id
      });

      if (error) {
        console.error('Delete vehicle error:', error);
        throw error;
      }

      const result = data as any; // Type assertion for the response

      toast({
        title: "تم الحذف",
        description: result.message + (result.deleted_expenses_count > 0 ? ` (تم حذف ${result.deleted_expenses_count} مصروف)` : ''),
      });

      // Refresh both vehicles and expenses
      await fetchVehicles();
      await fetchVehicleExpenses();
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف السيارة",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const retiredVehicles = vehicles.filter(v => v.status === 'retired').length;

  // Check for expiring documents
  const expiringLicenses = vehicles.filter(v => {
    if (!v.license_expiry) return false;
    const expiryDate = new Date(v.license_expiry);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
  });

  const expiringInsurance = vehicles.filter(v => {
    if (!v.insurance_expiry) return false;
    const expiryDate = new Date(v.insurance_expiry);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
  });

  // Calculate total vehicle expenses
  const totalExpenses = vehicleExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const exportToCSV = () => {
    const headers = ['الماركة', 'الموديل', 'السنة', 'رقم اللوحة', 'اللون', 'الحالة', 'الموظف المخصص', 'سعر الشراء', 'انتهاء الترخيص', 'انتهاء التأمين'];
    const csvContent = [
      headers.join(','),
      ...filteredVehicles.map(vehicle => {
        const employee = profiles.find(p => p.user_id === vehicle.assigned_to);
        const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '-';
        return [
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.license_plate,
          vehicle.color || '-',
          vehicle.status === 'active' ? 'نشطة' : vehicle.status === 'maintenance' ? 'صيانة' : 'خارج الخدمة',
          employeeName,
          vehicle.purchase_price ? `${vehicle.purchase_price} درهم` : '-',
          vehicle.license_expiry ? new Date(vehicle.license_expiry).toLocaleDateString('ar-AE') : '-',
          vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('ar-AE') : '-'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vehicles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة السيارات</h1>
          <p className="text-gray-600 mt-2">إدارة أسطول سيارات الشركة ومصروفاته</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (open && !isEditMode) {
              // فتح حوار الإضافة
              setIsEditMode(false);
              setSelectedVehicle(null);
              setFormData({
                make: "",
                model: "",
                year: "",
                license_plate: "",
                color: "",
                assigned_to: "",
                purchase_price: "",
                purchase_date: "",
                license_expiry: "",
                insurance_expiry: "",
                next_maintenance: "",
                odometer_reading: "",
                notes: ""
              });
            }
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة سيارة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "تعديل السيارة" : "إضافة سيارة جديدة"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "تعديل تفاصيل السيارة" : "أدخل تفاصيل السيارة الجديدة"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="make">الماركة</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">الموديل</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">السنة</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1990"
                      max="2030"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_plate">رقم اللوحة</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">اللون</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assigned_to">الموظف المخصص</Label>
                    <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">بدون موظف</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.user_id} value={profile.user_id}>
                            {profile.first_name} {profile.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase_price">سعر الشراء (درهم)</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchase_date">تاريخ الشراء</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_expiry">انتهاء الترخيص</Label>
                    <Input
                      id="license_expiry"
                      type="date"
                      value={formData.license_expiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_expiry: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance_expiry">انتهاء التأمين</Label>
                    <Input
                      id="insurance_expiry"
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, insurance_expiry: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="next_maintenance">الصيانة القادمة</Label>
                    <Input
                      id="next_maintenance"
                      type="date"
                      value={formData.next_maintenance}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_maintenance: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="odometer_reading">قراءة العداد</Label>
                    <Input
                      id="odometer_reading"
                      type="number"
                      value={formData.odometer_reading}
                      onChange={(e) => setFormData(prev => ({ ...prev, odometer_reading: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {isEditMode ? "تحديث السيارة" : "حفظ السيارة"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts Section */}
      {(expiringLicenses.length > 0 || expiringInsurance.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="h-5 w-5" />
              تنبيهات مهمة
            </CardTitle>
            <CardDescription className="text-orange-600">
              {expiringLicenses.length > 0 && (
                <div>• {expiringLicenses.length} سيارة تحتاج تجديد ترخيص خلال 30 يوماً</div>
              )}
              {expiringInsurance.length > 0 && (
                <div>• {expiringInsurance.length} سيارة تحتاج تجديد تأمين خلال 30 يوماً</div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السيارات</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">سيارة في الأسطول</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">السيارات النشطة</CardTitle>
            <Fuel className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeVehicles}</div>
            <p className="text-xs text-muted-foreground">سيارة نشطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحتاج صيانة</CardTitle>
            <Wrench className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{maintenanceVehicles}</div>
            <p className="text-xs text-muted-foreground">سيارة في الصيانة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalExpenses.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">مصروفات السيارات</p>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="البحث في السيارات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة السيارات</CardTitle>
          <CardDescription>جميع سيارات الشركة وحالتها</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الماركة والموديل</TableHead>
                <TableHead>السنة</TableHead>
                <TableHead>رقم اللوحة</TableHead>
                <TableHead>اللون</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الموظف المخصص</TableHead>
                <TableHead>انتهاء الترخيص</TableHead>
                <TableHead>سعر الشراء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => {
                const employee = profiles.find(p => p.user_id === vehicle.assigned_to);
                const statusOption = statusOptions.find(s => s.value === vehicle.status);
                const isLicenseExpiring = vehicle.license_expiry && new Date(vehicle.license_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <TableRow key={vehicle.id} className={isLicenseExpiring ? 'bg-orange-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        {vehicle.make} {vehicle.model}
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell className="font-mono">{vehicle.license_plate}</TableCell>
                    <TableCell>{vehicle.color || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusOption?.color}>
                        {statusOption?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{employee.first_name} {employee.last_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">غير مخصصة</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.license_expiry ? (
                        <div className={`flex items-center gap-2 ${isLicenseExpiring ? 'text-orange-600 font-semibold' : ''}`}>
                          {isLicenseExpiring && <AlertTriangle className="h-4 w-4" />}
                          {new Date(vehicle.license_expiry).toLocaleDateString('ar-AE')}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.purchase_price ? `${vehicle.purchase_price.toLocaleString('ar-AE')} درهم` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(vehicle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(vehicle)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredVehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    لا توجد سيارات لعرضها
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}