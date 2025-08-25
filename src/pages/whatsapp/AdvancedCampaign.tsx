// Advanced Campaign Creation Page
// صفحة إنشاء حملة متقدمة

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  MessageSquare,
  Image,
  Grid3X3,
  Zap,
  Clock,
  List,
  MapPin,
  User,
  Plus,
  Send,
  Settings,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

// Components
import { EnhancedTextMessageTab } from '@/components/whatsapp/campaign-tabs/EnhancedTextMessageTab';
import { EnhancedMediaMessageTab } from '@/components/whatsapp/campaign-tabs/EnhancedMediaMessageTab';
import { whatsappService } from '@/services/whatsappService';
import { ProductMessageTab } from '@/components/whatsapp/campaign-tabs/ProductMessageTab';
import { ChannelMessageTab } from '@/components/whatsapp/campaign-tabs/ChannelMessageTab';
import { StickerMessageTab } from '@/components/whatsapp/campaign-tabs/StickerMessageTab';
import { PollMessageTab } from '@/components/whatsapp/campaign-tabs/PollMessageTab';
import { ListMessageTab } from '@/components/whatsapp/campaign-tabs/ListMessageTab';
import { LocationMessageTab } from '@/components/whatsapp/campaign-tabs/LocationMessageTab';
import { ContactMessageTab } from '@/components/whatsapp/campaign-tabs/ContactMessageTab';
import { ButtonMessageTab } from '@/components/whatsapp/campaign-tabs/ButtonMessageTab';

interface AdvancedCampaignState {
  isLoading: boolean;
  activeTab: string;
  campaignData: any;
}

// تعريف التابات المتاحة - ركز على النصية والوسائط الآن
const campaignTabs = [
  {
    id: 'text',
    label: 'رسالة نصية',
    icon: MessageSquare,
    component: EnhancedTextMessageTab,
    description: 'رسالة نصية مع متغيرات وقوالب'
  },
  {
    id: 'media',
    label: 'رسالة وسائط',
    icon: Image,
    component: EnhancedMediaMessageTab,
    description: 'رسالة مع صورة، فيديو، صوت أو مستند'
  },
  // الأنواع التالية ستكون متاحة في المستقبل
  /* 
  {
    id: 'product',
    label: 'رسالة المنتج',
    icon: Grid3X3,
    component: ProductMessageTab,
    description: 'رسالة لعرض منتج (قريباً)'
  },
  {
    id: 'button',
    label: 'رسالة تفاعلية',
    icon: Plus,
    component: ButtonMessageTab,
    description: 'رسالة مع أزرار تفاعلية (قريباً)'
  },
  {
    id: 'list',
    label: 'رسالة قائمة',
    icon: List,
    component: ListMessageTab,
    description: 'رسالة قائمة خيارات (قريباً)'
  },
  {
    id: 'location',
    label: 'رسالة موقع',
    icon: MapPin,
    component: LocationMessageTab,
    description: 'رسالة مع موقع جغرافي (قريباً)'
  },
  {
    id: 'contact',
    label: 'رسالة جهة إتصال',
    icon: User,
    component: ContactMessageTab,
    description: 'رسالة مشاركة جهة اتصال (قريباً)'
  }
  */
];

