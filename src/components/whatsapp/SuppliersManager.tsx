import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Clock
} from 'lucide-react';

interface ExternalSupplier {
  id: string;
  name: string;
  shortName: string;
  phone: string;
  email?: string;
  company: string;
  category: 'real_estate' | 'construction' | 'maintenance' | 'cleaning' | 'security' | 'other';
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  lastContact?: string;
  nextContact?: string;
  notes?: string;
  address?: string;
  whatsappEnabled: boolean;
  autoMessageEnabled: boolean;
  messageTemplate?: string;
  contactFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastMessageSent?: string;
  messageCount: number;
  responseRate: number;
}

export default function SuppliersManager() {
  const [suppliers, setSuppliers] = useState<ExternalSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ExternalSupplier | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  // نموذج إنشاء/تعديل المورد
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    shortName: '',
    phone: '',
    email: '',
    company: '',
    category: 'other' as ExternalSupplier['category'],
    notes: '',
    address: '',
    whatsappEnabled: true,
    autoMessageEnabled: false,
    messageTemplate: '',
    contactFrequency: 'monthly' as ExternalSupplier['contactFrequency']
  });

  useEffect(() => {
      loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setIsLoading(true);
    // محاكاة جلب البيانات
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockSuppliers: ExternalSupplier[] = [
      {
        id: '1',
        name: 'شركة البناء المتقدمة',
        shortName: 'بناء متقدم',
        phone: '+971501234567',
        email: 'info@advancedbuilding.ae',
        company: 'شركة البناء المتقدمة',
        category: 'construction',
        status: 'active',
        rating: 4.5,
        lastContact: '2024-01-10T10:00:00',
        nextContact: '2024-01-20T10:00:00',
        notes: 'مورد موثوق للخدمات الإنشائية',
        address: 'دبي، الإمارات العربية المتحدة',
        whatsappEnabled: true,
        autoMessageEnabled: true,
        messageTemplate: 'مرحباً! نود التواصل معكم بخصوص مشاريعنا الجديدة',
        contactFrequency: 'monthly',
        lastMessageSent: '2024-01-10T10:00:00',
        messageCount: 15,
        responseRate: 85
      },
      {
        id: '2',
        name: 'خدمات الصيانة السريعة',
        shortName: 'صيانة سريعة',
        phone: '+971507654321',
        email: 'service@quickmaintenance.ae',
        company: 'خدمات الصيانة السريعة',
        category: 'maintenance',
        status: 'active',
        rating: 4.2,
        lastContact: '2024-01-12T14:00:00',
        nextContact: '2024-01-26T14:00:00',
        notes: 'خدمات صيانة سريعة وموثوقة',
        address: 'أبو ظبي، الإمارات العربية المتحدة',
        whatsappEnabled: true,
        autoMessageEnabled: false,
        messageTemplate: '',
        contactFrequency: 'weekly',
        lastMessageSent: '2024-01-12T14:00:00',
        messageCount: 8,
        responseRate: 75
      },
      {
        id: '3',
        name: 'شركة النظافة العالمية',
        shortName: 'نظافة عالمية',
        phone: '+971509876543',
        email: 'clean@globalcleaning.ae',
        company: 'شركة النظافة العالمية',
        category: 'cleaning',
        status: 'pending',
        rating: 0,
        notes: 'مورد جديد - تحتاج مراجعة',
        address: 'الشارقة، الإمارات العربية المتحدة',
        whatsappEnabled: false,
        autoMessageEnabled: false,
        messageTemplate: '',
        contactFrequency: 'monthly',
        messageCount: 0,
        responseRate: 0
      }
    ];
    
    setSuppliers(mockSuppliers);
    setIsLoading(false);
  };

  const handleCreateSupplier = () => {
    const newSupplier: ExternalSupplier = {
      id: Date.now().toString(),
      ...supplierForm,
      status: 'pending',
      rating: 0,
      messageCount: 0,
      responseRate: 0
    };
    
    setSuppliers([...suppliers, newSupplier]);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEditSupplier = () => {
    if (!editingSupplier) return;
    
    const updatedSuppliers = suppliers.map(supplier => 
            supplier.id === editingSupplier.id 
              ? { ...supplier, ...supplierForm }
              : supplier
    );
    
    setSuppliers(updatedSuppliers);
    setEditingSupplier(null);
    resetForm();
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter(supplier => supplier.id !== supplierId));
  };

  const handleStatusChange = (supplierId: string, newStatus: ExternalSupplier['status']) => {
    setSuppliers(suppliers.map(supplier => 
      supplier.id === supplierId ? { ...supplier, status: newStatus } : supplier
    ));
  };

  const handleBulkMessage = () => {
    if (selectedSuppliers.length === 0) return;
    // هنا يمكن إضافة منطق إرسال الرسائل الجماعية
    console.log('إرسال رسائل إلى:', selectedSuppliers);
  };

  const resetForm = () => {
      setSupplierForm({
        name: '',
      shortName: '',
        phone: '',
      email: '',
      company: '',
      category: 'other',
        notes: '',
      address: '',
      whatsappEnabled: true,
      autoMessageEnabled: false,
      messageTemplate: '',
      contactFrequency: 'monthly'
    });
  };

  const openEditDialog = (supplier: ExternalSupplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      shortName: supplier.shortName,
      phone: supplier.phone,
      email: supplier.email || '',
      company: supplier.company,
      category: supplier.category,
      notes: supplier.notes || '',
      address: supplier.address || '',
      whatsappEnabled: supplier.whatsappEnabled,
      autoMessageEnabled: supplier.autoMessageEnabled,
      messageTemplate: supplier.messageTemplate || '',
      contactFrequency: supplier.contactFrequency
    });
  };

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || supplier.category === filterCategory;
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.phone.includes(searchQuery);
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'real_estate': return 'bg-blue-100 text-blue-800';
      case 'construction': return 'bg-orange-100 text-orange-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      case 'cleaning': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'real_estate': return 'عقارات';
      case 'construction': return 'بناء';
      case 'maintenance': return 'صيانة';
      case 'cleaning': return 'نظافة';
      case 'security': return 'أمن';
      default: return 'أخرى';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط الأدوات */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
            <Input
            placeholder="البحث في الموردين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
            />
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
              <SelectValue placeholder="حالة المورد" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              </SelectContent>
            </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
              <SelectValue placeholder="فئة المورد" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              <SelectItem value="real_estate">عقارات</SelectItem>
              <SelectItem value="construction">بناء</SelectItem>
              <SelectItem value="maintenance">صيانة</SelectItem>
              <SelectItem value="cleaning">نظافة</SelectItem>
              <SelectItem value="security">أمن</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

        <div className="flex items-center gap-2">
          {selectedSuppliers.length > 0 && (
            <Button variant="outline" onClick={handleBulkMessage}>
              <MessageSquare className="h-4 w-4 ml-2" />
              رسالة جماعية ({selectedSuppliers.length})
                        </Button>
          )}

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                مورد جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
          <DialogHeader>
                <DialogTitle>إضافة مورد خارجي جديد</DialogTitle>
                <DialogDescription>
                  قم بإضافة مورد جديد لإدارة التواصل معه
                </DialogDescription>
          </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المورد</Label>
              <Input
                    id="name"
                value={supplierForm.name}
                    onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                    placeholder="أدخل اسم المورد"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortName">الاسم المختصر</Label>
                  <Input
                    id="shortName"
                    value={supplierForm.shortName}
                    onChange={(e) => setSupplierForm({...supplierForm, shortName: e.target.value})}
                    placeholder="أدخل الاسم المختصر"
              />
            </div>
            
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                    id="phone"
                value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                    placeholder="+971501234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                    placeholder="example@email.com"
              />
            </div>
            
                <div className="space-y-2">
                  <Label htmlFor="company">اسم الشركة</Label>
              <Input
                    id="company"
                    value={supplierForm.company}
                    onChange={(e) => setSupplierForm({...supplierForm, company: e.target.value})}
                    placeholder="أدخل اسم الشركة"
              />
            </div>
            
                <div className="space-y-2">
                  <Label htmlFor="category">فئة المورد</Label>
                  <Select value={supplierForm.category} onValueChange={(value: any) => setSupplierForm({...supplierForm, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="real_estate">عقارات</SelectItem>
                      <SelectItem value="construction">بناء</SelectItem>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                      <SelectItem value="cleaning">نظافة</SelectItem>
                      <SelectItem value="security">أمن</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                  placeholder="أدخل العنوان"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})}
                  placeholder="أدخل ملاحظات إضافية"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="whatsappEnabled"
                    checked={supplierForm.whatsappEnabled}
                    onCheckedChange={(checked) => setSupplierForm({...supplierForm, whatsappEnabled: checked})}
                  />
                  <Label htmlFor="whatsappEnabled">تفعيل الواتساب</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="autoMessageEnabled"
                    checked={supplierForm.autoMessageEnabled}
                    onCheckedChange={(checked) => setSupplierForm({...supplierForm, autoMessageEnabled: checked})}
                  />
                  <Label htmlFor="autoMessageEnabled">تفعيل الرسائل التلقائية</Label>
                </div>

                {supplierForm.autoMessageEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="messageTemplate">قالب الرسالة التلقائية</Label>
                      <Textarea
                        id="messageTemplate"
                        value={supplierForm.messageTemplate}
                        onChange={(e) => setSupplierForm({...supplierForm, messageTemplate: e.target.value})}
                        placeholder="أدخل قالب الرسالة التلقائية"
                        rows={3}
                      />
            </div>
            
                    <div className="space-y-2">
                      <Label htmlFor="contactFrequency">تكرار التواصل</Label>
                      <Select value={supplierForm.contactFrequency} onValueChange={(value: any) => setSupplierForm({...supplierForm, contactFrequency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                          <SelectItem value="daily">يومياً</SelectItem>
                          <SelectItem value="weekly">أسبوعياً</SelectItem>
                          <SelectItem value="monthly">شهرياً</SelectItem>
                          <SelectItem value="quarterly">ربع سنوياً</SelectItem>
                </SelectContent>
              </Select>
            </div>
                  </>
                )}
            </div>
            
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                إلغاء
              </Button>
                <Button onClick={handleCreateSupplier}>
                  إضافة المورد
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* قائمة الموردين */}
      <div className="space-y-4">
        {filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              لا يوجد موردين تطابق معايير البحث
            </CardContent>
          </Card>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.includes(supplier.id)}
                      onChange={() => toggleSupplierSelection(supplier.id)}
                      className="mt-2"
                    />
                    
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="h-4 w-4" />
                    </div>
                    
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{supplier.company}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(supplier.status)}>
                          {supplier.status === 'active' && 'نشط'}
                          {supplier.status === 'inactive' && 'غير نشط'}
                          {supplier.status === 'pending' && 'في الانتظار'}
                        </Badge>
                        <Badge className={getCategoryColor(supplier.category)}>
                          {getCategoryText(supplier.category)}
                        </Badge>
                        {supplier.rating > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {supplier.rating}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{supplier.phone}</span>
                    </div>
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{supplier.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">آخر تواصل: </span>
                      <span className="font-medium">
                        {supplier.lastContact 
                          ? new Date(supplier.lastContact).toLocaleDateString('ar-SA')
                          : 'لم يتم التواصل بعد'
                        }
                      </span>
                    </div>
                    {supplier.nextContact && (
                      <div className="text-sm text-muted-foreground">
                        التواصل التالي: {new Date(supplier.nextContact).toLocaleDateString('ar-SA')}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">تكرار التواصل: </span>
                      <span className="font-medium">
                        {supplier.contactFrequency === 'daily' && 'يومياً'}
                        {supplier.contactFrequency === 'weekly' && 'أسبوعياً'}
                        {supplier.contactFrequency === 'monthly' && 'شهرياً'}
                        {supplier.contactFrequency === 'quarterly' && 'ربع سنوياً'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">إحصائيات الواتساب:</span>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          <span>{supplier.messageCount} رسالة</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>{supplier.responseRate}% معدل استجابة</span>
                        </div>
                        {supplier.lastMessageSent && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>آخر رسالة: {new Date(supplier.lastMessageSent).toLocaleDateString('ar-SA')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {supplier.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">ملاحظات: </span>
                      <span>{supplier.notes}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(supplier.id, 'active')}
                    disabled={supplier.status === 'active'}
                  >
                    <CheckCircle className="h-4 w-4 ml-2" />
                    تفعيل
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(supplier.id, 'inactive')}
                    disabled={supplier.status === 'inactive'}
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    إلغاء التفعيل
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!supplier.whatsappEnabled}
                  >
                    <Send className="h-4 w-4 ml-2" />
                    إرسال رسالة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* إحصائيات سريعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ملخص الموردين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي الموردين</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {suppliers.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">نشط</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {suppliers.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">في الانتظار</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {suppliers.filter(s => s.status === 'inactive').length}
              </div>
              <div className="text-sm text-muted-foreground">غير نشط</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
