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
import { TextMessageTab } from '@/components/whatsapp/campaign-tabs/TextMessageTab';
import { MediaMessageTab } from '@/components/whatsapp/campaign-tabs/MediaMessageTab';
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

// تعريف التابات المتاحة
const campaignTabs = [
  {
    id: 'text',
    label: 'رسالة نصية',
    icon: MessageSquare,
    component: TextMessageTab,
    description: 'رسالة نصية بسيطة'
  },
  {
    id: 'media',
    label: 'رسالة وسائط',
    icon: Image,
    component: MediaMessageTab,
    description: 'رسالة مع صورة أو فيديو'
  },
  {
    id: 'product',
    label: 'رسالة المنتج',
    icon: Grid3X3,
    component: ProductMessageTab,
    description: 'رسالة لعرض منتج'
  },
  {
    id: 'channel',
    label: 'رسالة القناة',
    icon: Zap,
    component: ChannelMessageTab,
    description: 'رسالة من قناة'
  },
  {
    id: 'sticker',
    label: 'رسالة ملصق',
    icon: Clock,
    component: StickerMessageTab,
    description: 'رسالة ملصق'
  },
  {
    id: 'poll',
    label: 'رسالة استفتاء',
    icon: Clock,
    component: PollMessageTab,
    description: 'رسالة استطلاع رأي'
  },
  {
    id: 'list',
    label: 'رسالة قائمة',
    icon: List,
    component: ListMessageTab,
    description: 'رسالة قائمة خيارات'
  },
  {
    id: 'location',
    label: 'رسالة موقع',
    icon: MapPin,
    component: LocationMessageTab,
    description: 'رسالة مع موقع جغرافي'
  },
  {
    id: 'contact',
    label: 'رسالة جهة إتصال',
    icon: User,
    component: ContactMessageTab,
    description: 'رسالة مشاركة جهة اتصال'
  },
  {
    id: 'button',
    label: 'رسالة زر (*)',
    icon: Plus,
    component: ButtonMessageTab,
    description: 'رسالة مع أزرار تفاعلية'
  }
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
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // هنا سيتم إرسال البيانات إلى الخدمة
      console.log('Sending campaign data:', state.campaignData);
      
      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('تم إرسال الحملة بنجاح!');
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('فشل في إرسال الحملة');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
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
