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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, Phone, Mail, Globe, Calendar as CalendarIcon, IdCard, MapPin, MessageSquare, Languages, FileText, CheckCircle, X, Plus, Edit, Download, Search, MessageCircle } from 'lucide-react';
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface PropertyOwner {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  birth_date?: string;
  nationality: string;
  id_passport_number: string;
  mailing_address: string;
  preferred_contact_method: string;
  preferred_language: string;
  internal_notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PropertyOwnerForm {
  full_name: string;
  phone: string;
  email: string;
  birth_date?: Date;
  nationality: string;
  id_passport_number: string;
  mailing_address: string;
  preferred_contact_method: string;
  preferred_language: string;
  internal_notes: string;
  status: string;
}

const PropertyOwners = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<PropertyOwner | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [formData, setFormData] = useState<PropertyOwnerForm>({
    full_name: '',
    phone: '',
    email: '',
    birth_date: undefined,
    nationality: '',
    id_passport_number: '',
    mailing_address: '',
    preferred_contact_method: 'whatsapp',
    preferred_language: 'ar',
    internal_notes: '',
    status: 'active'
  });

  // Fetch owners data
  const fetchOwners = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual Supabase query
      const mockData: PropertyOwner[] = [
        {
          id: '1',
          full_name: 'أحمد محمد الشامسي',
          phone: '+971501234567',
          email: 'ahmed@example.com',
          nationality: 'ae',
          id_passport_number: '784-1985-1234567-8',
          mailing_address: 'عجمان - منطقة الروضة - شارع الشيخ راشد',
          preferred_contact_method: 'whatsapp',
          preferred_language: 'ar',
          internal_notes: 'مالك موثوق ومتعاون',
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2', 
          full_name: 'فاطمة علي النعيمي',
          phone: '+971507654321',
          email: 'fatima@example.com',
          nationality: 'ae',
          id_passport_number: '784-1980-9876543-2',
          mailing_address: 'عجمان - النعيمية - برج النصر',
          preferred_contact_method: 'email',
          preferred_language: 'ar',
          internal_notes: 'تملك عدة عقارات في المنطقة',
          status: 'active',
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-10T14:30:00Z'
        }
      ];
      setOwners(mockData);
    } catch (error) {
      console.error('Error fetching owners:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الملاك",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      birth_date: undefined,
      nationality: '',
      id_passport_number: '',
      mailing_address: '',
      preferred_contact_method: 'whatsapp',
      preferred_language: 'ar',
      internal_notes: '',
      status: 'active'
    });
    setEditingOwner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.full_name || !formData.phone || !formData.email) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Here you would typically save to Supabase
      // if editing, update; if new, insert
      
      toast({
        title: "تم الحفظ",
        description: editingOwner ? "تم تحديث بيانات المالك بنجاح" : "تم إضافة المالك بنجاح",
      });
      
      setDialogOpen(false);
      resetForm();
      fetchOwners(); // Refresh list
    } catch (error) {
      console.error('Error saving owner:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ بيانات المالك",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit owner
  const handleEdit = (owner: PropertyOwner) => {
    setEditingOwner(owner);
    setFormData({
      full_name: owner.full_name,
      phone: owner.phone,
      email: owner.email,
      birth_date: owner.birth_date ? new Date(owner.birth_date) : undefined,
      nationality: owner.nationality,
      id_passport_number: owner.id_passport_number,
      mailing_address: owner.mailing_address,
      preferred_contact_method: owner.preferred_contact_method,
      preferred_language: owner.preferred_language,
      internal_notes: owner.internal_notes,
      status: owner.status
    });
    setDialogOpen(true);
  };

  // WhatsApp message
  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Set Arabic font (you might need to add Arabic font support)
    doc.setFont('helvetica', 'normal');
    
    // Title
    doc.setFontSize(16);
    doc.text('Property Owners Report', 20, 20);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Table headers
    const headers = ['Name', 'Phone', 'Email', 'Nationality', 'Status'];
    const data = filteredOwners.map(owner => [
      owner.full_name,
      owner.phone,
      owner.email,
      owner.nationality,
      owner.status
    ]);
    
    // Add table (simplified - you might want to use jsPDF-autotable for better formatting)
    let yPos = 50;
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * 35), yPos);
    });
    
    data.forEach((row, rowIndex) => {
      yPos += 10;
      row.forEach((cell, cellIndex) => {
        doc.text(cell, 20 + (cellIndex * 35), yPos);
      });
    });
    
    doc.save('property-owners.pdf');
  };

  // Export to Excel
  const exportToExcel = () => {
    const wsData = [
      ['الاسم الكامل', 'رقم الهاتف', 'البريد الإلكتروني', 'الجنسية', 'الحالة', 'تاريخ الإنشاء'],
      ...filteredOwners.map(owner => [
        owner.full_name,
        owner.phone,
        owner.email,
        owner.nationality,
        owner.status === 'active' ? 'نشط' : 'غير نشط',
        new Date(owner.created_at).toLocaleDateString('ar-AE')
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Property Owners');
    XLSX.writeFile(wb, 'property-owners.xlsx');
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        نشط
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        غير نشط
      </Badge>
    );
  };

  // Filtered owners
  const filteredOwners = owners.filter(owner =>
    owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.phone.includes(searchTerm) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-tajawal" dir="rtl">
      <div className="container mx-auto p-6">
        {/* Header */}
        <Card className="mb-6 border-t-4 border-t-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-500" />
                  إدارة الملاك
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  قائمة بجميع ملاك العقارات المسجلين في النظام
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مالك جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      {editingOwner ? 'تعديل بيانات المالك' : 'إضافة مالك جديد'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingOwner ? 'تحديث معلومات المالك الحالية' : 'إدخال بيانات المالك الجديد'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* البيانات الأساسية */}
                    <Card className="shadow-sm">
                      <CardHeader className="bg-blue-50/50">
                        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                          البيانات الأساسية
                        </CardTitle>
                        <CardDescription>الحقول المطلوبة للمالك</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-gray-700 flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-500" />
                              الاسم الكامل *
                            </Label>
                            <Input
                              id="full_name"
                              value={formData.full_name}
                              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                              placeholder="أدخل الاسم الكامل"
                              className="border-gray-300 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-gray-700 flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-500" />
                              رقم الهاتف *
                            </Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="+971 50 123 4567"
                              className="border-gray-300 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-500" />
                              البريد الإلكتروني *
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              placeholder="owner@example.com"
                              className="border-gray-300 focus:border-blue-500"
                              required
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* البيانات الإضافية */}
                    <Card className="shadow-sm">
                      <CardHeader className="bg-gray-50/50">
                        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                          <IdCard className="h-5 w-5 text-gray-500" />
                          البيانات الإضافية
                        </CardTitle>
                        <CardDescription>معلومات تفصيلية عن المالك (اختيارية)</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* تاريخ الميلاد */}
                          <div className="space-y-2">
                            <Label className="text-gray-700 flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-500" />
                              تاريخ الميلاد
                            </Label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-right font-normal border-gray-300",
                                    !formData.birth_date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="ml-2 h-4 w-4" />
                                  {formData.birth_date ? (
                                    format(formData.birth_date, "PPP", { locale: ar })
                                  ) : (
                                    <span>اختر التاريخ</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={formData.birth_date}
                                  onSelect={(date) => {
                                    setFormData({...formData, birth_date: date});
                                    setCalendarOpen(false);
                                  }}
                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* الجنسية */}
                          <div className="space-y-2">
                            <Label className="text-gray-700 flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-500" />
                              الجنسية
                            </Label>
                            <Select value={formData.nationality} onValueChange={(value) => setFormData({...formData, nationality: value})}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="اختر الجنسية" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ae">الإمارات العربية المتحدة</SelectItem>
                                <SelectItem value="sa">السعودية</SelectItem>
                                <SelectItem value="eg">مصر</SelectItem>
                                <SelectItem value="jo">الأردن</SelectItem>
                                <SelectItem value="lb">لبنان</SelectItem>
                                <SelectItem value="sy">سوريا</SelectItem>
                                <SelectItem value="iq">العراق</SelectItem>
                                <SelectItem value="kw">الكويت</SelectItem>
                                <SelectItem value="qa">قطر</SelectItem>
                                <SelectItem value="bh">البحرين</SelectItem>
                                <SelectItem value="om">عمان</SelectItem>
                                <SelectItem value="pk">باكستان</SelectItem>
                                <SelectItem value="in">الهند</SelectItem>
                                <SelectItem value="bd">بنغلاديش</SelectItem>
                                <SelectItem value="other">أخرى</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* رقم الهوية/جواز السفر */}
                          <div className="space-y-2">
                            <Label htmlFor="id_passport" className="text-gray-700 flex items-center gap-2">
                              <IdCard className="h-4 w-4 text-gray-500" />
                              رقم الهوية/جواز السفر
                            </Label>
                            <Input
                              id="id_passport"
                              value={formData.id_passport_number}
                              onChange={(e) => setFormData({...formData, id_passport_number: e.target.value})}
                              placeholder="784-1985-1234567-8"
                              className="border-gray-300 focus:border-blue-500"
                            />
                          </div>

                          {/* طريقة التواصل المفضلة */}
                          <div className="space-y-2">
                            <Label className="text-gray-700 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-500" />
                              طريقة التواصل المفضلة
                            </Label>
                            <Select value={formData.preferred_contact_method} onValueChange={(value) => setFormData({...formData, preferred_contact_method: value})}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="whatsapp">واتساب</SelectItem>
                                <SelectItem value="email">البريد الإلكتروني</SelectItem>
                                <SelectItem value="sms">رسائل نصية</SelectItem>
                                <SelectItem value="call">مكالمة هاتفية</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* لغة التواصل */}
                          <div className="space-y-2">
                            <Label className="text-gray-700 flex items-center gap-2">
                              <Languages className="h-4 w-4 text-gray-500" />
                              لغة التواصل
                            </Label>
                            <Select value={formData.preferred_language} onValueChange={(value) => setFormData({...formData, preferred_language: value})}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ar">العربية</SelectItem>
                                <SelectItem value="en">الإنجليزية</SelectItem>
                                <SelectItem value="hi">الهندية</SelectItem>
                                <SelectItem value="ur">الأردية</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* حالة المالك */}
                          <div className="space-y-2">
                            <Label className="text-gray-700 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-gray-500" />
                              حالة المالك
                            </Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">نشط</SelectItem>
                                <SelectItem value="inactive">غير نشط</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* عنوان المراسلة */}
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="mailing_address" className="text-gray-700 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              عنوان المراسلة
                            </Label>
                            <Textarea
                              id="mailing_address"
                              value={formData.mailing_address}
                              onChange={(e) => setFormData({...formData, mailing_address: e.target.value})}
                              placeholder="أدخل العنوان الكامل للمراسلة"
                              rows={3}
                              className="border-gray-300 focus:border-blue-500 resize-none"
                            />
                          </div>

                          {/* الملاحظات الداخلية */}
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="internal_notes" className="text-gray-700 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              الملاحظات الداخلية
                            </Label>
                            <Textarea
                              id="internal_notes"
                              value={formData.internal_notes}
                              onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
                              placeholder="ملاحظات داخلية حول المالك..."
                              rows={4}
                              className="border-gray-300 focus:border-blue-500 resize-none"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* أزرار التحكم */}
                    <div className="flex gap-4 justify-end pt-6">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                        className="px-8 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 ml-2" />
                        {loading ? 'جاري الحفظ...' : editingOwner ? 'تحديث المالك' : 'حفظ المالك'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Search and Export */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              البحث والتصدير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="البحث بالاسم أو رقم الهاتف أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={exportToPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تصدير PDF
              </Button>
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تصدير Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Owners List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              قائمة الملاك ({filteredOwners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">جاري تحميل البيانات...</p>
              </div>
            ) : filteredOwners.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد بيانات ملاك</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم الكامل</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الجنسية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-medium">{owner.full_name}</TableCell>
                      <TableCell>{owner.phone}</TableCell>
                      <TableCell>{owner.email}</TableCell>
                      <TableCell>{owner.nationality}</TableCell>
                      <TableCell>{getStatusBadge(owner.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(owner)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsApp(owner.phone)}
                            className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <MessageCircle className="h-3 w-3" />
                            واتساب
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
      </div>
    </div>
  );
};

export default PropertyOwners;