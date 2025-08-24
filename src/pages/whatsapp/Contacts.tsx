// WhatsApp Contacts Management Page
// صفحة إدارة جهات الاتصال في واتساب

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceService } from '@/services/performanceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  MessageSquare,
  Phone,
  Mail,
  Building2,
  Tag,
  Filter,
  Download,
  Upload,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { contactSyncService } from '@/services/contactSyncService';
import { CreateContactForm, WhatsAppContact } from '@/types/whatsapp';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function WhatsAppContacts() {
  // قياس أداء تحميل الصفحة
  const performanceMeasure = useMemo(() => {
    return performanceService.measurePageLoad('WhatsApp Contacts');
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState<'all' | 'owner' | 'marketer' | 'client'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [formData, setFormData] = useState<CreateContactForm>({
    name: '',
    phone: '',
    whatsapp_number: '',
    contact_type: 'client',
    email: '',
    company: '',
    notes: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const queryClient = useQueryClient();

  // تحميل جهات الاتصال
  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['whatsapp-contacts'],
    queryFn: () => whatsappService.getContacts()
  });

  // إضافة جهة اتصال جديدة
  const addContactMutation = useMutation({
    mutationFn: (contactData: CreateContactForm) => {
      console.log('🚀 [ContactPage] Starting contact creation:', contactData);
      return whatsappService.createContact(contactData);
    },
    onSuccess: async (data) => {
      console.log('✅ [ContactPage] Contact created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
      
      // مزامنة مع الوحدات الأخرى حسب نوع جهة الاتصال
      try {
        if (data.contact_type === 'marketer') {
          await contactSyncService.syncWhatsAppToBroker(data);
          toast.success('تم إضافة جهة الاتصال ومزامنتها مع الوسطاء');
        } else if (data.contact_type === 'client') {
          if (data.tags?.includes('مستأجر')) {
            await contactSyncService.syncWhatsAppToTenant(data);
            toast.success('تم إضافة جهة الاتصال ومزامنتها مع المستأجرين');
          } else {
            await contactSyncService.syncWhatsAppToClient(data);
            toast.success('تم إضافة جهة الاتصال ومزامنتها مع العملاء');
          }
        } else if (data.contact_type === 'owner') {
          await contactSyncService.syncWhatsAppToOwner(data);
          toast.success('تم إضافة جهة الاتصال ومزامنتها مع الملاك');
        } else {
          toast.success('تم إضافة جهة الاتصال بنجاح');
        }
      } catch (error) {
        toast.success('تم إضافة جهة الاتصال (فشل في المزامنة)');
      }
      
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ [ContactPage] Contact creation failed:', error);
      toast.error(error.message || 'فشل في إضافة جهة الاتصال');
    }
  });

  // تحديث جهة اتصال
  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactForm> }) => 
      whatsappService.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
      toast.success('تم تحديث جهة الاتصال بنجاح');
      setIsEditDialogOpen(false);
      setSelectedContact(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في تحديث جهة الاتصال');
    }
  });

  // حذف جهة اتصال
  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => whatsappService.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] });
      toast.success('تم حذف جهة الاتصال بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في حذف جهة الاتصال');
    }
  });

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      whatsapp_number: '',
      contact_type: 'client',
      email: '',
      company: '',
      notes: '',
      tags: []
    });
    setTagInput('');
  };

  // إضافة تاج
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // حذف تاج
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // فتح نموذج التعديل
  const openEditDialog = (contact: WhatsAppContact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      whatsapp_number: contact.whatsapp_number || '',
      contact_type: contact.contact_type,
      email: contact.email || '',
      company: contact.company || '',
      notes: contact.notes || '',
      tags: contact.tags || []
    });
    setIsEditDialogOpen(true);
  };

  // إرسال النموذج
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    if (selectedContact) {
      updateContactMutation.mutate({ 
        id: selectedContact.id, 
        data: formData 
      });
    } else {
      addContactMutation.mutate(formData);
    }
  };

  // تصفية جهات الاتصال
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = contactTypeFilter === 'all' || contact.contact_type === contactTypeFilter;

    return matchesSearch && matchesType;
  });

  // إحصائيات
  const stats = {
    total: contacts.length,
    owners: contacts.filter(c => c.contact_type === 'owner').length,
    marketers: contacts.filter(c => c.contact_type === 'marketer').length,
    clients: contacts.filter(c => c.contact_type === 'client').length
  };

  // نوع جهة الاتصال
  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'owner': return 'مالك';
      case 'marketer': return 'مسوق';
      case 'client': return 'عميل';
      default: return type;
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'owner': return 'bg-green-100 text-green-800';
      case 'marketer': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>فشل في تحميل جهات الاتصال</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-contacts'] })}
                className="mt-2"
              >
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* العنوان والإحصائيات */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">جهات الاتصال</h1>
            <p className="text-gray-600">إدارة جهات الاتصال في واتساب</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* أزرار الإجراءات */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/whatsapp/contact-deduplication', '_blank')}
            >
              <Users className="h-4 w-4 mr-2" />
              إدارة التكرار
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              استيراد
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
            
            {/* زر إضافة جهة اتصال جديدة */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة وسيط جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إضافة وسيط جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {/* الاسم الكامل */}
                    <div>
                      <Label htmlFor="name">الاسم الكامل *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="أدخل الاسم الكامل"
                        required
                      />
                    </div>

                    {/* رقم الهاتف */}
                    <div>
                      <Label htmlFor="phone">رقم الهاتف *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="مثال: +971501234567"
                        required
                      />
                    </div>

                    {/* رقم الواتساب */}
                    <div>
                      <Label htmlFor="whatsapp_number">رقم الواتساب</Label>
                      <Input
                        id="whatsapp_number"
                        value={formData.whatsapp_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                        placeholder="إذا كان مختلف عن رقم الهاتف"
                      />
                    </div>

                    {/* نوع جهة الاتصال */}
                    <div>
                      <Label htmlFor="contact_type">نوع جهة الاتصال</Label>
                      <Select 
                        value={formData.contact_type} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, contact_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">عميل</SelectItem>
                          <SelectItem value="marketer">مسوق</SelectItem>
                          <SelectItem value="owner">مالك</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* البريد الإلكتروني */}
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@domain.com"
                      />
                    </div>

                    {/* الشركة */}
                    <div>
                      <Label htmlFor="company">الشركة</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="اسم الشركة"
                      />
                    </div>

                    {/* التاجز */}
                    <div>
                      <Label>التاجز</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="أضف تاج"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          إضافة
                        </Button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* الملاحظات */}
                    <div>
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="ملاحظات إضافية"
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addContactMutation.isPending}
                    >
                      {addContactMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          جاري الإضافة...
                        </div>
                      ) : (
                        'إضافة وسيط'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600">إجمالي جهات الاتصال</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.owners}</p>
                  <p className="text-sm text-gray-600">ملاك</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.marketers}</p>
                  <p className="text-sm text-gray-600">مسوقين</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.clients}</p>
                  <p className="text-sm text-gray-600">عملاء</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* الفلاتر والبحث */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* البحث */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في جهات الاتصال..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* فلتر نوع جهة الاتصال */}
            <div className="w-full md:w-48">
              <Select value={contactTypeFilter} onValueChange={(value: any) => setContactTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="client">عملاء</SelectItem>
                  <SelectItem value="marketer">مسوقين</SelectItem>
                  <SelectItem value="owner">ملاك</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة جهات الاتصال */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">جاري تحميل جهات الاتصال...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">لا توجد جهات اتصال</p>
              <p className="text-gray-400 text-sm">ابدأ بإضافة جهة اتصال جديدة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      جهة الاتصال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      معلومات الاتصال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاجز
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contact.name}
                          </div>
                          {contact.company && (
                            <div className="text-sm text-gray-500">
                              {contact.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-3 w-3 mr-2" />
                            {contact.phone}
                          </div>
                          {contact.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-3 w-3 mr-2" />
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getContactTypeColor(contact.contact_type)}>
                          {getContactTypeLabel(contact.contact_type)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags && contact.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) {
                                deleteContactMutation.mutate(contact.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نموذج التعديل */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل جهة الاتصال</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* نفس الحقول كما في نموذج الإضافة */}
              <div>
                <Label htmlFor="edit_name">الاسم الكامل *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل الاسم الكامل"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_phone">رقم الهاتف *</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="مثال: +971501234567"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_whatsapp_number">رقم الواتساب</Label>
                <Input
                  id="edit_whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  placeholder="إذا كان مختلف عن رقم الهاتف"
                />
              </div>

              <div>
                <Label htmlFor="edit_contact_type">نوع جهة الاتصال</Label>
                <Select 
                  value={formData.contact_type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, contact_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">عميل</SelectItem>
                    <SelectItem value="marketer">مسوق</SelectItem>
                    <SelectItem value="owner">مالك</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_email">البريد الإلكتروني</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@domain.com"
                />
              </div>

              <div>
                <Label htmlFor="edit_company">الشركة</Label>
                <Input
                  id="edit_company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="اسم الشركة"
                />
              </div>

              <div>
                <Label>التاجز</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="أضف تاج"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    إضافة
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit_notes">ملاحظات</Label>
                <Textarea
                  id="edit_notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedContact(null);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={updateContactMutation.isPending}
              >
                {updateContactMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري التحديث...
                  </div>
                ) : (
                  'تحديث'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}