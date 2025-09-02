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
import { EnhancedContactForm } from '@/components/contacts/EnhancedContactForm';
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
  const [selectedContact, setSelectedContact] = useState<EnhancedContact | null>(null);
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

  const handleDeleteContact = (contact = contactToDelete) => {
    if (contact) {
      deleteContact(contact.id);
      setContactToDelete(null);
      toast({
        title: "تم حذف جهة الاتصال",
        description: `تم حذف ${contact.name} بنجاح`,
      });
    }
  };

  const handleEditContact = async (contact: EnhancedContact) => {
    console.log('تحرير جهة اتصال:', contact);
    
    // الحصول على قنوات الاتصال لجهة الاتصال
    const { data: channels } = await supabase
      .from('enhanced_contact_channels')
      .select('*')
      .eq('contact_id', contact.id);
    
    console.log('قنوات الاتصال:', channels);
    
    // إضافة قنوات الاتصال إلى جهة الاتصال
    const contactWithChannels = {
      ...contact,
      channels: channels || []
    };
    
    setEditingContact(contactWithChannels);
    setIsDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedContacts.length === 0) return;
    
    // حذف جميع جهات الاتصال المحددة
    selectedContacts.forEach(id => {
      deleteContact(id);
    });
    
    // إعادة تعيين القائمة المحددة
    setSelectedContacts([]);
    
    toast({
      title: "تم حذف جهات الاتصال",
      description: `تم حذف ${selectedContacts.length} جهة اتصال بنجاح`,
    });
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact.id));
    }
  };

  const toggleSelectContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(contactId => contactId !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  // دوال مساعدة للألوان
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'archived': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getFollowUpStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-purple-500';
      case 'interested': return 'bg-green-500';
      case 'negotiating': return 'bg-amber-500';
      case 'closed': return 'bg-green-700';
      case 'lost': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-orange-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  // عرض النجوم للتقييم
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i}
          className={`h-3 w-3 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      );
    }
    
    return (
      <div className="flex items-center">
        {stars}
      </div>
    );
  };

  // الحصول على قناة اتصال معينة
  const getContactChannel = (contact: EnhancedContact, channelType: string) => {
    if (!contact.metadata || !contact.metadata.channels) return null;
    
    const channel = contact.metadata.channels.find((c: any) => c.channel_type === channelType && c.is_primary);
    return channel ? channel.value : null;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="جهات الاتصال"
        description="إدارة جهات الاتصال والعملاء والوسطاء والملاك والمستأجرين"
        icon={<Users className="h-6 w-6" />}
      >
        <div className="flex items-center gap-2">
          <Button onClick={() => { setEditingContact(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة جهة اتصال
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            استيراد
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
        </div>
      </PageHeader>

      {/* نافذة إضافة/تحرير جهة اتصال */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'تحرير جهة اتصال' : 'إضافة جهة اتصال جديدة'}
            </DialogTitle>
          </DialogHeader>
          <EnhancedContactForm 
            onSubmit={handleFormSubmit} 
            initialData={editingContact || undefined}
            employees={employees}
            isLoading={isAdding || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الحذف الجماعي */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            className={`${selectedContacts.length === 0 ? 'hidden' : 'flex'} items-center gap-2`}
          >
            <Trash2 className="h-4 w-4" />
            حذف المحدد ({selectedContacts.length})
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              تأكيد حذف جهات الاتصال
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedContacts.length} جهة اتصال؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بهذه الجهات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* أدوات البحث والتصفية */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن جهة اتصال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="الدور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأدوار</SelectItem>
              <SelectItem value="client">عميل</SelectItem>
              <SelectItem value="broker">وسيط</SelectItem>
              <SelectItem value="owner">مالك</SelectItem>
              <SelectItem value="tenant">مستأجر</SelectItem>
              <SelectItem value="supplier">مورد</SelectItem>
              <SelectItem value="employee">موظف</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('table')}
              title="عرض الجدول"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('cards')}
              title="عرض البطاقات"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={isSyncing}
            onClick={() => syncAll()}
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            مزامنة
          </Button>
        </div>
      </div>

      {/* إحصائيات جهات الاتصال */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              إجمالي جهات الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-green-500" />
              العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-amber-500" />
              الوسطاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.brokers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              بحاجة للمتابعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needsFollowUp || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* عرض جهات الاتصال */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">لا توجد جهات اتصال</h3>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            لم يتم العثور على جهات اتصال تطابق معايير البحث الخاصة بك.
          </p>
          <Button onClick={() => { setEditingContact(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة جهة اتصال
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-md border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedContacts.length === contacts.length && contacts.length > 0} 
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المتابعة</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>آخر تواصل</TableHead>
                <TableHead>التواصل القادم</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedContacts.includes(contact.id)} 
                      onCheckedChange={() => toggleSelectContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    {contact.roles && contact.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contact.roles.map((role, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {role === 'client' ? 'عميل' :
                             role === 'broker' ? 'وسيط' :
                             role === 'owner' ? 'مالك' :
                             role === 'tenant' ? 'مستأجر' :
                             role === 'supplier' ? 'مورد' :
                             role === 'employee' ? 'موظف' : role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(contact.status)} text-white text-xs`}>
                      {contact.status === 'active' ? 'نشط' :
                       contact.status === 'inactive' ? 'غير نشط' : 'مؤرشف'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getFollowUpStatusColor(contact.follow_up_status)} text-white text-xs`}>
                      {contact.follow_up_status === 'new' ? 'جديد' :
                       contact.follow_up_status === 'contacted' ? 'تم التواصل' :
                       contact.follow_up_status === 'interested' ? 'مهتم' :
                       contact.follow_up_status === 'negotiating' ? 'قيد التفاوض' :
                       contact.follow_up_status === 'closed' ? 'مغلق' :
                       contact.follow_up_status === 'lost' ? 'مفقود' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getPriorityColor(contact.priority)} text-white text-xs`}>
                      {contact.priority === 'low' ? 'منخفضة' :
                       contact.priority === 'medium' ? 'متوسطة' :
                       contact.priority === 'high' ? 'عالية' : 'عاجلة'}
                    </Badge>
                  </TableCell>
                  <TableCell>{renderStars(contact.rating)}</TableCell>
                  <TableCell>{getContactChannel(contact, 'phone') || '-'}</TableCell>
                  <TableCell>{getContactChannel(contact, 'email') || '-'}</TableCell>
                  <TableCell>
                    {contact.last_contact_date ? new Date(contact.last_contact_date).toLocaleDateString('ar-SA') : '-'}
                  </TableCell>
                  <TableCell>
                    {contact.next_contact_date ? new Date(contact.next_contact_date).toLocaleDateString('ar-SA') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditContact(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => setContactToDelete(contact)}
                          >
                            <Trash2 className="h-4 w-4" />
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
                              onClick={() => handleDeleteContact()}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              حذف نهائي
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{contact.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contact.roles && contact.roles.map((role, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {role === 'client' ? 'عميل' :
                             role === 'broker' ? 'وسيط' :
                             role === 'owner' ? 'مالك' :
                             role === 'tenant' ? 'مستأجر' :
                             role === 'supplier' ? 'مورد' :
                             role === 'employee' ? 'موظف' : role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Checkbox 
                      checked={selectedContacts.includes(contact.id)} 
                      onCheckedChange={() => toggleSelectContact(contact.id)}
                    />
                  </div>
                  
                  {/* الحالة والمتابعة والأولوية */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={`${getStatusColor(contact.status)} text-white text-xs w-fit`}>
                      {contact.status === 'active' ? 'نشط' :
                       contact.status === 'inactive' ? 'غير نشط' : 'مؤرشف'}
                    </Badge>
                    <Badge className={`${getFollowUpStatusColor(contact.follow_up_status)} text-white text-xs w-fit`}>
                      {contact.follow_up_status === 'new' ? 'جديد' :
                       contact.follow_up_status === 'contacted' ? 'تم التواصل' :
                       contact.follow_up_status === 'interested' ? 'مهتم' :
                       contact.follow_up_status === 'negotiating' ? 'قيد التفاوض' :
                       contact.follow_up_status === 'closed' ? 'مغلق' :
                       contact.follow_up_status === 'lost' ? 'مفقود' : 'غير نشط'}
                    </Badge>
                    <Badge className={`${getPriorityColor(contact.priority)} text-white text-xs w-fit`}>
                      {contact.priority === 'low' ? 'منخفضة' :
                       contact.priority === 'medium' ? 'متوسطة' :
                       contact.priority === 'high' ? 'عالية' : 'عاجلة'}
                    </Badge>
                    {renderStars(contact.rating)}
                  </div>
                  
                  {/* معلومات الاتصال */}
                  <div className="space-y-2 text-sm">
                    {getContactChannel(contact, 'phone') && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-500" />
                        <span>{getContactChannel(contact, 'phone')}</span>
                      </div>
                    )}
                    {getContactChannel(contact, 'email') && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <span className="truncate">{getContactChannel(contact, 'email')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* الوسوم */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
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
                  
                  {/* التاريخ المستقبلي */}
                  {contact.next_contact_date && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>المتابعة: {new Date(contact.next_contact_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}
                  
                  {/* الوصف */}
                  {contact.bio && (
                    <div className="mt-3 text-xs text-gray-600 line-clamp-2">
                      {contact.bio}
                    </div>
                  )}
                </div>
                
                {/* أزرار الإجراءات */}
                <div className="flex items-center justify-between border-t p-2 bg-gray-50">
                  <Button
                    size="sm"
                    variant="outline"
                    title="تحرير جهة الاتصال"
                    onClick={() => handleEditContact(contact)}
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
                          onClick={() => handleDeleteContact()}
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