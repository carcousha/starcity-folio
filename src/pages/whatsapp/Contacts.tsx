// WhatsApp Contacts Management Component
// صفحة إدارة جهات الاتصال

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  Calendar,
  MessageSquare,
  Upload,
  Download,
  UserPlus,
  UserMinus,
  Tag,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Import services and types
import { whatsappService } from '@/services/whatsappService';
import {
  WhatsAppContact,
  CreateContactForm,
  ContactsFilter,
  ContactType
} from '@/types/whatsapp';

interface ContactsState {
  contacts: WhatsAppContact[];
  filteredContacts: WhatsAppContact[];
  selectedContacts: Set<string>;
  isLoading: boolean;
  searchTerm: string;
  filter: ContactsFilter;
  showAddDialog: boolean;
  showEditDialog: boolean;
  editingContact: WhatsAppContact | null;
  newContact: CreateContactForm;
}

const initialNewContact: CreateContactForm = {
  name: '',
  phone: '',
  whatsapp_number: '',
  contact_type: 'client',
  email: '',
  company: '',
  notes: '',
  tags: []
};

export default function WhatsAppContacts() {
  const [state, setState] = useState<ContactsState>({
    contacts: [],
    filteredContacts: [],
    selectedContacts: new Set(),
    isLoading: false,
    searchTerm: '',
    filter: { contact_type: 'all', is_active: true },
    showAddDialog: false,
    showEditDialog: false,
    editingContact: null,
    newContact: { ...initialNewContact }
  });

  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [state.contacts, state.searchTerm, state.filter]);

  const updateState = (updates: Partial<ContactsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const loadContacts = async () => {
    try {
      updateState({ isLoading: true });
      const contactsData = await whatsappService.getContacts(state.filter);
      updateState({ contacts: contactsData });
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل جهات الاتصال",
        variant: "destructive"
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const applyFilters = () => {
    let filtered = [...state.contacts];

    // البحث
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.phone.includes(state.searchTerm) ||
        (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower))
      );
    }

    // فلتر نوع جهة الاتصال
    if (state.filter.contact_type && state.filter.contact_type !== 'all') {
      filtered = filtered.filter(contact => contact.contact_type === state.filter.contact_type);
    }

    // فلتر الحالة النشطة
    if (typeof state.filter.is_active === 'boolean') {
      filtered = filtered.filter(contact => contact.is_active === state.filter.is_active);
    }

    updateState({ filteredContacts: filtered });
  };

  const handleCreateContact = async () => {
    try {
      const validation = whatsappService.validatePhoneNumber(state.newContact.phone);
      if (!validation.isValid) {
        toast({
          title: "خطأ في البيانات",
          description: validation.errors.join('، '),
          variant: "destructive"
        });
        return;
      }

      await whatsappService.createContact(state.newContact);
      
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة جهة الاتصال بنجاح",
        variant: "default"
      });

      updateState({
        showAddDialog: false,
        newContact: { ...initialNewContact }
      });

      loadContacts();
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "فشل في إضافة جهة الاتصال",
        variant: "destructive"
      });
    }
  };

  const handleUpdateContact = async () => {
    if (!state.editingContact) return;

    try {
      await whatsappService.updateContact(state.editingContact.id, state.newContact);
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات جهة الاتصال",
        variant: "default"
      });

      updateState({
        showEditDialog: false,
        editingContact: null,
        newContact: { ...initialNewContact }
      });

      loadContacts();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث جهة الاتصال",
        variant: "destructive"
      });
    }
  };

  const handleDeleteContact = async (contact: WhatsAppContact) => {
    if (!confirm(`هل أنت متأكد من حذف ${contact.name}؟`)) return;

    try {
      await whatsappService.deleteContact(contact.id);
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف جهة الاتصال",
        variant: "default"
      });

      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف جهة الاتصال",
        variant: "destructive"
      });
    }
  };

  const startEditContact = (contact: WhatsAppContact) => {
    updateState({
      editingContact: contact,
      newContact: {
        name: contact.name,
        phone: contact.phone,
        whatsapp_number: contact.whatsapp_number || '',
        contact_type: contact.contact_type,
        email: contact.email || '',
        company: contact.company || '',
        notes: contact.notes || '',
        tags: contact.tags || []
      },
      showEditDialog: true
    });
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(state.selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    updateState({ selectedContacts: newSelected });
  };

  const selectAllContacts = () => {
    const allIds = new Set(state.filteredContacts.map(c => c.id));
    updateState({ selectedContacts: allIds });
  };

  const clearSelection = () => {
    updateState({ selectedContacts: new Set() });
  };

  const getContactTypeLabel = (type: ContactType) => {
    const labels = {
      'owner': 'مالك',
      'marketer': 'مسوق',
      'client': 'عميل'
    };
    return labels[type];
  };

  const getContactTypeBadge = (type: ContactType) => {
    const typeMap = {
      'owner': 'bg-blue-100 text-blue-800',
      'marketer': 'bg-green-100 text-green-800',
      'client': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={typeMap[type]}>
        {getContactTypeLabel(type)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastContacted = (dateString?: string) => {
    if (!dateString) return 'لم يتم التواصل';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">جهات الاتصال</h2>
          <p className="text-gray-600">إدارة جهات اتصال الواتساب</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button onClick={() => updateState({ showAddDialog: true })}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة جهة اتصال
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Upload className="ml-2 h-4 w-4" />
                استيراد من ملف
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="ml-2 h-4 w-4" />
                تصدير إلى ملف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في جهات الاتصال..."
                value={state.searchTerm}
                onChange={(e) => updateState({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* فلتر نوع جهة الاتصال */}
            <Select
              value={state.filter.contact_type || 'all'}
              onValueChange={(value) => updateState({
                filter: { ...state.filter, contact_type: value as any }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع جهة الاتصال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="owner">الملاك</SelectItem>
                <SelectItem value="marketer">المسوقين</SelectItem>
                <SelectItem value="client">العملاء</SelectItem>
              </SelectContent>
            </Select>

            {/* فلتر الحالة */}
            <Select
              value={state.filter.is_active === undefined ? 'all' : state.filter.is_active.toString()}
              onValueChange={(value) => updateState({
                filter: { 
                  ...state.filter, 
                  is_active: value === 'all' ? undefined : value === 'true'
                }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="true">نشط</SelectItem>
                <SelectItem value="false">غير نشط</SelectItem>
              </SelectContent>
            </Select>

            {/* إعادة تحميل */}
            <Button onClick={loadContacts} variant="outline" disabled={state.isLoading}>
              {state.isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="ml-2 h-4 w-4" />
              )}
              إعادة تحميل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {state.selectedContacts.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className="font-medium">
                  تم اختيار {state.selectedContacts.size} جهة اتصال
                </span>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  إلغاء التحديد
                </Button>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button size="sm" variant="outline">
                  <MessageSquare className="ml-2 h-4 w-4" />
                  إرسال رسالة
                </Button>
                <Button size="sm" variant="outline">
                  <Tag className="ml-2 h-4 w-4" />
                  إضافة تصنيف
                </Button>
                <Button size="sm" variant="outline">
                  <UserMinus className="ml-2 h-4 w-4" />
                  إلغاء تنشيط
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="ml-2 h-5 w-5" />
              قائمة جهات الاتصال ({state.filteredContacts.length})
            </CardTitle>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                checked={state.selectedContacts.size === state.filteredContacts.length && state.filteredContacts.length > 0}
                onCheckedChange={(checked) => checked ? selectAllContacts() : clearSelection()}
              />
              <span className="text-sm text-gray-600">تحديد الكل</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {state.isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">جاري تحميل جهات الاتصال...</p>
            </div>
          ) : state.filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد جهات اتصال متطابقة مع البحث</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    state.selectedContacts.has(contact.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Checkbox
                      checked={state.selectedContacts.has(contact.id)}
                      onCheckedChange={() => toggleContactSelection(contact.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 space-x-reverse mb-2">
                        <h3 className="font-medium text-lg">{contact.name}</h3>
                        {getContactTypeBadge(contact.contact_type)}
                        {!contact.is_active && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            غير نشط
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="h-4 w-4" />
                          <span>{contact.phone}</span>
                        </div>
                        
                        {contact.email && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Mail className="h-4 w-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        
                        {contact.company && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Building2 className="h-4 w-4" />
                            <span>{contact.company}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 space-x-reverse mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Calendar className="h-3 w-3" />
                          <span>أضيف: {formatDate(contact.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <MessageSquare className="h-3 w-3" />
                          <span>آخر تواصل: {formatLastContacted(contact.last_contacted)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditContact(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => startEditContact(contact)}>
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="ml-2 h-4 w-4" />
                          إرسال رسالة
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {contact.is_active ? (
                            <>
                              <EyeOff className="ml-2 h-4 w-4" />
                              إلغاء تنشيط
                            </>
                          ) : (
                            <>
                              <Eye className="ml-2 h-4 w-4" />
                              تنشيط
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContact(contact)}
                          className="text-red-600"
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={state.showAddDialog} onOpenChange={(open) => updateState({ showAddDialog: open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة جهة اتصال جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات جهة الاتصال الجديدة
            </DialogDescription>
          </DialogHeader>
          
          <ContactForm
            contact={state.newContact}
            onChange={(updates) => updateState({ newContact: { ...state.newContact, ...updates } })}
            onSubmit={handleCreateContact}
            onCancel={() => updateState({ showAddDialog: false, newContact: { ...initialNewContact } })}
            submitLabel="إضافة"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={state.showEditDialog} onOpenChange={(open) => updateState({ showEditDialog: open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل جهة الاتصال</DialogTitle>
            <DialogDescription>
              تعديل بيانات {state.editingContact?.name}
            </DialogDescription>
          </DialogHeader>
          
          <ContactForm
            contact={state.newContact}
            onChange={(updates) => updateState({ newContact: { ...state.newContact, ...updates } })}
            onSubmit={handleUpdateContact}
            onCancel={() => updateState({ 
              showEditDialog: false, 
              editingContact: null, 
              newContact: { ...initialNewContact } 
            })}
            submitLabel="حفظ التغييرات"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contact Form Component
interface ContactFormProps {
  contact: CreateContactForm;
  onChange: (updates: Partial<CreateContactForm>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}

function ContactForm({ contact, onChange, onSubmit, onCancel, submitLabel }: ContactFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم *</Label>
        <Input
          id="name"
          value={contact.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="اسم جهة الاتصال"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">رقم الهاتف *</Label>
        <Input
          id="phone"
          value={contact.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="971501234567"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp_number">رقم الواتساب (اختياري)</Label>
        <Input
          id="whatsapp_number"
          value={contact.whatsapp_number}
          onChange={(e) => onChange({ whatsapp_number: e.target.value })}
          placeholder="إذا كان مختلف عن رقم الهاتف"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_type">نوع جهة الاتصال *</Label>
        <Select
          value={contact.contact_type}
          onValueChange={(value) => onChange({ contact_type: value as ContactType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">مالك</SelectItem>
            <SelectItem value="marketer">مسوق</SelectItem>
            <SelectItem value="client">عميل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          value={contact.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="example@domain.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">الشركة</Label>
        <Input
          id="company"
          value={contact.company}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="اسم الشركة"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={contact.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="ملاحظات إضافية..."
          rows={3}
        />
      </div>

      <div className="flex space-x-3 space-x-reverse pt-4">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          إلغاء
        </Button>
      </div>
    </form>
  );
}
