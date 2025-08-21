// Advanced Text Message Campaign Page
// صفحة حملة الرسائل النصية المتقدمة مع جميع الميزات الذكية

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare,
  Users,
  ArrowLeft,
  Send,
  CheckCircle,
  Settings,
  Eye,
  Wand2,
  Clock,
  Activity,
  RotateCcw,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { supabase } from '@/integrations/supabase/client';
import { smartMessageService, TimingSettings, SendProgress as SendProgressType } from '@/services/smartMessageService';
import { SmartMessageEditor } from '@/components/whatsapp/SmartMessageEditor';
import { TimingSettings as TimingSettingsComponent } from '@/components/whatsapp/TimingSettings';
import { SendProgress } from '@/components/whatsapp/SendProgress';
import { MessagePreview } from '@/components/whatsapp/MessagePreview';
import { toast } from 'sonner';

export default function AdvancedTextMessage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // بيانات الوسيط من الرابط
  const brokerId = searchParams.get('brokerId');
  const brokerName = searchParams.get('brokerName');
  const brokerPhone = searchParams.get('brokerPhone');
  
  // الوضع الجماعي
  const bulkMode = searchParams.get('bulkMode') === 'true';
  const brokerIds = searchParams.get('brokerIds')?.split(',') || [];
  const brokerNames = searchParams.get('brokerNames') ? decodeURIComponent(searchParams.get('brokerNames')!).split(',') : [];
  const brokerPhones = searchParams.get('brokerPhones')?.split(',') || [];
  
  // حالات الحملة
  const [campaignName, setCampaignName] = useState(() => {
    if (bulkMode && brokerNames.length > 0) {
      return `حملة جماعية - ${brokerNames.length} وسيط`;
    }
    return brokerName ? `حملة ${brokerName}` : '';
  });
  const [campaignDescription, setCampaignDescription] = useState('');
  
  // حالات الرسالة
  const [messageTemplate, setMessageTemplate] = useState('');
  
  // حالات جهات الاتصال
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactsFilter, setContactsFilter] = useState('');

  // الميزات المتقدمة
  const [timingSettings, setTimingSettings] = useState<TimingSettings>({
    type: 'random',
    randomMin: 3,
    randomMax: 8
  });
  const [sendProgress, setSendProgress] = useState<SendProgressType[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTab, setCurrentTab] = useState('compose');

  // تحميل جهات الاتصال عند بداية التحميل
  useEffect(() => {
    loadContacts();
  }, []);

  // تحديد الوسيط تلقائياً إذا كان موجوداً في الرابط
  useEffect(() => {
    if (brokerId && contacts.length > 0) {
      const brokerContact = contacts.find(c => c.id === brokerId);
      if (brokerContact) {
        setSelectedContacts([brokerId]);
      }
    }
  }, [brokerId, contacts]);

  const loadContacts = async () => {
    try {
      console.log('🔍 [AdvancedTextMessage] Loading contacts...');
      
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [AdvancedTextMessage] Error loading contacts:', error);
        throw error;
      }

      console.log('✅ [AdvancedTextMessage] Contacts loaded successfully:', data?.length || 0);
      setContacts(data || []);
    } catch (error) {
      console.error('❌ [AdvancedTextMessage] Error in loadContacts:', error);
      toast.error('فشل في تحميل جهات الاتصال');
    }
  };

  // تحديد جهة اتصال
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  // تحديد الكل
  const selectAllContacts = () => {
    const filteredContactIds = filteredContacts.map(c => c.id);
    setSelectedContacts(filteredContactIds);
  };

  // إلغاء تحديد الكل
  const deselectAllContacts = () => {
    setSelectedContacts([]);
  };

  // تصفية جهات الاتصال
  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(contactsFilter.toLowerCase()) ||
    contact.phone?.includes(contactsFilter) ||
    contact.company?.toLowerCase().includes(contactsFilter.toLowerCase())
  );

  // إرسال الحملة المتقدم
  const handleSendCampaign = async () => {
    // التحقق من صحة البيانات
    if (!campaignName.trim()) {
      toast.error('يرجى إدخال اسم الحملة');
      return;
    }

    if (!messageTemplate.trim()) {
      toast.error('يرجى إدخال نص الرسالة');
      return;
    }

    // التحقق من وجود جهات اتصال (في الوضع العادي أو الجماعي)
    const hasContacts = bulkMode 
      ? brokerPhones.length > 0 
      : selectedContacts.length > 0;
      
    if (!hasContacts) {
      toast.error(bulkMode 
        ? 'لا توجد أرقام هواتف للوسطاء المحددين' 
        : 'يرجى اختيار جهات اتصال على الأقل'
      );
      return;
    }

    // التحقق من صحة القالب
    const validation = smartMessageService.validateTemplate(messageTemplate);
    if (!validation.isValid) {
      toast.error(`خطأ في القالب: ${validation.errors.join(', ')}`);
      return;
    }

    setCurrentTab('sending');
    setIsSending(true);
    setSendProgress([]);

    try {
      // تحديد قائمة جهات الاتصال بناءً على الوضع
      const contactsToSend = bulkMode 
        ? brokerPhones.map((phone, index) => ({
            id: brokerIds[index] || `bulk_${index}`,
            name: brokerNames[index] || 'وسيط',
            phone: phone,
            company: 'وسيط عقاري',
            email: '',
            short_name: brokerNames[index]?.split(' ')[0] || 'وسيط',
            office_name: 'مكتب عقاري',
            areas_specialization: ['عقارات']
          }))
        : await Promise.all(
            selectedContacts.map(async (contactId) => {
              const contact = await whatsappService.getContactById(contactId);
              return contact;
            })
          ).then(contacts => contacts.filter(Boolean));

      if (contactsToSend.length === 0) {
        toast.error('لا توجد جهات اتصال صالحة للإرسال');
        setIsSending(false);
        return;
      }

      // استخدام النظام الذكي للإرسال
      await smartMessageService.processBulkMessages(
        messageTemplate,
        contactsToSend,
        timingSettings,
        // تحديث التقدم
        (progress) => {
          setSendProgress(prev => {
            const updated = [...prev];
            const index = updated.findIndex(p => p.id === progress.id);
            if (index >= 0) {
              updated[index] = progress;
            } else {
              updated.push(progress);
            }
            return updated;
          });
        },
        // عند اكتمال الإرسال
        (results) => {
          const successCount = results.filter(r => r.status === 'success').length;
          const failedCount = results.filter(r => r.status === 'failed').length;
          
          if (successCount > 0) {
            toast.success(`تم إرسال ${successCount} رسالة بنجاح!`);
          }
          
          if (failedCount > 0) {
            toast.error(`فشل إرسال ${failedCount} رسالة`);
          }

          console.log('📊 تقرير الحملة المتقدم:', {
            campaignName,
            messageType: 'text',
            totalRecipients: contactsToSend.length,
            successCount,
            failedCount,
            results,
            timingSettings,
            sentAt: new Date().toISOString()
          });
        }
      );
      
    } catch (error) {
      console.error('خطأ عام في إرسال الحملة:', error);
      toast.error('حدث خطأ في إرسال الحملة');
    } finally {
      setIsSending(false);
    }
  };

  // إعادة إرسال الرسائل الفاشلة
  const handleRetryFailed = async (failedItems: SendProgressType[]) => {
    setIsSending(true);
    
    try {
      await smartMessageService.retryFailedMessages(
        messageTemplate,
        failedItems,
        timingSettings,
        (progress) => {
          setSendProgress(prev => {
            const updated = [...prev];
            const index = updated.findIndex(p => p.id === progress.id);
            if (index >= 0) {
              updated[index] = progress;
            }
            return updated;
          });
        }
      );

      toast.success('تم إعادة المحاولة للرسائل الفاشلة');
      
    } catch (error) {
      toast.error('فشل في إعادة الإرسال');
    } finally {
      setIsSending(false);
    }
  };

  // إيقاف مؤقت للإرسال
  const handlePause = () => {
    setIsPaused(true);
    toast.info('تم إيقاف الإرسال مؤقتاً');
  };

  // استئناف الإرسال
  const handleResume = () => {
    setIsPaused(false);
    toast.info('تم استئناف الإرسال');
  };

  // إيقاف الإرسال نهائياً
  const handleStop = () => {
    setIsSending(false);
    setIsPaused(false);
    toast.info('تم إيقاف الإرسال');
  };

  // تحديد قائمة جهات الاتصال للمعاينة
  const contactsForPreview = bulkMode 
    ? brokerPhones.map((phone, index) => ({
        id: brokerIds[index] || `bulk_${index}`,
        name: brokerNames[index] || 'وسيط',
        phone: phone,
        company: 'وسيط عقاري',
        short_name: brokerNames[index]?.split(' ')[0] || 'وسيط'
      }))
    : selectedContacts.map(id => contacts.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/whatsapp/message-types')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              رجوع
            </Button>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">حملة الرسائل النصية المتقدمة</h1>
                  <p className="text-gray-600">نظام ذكي مع البدائل النصية والتوقيت المتحكم به</p>
                  {(brokerName || (bulkMode && brokerNames.length > 0)) && (
                    <div className="mt-2">
                      {bulkMode && brokerNames.length > 0 ? (
                        <div className="space-y-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            👥 وضع جماعي: {brokerNames.length} وسيط محدد
                          </Badge>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {brokerNames.slice(0, 5).map((name, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                            {brokerNames.length > 5 && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                +{brokerNames.length - 5} المزيد
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          🎯 مختار للوسيط: {brokerName}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* التبويبات الرئيسية */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              إنشاء الرسالة
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              إعدادات التوقيت
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              معاينة
            </TabsTrigger>
            <TabsTrigger value="sending" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              الإرسال
            </TabsTrigger>
          </TabsList>

          {/* تبويب إنشاء الرسالة */}
          <TabsContent value="compose" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* معلومات الحملة */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات الحملة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="campaign-name">اسم الحملة *</Label>
                      <Input
                        id="campaign-name"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="اسم الحملة"
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaign-description">وصف الحملة</Label>
                      <Textarea
                        id="campaign-description"
                        value={campaignDescription}
                        onChange={(e) => setCampaignDescription(e.target.value)}
                        placeholder="وصف مختصر للحملة"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* محرر الرسائل الذكي */}
                <SmartMessageEditor
                  value={messageTemplate}
                  onChange={setMessageTemplate}
                  contacts={contactsForPreview}
                  placeholder="اكتب رسالتك هنا...

مثال على البدائل النصية:
{أهلاً|مرحباً|هاي} {name}، {كيف حالك؟|أرجو أن تكون بخير}

يمكنك استخدام المتغيرات:
- {name} للاسم الكامل
- {short_name} للاسم المختصر  
- {company} للشركة
- {date} للتاريخ الحالي
- {time} للوقت الحالي"
                />
              </div>

              {/* جهات الاتصال */}
              {!bulkMode && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        جهات الاتصال ({selectedContacts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="البحث في جهات الاتصال..."
                          value={contactsFilter}
                          onChange={(e) => setContactsFilter(e.target.value)}
                          className="flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllContacts}
                        >
                          تحديد الكل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllContacts}
                        >
                          إلغاء التحديد
                        </Button>
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedContacts.includes(contact.id)
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => toggleContactSelection(contact.id)}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedContacts.includes(contact.id)}
                                onChange={() => {}}
                                className="rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{contact.name}</p>
                                <p className="text-xs text-gray-500 truncate">{contact.phone}</p>
                                {contact.company && (
                                  <p className="text-xs text-gray-400 truncate">{contact.company}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredContacts.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          لا توجد جهات اتصال متطابقة
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* تبويب إعدادات التوقيت */}
          <TabsContent value="settings" className="space-y-6">
            <TimingSettingsComponent
              settings={timingSettings}
              onChange={setTimingSettings}
              messageCount={bulkMode ? brokerPhones.length : selectedContacts.length}
            />
          </TabsContent>

          {/* تبويب المعاينة */}
          <TabsContent value="preview" className="space-y-6">
            <MessagePreview
              template={messageTemplate}
              contacts={contactsForPreview}
              onSend={handleSendCampaign}
              showSendButton={true}
            />
          </TabsContent>

          {/* تبويب الإرسال */}
          <TabsContent value="sending" className="space-y-6">
            <SendProgress
              progress={sendProgress}
              isActive={isSending && !isPaused}
              onRetry={handleRetryFailed}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              showDetails={true}
            />
          </TabsContent>
        </Tabs>

        {/* أزرار التحكم الثابتة */}
        <div className="fixed bottom-6 right-6 flex items-center gap-3">
          {currentTab !== 'sending' && (
            <Button
              onClick={handleSendCampaign}
              disabled={!campaignName.trim() || !messageTemplate.trim() || (!bulkMode && selectedContacts.length === 0) || (bulkMode && brokerPhones.length === 0)}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg"
            >
              <Send className="h-5 w-5 mr-2" />
              إرسال الحملة ({bulkMode ? brokerPhones.length : selectedContacts.length})
            </Button>
          )}

          {isSending && (
            <div className="flex items-center gap-2">
              {!isPaused ? (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  size="lg"
                  className="shadow-lg"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  إيقاف مؤقت
                </Button>
              ) : (
                <Button
                  onClick={handleResume}
                  variant="outline"
                  size="lg"
                  className="shadow-lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  استئناف
                </Button>
              )}

              <Button
                onClick={handleStop}
                variant="destructive"
                size="lg"
                className="shadow-lg"
              >
                <Square className="h-5 w-5 mr-2" />
                إيقاف نهائي
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
