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
import { Users, Plus, Edit, Phone, Mail, Globe, MessageCircle, FileDown, FileSpreadsheet } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface RentalTenant {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  nationality?: string;
  emirates_id?: string;
  passport_number?: string;
  visa_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  preferred_language: string;
  status: string;
  lead_source?: string;
  notes?: string;
  created_at: string;
}

const RentalTenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<RentalTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<RentalTenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    nationality: '',
    emirates_id: '',
    passport_number: '',
    visa_status: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    current_address: '',
    preferred_language: 'ar',
    status: 'new',
    lead_source: '',
    notes: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المستأجرين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const tenantData = {
        ...formData,
        created_by: user.id
      };

      if (editingTenant) {
        const { error } = await supabase
          .from('rental_tenants')
          .update(tenantData)
          .eq('id', editingTenant.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات المستأجر بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('rental_tenants')
          .insert([tenantData]);

        if (error) throw error;

        toast({
          title: "تم الإنشاء",
          description: "تم إضافة المستأجر بنجاح",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ بيانات المستأجر",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      nationality: '',
      emirates_id: '',
      passport_number: '',
      visa_status: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      current_address: '',
      preferred_language: 'ar',
      status: 'new',
      lead_source: '',
      notes: ''
    });
    setEditingTenant(null);
  };

  const handleEdit = (tenant: RentalTenant) => {
    setEditingTenant(tenant);
    setFormData({
      full_name: tenant.full_name,
      phone: tenant.phone,
      email: tenant.email || '',
      nationality: tenant.nationality || '',
      emirates_id: tenant.emirates_id || '',
      passport_number: tenant.passport_number || '',
      visa_status: tenant.visa_status || '',
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || '',
      current_address: tenant.current_address || '',
      preferred_language: tenant.preferred_language,
      status: tenant.status,
      lead_source: tenant.lead_source || '',
      notes: tenant.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add Arabic font support
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text('Tenants Report', 20, 20);
    
    const tableColumns = ['Name', 'Phone', 'Email', 'Nationality', 'Status'];
    const tableRows = filteredTenants.map(tenant => [
      tenant.full_name,
      tenant.phone,
      tenant.email || '',
      tenant.nationality || '',
      getStatusText(tenant.status)
    ]);

    (doc as any).autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save('tenants-report.pdf');
    
    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير بصيغة PDF بنجاح",
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTenants.map(tenant => ({
        'الاسم الكامل': tenant.full_name,
        'رقم الهاتف': tenant.phone,
        'البريد الإلكتروني': tenant.email || '',
        'الجنسية': tenant.nationality || '',
        'الهوية الإماراتية': tenant.emirates_id || '',
        'رقم الجواز': tenant.passport_number || '',
        'الحالة': getStatusText(tenant.status),
        'المصدر': tenant.lead_source || '',
        'تاريخ الإنشاء': new Date(tenant.created_at).toLocaleDateString('ar-AE')
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المستأجرين');
    XLSX.writeFile(workbook, 'tenants-report.xlsx');
    
    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير بصيغة Excel بنجاح",
    });
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'new': 'جديد',
      'interested': 'مهتم',
      'negotiating': 'جاري التفاوض',
      'agreed': 'تم الاتفاق',
      'contracted': 'متعاقد',
      'not_interested': 'غير مهتم'
    };
    return statusMap[status as keyof typeof statusMap] || 'جديد';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'new': { variant: 'default' as const, label: 'جديد' },
      'interested': { variant: 'secondary' as const, label: 'مهتم' },
      'negotiating': { variant: 'outline' as const, label: 'جاري التفاوض' },
      'agreed': { variant: 'default' as const, label: 'تم الاتفاق' },
      'contracted': { variant: 'default' as const, label: 'متعاقد' },
      'not_interested': { variant: 'destructive' as const, label: 'غير مهتم' }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.new;
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm) ||
    (tenant.email && tenant.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (tenant.nationality && tenant.nationality.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المستأجرين</h1>
          <p className="text-muted-foreground mt-1">
            إدارة بيانات العملاء والمستأجرين المحتملين
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مستأجر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'تعديل المستأجر' : 'إضافة مستأجر جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingTenant ? 'تعديل بيانات المستأجر' : 'إضافة مستأجر جديد لنظام الإيجارات'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">الاسم الكامل *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">الجنسية</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emirates_id">الهوية الإماراتية</Label>
                  <Input
                    id="emirates_id"
                    value={formData.emirates_id}
                    onChange={(e) => setFormData({...formData, emirates_id: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="passport_number">رقم الجواز</Label>
                  <Input
                    id="passport_number"
                    value={formData.passport_number}
                    onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="visa_status">حالة التأشيرة</Label>
                <Select value={formData.visa_status} onValueChange={(value) => setFormData({...formData, visa_status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر حالة التأشيرة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">مقيم</SelectItem>
                    <SelectItem value="visit">زيارة</SelectItem>
                    <SelectItem value="tourist">سياحة</SelectItem>
                    <SelectItem value="work">عمل</SelectItem>
                    <SelectItem value="student">طالب</SelectItem>
                    <SelectItem value="citizen">مواطن</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">اسم جهة الاتصال الطارئ</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">هاتف جهة الاتصال الطارئ</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="current_address">العنوان الحالي</Label>
                <Input
                  id="current_address"
                  value={formData.current_address}
                  onChange={(e) => setFormData({...formData, current_address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="preferred_language">اللغة المفضلة</Label>
                  <Select value={formData.preferred_language} onValueChange={(value) => setFormData({...formData, preferred_language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                      <SelectItem value="ur">اردو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">حالة المستأجر</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="interested">مهتم</SelectItem>
                      <SelectItem value="negotiating">جاري التفاوض</SelectItem>
                      <SelectItem value="agreed">تم الاتفاق</SelectItem>
                      <SelectItem value="contracted">متعاقد</SelectItem>
                      <SelectItem value="not_interested">غير مهتم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lead_source">مصدر العميل</Label>
                  <Select value={formData.lead_source} onValueChange={(value) => setFormData({...formData, lead_source: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المصدر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">الموقع الإلكتروني</SelectItem>
                      <SelectItem value="referral">إحالة</SelectItem>
                      <SelectItem value="social_media">وسائل التواصل</SelectItem>
                      <SelectItem value="advertisement">إعلان</SelectItem>
                      <SelectItem value="walk_in">زيارة مباشرة</SelectItem>
                      <SelectItem value="phone_call">مكالمة هاتفية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingTenant ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="البحث في المستأجرين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <FileDown className="h-4 w-4 ml-2" />
                PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول المستأجرين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستأجرين</CardTitle>
          <CardDescription>
            إجمالي المستأجرين: {filteredTenants.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستأجر</TableHead>
                <TableHead>التواصل</TableHead>
                <TableHead>الهوية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المصدر</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tenant.full_name}</div>
                      {tenant.nationality && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Globe className="h-3 w-3 ml-1" />
                          {tenant.nationality}
                        </div>
                      )}
                      {tenant.preferred_language !== 'ar' && (
                        <Badge variant="outline" className="mt-1">
                          {tenant.preferred_language === 'en' && 'English'}
                          {tenant.preferred_language === 'hi' && 'हिन्दी'}
                          {tenant.preferred_language === 'ur' && 'اردو'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 ml-1" />
                        {tenant.phone}
                      </div>
                      {tenant.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 ml-1" />
                          {tenant.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {tenant.emirates_id && (
                        <div>هوية: {tenant.emirates_id}</div>
                      )}
                      {tenant.passport_number && (
                        <div>جواز: {tenant.passport_number}</div>
                      )}
                      {tenant.visa_status && (
                        <Badge variant="outline" className="mt-1">
                          {tenant.visa_status}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell>
                    {tenant.lead_source && (
                      <Badge variant="outline">
                        {tenant.lead_source === 'website' && 'موقع إلكتروني'}
                        {tenant.lead_source === 'referral' && 'إحالة'}
                        {tenant.lead_source === 'social_media' && 'وسائل تواصل'}
                        {tenant.lead_source === 'advertisement' && 'إعلان'}
                        {tenant.lead_source === 'walk_in' && 'زيارة مباشرة'}
                        {tenant.lead_source === 'phone_call' && 'مكالمة'}
                      </Badge>
                    )}
                  </TableCell>
                   <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsApp(tenant.phone)}
                        title="إرسال رسالة واتس آب"
                        className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        تعديل
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTenants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد مستأجرين</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalTenants;