// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Calendar, Clock, Edit, Trash2, CheckCircle, Filter, BarChart3, TrendingUp, AlertTriangle, Users, MapPin, Building2, Phone, Mail, MessageCircle, Download, Eye, MoreHorizontal, Send, Target, Megaphone, Grid3X3, List, RefreshCw } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";

interface LandTask {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  task_type: 'general' | 'land_related' | 'client_related' | 'broker_related' | 'communication' | 'follow_up' | 'networking' | 'sales_pitch' | 'campaign';
  related_land_id?: string;
  related_client_id?: string;
  related_broker_id?: string;
  assigned_to: string;
  created_at: string;
  communication_method?: 'phone' | 'whatsapp' | 'email' | 'meeting' | 'site_visit';
  follow_up_date?: string;
  expected_outcome?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  campaign_data?: {
    broker_ids: string[];
    message_template: string;
    sent_count: number;
    total_count: number;
  };
}

interface Broker {
  id: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  email?: string;
  activity_status: 'active' | 'medium' | 'low' | 'inactive';
}

export function LandTasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'calendar'>('cards');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LandTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<LandTask | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = useState(false);
  const [quickTaskType, setQuickTaskType] = useState<'broker_follow_up' | 'client_communication' | 'networking' | 'sales_pitch'>('broker_follow_up');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // ميزات الحملة الجديدة
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [selectedBrokers, setSelectedBrokers] = useState<Set<string>>(new Set());
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignPriority, setCampaignPriority] = useState<'medium' | 'high' | 'urgent'>('medium');
  const [campaignDueDate, setCampaignDueDate] = useState('');

  // ميزات متقدمة جديدة
  const [isCampaignReportOpen, setIsCampaignReportOpen] = useState(false);
  const [campaignReport, setCampaignReport] = useState<any>(null);
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false);
  const [failedMessages, setFailedMessages] = useState<any[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [campaignStats, setCampaignStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0
  });

  const queryClient = useQueryClient();

  // جلب الوسطاء للحملات
  const { data: brokers = [] } = useQuery({
    queryKey: ['land-brokers-for-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_brokers')
        .select('id, name, phone, whatsapp_number, email, activity_status')
        .eq('activity_status', 'active')
        .order('name');
      
      if (error) throw error;
      return data as Broker[];
    }
  });

  // دوال إدارة الحملة
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
    const allBrokerIds = brokers.map(broker => broker.id);
    setSelectedBrokers(new Set(allBrokerIds));
  };

  const clearBrokerSelection = () => {
    setSelectedBrokers(new Set());
  };

  const createCampaignTask = async () => {
    if (selectedBrokers.size === 0) {
      toast({ title: "خطأ", description: "يرجى اختيار وسطاء واحد على الأقل", variant: "destructive" });
      return;
    }

    if (!campaignTitle.trim() || !campaignMessage.trim()) {
      toast({ title: "خطأ", description: "يرجى ملء عنوان المهمة والرسالة", variant: "destructive" });
      return;
    }

    try {
      console.log('بدء إنشاء مهمة الحملة...');
      console.log('الوسطاء المختارون:', Array.from(selectedBrokers));
      
      // التحقق من المستخدم
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('خطأ في جلب المستخدم:', userError);
        throw new Error(`خطأ في المصادقة: ${userError.message}`);
      }
      
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      console.log('المستخدم:', user.id);

      const campaignData = {
        title: campaignTitle,
        description: campaignDescription,
        due_date: campaignDueDate || undefined,
        priority: campaignPriority,
        status: 'pending' as const,
        task_type: 'campaign' as const,
        assigned_to: user.id,
        communication_method: 'whatsapp' as const,
        expected_outcome: `إرسال رسالة حملة لـ ${selectedBrokers.size} وسيط`,
        notes: `رسالة الحملة: ${campaignMessage}`,
        campaign_data: {
          broker_ids: Array.from(selectedBrokers),
          message_template: campaignMessage,
          sent_count: 0,
          total_count: selectedBrokers.size
        }
      };

      console.log('بيانات الحملة:', campaignData);

      // محاولة الإدراج
      const { data: insertData, error: insertError } = await supabase
        .from('land_tasks')
        .insert(campaignData)
        .select();
      
      if (insertError) {
        console.error('خطأ في إدراج البيانات:', insertError);
        console.error('تفاصيل الخطأ:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw new Error(`فشل في حفظ البيانات: ${insertError.message}`);
      }

      console.log('تم إنشاء المهمة بنجاح:', insertData);

      toast({ title: "تم إنشاء مهمة الحملة بنجاح" });
      setIsCampaignDialogOpen(false);
      clearCampaignForm();
      queryClient.invalidateQueries({ queryKey: ['land-tasks'] });
    } catch (error) {
      console.error('خطأ شامل في إنشاء مهمة الحملة:', error);
      
      let errorMessage = 'فشل في إنشاء مهمة الحملة';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "خطأ", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const clearCampaignForm = () => {
    setCampaignTitle('');
    setCampaignDescription('');
    setCampaignMessage('');
    setCampaignPriority('medium');
    setCampaignDueDate('');
    setSelectedBrokers(new Set());
  };

  // دوال إرسال الرسائل الفعلية
  const sendWhatsAppMessage = async (broker: Broker, message: string) => {
    try {
      // تنظيف رقم الهاتف
      let phoneNumber = broker.whatsapp_number || broker.phone;
      phoneNumber = phoneNumber.replace(/\D/g, ''); // إزالة كل شيء ما عدا الأرقام
      
      // إضافة رمز البلد إذا لم يكن موجوداً
      if (!phoneNumber.startsWith('20')) { // مصر
        phoneNumber = '20' + phoneNumber;
      }
      
      // إنشاء رابط WhatsApp
      const encodedMessage = encodeURIComponent(message.replace('{name}', broker.name));
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      console.log(`إرسال رسالة لـ ${broker.name}:`, whatsappUrl);
      
      // فتح WhatsApp في نافذة جديدة
      window.open(whatsappUrl, '_blank');
      
      return { success: true, phoneNumber, whatsappUrl };
    } catch (error) {
      console.error(`خطأ في إرسال رسالة لـ ${broker.name}:`, error);
      return { success: false, error: error.message };
    }
  };

  const sendCampaignMessage = async (taskId: string, campaignData: any) => {
    try {
      console.log('بدء إرسال حملة الرسائل...');
      
      const selectedBrokersData = brokers.filter(broker => 
        campaignData.broker_ids.includes(broker.id)
      );

      console.log(`عدد الوسطاء المستهدفين: ${selectedBrokersData.length}`);

      let successCount = 0;
      let failedCount = 0;
      const results = [];

      // إرسال الرسائل لجميع الوسطاء
      for (const broker of selectedBrokersData) {
        console.log(`جاري إرسال رسالة لـ: ${broker.name}`);
        
        const result = await sendWhatsAppMessage(broker, campaignData.message_template);
        
        if (result.success) {
          successCount++;
          console.log(`✅ تم إرسال رسالة لـ ${broker.name}`);
        } else {
          failedCount++;
          console.log(`❌ فشل إرسال رسالة لـ ${broker.name}:`, result.error);
        }
        
        results.push({
          brokerId: broker.id,
          brokerName: broker.name,
          success: result.success,
          error: result.error,
          timestamp: new Date().toISOString()
        });

        // انتظار قليل بين الرسائل لتجنب الحظر
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`نتيجة الإرسال: ${successCount} نجح، ${failedCount} فشل`);

      // تحديث حالة المهمة في قاعدة البيانات
      const { error: updateError } = await supabase
        .from('land_tasks')
        .update({ 
          status: 'in_progress',
          'campaign_data.sent_count': successCount,
          notes: `تم إرسال ${successCount} رسالة، فشل ${failedCount} رسالة. ${new Date().toLocaleString('ar-EG')}`
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('خطأ في تحديث حالة المهمة:', updateError);
      }

      // عرض تقرير الإرسال
      showCampaignReport(successCount, failedCount, results);

      toast({ 
        title: "تم إرسال الحملة", 
        description: `تم إرسال ${successCount} رسالة، فشل ${failedCount} رسالة` 
      });

      queryClient.invalidateQueries({ queryKey: ['land-tasks'] });
    } catch (error) {
      console.error('خطأ شامل في إرسال الحملة:', error);
      toast({ 
        title: "خطأ", 
        description: `فشل في إرسال الحملة: ${error.message}`, 
        variant: "destructive" 
      });
    }
  };

  // دالة إرسال رسالة فردية لوسيط
  const sendIndividualMessage = async (broker: Broker, message: string) => {
    try {
      const result = await sendWhatsAppMessage(broker, message);
      
      if (result.success) {
        toast({
          title: "تم فتح WhatsApp",
          description: `تم فتح WhatsApp لإرسال رسالة لـ ${broker.name}`
        });
      } else {
        toast({
          title: "خطأ في الإرسال",
          description: `فشل في إرسال رسالة لـ ${broker.name}: ${result.error}`,
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      console.error('خطأ في إرسال رسالة فردية:', error);
      toast({
        title: "خطأ",
        description: `فشل في إرسال الرسالة: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // دوال الحملات المتقدمة
  const retryFailedMessages = async (failedList: any[]) => {
    try {
      console.log('إعادة محاولة إرسال الرسائل الفاشلة...');
      
      let retrySuccessCount = 0;
      const retryResults = [];

      for (const failed of failedList) {
        const broker = brokers.find(b => b.id === failed.brokerId);
        if (!broker) continue;

        console.log(`إعادة محاولة إرسال لـ: ${broker.name}`);
        
        const result = await sendWhatsAppMessage(broker, campaignMessage);
        
        if (result.success) {
          retrySuccessCount++;
          retryResults.push({ ...failed, retrySuccess: true });
        } else {
          retryResults.push({ ...failed, retrySuccess: false, retryError: result.error });
        }

        // انتظار بين المحاولات
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`نتيجة إعادة المحاولة: ${retrySuccessCount} نجح`);
      
      toast({
        title: "إعادة المحاولة",
        description: `تم إعادة إرسال ${retrySuccessCount} رسالة بنجاح`
      });

      return retryResults;
    } catch (error) {
      console.error('خطأ في إعادة المحاولة:', error);
      toast({
        title: "خطأ",
        description: `فشل في إعادة المحاولة: ${error.message}`,
        variant: "destructive"
      });
      return [];
    }
  };

  const scheduleCampaign = async (scheduledDateTime: string) => {
    try {
      console.log('جدولة حملة للإرسال:', scheduledDateTime);
      
      // إنشاء مهمة مجدولة
      const scheduledTask = {
        title: `${campaignTitle} (مجدولة)`,
        description: campaignDescription,
        due_date: scheduledDate,
        due_time: scheduledTime,
        priority: campaignPriority,
        status: 'pending' as const,
        task_type: 'campaign' as const,
        assigned_to: (await supabase.auth.getUser()).data.user?.id,
        communication_method: 'whatsapp' as const,
        expected_outcome: `إرسال حملة مجدولة لـ ${selectedBrokers.size} وسيط`,
        notes: `حملة مجدولة للإرسال في ${scheduledDateTime}`,
        campaign_data: {
          broker_ids: Array.from(selectedBrokers),
          message_template: campaignMessage,
          sent_count: 0,
          total_count: selectedBrokers.size,
          scheduled_for: scheduledDateTime
        }
      };

      const { error } = await supabase.from('land_tasks').insert(scheduledTask);
      
      if (error) throw error;

      toast({
        title: "تم جدولة الحملة",
        description: `سيتم إرسال الحملة في ${scheduledDateTime}`
      });

      setIsScheduleDialogOpen(false);
      clearCampaignForm();
      
    } catch (error) {
      console.error('خطأ في جدولة الحملة:', error);
      toast({
        title: "خطأ",
        description: `فشل في جدولة الحملة: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getCampaignStats = async () => {
    try {
      const { data: campaignTasks } = await supabase
        .from('land_tasks')
        .select('campaign_data, status')
        .eq('task_type', 'campaign');

      if (campaignTasks) {
        const stats = {
          total: campaignTasks.length,
          sent: campaignTasks.filter(t => t.status === 'completed').length,
          failed: campaignTasks.filter(t => t.status === 'cancelled').length,
          pending: campaignTasks.filter(t => t.status === 'pending').length
        };
        
        setCampaignStats(stats);
      }
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الحملات:', error);
    }
  };

  // تحديث دالة showCampaignReport لعرض النافذة المنبثقة
  const showCampaignReport = (successCount: number, failedCount: number, results: any[]) => {
    const report = {
      successCount,
      failedCount,
      results,
      timestamp: new Date().toLocaleString('ar-EG'),
      totalMessages: successCount + failedCount
    };

    setCampaignReport(report);
    setFailedMessages(results.filter(r => !r.success));
    setIsCampaignReportOpen(true);

    // عرض الإشعار
    toast({
      title: "تقرير إرسال الحملة",
      description: `تم إرسال ${successCount} رسالة، فشل ${failedCount} رسالة`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="المهمات اليومية" 
          description="تنظيم ومتابعة المهام اليومية"
        />
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مهمة جديدة
        </Button>
      </div>

      {/* زر إنشاء حملة جديدة */}
      <div className="flex justify-center">
        <Button
          size="lg"
          variant="outline"
          onClick={() => setIsCampaignDialogOpen(true)}
          className="h-12 px-6 border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
          title="إنشاء حملة رسائل للوسطاء"
        >
          <Megaphone className="h-5 w-5 ml-2" />
          حملة رسائل للوسطاء
        </Button>
      </div>

      {/* نافذة إنشاء الحملة */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              إنشاء حملة رسائل للوسطاء
            </DialogTitle>
            <div className="text-sm text-slate-600 mt-2">
              اختر الوسطاء واكتب رسالة الحملة لإرسالها لجميعهم
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* معلومات الحملة الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign_title" className="text-lg font-semibold text-slate-800">
                  عنوان الحملة *
                </Label>
                <Input
                  id="campaign_title"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="مثال: حملة عروض الأراضي الجديدة"
                  className="h-12 border-slate-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign_priority" className="text-lg font-semibold text-slate-800">
                  الأولوية
                </Label>
                <Select value={campaignPriority} onValueChange={(value: 'medium' | 'high' | 'urgent') => setCampaignPriority(value)}>
                  <SelectTrigger className="h-12 border-slate-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_description" className="text-lg font-semibold text-slate-800">
                وصف الحملة
              </Label>
              <Textarea
                id="campaign_description"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="وصف مختصر للحملة وأهدافها..."
                rows={3}
                className="border-slate-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_due_date" className="text-lg font-semibold text-slate-800">
                تاريخ الاستحقاق
              </Label>
              <Input
                id="campaign_due_date"
                type="date"
                value={campaignDueDate}
                onChange={(e) => setCampaignDueDate(e.target.value)}
                className="h-12 border-slate-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
              />
            </div>

            {/* اختيار الوسطاء */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-slate-800">
                  اختيار الوسطاء
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllBrokers}
                    className="h-8 px-3 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg"
                  >
                    اختيار الكل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearBrokerSelection}
                    className="h-8 px-3 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    إلغاء الاختيار
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {brokers.map((broker) => (
                    <div
                      key={broker.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedBrokers.has(broker.id)
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      onClick={() => toggleBrokerSelection(broker.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrokers.has(broker.id)}
                        onChange={() => toggleBrokerSelection(broker.id)}
                        className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{broker.name}</div>
                        <div className="text-sm text-slate-600">{broker.phone}</div>
                        {broker.whatsapp_number && (
                          <div className="text-xs text-green-600">واتساب: {broker.whatsapp_number}</div>
                        )}
                      </div>
                      <Badge className={`px-2 py-1 text-xs ${
                        broker.activity_status === 'active' ? 'bg-green-100 text-green-800' :
                        broker.activity_status === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        broker.activity_status === 'low' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {broker.activity_status === 'active' ? 'نشط' :
                         broker.activity_status === 'medium' ? 'متوسط' :
                         broker.activity_status === 'low' ? 'منخفض' : 'غير نشط'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBrokers.size > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">
                      تم اختيار {selectedBrokers.size} وسيط
                    </span>
                  </div>
                  <div className="text-sm text-red-700">
                    سيتم إرسال الرسالة لجميع الوسطاء المختارين
                  </div>
                </div>
              )}
            </div>

            {/* رسالة الحملة */}
            <div className="space-y-3">
              <Label htmlFor="campaign_message" className="text-lg font-semibold text-slate-800">
                رسالة الحملة *
              </Label>
              <Textarea
                id="campaign_message"
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                placeholder="اكتب رسالة الحملة هنا... يمكنك استخدام متغيرات مثل {name} لاسم الوسيط"
                rows={6}
                className="border-slate-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
              />
              <div className="text-sm text-slate-600">
                <div className="font-medium mb-2">نصائح للرسالة:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>استخدم اسم الوسيط في الرسالة</li>
                  <li>اكتب رسالة واضحة ومختصرة</li>
                  <li>اذكر الهدف من الحملة بوضوح</li>
                  <li>أضف معلومات التواصل إذا لزم الأمر</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsCampaignDialogOpen(false);
                clearCampaignForm();
              }}
              className="h-12 px-6 border-slate-200 hover:border-slate-300 rounded-xl"
            >
              إلغاء
            </Button>
            
            {/* زر جدولة الحملة */}
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(true)}
              className="h-12 px-6 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl"
            >
              <Clock className="h-4 w-4 ml-2" />
              جدولة
            </Button>
            
            <Button
              onClick={createCampaignTask}
              disabled={selectedBrokers.size === 0 || !campaignTitle.trim() || !campaignMessage.trim()}
              className="h-12 px-8 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Megaphone className="h-4 w-4 ml-2" />
              إنشاء حملة الرسائل
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة تقرير الحملة المتقدمة */}
      <Dialog open={isCampaignReportOpen} onOpenChange={setIsCampaignReportOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              تقرير إرسال الحملة
            </DialogTitle>
            <div className="text-sm text-slate-600 mt-2">
              تفاصيل شاملة عن نتائج إرسال الحملة
            </div>
          </DialogHeader>

          {campaignReport && (
            <div className="space-y-6">
              {/* ملخص سريع */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{campaignReport.totalMessages}</div>
                  <div className="text-sm text-green-700">إجمالي الرسائل</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{campaignReport.successCount}</div>
                  <div className="text-sm text-blue-700">رسائل ناجحة</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{campaignReport.failedCount}</div>
                  <div className="text-sm text-red-700">رسائل فاشلة</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-600">{campaignReport.timestamp}</div>
                  <div className="text-sm text-slate-700">وقت الإرسال</div>
                </div>
              </div>

              {/* تفاصيل الرسائل */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">تفاصيل الرسائل:</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {campaignReport.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        result.success
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          result.success ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-slate-800">{result.brokerName}</div>
                          <div className="text-sm text-slate-600">
                            {result.success ? 'تم الإرسال بنجاح' : `فشل: ${result.error}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(result.timestamp).toLocaleTimeString('ar-EG')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* إجراءات إضافية */}
              {campaignReport.failedCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">
                      رسائل فاشلة تحتاج إعادة محاولة
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsCampaignReportOpen(false);
                        setIsRetryDialogOpen(true);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <RefreshCw className="h-4 w-4 ml-1" />
                      إعادة محاولة الرسائل الفاشلة
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsCampaignReportOpen(false)}
              className="h-12 px-6 border-slate-200 hover:border-slate-300 rounded-xl"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة إعادة المحاولة */}
      <Dialog open={isRetryDialogOpen} onOpenChange={setIsRetryDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              إعادة محاولة الرسائل الفاشلة
            </DialogTitle>
            <div className="text-sm text-slate-600 mt-2">
              إعادة إرسال الرسائل التي فشلت في المرة الأولى
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">
                  {failedMessages.length} رسالة فاشلة
                </span>
              </div>
              <div className="text-sm text-yellow-700">
                سيتم إعادة محاولة إرسال هذه الرسائل مع انتظار أطول بين المحاولات
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {failedMessages.map((failed, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium">{failed.brokerName}</span>
                  <span className="text-xs text-slate-500">({failed.error})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsRetryDialogOpen(false)}
              className="h-12 px-6 border-slate-200 hover:border-slate-300 rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                retryFailedMessages(failedMessages);
                setIsRetryDialogOpen(false);
              }}
              className="h-12 px-8 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة جدولة الحملة */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              جدولة حملة للإرسال
            </DialogTitle>
            <div className="text-sm text-slate-600 mt-2">
              حدد وقت محدد لإرسال الحملة تلقائياً
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule_date" className="text-lg font-semibold text-slate-800">
                  التاريخ
                </Label>
                <Input
                  id="schedule_date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule_time" className="text-lg font-semibold text-slate-800">
                  الوقت
                </Label>
                <Input
                  id="schedule_time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-800">معلومات الجدولة</span>
              </div>
              <div className="text-sm text-purple-700 space-y-1">
                <div>• سيتم إنشاء مهمة مجدولة للإرسال</div>
                <div>• يمكنك مراجعة المهام المجدولة في صفحة المهام</div>
                <div>• سيتم إرسال الحملة تلقائياً في الوقت المحدد</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
              className="h-12 px-6 border-slate-200 hover:border-slate-300 rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (scheduledDate && scheduledTime) {
                  const scheduledDateTime = `${scheduledDate} ${scheduledTime}`;
                  scheduleCampaign(scheduledDateTime);
                } else {
                  toast({
                    title: "خطأ",
                    description: "يرجى تحديد التاريخ والوقت",
                    variant: "destructive"
                  });
                }
              }}
              disabled={!scheduledDate || !scheduledTime}
              className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50"
            >
              <Clock className="h-4 w-4 ml-2" />
              جدولة الحملة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}