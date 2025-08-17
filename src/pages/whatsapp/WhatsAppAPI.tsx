import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { whatsappServiceDirect } from '@/lib/whatsapp-service-direct';
import { 
  Send, 
  MessageCircle, 
  Image, 
  Video, 
  FileText, 
  MapPin, 
  User, 
  Phone, 
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  History,
  Download,
  Upload
} from "lucide-react";

interface APIConfig {
  sender: string;
}

interface MessageHistory {
  id: string;
  type: 'text' | 'media' | 'location' | 'vcard' | 'button' | 'list';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: string;
  response?: any;
}

const WhatsAppAPI: React.FC = () => {
  // حالة التكوين
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    sender: 'StarCity Folio'
  });

  // حالة الرسائل
  const [messageType, setMessageType] = useState<'text' | 'media' | 'location' | 'vcard' | 'button' | 'list'>('text');
  const [recipientNumber, setRecipientNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [footer, setFooter] = useState('');
  
  // حالة الوسائط
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [caption, setCaption] = useState('');
  
  // حالة الموقع
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // حالة VCard
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // حالة عامة
  const [isLoading, setIsLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // تحميل التكوين المحفوظ
  useEffect(() => {
    const savedConfig = localStorage.getItem('whatsapp_api_config');
    if (savedConfig) {
      setApiConfig(JSON.parse(savedConfig));
    }
  }, []);

  // حفظ التكوين
  const saveConfig = () => {
    if (!apiConfig.sender) {
      toast({
        title: "خطأ في التكوين",
        description: "يرجى ملء رقم المرسل",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('whatsapp_api_config', JSON.stringify(apiConfig));
    setIsConfigOpen(false);
    toast({
      title: "تم حفظ التكوين",
      description: "تم حفظ إعدادات المرسل بنجاح"
    });
  };

  // اختبار الاتصال عبر Edge Function
  const testAPIConnection = async () => {
    if (!apiConfig.sender) {
      toast({
        title: "خطأ في التكوين",
        description: "يرجى إدخال رقم المرسل أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 اختبار الاتصال عبر Edge Function...');
      console.log('📱 المرسل:', apiConfig.sender);
      
      const result = await whatsappServiceDirect.testConnection({
        sender: apiConfig.sender
      });
      
      console.log('📥 نتيجة اختبار الاتصال:', result);
      
      if (result.success) {
        toast({
          title: "✅ نجح الاختبار",
          description: "Edge Function والـ API يعملان بشكل طبيعي",
          variant: "default"
        });
      } else {
        toast({
          title: "❌ فشل الاختبار",
          description: result.message || "خطأ غير معروف",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ خطأ في اختبار الاتصال:', error);
      toast({
        title: "فشل في اختبار الاتصال",
        description: "تحقق من إعدادات Edge Function والـ API Key",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إرسال رسالة نصية
  const sendTextMessage = async () => {
    if (!validateBasicFields()) return;

    setIsLoading(true);
    try {
      console.log('🚀 بدء إرسال الرسالة النصية عبر Edge Function...');
      console.log('📋 البيانات:', {
        sender: apiConfig.sender,
        number: recipientNumber,
        message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
        footer: footer || 'Sent via WhatsApp API'
      });

      // استخدام Edge Function لإرسال الرسالة
      const result = await whatsappServiceDirect.sendTextMessage({
        sender: apiConfig.sender,
        number: recipientNumber,
        message: messageText,
        footer: footer || 'Sent via WhatsApp API'
      });

      if (result.success) {
        console.log('✅ تم إرسال الرسالة بنجاح');
        
        // إضافة الرسالة إلى السجل
        const newMessage: MessageHistory = {
          id: Date.now().toString(),
          type: 'text',
          recipient: recipientNumber,
          message: messageText,
          status: 'sent',
          timestamp: new Date().toISOString(),
          response: result
        };
        
        setMessageHistory(prev => [newMessage, ...prev]);
        
        toast({
          title: "تم الإرسال بنجاح",
          description: result.message,
        });
        
        // مسح الحقول
        setMessageText('');
        setFooter('');
      } else {
        console.log('❌ فشل في إرسال الرسالة:', result.message);
        
        // إضافة الرسالة إلى السجل مع حالة الفشل
        const newMessage: MessageHistory = {
          id: Date.now().toString(),
          type: 'text',
          recipient: recipientNumber,
          message: messageText,
          status: 'failed',
          timestamp: new Date().toISOString(),
          response: result
        };
        
        setMessageHistory(prev => [newMessage, ...prev]);
        
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      
      // إضافة الرسالة إلى السجل مع حالة الفشل
      const newMessage: MessageHistory = {
        id: Date.now().toString(),
        type: 'text',
        recipient: recipientNumber,
        message: messageText,
        status: 'failed',
        timestamp: new Date().toISOString(),
        response: { error: error.message }
      };
      
      setMessageHistory(prev => [newMessage, ...prev]);
      
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إرسال رسالة وسائط
  const sendMediaMessage = async () => {
    if (!validateBasicFields() || !mediaUrl) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 بدء إرسال الوسائط عبر Edge Function...');
      console.log('📋 البيانات:', {
        sender: apiConfig.sender,
        number: recipientNumber,
        media_type: mediaType,
        url: mediaUrl.substring(0, 50) + (mediaUrl.length > 50 ? '...' : ''),
        caption: caption.substring(0, 30) + (caption.length > 30 ? '...' : ''),
        footer: footer || 'Sent via WhatsApp API'
      });

      // استخدام Edge Function لإرسال الوسائط
      const result = await whatsappServiceDirect.sendMediaMessage({
        sender: apiConfig.sender,
        number: recipientNumber,
        media_type: mediaType,
        url: mediaUrl,
        caption: caption || '',
        footer: footer || 'Sent via WhatsApp API'
      });

      if (result.success) {
        console.log('✅ تم إرسال الوسائط بنجاح');
        
        // إضافة الرسالة إلى السجل
        const newMessage: MessageHistory = {
          id: Date.now().toString(),
          type: 'media',
          recipient: recipientNumber,
          message: `وسائط: ${mediaType} - ${caption || 'بدون وصف'}`,
          status: 'sent',
          timestamp: new Date().toISOString(),
          response: result
        };
        
        setMessageHistory(prev => [newMessage, ...prev]);
        
        toast({
          title: "تم الإرسال بنجاح",
          description: result.message,
        });
        
        // مسح الحقول
        setMediaUrl('');
        setCaption('');
        setFooter('');
      } else {
        console.log('❌ فشل في إرسال الوسائط:', result.message);
        
        // إضافة الرسالة إلى السجل مع حالة الفشل
        const newMessage: MessageHistory = {
          id: Date.now().toString(),
          type: 'media',
          recipient: recipientNumber,
          message: `وسائط: ${mediaType} - ${caption || 'بدون وصف'}`,
          status: 'failed',
          timestamp: new Date().toISOString(),
          response: result
        };
        
        setMessageHistory(prev => [newMessage, ...prev]);
        
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الوسائط:', error);
      
      // إضافة الرسالة إلى السجل مع حالة الفشل
      const newMessage: MessageHistory = {
        id: Date.now().toString(),
        type: 'media',
        recipient: recipientNumber,
        message: `وسائط: ${mediaType} - ${caption || 'بدون وصف'}`,
        status: 'failed',
        timestamp: new Date().toISOString(),
        response: { error: error.message }
      };
      
      setMessageHistory(prev => [newMessage, ...prev]);
      
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الوسائط",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دوال مساعدة
  const validateBasicFields = (): boolean => {
    if (!apiConfig.sender) {
      toast({
        title: "❌ خطأ في التكوين",
        description: "يرجى إدخال رقم المرسل في الإعدادات أولاً",
        variant: "destructive"
      });
      return false;
    }

    if (!recipientNumber) {
      toast({
        title: "❌ بيانات ناقصة",
        description: "يرجى إدخال رقم المستلم",
        variant: "destructive"
      });
      return false;
    }

    if (!messageText && messageType === 'text') {
      toast({
        title: "❌ بيانات ناقصة", 
        description: "يرجى كتابة نص الرسالة",
        variant: "destructive"
      });
      return false;
    }

    // التحقق من تنسيق رقم الهاتف
    const phoneRegex = /^(\+?[1-9]\d{1,14})$/;
    if (!phoneRegex.test(recipientNumber.replace(/\s/g, ''))) {
      toast({
        title: "❌ رقم هاتف غير صحيح",
        description: "يرجى إدخال رقم هاتف صحيح (مثال: +971501234567)",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const addToHistory = (type: MessageHistory['type'], recipient: string, message: string, status: MessageHistory['status'], response?: any) => {
    const newMessage: MessageHistory = {
      id: Date.now().toString(),
      type,
      recipient,
      message,
      status,
      timestamp: new Date().toISOString(),
      response
    };

    setMessageHistory(prev => [newMessage, ...prev.slice(0, 49)]); // الاحتفاظ بـ 50 رسالة فقط
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageCircle className="h-4 w-4" />;
      case 'media': return <Image className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'vcard': return <User className="h-4 w-4" />;
      case 'button': return <MessageCircle className="h-4 w-4" />;
      case 'list': return <MessageCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                WhatsApp API
              </h1>
              <p className="text-slate-600 text-lg">إرسال رسائل WhatsApp عبر Edge Function الآمن</p>
              {!apiConfig.sender ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-yellow-800 text-sm font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 ml-2" />
                    يرجى تكوين رقم المرسل أولاً لبدء الإرسال
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <p className="text-green-800 text-sm font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 ml-2" />
                    تم تكوين المرسل بنجاح - يمكنك البدء في إرسال الرسائل عبر Edge Function الآمن
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={testAPIConnection}
                disabled={isLoading || !apiConfig.sender}
                variant="outline"
                className="px-6 py-3 h-12 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-200"
              >
                <CheckCircle className="h-5 w-5 ml-2" />
                اختبار الاتصال
              </Button>
              <Button
                onClick={() => setIsConfigOpen(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 h-12 rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-105"
              >
                <Settings className="h-5 w-5 ml-2" />
                إعدادات المرسل
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Forms */}
          <div className="space-y-6">
            {/* Text Message */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <MessageCircle className="h-5 w-5" />
                  رسالة نصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">رقم المستلم</Label>
                  <Input
                    id="recipient"
                    value={recipientNumber}
                    onChange={(e) => setRecipientNumber(e.target.value)}
                    placeholder="+971501234567"
                    className="border-green-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">الرسالة</Label>
                  <Textarea
                    id="message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    rows={4}
                    className="border-green-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footer">تذييل الرسالة (اختياري)</Label>
                  <Input
                    id="footer"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    placeholder="Sent via WhatsApp API"
                    className="border-green-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
                
                <Button
                  onClick={sendTextMessage}
                  disabled={isLoading || !recipientNumber || !messageText}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-2" />
                      إرسال الرسالة النصية
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Media Message */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Image className="h-5 w-5" />
                  رسالة وسائط
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mediaType">نوع الوسائط</Label>
                    <Select value={mediaType} onValueChange={(value: 'image' | 'video' | 'audio' | 'document') => setMediaType(value)}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">صورة</SelectItem>
                        <SelectItem value="video">فيديو</SelectItem>
                        <SelectItem value="audio">صوت</SelectItem>
                        <SelectItem value="document">مستند</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mediaUrl">رابط الوسائط</Label>
                    <Input
                      id="mediaUrl"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="caption">وصف الوسائط</Label>
                  <Textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="وصف الوسائط..."
                    rows={3}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                
                <Button
                  onClick={sendMediaMessage}
                  disabled={isLoading || !recipientNumber || !mediaUrl}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </div>
                  ) : (
                    <>
                      <Image className="h-4 w-4 ml-2" />
                      إرسال رسالة الوسائط
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Message History */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <History className="h-5 w-5" />
                  سجل الرسائل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messageHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <MessageCircle className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                      <p>لا توجد رسائل مرسلة بعد</p>
                      <p className="text-sm">ابدأ بإرسال رسالة عبر Edge Function الآمن</p>
                    </div>
                  ) : (
                    messageHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getMessageTypeIcon(msg.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-800">
                              {msg.recipient}
                            </span>
                            <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(msg.status)}`}>
                              {msg.status === 'sent' ? 'تم الإرسال' : 
                               msg.status === 'failed' ? 'فشل' : 'قيد الإرسال'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-1">
                            {msg.message}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.timestamp).toLocaleString('ar-EG')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Configuration Dialog */}
        {isConfigOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">إعدادات المرسل</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sender">رقم المرسل</Label>
                  <Input
                    id="sender"
                    value={apiConfig.sender}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, sender: e.target.value }))}
                    placeholder="StarCity Folio"
                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                  <p className="text-xs text-slate-500">اسم المرسل الذي سيظهر في الرسائل</p>
                </div>
                
                {/* إرشادات التكوين */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 ml-2" />
                    معلومات مهمة
                  </h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 ml-2 flex-shrink-0"></span>
                      <span>API Key محفوظ بأمان في الخادم</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 ml-2 flex-shrink-0"></span>
                      <span>الإرسال يتم عبر Edge Function الآمن</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 ml-2 flex-shrink-0"></span>
                      <span>لا توجد مشاكل CORS أو تسريب مفاتيح</span>
                    </div>
                  </div>
                </div>
                
                {/* حالة API */}
                {apiConfig.sender && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                      <span className="text-sm text-green-700 font-medium">جاهز للاختبار والإرسال</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsConfigOpen(false)}
                  className="flex-1 border-slate-200 hover:border-slate-300"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={testAPIConnection}
                  disabled={isLoading || !apiConfig.sender}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50"
                >
                  {isLoading ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                </Button>
                <Button
                  onClick={saveConfig}
                  disabled={!apiConfig.sender}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
                >
                  حفظ
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppAPI;