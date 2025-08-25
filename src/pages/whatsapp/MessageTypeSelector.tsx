// Message Type Selector Page
// صفحة اختيار نوع الرسالة

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Image,
  Radio,
  Sticker,
  BarChart3,
  List,
  MapPin,
  User,
  MousePointer,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MessageType {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  status: 'ready' | 'coming-soon';
  color: string;
  gradient: string;
}

const messageTypes: MessageType[] = [
  {
    id: 'text',
    title: 'رسالة نصية',
    description: 'رسائل نصية مع متغيرات وقوالب ذكية',
    icon: MessageSquare,
    route: '/whatsapp/text-message',
    status: 'ready',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'media',
    title: 'رسالة وسائط',
    description: 'صور، فيديو، صوت، ومستندات مع نص اختياري',
    icon: Image,
    route: '/whatsapp/media-message',
    status: 'ready',
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'channel',
    title: 'رسالة القناة',
    description: 'رسائل من قنوات واتساب للأعمال',
    icon: Radio,
    route: '/whatsapp/channel-message',
    status: 'coming-soon',
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'sticker',
    title: 'رسالة ملصق',
    description: 'ملصقات تعبيرية وتفاعلية',
    icon: Sticker,
    route: '/whatsapp/sticker-message',
    status: 'coming-soon',
    color: 'text-yellow-600',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'poll',
    title: 'رسالة استفتاء',
    description: 'استطلاعات رأي تفاعلية مع خيارات متعددة',
    icon: BarChart3,
    route: '/whatsapp/poll-message',
    status: 'coming-soon',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'list',
    title: 'رسالة قائمة',
    description: 'قوائم خيارات منظمة وسهلة التصفح',
    icon: List,
    route: '/whatsapp/list-message',
    status: 'coming-soon',
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-600'
  },
  {
    id: 'location',
    title: 'رسالة موقع',
    description: 'مشاركة المواقع الجغرافية والعناوين',
    icon: MapPin,
    route: '/whatsapp/location-message',
    status: 'coming-soon',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'contact',
    title: 'رسالة جهة اتصال',
    description: 'مشاركة معلومات جهات الاتصال والبروفايلات',
    icon: User,
    route: '/whatsapp/contact-message',
    status: 'coming-soon',
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-600'
  },
  {
    id: 'button',
    title: 'رسالة أزرار',
    description: 'رسائل تفاعلية مع أزرار للإجراءات المباشرة',
    icon: MousePointer,
    route: '/whatsapp/button-message',
    status: 'coming-soon',
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-pink-600'
  }
];

export default function MessageTypeSelector() {
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

  const handleMessageTypeSelect = (messageType: MessageType) => {
    if (messageType.status === 'ready') {
      // إضافة بيانات الوسيط للرابط إذا كانت موجودة
      const params = new URLSearchParams();
      
      if (bulkMode) {
        // في الوضع الجماعي، إرسال جميع البيانات الجماعية
        params.append('bulkMode', 'true');
        if (brokerIds.length > 0) params.append('brokerIds', brokerIds.join(','));
        if (brokerNames.length > 0) params.append('brokerNames', encodeURIComponent(brokerNames.join(',')));
        if (brokerPhones.length > 0) params.append('brokerPhones', brokerPhones.join(','));
      } else {
        // في الوضع العادي، إرسال بيانات الوسيط الواحد
        if (brokerId) params.append('brokerId', brokerId);
        if (brokerName) params.append('brokerName', brokerName);
        if (brokerPhone) params.append('brokerPhone', brokerPhone);
      }
      
      const queryString = params.toString();
      const finalRoute = queryString ? `${messageType.route}?${queryString}` : messageType.route;
      
      navigate(finalRoute);
    }
  };

  const readyTypes = messageTypes.filter(type => type.status === 'ready');
  const comingSoonTypes = messageTypes.filter(type => type.status === 'coming-soon');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              اختر نوع رسالة واتساب
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            اختر نوع الرسالة المناسب لحملتك التسويقية
          </p>
          {(brokerName || (bulkMode && brokerNames.length > 0)) && (
            <div className="mt-4">
              {bulkMode && brokerNames.length > 0 ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                    👥 وضع جماعي: {brokerNames.length} وسيط محدد
                  </Badge>
                  <div className="flex flex-wrap gap-1 justify-center max-h-20 overflow-y-auto">
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
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-lg px-4 py-2">
                  🎯 للوسيط: {brokerName}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Ready Message Types */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold text-gray-800">متاح الآن</h2>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {readyTypes.length} نوع
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyTypes.map((messageType) => {
              const Icon = messageType.icon;
              return (
                <Card 
                  key={messageType.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
                  onClick={() => handleMessageTypeSelect(messageType)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${messageType.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {messageType.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {messageType.description}
                    </p>
                    <Button 
                      className={`w-full bg-gradient-to-r ${messageType.gradient} hover:shadow-lg transition-all duration-300 group-hover:scale-105`}
                    >
                      <span>ابدأ الآن</span>
                      <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Coming Soon Message Types */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold text-gray-800">قريباً</h2>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {comingSoonTypes.length} نوع
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonTypes.map((messageType) => {
              const Icon = messageType.icon;
              return (
                <Card 
                  key={messageType.id}
                  className="relative overflow-hidden bg-white/60 backdrop-blur-sm border-2 border-dashed border-gray-300"
                >
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      قريباً
                    </Badge>
                  </div>
                  
                  <CardHeader className="text-center pb-4 opacity-75">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${messageType.gradient} flex items-center justify-center shadow-lg opacity-75`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-600">
                      {messageType.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center opacity-75">
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                      {messageType.description}
                    </p>
                    <Button 
                      disabled
                      variant="outline"
                      className="w-full"
                    >
                      قريباً
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              نعمل بشكل مستمر على إضافة أنواع رسائل جديدة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
