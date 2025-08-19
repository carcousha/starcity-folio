import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, MessageCircle, Mail, Edit, Trash2, Phone, Grid3X3, List, Download, Building2 } from "lucide-react";
import { getTemplates, type TemplateDTO } from "@/services/templateService";

interface LandBroker {
  id: string;
  name: string;
  short_name?: string;
  phone: string;
  email?: string;
  whatsapp_number?: string;
  areas_specialization: string[];
  office_name?: string;
  office_location?: string;
  activity_status: 'active' | 'medium' | 'low' | 'inactive';
  deals_count: number;
  total_sales_amount: number;
  created_at: string;
  notes?: string; // Added notes property
  language?: string; // Added language property
}

export function LandBrokers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<LandBroker | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // إضافة حالة اللغة
  const [languageFilter, setLanguageFilter] = useState<'all' | 'arabic' | 'english'>('all');

  const queryClient = useQueryClient();

  const { data: brokers = [], isLoading, error: queryError } = useQuery({
    queryKey: ['land-brokers', searchTerm, activityFilter, languageFilter],
    queryFn: async () => {
      console.log('Fetching brokers with filters:', { searchTerm, activityFilter, languageFilter });
      
      let query = supabase.from('land_brokers').select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (activityFilter !== 'all') {
        query = query.eq('activity_status', activityFilter);
      }
      
      if (languageFilter !== 'all') {
        query = query.eq('language', languageFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching brokers:', error);
        throw error;
      }
      
      console.log('Brokers fetched successfully:', data?.length || 0);
      return data as LandBroker[];
    },
    retry: 2,
    retryDelay: 1000
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LandBroker>) => {
      console.log('Creating broker with data:', data);
      
      // الحصول على المستخدم الحالي
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user:', userError);
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      // إضافة قيم افتراضية
      const brokerData = {
        ...data,
        created_by: user.id,
        deals_count: 0,
        total_sales_amount: 0,
        created_at: new Date().toISOString()
      };
      
      console.log('Final broker data:', brokerData);
      
      const { data: result, error } = await supabase
        .from('land_brokers')
        .insert(brokerData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating broker:', error);
        throw error;
      }
      
      console.log('Broker created successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      setIsDialogOpen(false);
      toast({ 
        title: "تم إضافة الوسيط بنجاح",
        description: "تم حفظ بيانات الوسيط في قاعدة البيانات"
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({ 
        title: "خطأ في إضافة الوسيط",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LandBroker> & { id: string }) => {
      console.log('Updating broker with ID:', id, 'data:', data);
      
      // الحصول على المستخدم الحالي
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user:', userError);
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      // إضافة updated_by
      const updateData = {
        ...data,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };
      
      console.log('Final update data:', updateData);
      
      const { data: result, error } = await supabase
        .from('land_brokers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating broker:', error);
        throw error;
      }
      
      console.log('Broker updated successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      setIsDialogOpen(false);
      setEditingBroker(null);
      toast({ 
        title: "تم تحديث الوسيط بنجاح",
        description: "تم حفظ التغييرات بنجاح"
      });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      toast({ 
        title: "خطأ في تحديث الوسيط",
        description: error.message || "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting broker with ID:', id);
      
      // الحصول على المستخدم الحالي
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user:', userError);
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      // التحقق من أن المستخدم يمكنه حذف هذا الوسيط
      // يمكنك إضافة منطق إضافي هنا للتحقق من الصلاحيات
      
      const { error } = await supabase.from('land_brokers').delete().eq('id', id);
      if (error) {
        console.error('Error deleting broker:', error);
        throw error;
      }
      
      console.log('Broker deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      toast({ 
        title: "تم حذف الوسيط بنجاح",
        description: "تم حذف الوسيط من قاعدة البيانات"
      });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast({ 
        title: "خطأ في حذف الوسيط",
        description: error.message || "حدث خطأ أثناء حذف الوسيط",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // فحص الأرقام المكررة قبل الإرسال
      const validation = validatePhoneNumbers(formData);
      if (!validation.isValid) {
        // عرض جميع الأخطاء
        validation.errors.forEach(error => {
          toast({
            title: "خطأ في التحقق",
            description: error,
            variant: "destructive"
          });
        });
        return;
      }

      const brokerData = {
        name: formData.get('name') as string,
        short_name: formData.get('short_name') as string,
        phone: cleanPhoneNumber(formData.get('phone') as string),
        whatsapp_number: cleanWhatsAppNumber(formData.get('whatsapp_number') as string),
        email: formData.get('email') as string,
        office_name: formData.get('office_name') as string,
        office_location: formData.get('office_location') as string,
        activity_status: formData.get('activity_status') as 'active' | 'medium' | 'low' | 'inactive',
        language: formData.get('language') as 'arabic' | 'english',
        areas_specialization: (formData.get('areas_specialization') as string)
          ?.split(',')
          .map(area => area.trim())
          .filter(area => area.length > 0) || []
      };

      if (editingBroker) {
        // تحديث وسيط موجود
        await updateMutation.mutateAsync({
          id: editingBroker.id,
          ...brokerData
        });
        toast({ title: "تم التحديث", description: "تم تحديث بيانات الوسيط بنجاح" });
      } else {
        // إضافة وسيط جديد
        await createMutation.mutateAsync(brokerData);
        toast({ title: "تم الإضافة", description: "تم إضافة الوسيط الجديد بنجاح" });
      }

      setIsDialogOpen(false);
      setEditingBroker(null);
    } catch (error) {
      console.error('خطأ في حفظ بيانات الوسيط:', error);
      toast({
        title: "خطأ",
        description: `فشل في حفظ البيانات: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'medium': return 'متوسط';
      case 'low': return 'ضعيف';
      case 'inactive': return 'غير نشط';
      default: return status;
    }
  };

  // جلب قوالب الواتساب من قاعدة البيانات
  const { data: whatsappTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates', 'ar'],
    queryFn: async () => {
      try {
        const templates = await getTemplates({ lang: 'ar' });
        console.log('WhatsApp templates loaded:', templates);
        return templates;
      } catch (error) {
        console.error('Error loading WhatsApp templates:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });

  // تحويل قوالب قاعدة البيانات إلى التنسيق المطلوب
  const getFormattedTemplates = (brokerName: string) => {
    if (!whatsappTemplates.length) {
      // قوالب افتراضية في حالة عدم وجود قوالب في قاعدة البيانات
      return [
        {
          id: 'default_1',
          title: 'عروض جديدة',
          message: `مرحباً ${brokerName}، لدينا عروض جديدة للأراضي قد تهمك. هل يمكننا مناقشة التفاصيل؟`
        },
        {
          id: 'default_2',
          title: 'البحث عن أراضي',
          message: `أهلاً ${brokerName}، نبحث عن أراضي في مناطق تخصصك. هل لديك عروض حالية؟`
        }
      ];
    }

    return whatsappTemplates.map(template => ({
      id: template.id || 'unknown',
      title: template.name,
      message: template.body.replace(/{broker_name}/g, brokerName).replace(/{client_name}/g, brokerName),
      stage: template.stage
    }));
  };

  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<LandBroker | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // نظام الاختيار المتعدد
  const [selectedBrokers, setSelectedBrokers] = useState<Set<string>>(new Set());
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'whatsapp' | 'task' | 'export' | 'edit' | 'delete'>('whatsapp');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTaskTitle, setBulkTaskTitle] = useState('');
  const [bulkTaskDescription, setBulkTaskDescription] = useState('');
  const [bulkEditActivity, setBulkEditActivity] = useState<'' | 'active' | 'medium' | 'low' | 'inactive'>('');
  const [bulkEditLanguage, setBulkEditLanguage] = useState<'' | 'arabic' | 'english'>('');

  const handleWhatsApp = (broker: LandBroker) => {
    setSelectedBroker(broker);
    setCustomMessage('');
    setSelectedTemplate('');
    setIsWhatsAppDialogOpen(true);
  };

  const sendWhatsAppMessage = async (message: string) => {
    if (selectedBrokers.size === 0) {
      toast({ title: "تنبيه", description: "يرجى اختيار وسطاء لإرسال الرسالة", variant: "destructive" });
      return;
    }

    try {
      const selectedBrokersData = getSelectedBrokersData();
      let successCount = 0;
      let failedCount = 0;

      for (const broker of selectedBrokersData) {
        try {
          // تنظيف رقم الهاتف قبل الإرسال
          let phoneNumber = cleanPhoneNumber(broker.whatsapp_number || broker.phone);
          
          // إزالة + إذا كان موجوداً وإضافة كود الدولة
          if (phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber.substring(1);
          }
          
          // إضافة كود الدولة إذا لم يكن موجوداً
          if (!phoneNumber.startsWith('971')) {
            phoneNumber = '971' + phoneNumber;
          }

          const encodedMessage = encodeURIComponent(message);
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
          
          console.log(`إرسال رسالة لـ ${broker.name}:`, whatsappUrl);
          window.open(whatsappUrl, '_blank');
          
          successCount++;
        } catch (error) {
          console.error(`خطأ في إرسال رسالة لـ ${broker.name}:`, error);
          failedCount++;
        }
      }

      toast({
        title: "تم إرسال الرسائل",
        description: `تم فتح WhatsApp لـ ${successCount} وسيط، فشل ${failedCount} وسيط`
      });

      setIsBulkActionsOpen(false);
      clearSelection();
    } catch (error) {
      console.error('خطأ في إرسال الرسائل الجماعية:', error);
      toast({
        title: "خطأ",
        description: `فشل في إرسال الرسائل: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const templates = getFormattedTemplates(selectedBroker?.name || 'الوسيط');
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomMessage(template.message);
    }
  };

  // دوال الاختيار المتعدد
  const toggleBrokerSelection = (brokerId: string) => {
    const newSelection = new Set(selectedBrokers);
    if (newSelection.has(brokerId)) {
      newSelection.delete(brokerId);
    } else {
      newSelection.add(brokerId);
    }
    setSelectedBrokers(newSelection);
  };

  const selectAllBrokers = () => {
    const allIds = brokers.map(broker => broker.id);
    setSelectedBrokers(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedBrokers(new Set());
  };

  const getSelectedBrokersData = () => {
    return brokers.filter(broker => selectedBrokers.has(broker.id));
  };

  const handleBulkWhatsApp = () => {
    if (selectedBrokers.size === 0) return;
    
    const selectedData = getSelectedBrokersData();
    const phoneNumbers = selectedData
      .map(broker => broker.whatsapp_number || broker.phone)
      .filter(phone => phone)
      .map(phone => phone.replace(/[^0-9]/g, ''))
      .join(',');
    
    if (phoneNumbers) {
      const message = bulkMessage || 'مرحباً، لدينا عروض جديدة للأراضي قد تهمكم.';
      const url = `https://wa.me/${phoneNumbers}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
    
    setIsBulkActionsOpen(false);
    setBulkMessage('');
  };

  const handleBulkTaskCreation = () => {
    if (selectedBrokers.size === 0) return;
    
    const selectedData = getSelectedBrokersData();
    const brokerNames = selectedData.map(broker => broker.name).join(', ');
    const phoneNumbers = selectedData
      .map(broker => broker.whatsapp_number || broker.phone)
      .filter(phone => phone)
      .join(', ');
    
    // إنشاء مهمة جديدة
    const taskData = {
      title: bulkTaskTitle || `تواصل مع وسطاء: ${brokerNames}`,
      description: `${bulkTaskDescription || 'إرسال رسائل واتساب لوسطاء مختارين'}\n\nالأسماء: ${brokerNames}\nالأرقام: ${phoneNumbers}`,
      type: 'communication',
      priority: 'medium',
      status: 'pending'
    };
    
    // هنا يمكنك إضافة الكود لإرسال المهمة لصفحة المهام
    console.log('Creating bulk task:', taskData);
    
    // إظهار رسالة نجاح
    toast({
      title: "تم إنشاء المهمة بنجاح",
      description: `تم إنشاء مهمة لـ ${selectedBrokers.size} وسيط`,
    });
    
    setIsBulkActionsOpen(false);
    setBulkTaskTitle('');
    setBulkTaskDescription('');
  };

  const exportPhoneNumbers = () => {
    if (selectedBrokers.size === 0) return;
    
    const selectedData = getSelectedBrokersData();
    const phoneData = selectedData.map(broker => ({
      name: broker.name,
      phone: broker.phone,
      whatsapp: broker.whatsapp_number || broker.phone,
      office: broker.office_name || 'غير محدد'
    }));
    
    // إنشاء ملف CSV
    const csvContent = [
      'الاسم,رقم الهاتف,رقم الواتساب,المكتب',
      ...phoneData.map(row => `${row.name},${row.phone},${row.whatsapp},${row.office}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `وسطاء_مختارين_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "تم تصدير الأرقام بنجاح",
      description: `تم تصدير ${selectedBrokers.size} رقم`,
    });
  };

  const handleEmail = (broker: LandBroker) => {
    if (broker.email) {
      const subject = 'عروض أراضي جديدة';
      const body = `مرحباً ${broker.name},\n\nلدينا عروض جديدة للأراضي في مناطق تخصصك قد تهمك.\n\nشكراً لك`;
      const url = `mailto:${broker.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url);
    }
  };

  // دوال التصدير الجديدة
  const exportSelectedBrokersAsText = () => {
    if (selectedBrokers.size === 0) {
      toast({ title: "تنبيه", description: "يرجى اختيار وسطاء للتصدير", variant: "destructive" });
      return;
    }

    const selectedBrokersData = getSelectedBrokersData();
    const textContent = selectedBrokersData
      .map(broker => `${cleanPhoneNumber(broker.phone)}, ${broker.short_name || broker.name}`)
      .join('\n');

    // إنشاء ملف نصي للتحميل
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `وسطاء_مختارين_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "تم التصدير", description: `تم تصدير ${selectedBrokersData.length} وسيط بصيغة TEXT` });
  };

  const exportSelectedBrokersAsCSV = () => {
    if (selectedBrokers.size === 0) {
      toast({ title: "تنبيه", description: "يرجى اختيار وسطاء للتصدير", variant: "destructive" });
      return;
    }

    const selectedBrokersData = getSelectedBrokersData();
    
    // رؤوس الأعمدة
    const headers = [
      'الاسم الكامل',
      'الاسم المختصر',
      'رقم الهاتف',
      'رقم الواتساب',
      'البريد الإلكتروني',
      'حالة النشاط'
    ];

    // بيانات CSV مع تنظيف الأرقام
    const csvContent = [
      headers.join(','),
      ...selectedBrokersData.map(broker => [
        `"${broker.name}"`,
        `"${broker.short_name || ''}"`,
        `"${cleanPhoneNumber(broker.phone)}"`,
        `"${cleanPhoneNumber(broker.whatsapp_number || '')}"`,
        `"${broker.email || ''}"`,
        `"${broker.activity_status}"`
      ].join(','))
    ].join('\n');

    // إنشاء ملف CSV للتحميل
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `وسطاء_مختارين_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "تم التصدير", description: `تم تصدير ${selectedBrokersData.length} وسيط بصيغة CSV` });
  };

  // تعديل جماعي: تحديث حالة النشاط واللغة للوسطاء المختارين
  const bulkUpdateSelectedBrokers = async () => {
    if (selectedBrokers.size === 0) {
      toast({ title: "تنبيه", description: "يرجى اختيار وسطاء للتعديل", variant: "destructive" });
      return;
    }
    if (!bulkEditActivity && !bulkEditLanguage) {
      toast({ title: "تنبيه", description: "اختر على الأقل حقلاً واحداً للتعديل (الحالة أو اللغة)", variant: "destructive" });
      return;
    }

    const ids = Array.from(selectedBrokers);
    const updateData: any = {};
    if (bulkEditActivity) updateData.activity_status = bulkEditActivity;
    if (bulkEditLanguage) updateData.language = bulkEditLanguage;

    try {
      const { error } = await supabase
        .from('land_brokers')
        .update(updateData)
        .in('id', ids);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      toast({ title: "تم التعديل الجماعي", description: `تم تحديث ${ids.length} وسيط` });
      setIsBulkActionsOpen(false);
      setBulkEditActivity('');
      setBulkEditLanguage('');
      clearSelection();
    } catch (error: any) {
      console.error('Bulk update error:', error);
      toast({ title: "خطأ", description: error.message || 'فشل التعديل الجماعي', variant: 'destructive' });
    }
  };

  // حذف جماعي: حذف الوسطاء المختارين
  const bulkDeleteSelectedBrokers = async () => {
    if (selectedBrokers.size === 0) {
      toast({ title: "تنبيه", description: "يرجى اختيار وسطاء للحذف", variant: "destructive" });
      return;
    }
    try {
      const ids = Array.from(selectedBrokers);
      const { error } = await supabase
        .from('land_brokers')
        .delete()
        .in('id', ids);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      toast({ title: "تم الحذف", description: `تم حذف ${ids.length} وسيط` });
      setIsBulkActionsOpen(false);
      clearSelection();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast({ title: "خطأ", description: error.message || 'فشل الحذف الجماعي', variant: 'destructive' });
    }
  };

  // دالة تنظيف أرقام الهاتف
  const cleanPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // إزالة المسافات والرموز غير المرغوبة مع الحفاظ على + والأرقام
    return phone.replace(/[\s\-\(\)\.]/g, '');
  };

  // دالة تنظيف أرقام الواتساب
  const cleanWhatsAppNumber = (whatsapp: string): string => {
    if (!whatsapp) return '';
    
    // نفس التنظيف مع إضافة تنظيف إضافي للواتساب
    return whatsapp.replace(/[\s\-\(\)\.]/g, '');
  };

  // دالة فحص الأرقام المكررة
  const checkDuplicatePhoneNumbers = (phone: string, whatsapp: string, excludeId?: string): { hasDuplicate: boolean; duplicateType: string; duplicateBroker: any } => {
    if (!phone && !whatsapp) {
      return { hasDuplicate: false, duplicateType: '', duplicateBroker: null };
    }

    const cleanedPhone = cleanPhoneNumber(phone);
    const cleanedWhatsapp = cleanWhatsAppNumber(whatsapp);

    // فحص في قاعدة البيانات
    const existingBrokers = brokers || [];
    
    for (const broker of existingBrokers) {
      // تجاهل الوسيط الحالي عند التعديل
      if (excludeId && broker.id === excludeId) continue;

      const existingPhone = cleanPhoneNumber(broker.phone);
      const existingWhatsapp = cleanPhoneNumber(broker.whatsapp_number || '');

      // فحص رقم الهاتف
      if (cleanedPhone && existingPhone === cleanedPhone) {
        return {
          hasDuplicate: true,
          duplicateType: 'رقم الهاتف',
          duplicateBroker: broker
        };
      }

      // فحص رقم الواتساب
      if (cleanedWhatsapp && existingWhatsapp === cleanedWhatsapp) {
        return {
          hasDuplicate: true,
          duplicateType: 'رقم الواتساب',
          duplicateBroker: broker
        };
      }

      // فحص تداخل بين الهاتف والواتساب
      if (cleanedPhone && existingWhatsapp === cleanedPhone) {
        return {
          hasDuplicate: true,
          duplicateType: 'رقم الهاتف يتطابق مع واتساب موجود',
          duplicateBroker: broker
        };
      }

      if (cleanedWhatsapp && existingPhone === cleanedWhatsapp) {
        return {
          hasDuplicate: true,
          duplicateType: 'رقم الواتساب يتطابق مع هاتف موجود',
          duplicateBroker: broker
        };
      }
    }

    return { hasDuplicate: false, duplicateType: '', duplicateBroker: null };
  };

  // دالة فحص الأرقام المكررة في النموذج
  const validatePhoneNumbers = (formData: FormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const phone = formData.get('phone') as string;
    const whatsapp = formData.get('whatsapp_number') as string;
    const excludeId = editingBroker?.id;

    if (!phone && !whatsapp) {
      errors.push('يجب إدخال رقم هاتف أو واتساب واحد على الأقل');
      return { isValid: false, errors };
    }

    const duplicateCheck = checkDuplicatePhoneNumbers(phone, whatsapp, excludeId);
    
    if (duplicateCheck.hasDuplicate) {
      const brokerName = duplicateCheck.duplicateBroker?.name || 'وسيط آخر';
      errors.push(`الرقم مكرر! ${duplicateCheck.duplicateType} موجود بالفعل مع ${brokerName}`);
    }

    return { isValid: errors.length === 0, errors };
  };

  // تطبيق الفلاتر على البيانات
  const filteredBrokers = useMemo(() => {
    let filtered = brokers || [];

    // فلتر البحث
    if (searchTerm) {
      filtered = filtered.filter(broker =>
        broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (broker.short_name && broker.short_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        broker.phone.includes(searchTerm) ||
        (broker.whatsapp_number && broker.whatsapp_number.includes(searchTerm)) ||
        (broker.office_name && broker.office_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // فلتر النشاط
    if (activityFilter !== 'all') {
      filtered = filtered.filter(broker => broker.activity_status === activityFilter);
    }

    // فلتر اللغة الجديد
    if (languageFilter !== 'all') {
      filtered = filtered.filter(broker => broker.language === languageFilter);
    }

    return filtered;
  }, [brokers, searchTerm, activityFilter, languageFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
      <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                إدارة الوسطاء
              </h1>
              <p className="text-slate-600 text-lg">إدارة شبكة الوسطاء والتواصل معهم بكفاءة عالية</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-1 shadow-sm">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`h-10 px-4 transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <List className="h-4 w-4 ml-2" />
                  جدول
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={`h-10 px-4 transition-all duration-200 ${
                    viewMode === 'cards' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 ml-2" />
                  كروت
                </Button>
              </div>
              
              {/* Bulk Selection Controls */}
              {selectedBrokers.size > 0 && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {selectedBrokers.size}
                    </div>
                    <span className="text-sm font-medium text-blue-800">
                      وسيط مختار
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBulkActionType('whatsapp');
                        setIsBulkActionsOpen(true);
                      }}
                      className="h-8 px-3 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg"
                    >
                      <MessageCircle className="h-3 w-3 ml-1" />
                      إرسال رسائل
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBulkActionType('task');
                        setIsBulkActionsOpen(true);
                      }}
                      className="h-8 px-3 border-green-300 text-green-700 hover:bg-green-50 rounded-lg"
                    >
                      <Plus className="h-3 w-3 ml-1" />
                      إنشاء مهمة
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportPhoneNumbers}
                      className="h-8 px-3 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg"
                    >
                      <Download className="h-3 w-3 ml-1" />
                      تصدير الأرقام
                    </Button>

                    {/* أزرار التصدير الجديدة */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportSelectedBrokersAsText}
                      className="h-8 px-3 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg"
                    >
                      <Download className="h-3 w-3 ml-1" />
                      تصدير TEXT
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportSelectedBrokersAsCSV}
                      className="h-8 px-3 border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-lg"
                    >
                      <Download className="h-3 w-3 ml-1" />
                      تصدير CSV
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    className="h-8 px-3 text-slate-600 hover:text-slate-800"
                  >
                    إلغاء الاختيار
                  </Button>
                </div>
              )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
                  <Button 
                    onClick={() => setEditingBroker(null)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 h-12 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-5 w-5 ml-2" />
              إضافة وسيط جديد
            </Button>
          </DialogTrigger>
                <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
                  <DialogHeader className="text-center pb-6">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                      {editingBroker ? 'تعديل الوسيط' : 'إضافة وسيط جديد'}
                    </DialogTitle>
            </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700">اسم الوسيط</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={editingBroker?.name}
                    required 
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  />
                </div>
                      <div className="space-y-3">
                        <Label htmlFor="short_name" className="text-sm font-semibold text-slate-700">الاسم المختصر</Label>
                        <Input 
                          id="short_name" 
                          name="short_name" 
                          placeholder="مثال: أحمد، محمد، علي"
                          defaultValue={editingBroker?.short_name}
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">رقم الهاتف</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          defaultValue={editingBroker?.phone}
                          required 
                          onChange={(e) => {
                            // تنظيف الرقم تلقائياً أثناء الكتابة
                            const cleaned = cleanPhoneNumber(e.target.value);
                            if (cleaned !== e.target.value) {
                              e.target.value = cleaned;
                            }
                            
                            // فحص فوري للأرقام المكررة
                            if (cleaned) {
                              const duplicateCheck = checkDuplicatePhoneNumbers(cleaned, '', editingBroker?.id);
                              if (duplicateCheck.hasDuplicate) {
                                e.target.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
                                e.target.classList.remove('border-slate-200', 'focus:border-blue-500', 'focus:ring-blue-500/20');
                              } else {
                                e.target.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
                                e.target.classList.add('border-slate-200', 'focus:border-blue-500', 'focus:ring-blue-500/20');
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // تنظيف نهائي عند الخروج من الحقل
                            e.target.value = cleanPhoneNumber(e.target.value);
                          }}
                          placeholder="+971585700181"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                        />
                        {/* تنبيه الأرقام المكررة */}
                        <div id="phone-duplicate-warning" className="hidden text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                          ⚠️ هذا الرقم موجود بالفعل مع وسيط آخر
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="language" className="text-sm font-semibold text-slate-700">لغة الوسيط</Label>
                        <Select name="language" defaultValue={editingBroker?.language || 'arabic'}>
                          <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-xl">
                            <SelectItem value="arabic">عربي</SelectItem>
                            <SelectItem value="english">إنجليزي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">البريد الإلكتروني</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    defaultValue={editingBroker?.email}
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  />
                </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="whatsapp_number" className="text-sm font-semibold text-slate-700">رقم الواتساب</Label>
                        <Input 
                          id="whatsapp_number" 
                          name="whatsapp_number" 
                          defaultValue={editingBroker?.whatsapp_number}
                          onChange={(e) => {
                            // تنظيف الرقم تلقائياً أثناء الكتابة
                            const cleaned = cleanWhatsAppNumber(e.target.value);
                            if (cleaned !== e.target.value) {
                              e.target.value = cleaned;
                            }
                            
                            // فحص فوري للأرقام المكررة
                            if (cleaned) {
                              const duplicateCheck = checkDuplicatePhoneNumbers('', cleaned, editingBroker?.id);
                              if (duplicateCheck.hasDuplicate) {
                                e.target.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
                                e.target.classList.remove('border-slate-200', 'focus:border-blue-500', 'focus:ring-blue-500/20');
                              } else {
                                e.target.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
                                e.target.classList.add('border-slate-200', 'focus:border-blue-500', 'focus:ring-blue-500/20');
                              }
                            }
                          }}
                          onBlur={(e) => {
                            // تنظيف نهائي عند الخروج من الحقل
                            e.target.value = cleanWhatsAppNumber(e.target.value);
                          }}
                          placeholder="+971585700181"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                        />
                        {/* تنبيه الأرقام المكررة */}
                        <div id="whatsapp-duplicate-warning" className="hidden text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                          ⚠️ هذا الرقم موجود بالفعل مع وسيط آخر
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="office_name" className="text-sm font-semibold text-slate-700">المكتب العقاري</Label>
                        <Input 
                          id="office_name" 
                          name="office_name" 
                          defaultValue={editingBroker?.office_name}
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="office_location" className="text-sm font-semibold text-slate-700">موقع المكتب</Label>
                  <Input 
                    id="office_location" 
                    name="office_location"
                    defaultValue={editingBroker?.office_location}
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  />
                </div>
                      <div className="space-y-3">
                        <Label htmlFor="activity_status" className="text-sm font-semibold text-slate-700">حالة النشاط</Label>
                  <Select name="activity_status" defaultValue={editingBroker?.activity_status || 'active'}>
                          <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 rounded-xl">
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">ضعيف</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                    <div className="space-y-3">
                      <Label htmlFor="areas_specialization" className="text-sm font-semibold text-slate-700">مناطق التخصص (مفصولة بفواصل)</Label>
                <Input 
                  id="areas_specialization" 
                  name="areas_specialization"
                  placeholder="دبي, أبوظبي, الشارقة"
                  defaultValue={editingBroker?.areas_specialization?.join(', ')}
                        className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                />
              </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        className="h-12 px-8 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
                      >
                  إلغاء
                </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {createMutation.isPending || updateMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                            {editingBroker ? 'جاري التحديث...' : 'جاري الإضافة...'}
                          </div>
                        ) : (
                          editingBroker ? 'تحديث' : 'إضافة'
                        )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
            </div>
          </div>
      </div>

        {/* Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex flex-wrap gap-6 items-center">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              placeholder="البحث في الاسم أو الهاتف أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pr-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 bg-white/60 backdrop-blur-sm"
            />
          </div>
        </div>

        <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[200px] h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-white/60 backdrop-blur-sm">
            <SelectValue placeholder="فلترة بالنشاط" />
          </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl">
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="medium">متوسط</SelectItem>
            <SelectItem value="low">ضعيف</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>

        {/* فلتر اللغة الجديد */}
        <Select value={languageFilter} onValueChange={(value: 'all' | 'arabic' | 'english') => setLanguageFilter(value)}>
          <SelectTrigger className="w-[200px] h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-white/60 backdrop-blur-sm">
            <SelectValue placeholder="فلترة باللغة" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 rounded-xl">
            <SelectItem value="all">جميع اللغات</SelectItem>
            <SelectItem value="arabic">عربي</SelectItem>
            <SelectItem value="english">إنجليزي</SelectItem>
          </SelectContent>
        </Select>

        {/* أزرار الاختيار المتعدد */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={selectAllBrokers}
            className="h-12 px-4 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
          >
            اختيار الكل
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="h-12 px-4 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            إلغاء الاختيار
          </Button>
        </div>
          </div>
      </div>

      {/* Brokers Display */}
        {queryError ? (
          <Card className="bg-red-50/80 backdrop-blur-sm border-red-200 border-2">
            <CardContent className="text-center py-8">
              <div className="h-16 w-16 mx-auto text-red-400 mb-4">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-2">خطأ في تحميل البيانات</h3>
              <p className="text-red-600 mb-4">حدث خطأ أثناء جلب بيانات الوسطاء</p>
              <p className="text-sm text-red-500 mb-4">{queryError.message}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          viewMode === 'table' ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl border-0">
              <CardHeader>
                    <div className="h-6 bg-slate-300 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-300 rounded"></div>
                      <div className="h-4 bg-slate-300 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          )
      ) : brokers.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="text-center py-16">
              <div className="h-20 w-20 mx-auto text-slate-400 mb-6">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5C14.8 5.1 14.4 4.8 14 4.8S13.2 5.1 13 5.5L11 6.5H7C5.9 6.5 5 7.4 5 8.5V11H3V13H5V22H7V13H9V11H11L13 10L15 11H17V13H19V11H21V9Z"/>
              </svg>
            </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">لا يوجد وسطاء</h3>
              <p className="text-slate-600 mb-6 text-lg">لم يتم العثور على وسطاء يطابقون معايير البحث</p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 h-12 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-5 w-5 ml-2" />
              إضافة أول وسيط
            </Button>
          </CardContent>
        </Card>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                          <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50">
                    <TableHead className="text-right font-bold text-slate-800 w-12">
                      <input
                        type="checkbox"
                        checked={selectedBrokers.size === filteredBrokers.length && filteredBrokers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllBrokers();
                          } else {
                            clearSelection();
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-800">الاسم</TableHead>
                    <TableHead className="text-right font-bold text-slate-800">الاسم المختصر</TableHead>
                    <TableHead className="text-right font-bold text-slate-800">رقم الهاتف</TableHead>
                    <TableHead className="text-right font-bold text-slate-800">رقم الواتساب</TableHead>
                    <TableHead className="text-right font-bold text-slate-800">اللغة</TableHead>
                    <TableHead className="text-right font-bold text-slate-800">المكتب</TableHead>
                    <TableHead className="text-right font-bold text-slate-800">حالة النشاط</TableHead>
                    <TableHead className="text-right font-bold text-slate-800">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredBrokers.map((broker, index) => (
                  <TableRow 
                    key={broker.id} 
                    className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white/60' : 'bg-slate-50/60'
                    }`}
                  >
                    <TableCell className="py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedBrokers.has(broker.id)}
                        onChange={() => toggleBrokerSelection(broker.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 py-4">{broker.name}</TableCell>
                    <TableCell className="text-slate-600 py-4">{broker.short_name || '-'}</TableCell>
                    <TableCell className="text-slate-600 py-4">{broker.phone}</TableCell>
                    <TableCell className="text-slate-600 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {broker.whatsapp_number || 'غير محدد'}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {broker.language ? (
                        <Badge 
                          variant={broker.language === 'arabic' ? 'default' : 'secondary'}
                          className={`${
                            broker.language === 'arabic' 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}
                        >
                          {broker.language === 'arabic' ? 'عربي' : broker.language === 'english' ? 'إنجليزي' : 'غير محدد'}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">غير محدد</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-slate-600 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        {broker.office_name || 'غير محدد'}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <Badge className={`${getActivityColor(broker.activity_status)} text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm`}>
                        {getActivityLabel(broker.activity_status)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWhatsApp(broker)}
                          disabled={!broker.whatsapp_number && !broker.phone}
                          title="إرسال واتساب"
                          className="h-8 w-8 p-0 border-slate-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          <MessageCircle className="h-3 w-3 text-green-600" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEmail(broker)}
                          disabled={!broker.email}
                          title="إرسال إيميل"
                          className="h-8 w-8 p-0 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <Mail className="h-3 w-3 text-blue-600" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBroker(broker);
                            setIsDialogOpen(true);
                          }}
                          title="تعديل"
                          className="h-8 w-8 p-0 border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded-lg transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 text-amber-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(broker.id)}
                          title="حذف"
                          className="h-8 w-8 p-0 border-slate-200 hover:border-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          // Cards View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrokers.map((broker, index) => (
            <Card key={broker.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedBrokers.has(broker.id)}
                      onChange={() => toggleBrokerSelection(broker.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-slate-800">{broker.name}</CardTitle>
                      {broker.short_name && (
                        <p className="text-sm text-slate-600 font-medium">({broker.short_name})</p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getActivityColor(broker.activity_status)} text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm`}>
                    {getActivityLabel(broker.activity_status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4" />
                    {broker.phone}
                  </div>
                  
                  {broker.whatsapp_number && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MessageCircle className="h-4 w-4" />
                      {broker.whatsapp_number}
                    </div>
                  )}

                  {/* عرض اللغة */}
                  {broker.language && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={broker.language === 'arabic' ? 'default' : 'secondary'}
                        className={`${
                          broker.language === 'arabic' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}
                      >
                        {broker.language === 'arabic' ? 'عربي' : broker.language === 'english' ? 'إنجليزي' : 'غير محدد'}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {broker.office_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    {broker.office_name}
                  </div>
                )}
                
                {broker.areas_specialization && broker.areas_specialization.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-700">مناطق التخصص:</div>
                    <div className="flex flex-wrap gap-1">
                      {broker.areas_specialization.slice(0, 3).map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-slate-200 text-slate-600 rounded-full px-2 py-1">
                          {area}
                        </Badge>
                      ))}
                      {broker.areas_specialization.length > 3 && (
                        <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 rounded-full px-2 py-1">
                          +{broker.areas_specialization.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsApp(broker)}
                      disabled={!broker.whatsapp_number && !broker.phone}
                      title="إرسال واتساب"
                      className="h-9 w-9 p-0 border-slate-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all duration-200"
                    >
                      <MessageCircle className="h-3 w-3 text-green-600" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(broker)}
                      disabled={!broker.email}
                      title="إرسال إيميل"
                      className="h-9 w-9 p-0 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <Mail className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBroker(broker);
                        setIsDialogOpen(true);
                      }}
                      title="تعديل"
                      className="h-9 w-9 p-0 border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded-lg transition-all duration-200"
                    >
                      <Edit className="h-3 w-3 text-amber-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(broker.id)}
                      title="حذف"
                      className="h-9 w-9 p-0 border-slate-200 hover:border-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* WhatsApp Templates Dialog */}
      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              إرسال رسالة واتساب
            </DialogTitle>
            <div className="text-sm text-slate-600 mt-2">
              إلى: <span className="font-semibold text-slate-800">{selectedBroker?.name}</span>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* قوالب الرسائل */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">اختر قالب جاهز:</h3>
              
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-slate-600">جاري تحميل القوالب...</span>
                </div>
              ) : getFormattedTemplates(selectedBroker?.name || 'الوسيط').length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="h-16 w-16 mx-auto text-slate-300 mb-4">
                    <MessageCircle className="h-full w-full" />
                  </div>
                  <p>لا توجد قوالب متاحة حالياً</p>
                  <p className="text-sm">يمكنك إنشاء قوالب جديدة في صفحة إدارة القوالب</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getFormattedTemplates(selectedBroker?.name || 'الوسيط').map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`h-auto p-4 text-right justify-start ${
                        selectedTemplate === template.id 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                          : 'border-slate-700 hover:border-green-300 hover:bg-green-50'
                      } rounded-xl transition-all duration-200`}
                    >
                      <div className="space-y-1">
                        <div className="font-semibold">{template.title}</div>
                        <div className={`text-xs ${selectedTemplate === template.id ? 'text-green-100' : 'text-slate-600'}`}>
                          {template.message.length > 50 ? template.message.substring(0, 50) + '...' : template.message}
                        </div>
                        {template.stage && (
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            selectedTemplate === template.id ? 'bg-green-700 text-green-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {template.stage}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* رسالة مخصصة */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">أو اكتب رسالة مخصصة:</h3>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500/20 resize-none transition-all duration-200"
              />
            </div>

            {/* معاينة الرسالة */}
            {customMessage && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">معاينة الرسالة:</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-sm text-green-800 whitespace-pre-wrap">{customMessage}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsWhatsAppDialogOpen(false)}
              className="h-12 px-6 border-slate-200 hover:border-slate-300 rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => sendWhatsAppMessage(customMessage)}
              disabled={!customMessage.trim()}
              className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="h-4 w-4 ml-2" />
              إرسال الرسالة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={isBulkActionsOpen} onOpenChange={setIsBulkActionsOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              إجراءات متعددة
            </DialogTitle>
            <div className="text-sm text-slate-600 mt-2">
              {selectedBrokers.size} وسيط مختار
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* نوع الإجراء */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">نوع الإجراء:</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={bulkActionType === 'whatsapp' ? 'default' : 'outline'}
                  onClick={() => setBulkActionType('whatsapp')}
                  className={`h-12 ${
                    bulkActionType === 'whatsapp' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'border-slate-200 hover:border-green-300'
                  } rounded-xl transition-all duration-200`}
                >
                  <MessageCircle className="h-4 w-4 ml-2" />
                  رسائل واتساب
                </Button>
                
                <Button
                  variant={bulkActionType === 'task' ? 'default' : 'outline'}
                  onClick={() => setBulkActionType('task')}
                  className={`h-12 ${
                    bulkActionType === 'task' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-slate-200 hover:border-blue-300'
                  } rounded-xl transition-all duration-200`}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء مهمة
                </Button>
                
                <Button
                  variant={bulkActionType === 'export' ? 'default' : 'outline'}
                  onClick={() => setBulkActionType('export')}
                  className={`h-12 ${
                    bulkActionType === 'export' 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'border-slate-200 hover:border-purple-300'
                  } rounded-xl transition-all duration-200`}
                >
                  <Download className="h-4 w-4 ml-2" />
                  تصدير البيانات
                </Button>
                
                <Button
                  variant={bulkActionType === 'edit' ? 'default' : 'outline'}
                  onClick={() => setBulkActionType('edit')}
                  className={`h-12 ${
                    bulkActionType === 'edit' 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'border-slate-200 hover:border-amber-300'
                  } rounded-xl transition-all duration-200`}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل جماعي
                </Button>
                
                <Button
                  variant={bulkActionType === 'delete' ? 'default' : 'outline'}
                  onClick={() => setBulkActionType('delete')}
                  className={`h-12 ${
                    bulkActionType === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'border-slate-200 hover:border-red-300'
                  } rounded-xl transition-all duration-200`}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف جماعي
                </Button>
              </div>
            </div>

            {/* رسالة الواتساب */}
            {bulkActionType === 'whatsapp' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">رسالة الواتساب:</h3>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا... مثال: مرحباً، لدينا أرض جديدة للبيع في منطقة مميزة. هل تريد معرفة التفاصيل؟"
                  className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500/20 resize-none transition-all duration-200"
                />
                <div className="text-sm text-slate-500">
                  سيتم إرسال هذه الرسالة لجميع الأوسطاء المختارين
                </div>
              </div>
            )}

            {/* إنشاء مهمة */}
            {bulkActionType === 'task' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="bulk-task-title" className="text-sm font-semibold text-slate-700">عنوان المهمة:</Label>
                  <Input
                    id="bulk-task-title"
                    value={bulkTaskTitle}
                    onChange={(e) => setBulkTaskTitle(e.target.value)}
                    placeholder="مثال: التواصل مع وسطاء بخصوص أرض جديدة للبيع"
                    className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="bulk-task-description" className="text-sm font-semibold text-slate-700">وصف المهمة:</Label>
                  <textarea
                    id="bulk-task-description"
                    value={bulkTaskDescription}
                    onChange={(e) => setBulkTaskDescription(e.target.value)}
                    placeholder="وصف تفصيلي للمهمة..."
                    className="w-full h-24 p-4 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 resize-none transition-all duration-200"
                  />
                </div>
                
                <div className="text-sm text-slate-500">
                  سيتم إنشاء مهمة تحتوي على أسماء وأرقام جميع الأوسطاء المختارين
                </div>
              </div>
            )}

            {/* تصدير البيانات */}
            {bulkActionType === 'export' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">تصدير البيانات:</h3>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-sm text-slate-600">
                    سيتم تصدير البيانات التالية لجميع الأوسطاء المختارين:
                  </div>
                  <ul className="mt-2 text-sm text-slate-600 space-y-1">
                    <li>• الاسم الكامل</li>
                    <li>• رقم الهاتف</li>
                    <li>• رقم الواتساب</li>
                    <li>• اسم المكتب</li>
                    <li>• مناطق التخصص</li>
                  </ul>
                </div>
              </div>
            )}

            {/* تعديل جماعي */}
            {bulkActionType === 'edit' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">تحديث حالة النشاط (اختياري)</Label>
                    <Select value={bulkEditActivity} onValueChange={(v: any) => setBulkEditActivity(v)}>
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl">
                        <SelectValue placeholder="اختر حالة النشاط" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="low">ضعيف</SelectItem>
                        <SelectItem value="inactive">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">تحديث اللغة (اختياري)</Label>
                    <Select value={bulkEditLanguage} onValueChange={(v: any) => setBulkEditLanguage(v)}>
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl">
                        <SelectValue placeholder="اختر اللغة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arabic">عربي</SelectItem>
                        <SelectItem value="english">إنجليزي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-xs text-slate-500">سيتم تطبيق القيم المختارة فقط، واترك أي حقل فارغ إذا لا تريد تحديثه.</div>
              </div>
            )}

            {/* حذف جماعي */}
            {bulkActionType === 'delete' && (
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  سيتم حذف جميع الأوسطاء المختارين بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsBulkActionsOpen(false)}
              className="h-12 px-6 border-slate-200 hover:border-slate-300 rounded-xl"
            >
              إلغاء
            </Button>
            
            {bulkActionType === 'whatsapp' && (
              <Button
                onClick={handleBulkWhatsApp}
                disabled={!bulkMessage.trim()}
                className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="h-4 w-4 ml-2" />
                إرسال الرسائل
              </Button>
            )}
            
            {bulkActionType === 'task' && (
              <Button
                onClick={handleBulkTaskCreation}
                disabled={!bulkTaskTitle.trim()}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 ml-2" />
                إنشاء المهمة
              </Button>
            )}
            
            {bulkActionType === 'export' && (
              <Button
                onClick={exportPhoneNumbers}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير البيانات
              </Button>
            )}

            {bulkActionType === 'edit' && (
              <Button
                onClick={bulkUpdateSelectedBrokers}
                className="h-12 px-8 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105"
              >
                <Edit className="h-4 w-4 ml-2" />
                حفظ التعديلات
              </Button>
            )}

            {bulkActionType === 'delete' && (
              <Button
                onClick={bulkDeleteSelectedBrokers}
                className="h-12 px-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 hover:scale-105"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                تأكيد الحذف
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}