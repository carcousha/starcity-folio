// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Phone, Mail, Globe, MessageCircle, FileDown, FileSpreadsheet, Trash2, RotateCw, RefreshCw } from 'lucide-react';
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useUnifiedContacts } from "@/hooks/useUnifiedContacts";
// TODO: Create useAutoSync hook or remove this import if not needed
const useAutoSync = () => ({ isAutoSyncEnabled: false });
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const Tenants = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAutoSyncEnabled } = useAutoSync();
  const { fetchContacts } = useUnifiedContacts();

  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [properties, setProperties] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchTenants();
    fetchProperties();
  }, []);

  useEffect(() => {
    if (tenants.length > 0) {
      filterTenants();
    }
  }, [searchTerm, tenants, selectedTab]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, properties(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
      setFilteredTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: 'خطأ في جلب المستأجرين',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const filterTenants = () => {
    let filtered = tenants;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tenant =>
        tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone?.includes(searchTerm) ||
        tenant.properties?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab
    if (selectedTab !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === selectedTab);
    }

    setFilteredTenants(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const tenantData = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      property_id: formData.get('property_id'),
      lease_start: formData.get('lease_start'),
      lease_end: formData.get('lease_end'),
      rent_amount: formData.get('rent_amount'),
      payment_frequency: formData.get('payment_frequency'),
      notes: formData.get('notes'),
      status: formData.get('status'),
    };

    try {
      let result;

      if (editingTenant) {
        // Update existing tenant
        result = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', editingTenant.id);

        if (result.error) throw result.error;

        toast({
          title: 'تم التحديث بنجاح',
          description: 'تم تحديث بيانات المستأجر بنجاح',
        });
      } else {
        // Create new tenant
        tenantData.created_by = user.id;

        result = await supabase
          .from('tenants')
          .insert([tenantData]);

        if (result.error) throw result.error;

        toast({
          title: 'تمت الإضافة بنجاح',
          description: 'تم إضافة المستأجر الجديد بنجاح',
        });

        // If auto sync is enabled, add to contacts
        if (isAutoSyncEnabled) {
          try {
            await fetchContacts({
              name: tenantData.full_name,
              phone: tenantData.phone,
              email: tenantData.email,
              role: 'tenant',
            });
          } catch (syncError) {
            console.error('Error syncing contact:', syncError);
          }
        }
      }

      setIsDialogOpen(false);
      fetchTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: 'خطأ في حفظ البيانات',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setEditingTenant(null);
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!tenantToDelete) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantToDelete.id);

      if (error) throw error;

      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف المستأجر بنجاح',
      });

      setTenants(tenants.filter(t => t.id !== tenantToDelete.id));
      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast({
        title: 'خطأ في حذف المستأجر',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (tenant) => {
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(18);
      doc.text('قائمة المستأجرين', doc.internal.pageSize.width / 2, 20, { align: 'center' });

      const tableColumn = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'العقار', 'مبلغ الإيجار', 'الحالة'];
      const tableRows = [];

      filteredTenants.forEach(tenant => {
        const tenantData = [
          tenant.full_name,
          tenant.phone || '-',
          tenant.email || '-',
          tenant.properties?.name || '-',
          `${tenant.rent_amount || 0} ريال`,
          tenant.status === 'active' ? 'نشط' : 
          tenant.status === 'inactive' ? 'غير نشط' : 
          tenant.status === 'pending' ? 'قيد الانتظار' : tenant.status,
        ];
        tableRows.push(tenantData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 10, halign: 'right' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      doc.save('tenants.pdf');

      toast({
        title: 'تم التصدير بنجاح',
        description: 'تم تصدير قائمة المستأجرين إلى ملف PDF',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // This is a placeholder for Excel export functionality
      // You would typically use a library like xlsx or exceljs
      toast({
        title: 'ميزة قيد التطوير',
        description: 'تصدير Excel قيد التطوير حالياً',
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">نشط</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">غير نشط</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">قيد الانتظار</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  const getPaymentFrequencyText = (frequency) => {
    switch (frequency) {
      case 'monthly': return 'شهري';
      case 'quarterly': return 'ربع سنوي';
      case 'biannual': return 'نصف سنوي';
      case 'annual': return 'سنوي';
      default: return frequency;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">إدارة المستأجرين</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/contacts')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Users className="h-4 w-4 ml-2" />
            جهات الاتصال
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستأجر جديد
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="البحث عن مستأجر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchTenants}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            variant="outline"
            onClick={exportToPDF}
            disabled={isExporting || filteredTenants.length === 0}
          >
            <FileDown className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={isExporting || filteredTenants.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="active">نشط</TabsTrigger>
          <TabsTrigger value="inactive">غير نشط</TabsTrigger>
          <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-0">
          <Card>
            <CardContent className="p-0">
              {loading && tenants.length === 0 ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 rtl:space-x-reverse">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTenants.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">لا توجد بيانات للعرض</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>معلومات الاتصال</TableHead>
                      <TableHead>العقار</TableHead>
                      <TableHead>مدة الإيجار</TableHead>
                      <TableHead>مبلغ الإيجار</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.full_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {tenant.phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 ml-1 text-muted-foreground" />
                                <span className="text-sm">{tenant.phone}</span>
                              </div>
                            )}
                            {tenant.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 ml-1 text-muted-foreground" />
                                <span className="text-sm">{tenant.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{tenant.properties?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">من:</span> {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString('ar-SA') : '-'}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">إلى:</span> {tenant.lease_end ? new Date(tenant.lease_end).toLocaleDateString('ar-SA') : '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="font-medium">{tenant.rent_amount ? `${tenant.rent_amount} ريال` : '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {tenant.payment_frequency ? getPaymentFrequencyText(tenant.payment_frequency) : '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(tenant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => confirmDelete(tenant)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'تعديل المستأجر' : 'إضافة مستأجر جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={editingTenant?.full_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingTenant?.phone}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingTenant?.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_id">العقار</Label>
                <Select name="property_id" defaultValue={editingTenant?.property_id?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العقار" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lease_start">تاريخ بداية الإيجار</Label>
                <Input
                  id="lease_start"
                  name="lease_start"
                  type="date"
                  defaultValue={editingTenant?.lease_start}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lease_end">تاريخ نهاية الإيجار</Label>
                <Input
                  id="lease_end"
                  name="lease_end"
                  type="date"
                  defaultValue={editingTenant?.lease_end}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent_amount">مبلغ الإيجار</Label>
                <Input
                  id="rent_amount"
                  name="rent_amount"
                  type="number"
                  defaultValue={editingTenant?.rent_amount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_frequency">تكرار الدفع</Label>
                <Select name="payment_frequency" defaultValue={editingTenant?.payment_frequency || 'monthly'}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر تكرار الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="quarterly">ربع سنوي</SelectItem>
                    <SelectItem value="biannual">نصف سنوي</SelectItem>
                    <SelectItem value="annual">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select name="status" defaultValue={editingTenant?.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingTenant?.notes}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <RotateCw className="ml-2 h-4 w-4 animate-spin" />}
                {editingTenant ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستأجر "{tenantToDelete?.full_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading && <RotateCw className="ml-2 h-4 w-4 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tenants;