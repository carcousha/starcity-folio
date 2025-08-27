import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
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
  Clock
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

  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['enhanced-contacts', searchTerm, statusFilter, roleFilter],
    queryFn: async () => {
      let query = supabase
        .from('enhanced_contacts')
        .select(`
          *,
          enhanced_contact_channels(*)
        `);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (roleFilter !== 'all') {
        query = query.contains('roles', [roleFilter]);
      }
      
      const { data, error } = await query
        .eq('is_duplicate', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EnhancedContact[];
    }
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: Partial<EnhancedContact> & { channels?: Partial<ContactChannel>[] }) => {
      const { channels, ...contactData } = data;
      
      const { data: contact, error } = await supabase
        .from('enhanced_contacts')
        .insert({
          ...contactData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // إضافة قنوات الاتصال
      if (channels && channels.length > 0) {
        const channelData = channels.map(channel => ({
          ...channel,
          contact_id: contact.id
        }));
        
        const { error: channelError } = await supabase
          .from('enhanced_contact_channels')
          .insert(channelData);
        
        if (channelError) throw channelError;
      }
      
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
      setIsDialogOpen(false);
      setEditingContact(null);
      toast({ title: "تم إضافة جهة الاتصال بنجاح" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EnhancedContact> & { id: string }) => {
      const { error } = await supabase
        .from('enhanced_contacts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
      setIsDialogOpen(false);
      setEditingContact(null);
      toast({ title: "تم تحديث جهة الاتصال بنجاح" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('enhanced_contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
      toast({ title: "تم حذف جهة الاتصال بنجاح" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const contactData = {
      name: formData.get('name') as string,
      first_name: formData.get('first_name') as string || undefined,
      last_name: formData.get('last_name') as string || undefined,
      company_name: formData.get('company_name') as string || undefined,
      office: formData.get('office') as string || undefined,
      bio: formData.get('bio') as string || undefined,
      roles: (formData.get('roles') as string)?.split(',').map(r => r.trim()).filter(Boolean) || [],
      status: formData.get('status') as 'active' | 'inactive' | 'archived' || 'active',
      follow_up_status: formData.get('follow_up_status') as any || 'new',
      priority: formData.get('priority') as any || 'medium',
      rating: formData.get('rating') ? Number(formData.get('rating')) : undefined,
      assigned_to: formData.get('assigned_to') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
      next_contact_date: formData.get('next_contact_date') as string || undefined,
    };

    const channels = [
      {
        channel_type: 'phone' as const,
        value: formData.get('phone') as string,
        is_primary: true,
        is_active: true,
        preferred_for_calls: true,
        preferred_for_messages: true
      },
      {
        channel_type: 'email' as const,
        value: formData.get('email') as string,
        is_primary: false,
        is_active: true,
        preferred_for_emails: true
      }
    ].filter(channel => channel.value);

    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, ...contactData });
    } else {
      createMutation.mutate({ ...contactData, channels });
    }
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* البيانات الأساسية */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">البيانات الأساسية</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">الاسم الأول</Label>
                        <Input 
                          id="first_name" 
                          name="first_name" 
                          defaultValue={editingContact?.first_name}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">اسم العائلة</Label>
                        <Input 
                          id="last_name" 
                          name="last_name" 
                          defaultValue={editingContact?.last_name}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        defaultValue={editingContact?.name}
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">اسم الشركة</Label>
                        <Input 
                          id="company_name" 
                          name="company_name" 
                          defaultValue={editingContact?.company_name}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="office">المكتب</Label>
                        <Input 
                          id="office" 
                          name="office" 
                          defaultValue={editingContact?.office}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">النبذة الشخصية</Label>
                      <Textarea 
                        id="bio" 
                        name="bio"
                        defaultValue={editingContact?.bio}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* قنوات الاتصال والبيانات الإضافية */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">قنوات الاتصال</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        defaultValue={editingContact ? getContactChannel(editingContact, 'phone') : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        defaultValue={editingContact ? getContactChannel(editingContact, 'email') : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roles">الأدوار (مفصولة بفواصل)</Label>
                      <Input 
                        id="roles" 
                        name="roles" 
                        placeholder="client, broker, owner"
                        defaultValue={editingContact?.roles?.join(', ')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">الحالة</Label>
                        <Select name="status" defaultValue={editingContact?.status || 'active'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="inactive">غير نشط</SelectItem>
                            <SelectItem value="archived">مؤرشف</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="follow_up_status">حالة المتابعة</Label>
                        <Select name="follow_up_status" defaultValue={editingContact?.follow_up_status || 'new'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">جديد</SelectItem>
                            <SelectItem value="contacted">تم التواصل</SelectItem>
                            <SelectItem value="interested">مهتم</SelectItem>
                            <SelectItem value="negotiating">تفاوض</SelectItem>
                            <SelectItem value="closed">مغلق</SelectItem>
                            <SelectItem value="lost">ضائع</SelectItem>
                            <SelectItem value="inactive">غير نشط</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">الأولوية</Label>
                        <Select name="priority" defaultValue={editingContact?.priority || 'medium'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
                            <SelectItem value="urgent">عاجلة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rating">التقييم (1-5)</Label>
                        <Select name="rating" defaultValue={editingContact?.rating?.toString()}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر التقييم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 نجمة</SelectItem>
                            <SelectItem value="2">2 نجمة</SelectItem>
                            <SelectItem value="3">3 نجوم</SelectItem>
                            <SelectItem value="4">4 نجوم</SelectItem>
                            <SelectItem value="5">5 نجوم</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assigned_to">مُعين إلى</Label>
                      <Select name="assigned_to" defaultValue={editingContact?.assigned_to}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موظف" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.user_id} value={emp.user_id}>
                              {emp.first_name} {emp.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next_contact_date">موعد المتابعة التالي</Label>
                      <Input 
                        id="next_contact_date" 
                        name="next_contact_date" 
                        type="datetime-local"
                        defaultValue={editingContact?.next_contact_date}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">الوسوم (مفصولة بفواصل)</Label>
                      <Input 
                        id="tags" 
                        name="tags" 
                        placeholder="عميل مهم, وسيط نشط"
                        defaultValue={editingContact?.tags?.join(', ')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea 
                        id="notes" 
                        name="notes"
                        defaultValue={editingContact?.notes}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingContact ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </form>
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
      </div>

      {/* عرض جهات الاتصال */}
      {isLoading ? (
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
                    onClick={() => {
                      setEditingContact(contact);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Activity className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(contact.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}