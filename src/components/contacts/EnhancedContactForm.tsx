// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Save } from 'lucide-react';
import { useContactSync } from '@/hooks/useContactSync';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const contactSchema = z.object({
  // المعلومات الأساسية (إلزامية لجميع الأدوار)
  full_name: z.string().min(2, 'الاسم الكامل مطلوب'),
  short_name: z.string().min(1, 'الاسم المختصر مطلوب'),
  language: z.enum(['ar', 'en'], { required_error: 'اللغة مطلوبة' }),
  notes: z.string().optional(),
  rating_1_5: z.number().min(1).max(5).optional(),
  
  // قنوات الاتصال (إلزامية لجميع الأدوار)
  channels: z.array(z.object({
    type: z.enum(['mobile', 'phone', 'whatsapp', 'email', 'website', 'instagram', 'twitter', 'snapchat', 'tiktok', 'linkedin', 'other']),
    value: z.string().min(1, 'القيمة مطلوبة'),
    is_primary: z.boolean().default(false),
    label: z.string().optional(),
  })).min(1, 'يجب إدخال وسيلة اتصال واحدة على الأقل'),
  
  // الأدوار (إلزامي)
  roles: z.array(z.enum(['broker', 'owner', 'landlord', 'tenant', 'client', 'customer', 'supplier'])).min(1, 'يجب اختيار دور واحد على الأقل'),
  
  // بيانات الوسيط (تظهر عند تحديد دور الوسيط)
  office_name: z.string().optional(),
  office_classification: z.enum(['platinum', 'gold', 'silver', 'bronze']).optional(),
  job_title: z.string().optional(),
  cr_number: z.string().optional(),
  cr_expiry_date: z.string().optional(),
  units_count: z.number().min(0).optional(),
  
  // بيانات المالك (تظهر عند تحديد دور المالك)
  nationality: z.string().optional(),
  id_type: z.enum(['national_id', 'iqama', 'passport']).optional(),
  id_number: z.string().optional(),
  id_expiry_date: z.string().optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  iban: z.string().optional(),
  
  // المرفقات
  id_image: z.any().optional(), // ملف صورة الهوية للمالك
  
  // حقول النظام والتصنيف
  status: z.enum(['active', 'new', 'archived', 'do_not_contact']).default('new'),
  follow_up_status: z.enum(['new', 'contacted', 'interested', 'negotiating', 'closed', 'lost', 'inactive']).default('new'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  organization_id: z.string().optional(),
  assigned_to_user: z.string().optional(),
  preferred_contact_method: z.enum(['phone', 'whatsapp', 'email', 'sms']).default('phone'),
}).refine((data) => {
  // التحقق من الحقول الإلزامية للوسيط
  if (data.roles.includes('broker')) {
    return data.office_name && data.office_name.length > 0;
  }
  return true;
}, {
  message: 'اسم المكتب مطلوب للوسطاء',
  path: ['office_name']
}).refine((data) => {
  // التحقق من الحقول الإلزامية للمالك
  if (data.roles.includes('owner') || data.roles.includes('landlord')) {
    return data.nationality && data.nationality.length > 0 && 
           data.id_type && data.id_number && data.id_number.length > 0;
  }
  return true;
}, {
  message: 'الجنسية ونوع الهوية ورقم الهوية مطلوبة للملاك',
  path: ['nationality']
}).refine((data) => {
  // التحقق من وجود رقم واتساب
  const hasWhatsApp = data.channels.some(channel => 
    channel.type === 'whatsapp' && channel.value.length > 0
  );
  return hasWhatsApp;
}, {
  message: 'رقم الواتساب مطلوب',
  path: ['channels']
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface EnhancedContactFormProps {
  initialData?: Partial<ContactFormValues>;
  onSubmit?: (data: ContactFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  contactId?: string;
}

export function EnhancedContactForm({ initialData, onSubmit, onCancel, isLoading, contactId }: EnhancedContactFormProps) {
  const { syncContactToPages, isLoading: isSyncing } = useContactSync();
  const [activeTab, setActiveTab] = useState('basic');
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      short_name: initialData?.short_name || '',
      language: initialData?.language || 'ar',
      notes: initialData?.notes || '',
      channels: initialData?.channels || [
        { type: 'mobile', value: '', is_primary: false, label: 'الجوال' },
        { type: 'whatsapp', value: '', is_primary: true, label: 'الواتساب' },
        { type: 'email', value: '', is_primary: false, label: 'البريد الإلكتروني' }
      ],
      roles: initialData?.roles || [],
      status: initialData?.status || 'new',
      follow_up_status: initialData?.follow_up_status || 'new',
      priority: initialData?.priority || 'medium',
      preferred_contact_method: initialData?.preferred_contact_method || 'phone',
      office_name: initialData?.office_name || '',
      office_classification: initialData?.office_classification,
      job_title: initialData?.job_title || '',
      cr_number: initialData?.cr_number || '',
      cr_expiry_date: initialData?.cr_expiry_date || '',
      units_count: initialData?.units_count,
      nationality: initialData?.nationality || '',
      id_type: initialData?.id_type,
      id_number: initialData?.id_number || '',
      id_expiry_date: initialData?.id_expiry_date || '',
      bank_name: initialData?.bank_name || '',
      account_number: initialData?.account_number || '',
      iban: initialData?.iban || '',
      rating_1_5: initialData?.rating_1_5,
    },
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = form;
  
  // إعادة تعيين قيم النموذج عند تغيير البيانات الأولية
  React.useEffect(() => {
    if (initialData) {
      console.log('تم استلام بيانات أولية للتعديل:', initialData);
      
      // تحقق من وجود قنوات الاتصال
      if (initialData.channels && initialData.channels.length > 0) {
        console.log('تم العثور على قنوات الاتصال:', initialData.channels);
      } else {
        console.log('لم يتم العثور على قنوات الاتصال');
      }
      
      // إعادة تعيين النموذج بالبيانات الأولية
      reset({
        full_name: initialData.full_name || initialData.name,
        short_name: initialData.short_name,
        language: initialData.language || 'ar',
        channels: initialData.channels || [],
        roles: initialData.roles || [],
        status: initialData.status || 'active',
        priority: initialData.priority || 'medium',
        follow_up_status: initialData.follow_up_status || 'new',
        preferred_contact_method: initialData.preferred_contact_method || 'any',
        company_name: initialData.company_name,
        office: initialData.office,
        bio: initialData.bio,
        notes: initialData.notes,
        tags: initialData.tags || [],
        rating: initialData.rating || 0,
        birthday: initialData.birthday,
        next_contact_date: initialData.next_contact_date
      });
      
      console.log('تم إعادة تعيين النموذج بالبيانات');
    }
  }, [initialData, reset]);
  const roles = watch('roles') || [];
  const channels = watch('channels') || [];
  const fullName = watch('full_name') || '';
  
  // توليد الاسم المختصر تلقائياً من الاسم الكامل
  React.useEffect(() => {
    if (fullName && !watch('short_name')) {
      const words = fullName.trim().split(' ');
      let shortName = '';
      
      if (words.length === 1) {
        shortName = words[0];
      } else if (words.length === 2) {
        shortName = words[0] + ' ' + words[1].charAt(0) + '.';
      } else if (words.length >= 3) {
        shortName = words[0] + ' ' + words[words.length - 1];
      }
      
      setValue('short_name', shortName);
    }
  }, [fullName, setValue, watch]);

  const addChannel = () => {
    const newChannel = {
      id: uuidv4(),
      channel_type: 'phone',
      value: '',
      label: '',
      is_primary: channels.length === 0,
      is_verified: false,
      is_active: true,
      preferred_for_calls: false,
      preferred_for_messages: false,
      preferred_for_emails: false
    };
    setValue('channels', [...channels, newChannel]);
    console.log('تمت إضافة قناة جديدة، القنوات الحالية:', [...channels, newChannel]);
  };
  
  // تحميل قنوات الاتصال عند فتح علامة التبويب channels
  React.useEffect(() => {
    if (activeTab === 'channels' && initialData?.channels?.length > 0 && channels.length === 0) {
      console.log('تحميل قنوات الاتصال من البيانات الأولية:', initialData.channels);
      setValue('channels', initialData.channels);
    }
  }, [activeTab, initialData, channels, setValue]);

  const removeChannel = (index: number) => {
    const newChannels = [...channels];
    newChannels.splice(index, 1);
    setValue('channels', newChannels);
  };

  const setPrimaryChannel = (index: number) => {
    setValue('channels', channels.map((channel, i) => ({
      ...channel,
      is_primary: i === index,
    })));
  };

  const handleFormSubmit = async (data: ContactFormValues) => {
    try {
      console.log('🚀 بدء عملية الحفظ...', { contactId, data });
      
      // فحص حالة المستخدم أولاً
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ خطأ في المصادقة:', authError);
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ المستخدم مصادق:', user.email);
      
      // حفظ البيانات في قاعدة البيانات
      let savedContactId = contactId;
      
      if (contactId) {
        console.log('📝 تحديث جهة اتصال موجودة:', contactId);
        
        // تحديث جهة اتصال موجودة
        const updateData = {
          full_name: data.full_name,
          name: data.full_name, // للتوافق مع الأعمدة القديمة
          short_name: data.short_name,
          language: data.language,
          bio: data.notes,
          rating_1_5: data.rating_1_5,
          roles: data.roles,
          status: data.status,
          follow_up_status: data.follow_up_status,
          priority: data.priority,
          preferred_contact_method: data.preferred_contact_method,
          office_name: data.office_name,
          office_classification: data.office_classification,
          job_title: data.job_title,
          units_count: data.units_count,
          cr_number: data.cr_number,
          cr_expiry_date: data.cr_expiry_date,
          nationality: data.nationality,
          id_type: data.id_type,
          id_number: data.id_number,
          id_expiry_date: data.id_expiry_date,
          bank_name: data.bank_name,
          account_number: data.account_number,
          iban: data.iban,
          updated_at: new Date().toISOString()
        };
        
        console.log('📊 بيانات التحديث:', updateData);
        
        const { data: updatedData, error } = await supabase
          .from('enhanced_contacts')
          .update(updateData)
          .eq('id', contactId)
          .select();
          
        if (error) {
          console.error('❌ خطأ في التحديث:', error);
          throw error;
        }
        
        console.log('✅ تم التحديث بنجاح:', updatedData);
        
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات جهة الاتصال بنجاح"
        });
      } else {
        // إنشاء جهة اتصال جديدة
        const { data: newContact, error } = await supabase
          .from('enhanced_contacts')
          .insert({
            full_name: data.full_name,
            name: data.full_name, // للتوافق مع الأعمدة القديمة
            short_name: data.short_name,
            language: data.language,
            bio: data.notes,
            rating_1_5: data.rating_1_5,
            roles: data.roles,
            status: data.status,
            follow_up_status: data.follow_up_status,
            priority: data.priority,
            preferred_contact_method: data.preferred_contact_method,
            office_name: data.office_name,
            office_classification: data.office_classification,
            job_title: data.job_title,
            units_count: data.units_count,
            cr_number: data.cr_number,
            cr_expiry_date: data.cr_expiry_date,
            nationality: data.nationality,
            id_type: data.id_type,
            id_number: data.id_number,
            id_expiry_date: data.id_expiry_date,
            bank_name: data.bank_name,
            account_number: data.account_number,
            iban: data.iban,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) throw error;
        savedContactId = newContact.id;
        
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم إنشاء جهة اتصال جديدة بنجاح"
        });
      }
      
      // حفظ قنوات الاتصال في جدول منفصل
      if (savedContactId && data.channels && data.channels.length > 0) {
        // حذف القنوات الموجودة أولاً (في حالة التحديث)
        await supabase
          .from('enhanced_contact_channels')
          .delete()
          .eq('contact_id', savedContactId);
        
        // إضافة القنوات الجديدة
        const channelsToInsert = data.channels.map(channel => ({
          contact_id: savedContactId,
          channel_type: channel.type,
          value: channel.value,
          is_primary: channel.is_primary,
          label: channel.label || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: channelsError } = await supabase
          .from('enhanced_contact_channels')
          .insert(channelsToInsert);
        
        if (channelsError) {
          console.error('Error saving channels:', channelsError);
          toast({
            title: "تحذير",
            description: "تم حفظ جهة الاتصال ولكن فشل في حفظ قنوات الاتصال",
            variant: "destructive"
          });
        }
      }
      
      // مزامنة البيانات مع الصفحات الأخرى
      if (savedContactId) {
        const syncResult = await syncContactToPages(savedContactId, data as any);
        
        if (syncResult.success) {
          toast({
            title: "تمت المزامنة بنجاح",
            description: "تم مزامنة البيانات مع الصفحات الأخرى"
          });
        } else {
          toast({
            title: "تحذير",
            description: "تم حفظ البيانات ولكن فشلت المزامنة",
            variant: "destructive"
          });
        }
      }
      
      // استدعاء دالة onSubmit إذا كانت موجودة
      if (onSubmit) {
        onSubmit(data);
      }
      
    } catch (error: any) {
      console.error('❌ خطأ في حفظ جهة الاتصال:', error);
      
      let errorMessage = "حدث خطأ أثناء حفظ البيانات";
      
      if (error?.message) {
        if (error.message.includes('permission')) {
          errorMessage = "ليس لديك صلاحية لتحديث هذه البيانات";
        } else if (error.message.includes('network')) {
          errorMessage = "مشكلة في الاتصال بالإنترنت";
        } else if (error.message.includes('constraint')) {
          errorMessage = "البيانات المدخلة غير صحيحة";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطأ في الحفظ",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="flex space-x-2 mb-4 border-b">
          <Button
            type="button"
            variant={activeTab === 'basic' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('basic')}
          >
            المعلومات الأساسية
          </Button>
          
          <Button
            type="button"
            variant={activeTab === 'channels' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('channels')}
          >
            قنوات الاتصال
          </Button>
          
          {roles.includes('broker') && (
            <Button
              type="button"
              variant={activeTab === 'broker' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('broker')}
            >
              بيانات الوسيط
            </Button>
          )}
          
          {roles.includes('owner') && (
            <Button
              type="button"
              variant={activeTab === 'owner' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('owner')}
            >
              بيانات المالك
            </Button>
          )}
        </div>

        {activeTab === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="short_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم المختصر *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اللغة *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر اللغة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">جديد</SelectItem>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="do_not_contact">لا تتواصل</SelectItem>
                          <SelectItem value="archived">مؤرشف</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأولوية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الأولوية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">منخفضة</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="urgent">عاجلة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="follow_up_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة المتابعة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر حالة المتابعة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">جديد</SelectItem>
                          <SelectItem value="contacted">تم التواصل</SelectItem>
                          <SelectItem value="interested">مهتم</SelectItem>
                          <SelectItem value="negotiating">تفاوض</SelectItem>
                          <SelectItem value="closed">مغلق</SelectItem>
                          <SelectItem value="lost">فقدان</SelectItem>
                          <SelectItem value="inactive">غير نشط</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="preferred_contact_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>طريقة التواصل المفضلة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر طريقة التواصل" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="phone">هاتف</SelectItem>
                          <SelectItem value="whatsapp">واتساب</SelectItem>
                          <SelectItem value="email">بريد إلكتروني</SelectItem>
                          <SelectItem value="sms">رسائل نصية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={control}
                name="rating_1_5"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التقييم (1-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأدوار *</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {(['broker', 'owner', 'landlord', 'tenant', 'client', 'customer', 'supplier'] as const).map((role) => (
                        <Button
                          key={role}
                          type="button"
                          variant={field.value?.includes(role) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newRoles = field.value?.includes(role)
                              ? field.value.filter((r) => r !== role)
                              : [...(field.value || []), role];
                            field.onChange(newRoles);
                          }}
                        >
                          {role === 'broker' && 'وسيط'}
                          {role === 'owner' && 'مالك'}
                          {role === 'landlord' && 'مؤجر'}
                          {role === 'tenant' && 'مستأجر'}
                          {role === 'client' && 'عميل'}
                          {role === 'customer' && 'زبون'}
                          {role === 'supplier' && 'مورد'}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'channels' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>قنوات الاتصال</CardTitle>
                <Button type="button" size="sm" onClick={addChannel}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة قناة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.map((channel, index) => (
                <div key={index} className="flex items-start gap-2 p-3 border rounded-md">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <FormField
                      control={control}
                      name={`channels.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع القناة</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع القناة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mobile">جوال</SelectItem>
                              <SelectItem value="phone">هاتف</SelectItem>
                              <SelectItem value="whatsapp">واتساب</SelectItem>
                              <SelectItem value="email">بريد إلكتروني</SelectItem>
                              <SelectItem value="website">موقع إلكتروني</SelectItem>
                              <SelectItem value="instagram">انستجرام</SelectItem>
                              <SelectItem value="twitter">تويتر</SelectItem>
                              <SelectItem value="snapchat">سناب شات</SelectItem>
                              <SelectItem value="tiktok">تيك توك</SelectItem>
                              <SelectItem value="linkedin">لينكد إن</SelectItem>
                              <SelectItem value="other">أخرى</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name={`channels.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>القيمة</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name={`channels.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>التسمية</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="تسمية اختيارية" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-end gap-2">
                      <FormField
                        control={control}
                        name={`channels.${index}.is_primary`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-x-reverse">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.checked);
                                  if (e.target.checked) {
                                    setPrimaryChannel(index);
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </FormControl>
                            <FormLabel className="!m-0">رئيسي</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChannel(index)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === 'broker' && roles.includes('broker') && (
          <Card>
            <CardHeader>
              <CardTitle>بيانات الوسيط</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="office_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المكتب *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المسمى الوظيفي</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: وسيط عقاري، مدير مبيعات" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="office_classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تصنيف المكتب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر التصنيف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="platinum">بلاتيني</SelectItem>
                          <SelectItem value="gold">ذهبي</SelectItem>
                          <SelectItem value="silver">فضي</SelectItem>
                          <SelectItem value="bronze">برونزي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="cr_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم السجل التجاري</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: 1010123456" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="cr_expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ انتهاء السجل</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={control}
                name="units_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد الوحدات المدارة</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="عدد الوحدات العقارية المدارة" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'owner' && (roles.includes('owner') || roles.includes('landlord')) && (
          <Card>
            <CardHeader>
              <CardTitle>بيانات المالك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنسية *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الجنسية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="saudi">سعودي</SelectItem>
                          <SelectItem value="egyptian">مصري</SelectItem>
                          <SelectItem value="jordanian">أردني</SelectItem>
                          <SelectItem value="lebanese">لبناني</SelectItem>
                          <SelectItem value="syrian">سوري</SelectItem>
                          <SelectItem value="palestinian">فلسطيني</SelectItem>
                          <SelectItem value="iraqi">عراقي</SelectItem>
                          <SelectItem value="yemeni">يمني</SelectItem>
                          <SelectItem value="kuwaiti">كويتي</SelectItem>
                          <SelectItem value="emirati">إماراتي</SelectItem>
                          <SelectItem value="qatari">قطري</SelectItem>
                          <SelectItem value="bahraini">بحريني</SelectItem>
                          <SelectItem value="omani">عماني</SelectItem>
                          <SelectItem value="moroccan">مغربي</SelectItem>
                          <SelectItem value="tunisian">تونسي</SelectItem>
                          <SelectItem value="algerian">جزائري</SelectItem>
                          <SelectItem value="libyan">ليبي</SelectItem>
                          <SelectItem value="sudanese">سوداني</SelectItem>
                          <SelectItem value="indian">هندي</SelectItem>
                          <SelectItem value="pakistani">باكستاني</SelectItem>
                          <SelectItem value="bangladeshi">بنغلاديشي</SelectItem>
                          <SelectItem value="filipino">فلبيني</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="id_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الهوية *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الهوية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="national_id">هوية وطنية</SelectItem>
                          <SelectItem value="iqama">إقامة</SelectItem>
                          <SelectItem value="passport">جواز سفر</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="id_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهوية *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: 1234567890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="id_expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ انتهاء الهوية</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم البنك</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر البنك" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="alrajhi">مصرف الراجحي</SelectItem>
                          <SelectItem value="alahli">البنك الأهلي السعودي</SelectItem>
                          <SelectItem value="samba">بنك سامبا</SelectItem>
                          <SelectItem value="riyad">بنك الرياض</SelectItem>
                          <SelectItem value="anb">البنك العربي الوطني</SelectItem>
                          <SelectItem value="sab">البنك السعودي البريطاني</SelectItem>
                          <SelectItem value="alinma">بنك الإنماء</SelectItem>
                          <SelectItem value="albilad">بنك البلاد</SelectItem>
                          <SelectItem value="aljazira">بنك الجزيرة</SelectItem>
                          <SelectItem value="saib">البنك السعودي للاستثمار</SelectItem>
                          <SelectItem value="other">بنك آخر</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الحساب</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: 123456789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الآيبان</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SA0000000000000000000000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">المرفقات</h4>
                <FormField
                  control={control}
                  name="id_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صورة الهوية</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        يُقبل ملفات الصور (JPG, PNG) أو PDF بحد أقصى 5 ميجابايت
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || isSyncing}>
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || isSyncing}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading || isSyncing ? 'جاري الحفظ والمزامنة...' : 'حفظ ومزامنة'}
            </Button>
          </div>
      </form>
    </Form>
  );
}
