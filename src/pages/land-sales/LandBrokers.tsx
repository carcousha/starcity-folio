import React, { useState, useMemo, useCallback, Suspense, lazy, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useUnifiedContacts } from "@/hooks/useUnifiedContacts";
import { useAutoSync } from "@/hooks/useUnifiedContacts";
import { useGlobalSelectedBrokers } from "@/hooks/useGlobalSelectedBrokers";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { Plus, Search, MessageCircle, Mail, Edit, Trash2, Phone, Grid3X3, List, Download, Building2, ExternalLink, Settings, ChevronDown, X, FileText, Eye, MoreHorizontal, Filter, RefreshCw, Send, Users, FileText as FileTextIcon, Target, ArrowRight } from "lucide-react";

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
  notes?: string;
  language?: string;
}

interface BrokerFormData {
  name: string;
  short_name: string;
  phone: string;
  email: string;
  whatsapp_number: string;
  areas_specialization: string[];
  office_name: string;
  office_location: string;
  activity_status: 'active' | 'medium' | 'low' | 'inactive';
  notes: string;
  language: 'arabic' | 'english';
}

export function LandBrokers() {
  const navigate = useNavigate();
  const { contacts, isLoading, error, refetch, addContact, updateContact, deleteContact, syncBrokers, isSyncing } = useUnifiedContacts();
  const { hasAutoSynced } = useAutoSync();
  const { addBrokers, selectedBrokers: globalSelectedBrokers, selectedCount, isTransferring, setIsTransferring } = useGlobalSelectedBrokers();
  // تحسين state للبحث مع debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'arabic' | 'english'>('all');

  // Debounce search term لتقليل عدد الاستعلامات
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [displayLimit, setDisplayLimit] = useState(50); // عرض 50 عنصر في البداية
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBulkMessageDialogOpen, setIsBulkMessageDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<LandBroker | null>(null);
  const [selectedBrokersForBulk, setSelectedBrokersForBulk] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'txt' | 'excel'>('csv');
  const [formData, setFormData] = useState<BrokerFormData>({
    name: '',
    short_name: '',
    phone: '',
    email: '',
    whatsapp_number: '',
    areas_specialization: [],
    office_name: '',
    office_location: '',
    activity_status: 'active',
    notes: '',
    language: 'arabic'
  });

  const queryClient = useQueryClient();

  // تحويل جهات الاتصال إلى تنسيق الوسطاء
  const brokers = useMemo(() => {
    return contacts
      .filter(contact => contact.role === 'broker')
      .map(contact => ({
        id: contact.id,
        name: contact.name,
        short_name: contact.metadata?.short_name || '',
        phone: contact.phone,
        email: contact.email || '',
        whatsapp_number: contact.metadata?.whatsapp_number || '',
        areas_specialization: contact.metadata?.areas_specialization || [],
        office_name: contact.metadata?.office_name || '',
        office_location: contact.metadata?.office_location || '',
        activity_status: contact.metadata?.activity_status || 'active',
        deals_count: contact.metadata?.deals_count || 0,
        total_sales_amount: contact.metadata?.total_sales_amount || 0,
        created_at: contact.created_at,
        notes: contact.notes || '',
        language: contact.language || 'arabic'
      } as LandBroker))
      .filter(broker => {
        // تطبيق فلاتر البحث
        const matchesSearch = !debouncedSearchTerm || 
          broker.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          broker.phone.includes(debouncedSearchTerm) ||
          (broker.email && broker.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        
        const matchesActivity = activityFilter === 'all' || broker.activity_status === activityFilter;
        const matchesLanguage = languageFilter === 'all' || broker.language === languageFilter;
        
        return matchesSearch && matchesActivity && matchesLanguage;
      });
  }, [contacts, debouncedSearchTerm, activityFilter, languageFilter]);

  // Bulk selection hook - سيتم نقله لاحقاً

  // Bulk messaging functions
  const handleBulkTextMessage = () => {
    if (bulkSelection.selectedCount === 0) {
      toast({
        title: "لم يتم تحديد وسطاء",
        description: "يرجى تحديد وسيط واحد على الأقل لإرسال الرسائل",
        variant: "destructive"
      });
      return;
    }

    const brokerIds = Array.from(bulkSelection.selectedIds);
    const brokerNames = bulkSelection.selectedItems.map(b => b.name);
    const brokerPhones = bulkSelection.selectedItems.map(b => b.phone);
    
    navigate(`/whatsapp/text-message?bulkMode=true&brokerIds=${brokerIds.join(',')}&brokerNames=${encodeURIComponent(brokerNames.join(','))}&brokerPhones=${brokerPhones.join(',')}`);
  };

  const handleBulkMediaMessage = () => {
    if (bulkSelection.selectedCount === 0) {
      toast({
        title: "لم يتم تحديد وسطاء",
        description: "يرجى تحديد وسيط واحد على الأقل لإرسال الرسائل",
        variant: "destructive"
      });
      return;
    }

    const brokerIds = Array.from(bulkSelection.selectedIds);
    const brokerNames = bulkSelection.selectedItems.map(b => b.name);
    const brokerPhones = bulkSelection.selectedItems.map(b => b.phone);
    
    navigate(`/whatsapp/media-message?bulkMode=true&brokerIds=${brokerIds.join(',')}&brokerNames=${encodeURIComponent(brokerNames.join(','))}&brokerPhones=${brokerPhones.join(',')}`);
  };

  const handleBulkAllTypes = () => {
    if (bulkSelection.selectedCount === 0) {
      toast({
        title: "لم يتم تحديد وسطاء",
        description: "يرجى تحديد وسيط واحد على الأقل لإرسال الرسائل",
        variant: "destructive"
      });
      return;
    }

    const brokerIds = Array.from(bulkSelection.selectedIds);
    const brokerNames = bulkSelection.selectedItems.map(b => b.name);
    const brokerPhones = bulkSelection.selectedItems.map(b => b.phone);
    
    navigate(`/whatsapp/message-types?bulkMode=true&brokerIds=${brokerIds.join(',')}&brokerNames=${encodeURIComponent(brokerNames.join(','))}&brokerPhones=${brokerPhones.join(',')}`);
  };

  // Add broker mutation
  const addBrokerMutation = useMutation({
    mutationFn: async (data: BrokerFormData) => {
      return addContact({
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: 'broker',
        language: data.language === 'arabic' ? 'ar' : 'en',
        rating: 0,
        notes: data.notes,
        metadata: {
          short_name: data.short_name,
          whatsapp_number: data.whatsapp_number,
          areas_specialization: data.areas_specialization,
          office_name: data.office_name,
          office_location: data.office_location,
          activity_status: data.activity_status,
          deals_count: 0,
          total_sales_amount: 0
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الإضافة بنجاح",
        description: "تم إضافة الوسيط بنجاح",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "خطأ في الإضافة",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update broker mutation
  const updateBrokerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BrokerFormData> }) => {
      return updateContact({
        id,
        updates: { 
          name: data.name,
          phone: data.phone,
          email: data.email
        },
        role: 'broker',
        language: data.language,
        rating: 0,
        notes: data.notes,
        metadata: {
          short_name: data.short_name,
          whatsapp_number: data.whatsapp_number,
          areas_specialization: data.areas_specialization,
          office_name: data.office_name,
          office_location: data.office_location,
          activity_status: data.activity_status,
          deals_count: 0,
          total_sales_amount: 0
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الوسيط بنجاح",
      });
      setIsEditDialogOpen(false);
      setSelectedBroker(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete broker mutation
  const deleteBrokerMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteContact(id);
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الوسيط بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      short_name: '',
      phone: '',
      email: '',
      whatsapp_number: '',
      areas_specialization: [],
      office_name: '',
      office_location: '',
      activity_status: 'active',
      notes: '',
      language: 'arabic'
    });
  };

  const handleEdit = (broker: LandBroker) => {
    setSelectedBroker(broker);
    setFormData({
      name: broker.name,
      short_name: broker.short_name || '',
      phone: broker.phone,
      email: broker.email || '',
      whatsapp_number: broker.whatsapp_number || '',
      areas_specialization: broker.areas_specialization || [],
      office_name: broker.office_name || '',
      office_location: broker.office_location || '',
      activity_status: broker.activity_status,
      notes: broker.notes || '',
      language: broker.language as 'arabic' | 'english' || 'arabic'
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (broker: LandBroker) => {
    setSelectedBroker(broker);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الوسيط؟')) {
      deleteBrokerMutation.mutate(id);
    }
  };

  const handleSubmit = (isEdit: boolean = false) => {
    if (isEdit && selectedBroker) {
      updateBrokerMutation.mutate({ id: selectedBroker.id, data: formData });
    } else {
      addBrokerMutation.mutate(formData);
    }
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-orange-100 text-orange-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      case 'inactive': return 'غير نشط';
      default: return status;
    }
  };

  // تحسين عملية الفلترة لتقليل الحمل على الواجهة  
  const filteredBrokers = useMemo(() => {
    // إذا لم يكن هناك بحث حالي أو دائم، استخدم البيانات من الخادم مباشرة
    if (!searchTerm || searchTerm === debouncedSearchTerm) {
      return brokers;
    }
    
    // فلترة محلية سريعة للكتابة الحية فقط
    if (searchTerm.length >= 2) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return brokers.filter(broker => {
        return broker.name.toLowerCase().includes(lowerSearchTerm) ||
          broker.short_name?.toLowerCase().includes(lowerSearchTerm) ||
          broker.phone.includes(searchTerm);
      });
    }
    
    return brokers;
  }, [brokers, searchTerm, debouncedSearchTerm]);

  // تحسين عرض البيانات مع pagination محلي للأداء
  const displayedBrokers = useMemo(() => {
    return filteredBrokers.slice(0, displayLimit);
  }, [filteredBrokers, displayLimit]);

  // تحسين bulk selection لتجنب إعادة الحساب المتكررة
  const bulkSelection = useBulkSelection({
    items: displayedBrokers,
    getItemId: useCallback((broker) => broker.id, [])
  });

  // Load more function
  const loadMore = useCallback(() => {
    setDisplayLimit(prev => Math.min(prev + 50, filteredBrokers.length));
  }, [filteredBrokers.length]);

  // Export functionality
  const handleExport = useCallback(() => {
    const data = filteredBrokers.map(broker => ({
      name: broker.name,
      short_name: broker.short_name || '',
      phone: broker.phone,
      email: broker.email || '',
      whatsapp_number: broker.whatsapp_number || '',
      activity_status: getActivityStatusText(broker.activity_status),
      deals_count: broker.deals_count.toString(),
      total_sales_amount: broker.total_sales_amount.toString(),
      office_name: broker.office_name || '',
      office_location: broker.office_location || '',
      language: broker.language === 'arabic' ? 'عربي' : 'إنجليزي',
      notes: broker.notes || ''
    }));

    let content = '';
    let filename = '';
    let mimeType = '';

    if (exportFormat === 'csv') {
      const headers = ['الاسم', 'الاسم المختصر', 'رقم الهاتف', 'البريد الإلكتروني', 'رقم الواتساب', 'حالة النشاط', 'عدد الصفقات', 'إجمالي المبيعات', 'اسم المكتب', 'موقع المكتب', 'اللغة', 'ملاحظات'];
      content = [
        headers,
        ...data.map(broker => [
          broker.name,
          broker.short_name,
          broker.phone,
          broker.email,
          broker.whatsapp_number,
          broker.activity_status,
          broker.deals_count,
          broker.total_sales_amount,
          broker.office_name,
          broker.office_location,
          broker.language,
          broker.notes
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      filename = `وسطاء_الأراضي_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    } else if (exportFormat === 'txt') {
      content = data.map(broker => 
        `الاسم: ${broker.name}\n` +
        `الاسم المختصر: ${broker.short_name}\n` +
        `رقم الهاتف: ${broker.phone}\n` +
        `البريد الإلكتروني: ${broker.email}\n` +
        `رقم الواتساب: ${broker.whatsapp_number}\n` +
        `حالة النشاط: ${broker.activity_status}\n` +
        `عدد الصفقات: ${broker.deals_count}\n` +
        `إجمالي المبيعات: ${broker.total_sales_amount} د.ك\n` +
        `اسم المكتب: ${broker.office_name}\n` +
        `موقع المكتب: ${broker.office_location}\n` +
        `اللغة: ${broker.language}\n` +
        `ملاحظات: ${broker.notes}\n` +
        '----------------------------------------\n'
      ).join('\n');
      filename = `وسطاء_الأراضي_${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain;charset=utf-8;';
    } else if (exportFormat === 'excel') {
      // Excel format (CSV with BOM for Arabic support)
      const headers = ['الاسم', 'الاسم المختصر', 'رقم الهاتف', 'البريد الإلكتروني', 'رقم الواتساب', 'حالة النشاط', 'عدد الصفقات', 'إجمالي المبيعات', 'اسم المكتب', 'موقع المكتب', 'اللغة', 'ملاحظات'];
      content = '\ufeff' + [
        headers,
        ...data.map(broker => [
          broker.name,
          broker.short_name,
          broker.phone,
          broker.email,
          broker.whatsapp_number,
          broker.activity_status,
          broker.deals_count,
          broker.total_sales_amount,
          broker.office_name,
          broker.office_location,
          broker.language,
          broker.notes
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      filename = `وسطاء_الأراضي_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير البيانات بصيغة ${exportFormat.toUpperCase()}`,
    });
  }, [filteredBrokers, exportFormat]);

  // Bulk message functionality
  const sendBulkMessageMutation = useMutation({
    mutationFn: async ({ brokerIds, message }: { brokerIds: string[], message: string }) => {
      // Here you would integrate with your WhatsApp service
      // For now, we'll simulate the process
      const selectedBrokersData = filteredBrokers.filter(broker => brokerIds.includes(broker.id));
      
      // Simulate sending messages
      for (const broker of selectedBrokersData) {
        if (broker.whatsapp_number) {
          console.log(`Sending message to ${broker.name} (${broker.whatsapp_number}): ${message}`);
          // await sendWhatsAppMessage(broker.whatsapp_number, message);
        }
      }
      
      return { success: true, count: selectedBrokersData.length };
    },
    onSuccess: (data) => {
      toast({
        title: "تم إرسال الرسائل بنجاح",
        description: `تم إرسال الرسالة إلى ${data.count} وسيط`,
      });
      setIsBulkMessageDialogOpen(false);
      setBulkMessage('');
      setSelectedBrokersForBulk([]);
    },
    onError: (error) => {
      toast({
        title: "خطأ في إرسال الرسائل",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleBulkMessage = () => {
    if (selectedBrokersForBulk.length === 0) {
      toast({
        title: "تحذير",
        description: "يرجى اختيار وسطاء لإرسال الرسالة إليهم",
        variant: "destructive",
      });
      return;
    }
    
    if (!bulkMessage.trim()) {
      toast({
        title: "تحذير",
        description: "يرجى كتابة الرسالة",
        variant: "destructive",
      });
      return;
    }

    sendBulkMessageMutation.mutate({ brokerIds: selectedBrokersForBulk, message: bulkMessage });
  };

  const handleSelectAll = () => {
    if (selectedBrokersForBulk.length === filteredBrokers.length) {
      setSelectedBrokersForBulk([]);
    } else {
      setSelectedBrokersForBulk(filteredBrokers.map(broker => broker.id));
    }
  };

  const handleSelectBroker = (brokerId: string) => {
    if (selectedBrokersForBulk.includes(brokerId)) {
      setSelectedBrokersForBulk(selectedBrokersForBulk.filter(id => id !== brokerId));
    } else {
      setSelectedBrokersForBulk([...selectedBrokersForBulk, brokerId]);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader
          title="الوسطاء"
          description="إدارة وسطاء الأراضي والعقارات"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader
          title="الوسطاء"
          description="إدارة وسطاء الأراضي والعقارات"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">خطأ في تحميل البيانات</p>
            <Button onClick={() => refetch()}>إعادة المحاولة</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="الوسطاء"
        description="إدارة وسطاء الأراضي والعقارات"
      />

      {/* Bulk Actions Toolbar */}
      {bulkSelection.selectedCount > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">
                  تم تحديد {bulkSelection.selectedCount} وسيط
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkSelection.clearSelection}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-1" />
                إلغاء التحديد
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkTextMessage}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                رسالة نصية جماعية
              </Button>
              <Button
                onClick={handleBulkMediaMessage}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <FileTextIcon className="h-4 w-4 mr-1" />
                رسالة وسائط جماعية
              </Button>
              <Button
                onClick={handleBulkAllTypes}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Target className="h-4 w-4 mr-1" />
                جميع الأنواع
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الوسطاء..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="حالة النشاط" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="low">منخفض</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={languageFilter} onValueChange={(v: any) => setLanguageFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="اللغة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع اللغات</SelectItem>
              <SelectItem value="arabic">عربي</SelectItem>
              <SelectItem value="english">إنجليزي</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
          >
            {viewMode === 'table' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={filteredBrokers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsBulkMessageDialogOpen(true)}
            disabled={filteredBrokers.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            رسائل جماعية
          </Button>
          
          <Button
            variant="default"
            onClick={() => {
              console.log('Selected brokers for bulk:', selectedBrokersForBulk);
              console.log('Filtered brokers:', filteredBrokers);
              
              const selectedBrokersData = filteredBrokers.filter(broker => 
                selectedBrokersForBulk.includes(broker.id)
              );
              
              console.log('Selected brokers data:', selectedBrokersData);
              
              if (selectedBrokersData.length > 0) {
                addBrokers(selectedBrokersData);
                setIsTransferring(true);
                
                // Simulate transfer delay
                setTimeout(() => {
                  setIsTransferring(false);
                  navigate('/land-sales/advanced-tasks');
                  toast({
                    title: "تم النقل بنجاح",
                    description: `تم نقل ${selectedBrokersData.length} وسيط إلى صفحة المهام المتقدمة`,
                  });
                }, 1000);
              } else {
                toast({
                  title: "تحذير",
                  description: "يرجى اختيار وسطاء للنقل إلى المهام المتقدمة",
                  variant: "destructive",
                });
              }
            }}
            disabled={selectedBrokersForBulk.length === 0 || isTransferring}
          >
            <Target className="h-4 w-4 mr-2" />
            {isTransferring ? "جاري النقل..." : `نقل للمهام (${selectedBrokersForBulk.length})`}
          </Button>
          
          <Button
            onClick={() => {
              syncBrokers();
              toast({
                title: "تم بدء المزامنة",
                description: "جاري مزامنة جهات الاتصال...",
              });
            }}
            variant="outline"
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "جاري المزامنة..." : "مزامنة"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/contacts')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Users className="h-4 w-4 mr-2" />
            جهات الاتصال
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إضافة وسيط
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة وسيط جديد</DialogTitle>
                <DialogDescription>
                  قم بإدخال بيانات الوسيط الجديد في النموذج أدناه
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="الاسم الكامل"
                  />
                </div>
                <div>
                  <Label htmlFor="short_name">الاسم المختصر</Label>
                  <Input
                    id="short_name"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    placeholder="الاسم المختصر"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp_number">رقم الواتساب</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="رقم الواتساب"
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="البريد الإلكتروني"
                  />
                </div>
                <div>
                  <Label htmlFor="activity_status">حالة النشاط</Label>
                  <Select value={formData.activity_status} onValueChange={(v: any) => setFormData({ ...formData, activity_status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">اللغة</Label>
                  <Select value={formData.language} onValueChange={(v: any) => setFormData({ ...formData, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arabic">عربي</SelectItem>
                      <SelectItem value="english">إنجليزي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="office_name">اسم المكتب</Label>
                  <Input
                    id="office_name"
                    value={formData.office_name}
                    onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                    placeholder="اسم المكتب"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="office_location">موقع المكتب</Label>
                  <Input
                    id="office_location"
                    value={formData.office_location}
                    onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                    placeholder="موقع المكتب"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={() => handleSubmit(false)}
                  disabled={addBrokerMutation.isPending || !formData.name || !formData.phone}
                >
                  {addBrokerMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الوسطاء</p>
                <p className="text-2xl font-bold">{brokers.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">وسطاء نشطين</p>
                <p className="text-2xl font-bold">{brokers.filter(b => b.activity_status === 'active').length}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الصفقات</p>
                <p className="text-2xl font-bold">{brokers.reduce((sum, b) => sum + b.deals_count, 0)}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold">
                  {brokers.reduce((sum, b) => sum + b.total_sales_amount, 0).toLocaleString()} د.ك
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {filteredBrokers.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || activityFilter !== 'all' || languageFilter !== 'all' 
                  ? 'جرب تغيير معايير البحث أو الفلترة' 
                  : 'لم يتم العثور على وسطاء بعد. ابدأ بإضافة وسيط جديد.'}
              </p>
              {!searchTerm && activityFilter === 'all' && languageFilter === 'all' && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة وسيط جديد
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>قائمة الوسطاء ({filteredBrokers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = bulkSelection.isIndeterminate;
                      }}
                      onChange={bulkSelection.toggleAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>حالة النشاط</TableHead>
                  <TableHead>عدد الصفقات</TableHead>
                  <TableHead>إجمالي المبيعات</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrokers.map((broker) => (
                  <TableRow key={broker.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(broker.id)}
                        onChange={() => bulkSelection.toggleItem(broker.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{broker.name}</p>
                        {broker.short_name && (
                          <p className="text-sm text-gray-500">{broker.short_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {broker.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {broker.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {broker.email}
                        </div>
                      ) : (
                        <span className="text-gray-400">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActivityStatusColor(broker.activity_status)}>
                        {getActivityStatusText(broker.activity_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{broker.deals_count}</TableCell>
                    <TableCell>{broker.total_sales_amount.toLocaleString()} د.ك</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(broker)}>
                            <Eye className="h-4 w-4 mr-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(broker)}>
                            <Edit className="h-4 w-4 mr-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Target className="h-4 w-4 mr-2" />
                              المهام
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuLabel>أنواع الرسائل</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => navigate(`/whatsapp/text-message?brokerId=${broker.id}&brokerName=${encodeURIComponent(broker.name)}&brokerPhone=${broker.phone}`)}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                رسالة نصية
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => navigate(`/whatsapp/media-message?brokerId=${broker.id}&brokerName=${encodeURIComponent(broker.name)}&brokerPhone=${broker.phone}`)}
                              >
                                <FileTextIcon className="h-4 w-4 mr-2" />
                                رسالة وسائط
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => navigate(`/whatsapp/message-types?brokerId=${broker.id}&brokerName=${encodeURIComponent(broker.name)}&brokerPhone=${broker.phone}`)}
                                className="text-blue-600"
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                جميع الأنواع
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(broker.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium">عرض البطاقات ({filteredBrokers.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrokers.map((broker) => (
              <Card key={broker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bulkSelection.isSelected(broker.id)}
                      onChange={() => bulkSelection.toggleItem(broker.id)}
                      className="absolute top-2 right-2 z-10 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{broker.name}</CardTitle>
                      {broker.short_name && (
                        <p className="text-sm text-gray-500">{broker.short_name}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(broker)}>
                        <Eye className="h-4 w-4 mr-2" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(broker)}>
                        <Edit className="h-4 w-4 mr-2" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Target className="h-4 w-4 mr-2" />
                          المهام
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuLabel>أنواع الرسائل</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => navigate(`/whatsapp/text-message?brokerId=${broker.id}&brokerName=${encodeURIComponent(broker.name)}&brokerPhone=${broker.phone}`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            رسالة نصية
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate(`/whatsapp/media-message?brokerId=${broker.id}&brokerName=${encodeURIComponent(broker.name)}&brokerPhone=${broker.phone}`)}
                          >
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            رسالة وسائط
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => navigate(`/whatsapp/message-types?brokerId=${broker.id}&brokerName=${encodeURIComponent(broker.name)}&brokerPhone=${broker.phone}`)}
                            className="text-blue-600"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            جميع الأنواع
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(broker.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{broker.phone}</span>
                  </div>
                  
                  {broker.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{broker.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getActivityStatusColor(broker.activity_status)}>
                      {getActivityStatusText(broker.activity_status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">الصفقات</p>
                      <p className="font-medium">{broker.deals_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">المبيعات</p>
                      <p className="font-medium">{broker.total_sales_amount.toLocaleString()} د.ك</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الوسيط</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات الوسيط في النموذج أدناه
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">الاسم الكامل *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="الاسم الكامل"
              />
            </div>
            <div>
              <Label htmlFor="edit-short_name">الاسم المختصر</Label>
              <Input
                id="edit-short_name"
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                placeholder="الاسم المختصر"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">رقم الهاتف *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>
            <div>
              <Label htmlFor="edit-whatsapp_number">رقم الواتساب</Label>
              <Input
                id="edit-whatsapp_number"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="رقم الواتساب"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="البريد الإلكتروني"
              />
            </div>
            <div>
              <Label htmlFor="edit-activity_status">حالة النشاط</Label>
              <Select value={formData.activity_status} onValueChange={(v: any) => setFormData({ ...formData, activity_status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-language">اللغة</Label>
              <Select value={formData.language} onValueChange={(v: any) => setFormData({ ...formData, language: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arabic">عربي</SelectItem>
                  <SelectItem value="english">إنجليزي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-office_name">اسم المكتب</Label>
              <Input
                id="edit-office_name"
                value={formData.office_name}
                onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                placeholder="اسم المكتب"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-office_location">موقع المكتب</Label>
              <Input
                id="edit-office_location"
                value={formData.office_location}
                onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                placeholder="موقع المكتب"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => handleSubmit(true)}
              disabled={updateBrokerMutation.isPending || !formData.name || !formData.phone}
            >
              {updateBrokerMutation.isPending ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الوسيط</DialogTitle>
            <DialogDescription>
              عرض تفاصيل الوسيط المحدد
            </DialogDescription>
          </DialogHeader>
          {selectedBroker && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">الاسم الكامل</Label>
                  <p className="text-lg font-medium">{selectedBroker.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">الاسم المختصر</Label>
                  <p className="text-lg">{selectedBroker.short_name || 'غير محدد'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">رقم الهاتف</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-lg">{selectedBroker.phone}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">رقم الواتساب</Label>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <p className="text-lg">{selectedBroker.whatsapp_number || 'غير محدد'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">البريد الإلكتروني</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-lg">{selectedBroker.email || 'غير محدد'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">حالة النشاط</Label>
                  <Badge className={getActivityStatusColor(selectedBroker.activity_status)}>
                    {getActivityStatusText(selectedBroker.activity_status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">اللغة</Label>
                  <p className="text-lg">{selectedBroker.language === 'arabic' ? 'عربي' : 'إنجليزي'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">اسم المكتب</Label>
                  <p className="text-lg">{selectedBroker.office_name || 'غير محدد'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">موقع المكتب</Label>
                  <p className="text-lg">{selectedBroker.office_location || 'غير محدد'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">عدد الصفقات</Label>
                  <p className="text-lg font-medium">{selectedBroker.deals_count}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">إجمالي المبيعات</Label>
                  <p className="text-lg font-medium">{selectedBroker.total_sales_amount.toLocaleString()} د.ك</p>
                </div>
                {selectedBroker.notes && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">ملاحظات</Label>
                    <p className="text-lg">{selectedBroker.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Message Dialog */}
      <Dialog open={isBulkMessageDialogOpen} onOpenChange={setIsBulkMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إرسال رسائل جماعية</DialogTitle>
            <DialogDescription>
              إرسال رسائل جماعية للوسطاء المحددين
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اختيار الوسطاء</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {filteredBrokers.map((broker) => (
                  <div key={broker.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`broker-${broker.id}`}
                      checked={selectedBrokersForBulk.includes(broker.id)}
                      onChange={() => handleSelectBroker(broker.id)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`broker-${broker.id}`} className="text-sm">
                      {broker.name} - {broker.phone}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                تم اختيار {selectedBrokersForBulk.length} وسيط من أصل {filteredBrokers.length}
              </p>
            </div>
            {selectedBrokersForBulk.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  سيتم إرسال الرسالة إلى {selectedBrokersForBulk.length} وسيط محدد
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="bulk-message">الرسالة</Label>
              <Textarea
                id="bulk-message"
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="اكتب الرسالة هنا..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkMessageDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleBulkMessage}
              disabled={sendBulkMessageMutation.isPending || selectedBrokersForBulk.length === 0 || !bulkMessage.trim()}
            >
              {sendBulkMessageMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تصدير البيانات</DialogTitle>
            <DialogDescription>
              اختر تنسيق التصدير المطلوب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اختر صيغة التصدير</Label>
              <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                  <SelectItem value="excel">Excel (CSV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              سيتم تصدير {filteredBrokers.length} وسيط بصيغة {exportFormat.toUpperCase()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleExport}>
              تصدير
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}