export default function AdvancedCampaign() {
  const [state, setState] = useState<AdvancedCampaignState>({
    isLoading: false,
    activeTab: 'text',
    campaignData: {
      name: '',
      description: '',
      messageType: 'text',
      recipients: [],
      schedule: {
        type: 'immediate',
        date: '',
        time: ''
      },
      settings: {
        personalization: false,
        tracking: true,
        retryFailed: true
      }
    }
  });

  const updateState = (updates: Partial<AdvancedCampaignState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleTabChange = (tabId: string) => {
    updateState({ activeTab: tabId });
  };

  const handleCampaignDataChange = (data: any) => {
    updateState({
      campaignData: {
        ...state.campaignData,
        ...data
      }
    });
  };

  const handleSendCampaign = async () => {
    // التحقق من صحة البيانات
    if (!state.campaignData.campaignName) {
      toast.error('يرجى إدخال اسم الحملة');
      return;
    }

    if (!state.campaignData.selectedContacts || state.campaignData.selectedContacts.length === 0) {
      toast.error('يرجى اختيار جهات اتصال على الأقل');
      return;
    }

    // التحقق من وجود رسائل صالحة
    let hasValidMessages = false;
    
    if (state.campaignData.messageType === 'text' && state.campaignData.textMessages) {
      hasValidMessages = state.campaignData.textMessages.some((msg: any) => msg.message.trim());
    } else if (state.campaignData.messageType === 'media' && state.campaignData.mediaMessages) {
      hasValidMessages = state.campaignData.mediaMessages.some((msg: any) => msg.mediaUrl && msg.message);
    }

    if (!hasValidMessages) {
      toast.error('يرجى إضافة رسالة صالحة واحدة على الأقل');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🚀 بدء إرسال الحملة:', state.campaignData);
      
      const { selectedContacts, messageType } = state.campaignData;
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // إرسال الرسائل لكل جهة اتصال
      for (const contactId of selectedContacts) {
        try {
          // العثور على جهة الاتصال
          const contact = await whatsappService.getContactById(contactId);
          if (!contact) {
            errors.push(`لم يتم العثور على جهة الاتصال ${contactId}`);
            errorCount++;
            continue;
          }

          // إرسال حسب نوع الرسالة
          if (messageType === 'text') {
            await sendTextMessages(contact, state.campaignData.textMessages);
          } else if (messageType === 'media') {
            await sendMediaMessages(contact, state.campaignData.mediaMessages);
          }

          successCount++;
          
          // تأخير بسيط بين الرسائل لتجنب الحظر
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`خطأ في إرسال رسالة للعميل ${contactId}:`, error);
          errors.push(`فشل الإرسال للعميل ${contactId}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
          errorCount++;
        }
      }

      // عرض النتائج
      if (successCount > 0) {
        toast.success(`تم إرسال الحملة بنجاح إلى ${successCount} عميل!`);
      }
      
      if (errorCount > 0) {
        console.error('أخطاء الإرسال:', errors);
        toast.error(`فشل إرسال ${errorCount} رسالة`);
      }

      // إنشاء تقرير الحملة
      const campaignReport = {
        campaignName: state.campaignData.campaignName,
        messageType,
        totalRecipients: selectedContacts.length,
        successCount,
        errorCount,
        errors,
        sentAt: new Date().toISOString()
      };

      console.log('📊 تقرير الحملة:', campaignReport);
      
    } catch (error) {
      console.error('خطأ عام في إرسال الحملة:', error);
      toast.error('حدث خطأ في إرسال الحملة');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // دالة إرسال الرسائل النصية
  const sendTextMessages = async (contact: any, textMessages: any[]) => {
    for (const textMsg of textMessages) {
      if (!textMsg.message.trim()) continue;

      // استبدال المتغيرات
      let message = textMsg.message;
      const replacements: { [key: string]: string } = {
        name: contact.name || 'العميل',
        company: contact.company || '',
        phone: contact.phone || '',
        email: contact.email || '',
        date: new Date().toLocaleDateString('ar-SA'),
        time: new Date().toLocaleTimeString('ar-SA')
      };

      textMsg.variables?.forEach((variable: string) => {
        const value = replacements[variable] || `{${variable}}`;
        message = message.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
      });

      await whatsappService.sendWhatsAppMessage(
        contact.phone,
        message,
        textMsg.footer || 'مرسل عبر StarCity Folio'
      );
    }
  };

  // دالة إرسال رسائل الوسائط
  const sendMediaMessages = async (contact: any, mediaMessages: any[]) => {
    for (const mediaMsg of mediaMessages) {
      if (!mediaMsg.mediaUrl) continue;

      await whatsappService.sendWhatsAppMessage(
        contact.phone,
        mediaMsg.message || 'رسالة وسائط',
        'مرسل عبر StarCity Folio',
        mediaMsg.mediaUrl,
        mediaMsg.mediaType,
        mediaMsg.message
      );
    }
  };

  const getActiveTab = () => {
    return campaignTabs.find(tab => tab.id === state.activeTab) || campaignTabs[0];
  };

  const ActiveTabComponent = getActiveTab().component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="flex gap-6">
          {/* المحتوى الرئيسي */}
          <div className="flex-1">
            {/* العنوان */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">إنشاء حملة متقدمة</h1>
              <p className="text-gray-600">إنشاء وإرسال حملات واتساب متقدمة مع أنواع مختلفة من الرسائل</p>
            </div>

            {/* محتوى التاب النشط */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <ActiveTabComponent
                  data={state.campaignData}
                  onChange={handleCampaignDataChange}
                  isLoading={state.isLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* الشريط الجانبي - التابات */}
          <div className="w-80">
            <Card className="bg-white shadow-sm sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">أنواع الرسائل</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {campaignTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = state.activeTab === tab.id;
                    
                    return (
                      <Button
                        key={tab.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start h-auto p-4 ${
                          isActive 
                            ? "bg-purple-600 text-white hover:bg-purple-700" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => handleTabChange(tab.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                          <div className="text-right">
                            <div className="font-medium">{tab.label}</div>
                            <div className={`text-xs ${isActive ? "text-purple-100" : "text-gray-400"}`}>
                              {tab.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                {/* أزرار التحكم */}
                <div className="p-4 space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleSendCampaign}
                    disabled={state.isLoading}
                  >
                    {state.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        إرسال الحملة
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    إعدادات متقدمة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
