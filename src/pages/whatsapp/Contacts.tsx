import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { ContactForm } from '@/components/contacts/ContactForm';
import { useUnifiedContacts, useAutoSync, useContactStats } from '@/hooks/useUnifiedContacts';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  Star, 
  Users, 
  Building, 
  Edit, 
  Trash2,
  Contact,
  Calendar,
  Filter,
  Download,
  Upload,
  UserPlus,
  Settings,
  Eye,
  Activity,
  Tags,
  Clock,
  RefreshCw,
  Database,
  AlertTriangle,
  Table as TableIcon,
  Grid3X3,
  List
} from 'lucide-react';

interface EnhancedContact {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  office?: string;
  bio?: string;
  roles: string[];
  status: 'active' | 'inactive' | 'archived';
  follow_up_status: 'new' | 'contacted' | 'interested' | 'negotiating' | 'closed' | 'lost' | 'inactive';
  rating?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  last_contact_date?: string;
  next_contact_date?: string;
  birthday?: string;
  created_by?: string;
  assigned_to?: string;
  is_duplicate: boolean;
  master_contact_id?: string;
  notes?: string;
  metadata: any;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ContactChannel {
  id: string;
  contact_id: string;
  channel_type: 'phone' | 'whatsapp' | 'email' | 'address' | 'website' | 'social';
  value: string;
  label?: string;
  is_primary: boolean;
  is_verified: boolean;
  is_active: boolean;
  preferred_for_calls: boolean;
  preferred_for_messages: boolean;
  preferred_for_emails: boolean;
}

export default function WhatsAppContacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EnhancedContact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactToDelete, setContactToDelete] = useState<EnhancedContact | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table'); // العرض الافتراضي هو الجدول

  const queryClient = useQueryClient();
  
  // استخدام الخدمة الموحدة الجديدة
  const {
    contacts,
    isLoading,
    syncAll,
    syncClients,
    syncBrokers,
    syncOwners,
    syncTenants,
    isSyncing,
    addContact,
    updateContact,
    deleteContact,
    isAdding,
    isUpdating,
    isDeleting
  } = useUnifiedContacts({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined
  });
  
  // إحصائيات جهات الاتصال
  const stats = useContactStats();
  
  // المزامنة التلقائية عند تحميل الصفحة
  useAutoSync(true);

  // تم استبدال هذا الكود بالخدمة الموحدة أعلاه

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // تم استبدال هذا بالخدمة الموحدة

  // تم استبدال هذا بالخدمة الموحدة

  // تم استبدال هذا بالخدمة الموحدة

  // البحث عن التكرار بناءً على رقم الهاتف
  const findDuplicateByPhone = async (phoneNumber?: string) => {
    if (!phoneNumber) return null;
    
    const { data } = await supabase
      .from('enhanced_contacts')
      .select(`
        *,
        enhanced_contact_channels!inner(*)
      `)
      .eq('enhanced_contact_channels.channel_type', 'phone')
      .eq('enhanced_contact_channels.value', phoneNumber)
      .eq('is_duplicate', false)
      .single();
    
    return data || null;
  };

  const handleFormSubmit = (contactData: any) => {
    if (editingContact) {
      updateContact({ id: editingContact.id, updates: contactData });
    } else {
      addContact(contactData);
    }
    setIsDialogOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = () => {
    if (contactToDelete) {
      deleteContact(contactToDelete.id);
      setContactToDelete(null);
      toast({
        title: "تم حذف جهة الاتصال",
        description: `تم حذف ${contactToDelete.name} بنجاح`,
      });
    }
  };

  const handleEditContact = (contact: EnhancedContact) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getFollowUpStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-purple-500';
      case 'interested': return 'bg-green-500';
      case 'negotiating': return 'bg-orange-500';
      case 'closed': return 'bg-green-600';
      case 'lost': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getContactChannel = (contact: any, type: string) => {
    return contact.enhanced_contact_channels?.find((ch: any) => ch.channel_type === type)?.value || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="مركز جهات الاتصال الموحد" 
          description="إدارة شاملة لجميع جهات الاتصال مع مزامنة ثنائية"
        />
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 ml-1" />
            استيراد
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-1" />
            تصدير
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingContact(null)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة جهة اتصال
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}</DialogTitle>
              </DialogHeader>
              <ContactForm
                editingContact={editingContact}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingContact(null);
                }}
                isLoading={isAdding || isUpdating}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في الأسماء والشركات والملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
            <SelectItem value="archived">مؤرشف</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="الدور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأدوار</SelectItem>
            <SelectItem value="client">عميل</SelectItem>
            <SelectItem value="broker">وسيط</SelectItem>
            <SelectItem value="owner">مالك</SelectItem>
            <SelectItem value="tenant">مستأجر</SelectItem>
            <SelectItem value="supplier">مورد</SelectItem>
          </SelectContent>
        </Select>
        
        {/* أزرار التبديل بين طرق العرض */}
        <div className="flex border rounded-lg p-1 bg-muted">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-3"
          >
            <TableIcon className="h-4 w-4 ml-1" />
            جدول
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-3"
          >
            <Grid3X3 className="h-4 w-4 ml-1" />
            كروت
          </Button>
        </div>
      </div>

      {/* عرض جهات الاتصال */}
      {isLoading ? (
        viewMode === 'table' ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الشركة</TableHead>
                    <TableHead>الأدوار</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : contacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Contact className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد جهات اتصال</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على جهات اتصال تطابق معايير البحث</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول جهة اتصال
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الشركة</TableHead>
                  <TableHead>الأدوار</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          {getContactChannel(contact, 'phone') && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {getContactChannel(contact, 'phone')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.company_name && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {contact.company_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.roles && contact.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contact.roles.slice(0, 2).map((role, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {role === 'client' ? 'عميل' :
                               role === 'broker' ? 'وسيط' :
                               role === 'owner' ? 'مالك' :
                               role === 'tenant' ? 'مستأجر' : role}
                            </Badge>
                          ))}
                          {contact.roles.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.roles.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(contact.status)} text-white text-xs`}>
                        {contact.status === 'active' ? 'نشط' : contact.status === 'inactive' ? 'غير نشط' : 'مؤرشف'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(contact.priority)} text-white text-xs`}>
                        {contact.priority === 'urgent' ? 'عاجل' : 
                         contact.priority === 'high' ? 'عالي' :
                         contact.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(contact.rating)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(contact);
                            setIsDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Activity className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف جهة الاتصال "{contact.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteContact.mutate(contact.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {contact.name}
                      {renderStars(contact.rating)}
                    </CardTitle>
                    {contact.company_name && (
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Building className="h-3 w-3 ml-1" />
                        {contact.company_name}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={`${getStatusColor(contact.status)} text-white text-xs`}>
                      {contact.status === 'active' ? 'نشط' : contact.status === 'inactive' ? 'غير نشط' : 'مؤرشف'}
                    </Badge>
                    <Badge className={`${getPriorityColor(contact.priority)} text-white text-xs`}>
                      {contact.priority === 'urgent' ? 'عاجل' : 
                       contact.priority === 'high' ? 'عالي' :
                       contact.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* الأدوار */}
                  {contact.roles && contact.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contact.roles.slice(0, 3).map((role, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {role === 'client' ? 'عميل' :
                           role === 'broker' ? 'وسيط' :
                           role === 'owner' ? 'مالك' :
                           role === 'tenant' ? 'مستأجر' : role}
                        </Badge>
                      ))}
                      {contact.roles.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{contact.roles.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* حالة المتابعة */}
                  <Badge className={`${getFollowUpStatusColor(contact.follow_up_status)} text-white text-xs w-fit`}>
                    {contact.follow_up_status === 'new' ? 'جديد' :
                     contact.follow_up_status === 'contacted' ? 'تم التواصل' :
                     contact.follow_up_status === 'interested' ? 'مهتم' :
                     contact.follow_up_status === 'negotiating' ? 'تفاوض' :
                     contact.follow_up_status === 'closed' ? 'مغلق' :
                     contact.follow_up_status === 'lost' ? 'ضائع' : 'غير نشط'}
                  </Badge>

                  {/* قنوات الاتصال */}
                  <div className="space-y-1">
                    {getContactChannel(contact, 'phone') && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 ml-1 text-muted-foreground" />
                        <span>{getContactChannel(contact, 'phone')}</span>
                      </div>
                    )}
                    {getContactChannel(contact, 'email') && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 ml-1 text-muted-foreground" />
                        <span className="truncate">{getContactChannel(contact, 'email')}</span>
                      </div>
                    )}
                  </div>

                  {/* الوسوم */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* مواعيد المتابعة */}
                  {contact.next_contact_date && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 ml-1" />
                      <span>المتابعة: {new Date(contact.next_contact_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}

                  {/* النبذة */}
                  {contact.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {contact.bio}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse mt-4 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditContact(contact)}
                    title="تعديل جهة الاتصال"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    title="عرض النشاطات"
                  >
                    <Activity className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        title="حذف جهة الاتصال"
                        onClick={() => setContactToDelete(contact)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          تأكيد حذف جهة الاتصال
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف جهة الاتصال <strong>{contact.name}</strong>؟
                          <br />
                          هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بهذه الجهة.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteContact}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          حذف نهائي
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}