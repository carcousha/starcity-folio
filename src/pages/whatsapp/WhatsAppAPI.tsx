import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
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
  api_key: string;
  sender: string;
  base_url: string;
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
    api_key: '',
    sender: '',
    base_url: 'https://app.x-growth.tech'
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
  
  // حالة الأزرار
  const [buttons, setButtons] = useState<Array<{
    type: 'reply' | 'call' | 'url' | 'copy';
    displayText: string;
    phoneNumber?: string;
    url?: string;
    copyCode?: string;
  }>>([]);
  
  // حالة القائمة
  const [listName, setListName] = useState('');
  const [listTitle, setListTitle] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [sections, setSections] = useState<Array<{
    title: string;
    description: string;
    rows: Array<{
      title: string;
      rowId: string;
      description: string;
    }>;
  }>>([]);
  
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
    if (!apiConfig.api_key || !apiConfig.sender) {
      toast({
        title: "خطأ في التكوين",
        description: "يرجى ملء API Key ورقم المرسل",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('whatsapp_api_config', JSON.stringify(apiConfig));
    setIsConfigOpen(false);
    toast({
      title: "تم حفظ التكوين",
      description: "تم حفظ إعدادات API بنجاح"
    });
  };

  // إرسال رسالة نصية
  const sendTextMessage = async () => {
    if (!validateBasicFields()) return;

    setIsLoading(true);
    try {
      const payload = {
        api_key: apiConfig.api_key,
        sender: apiConfig.sender,
        number: recipientNumber,
        message: messageText,
        footer: footer || 'Sent via WhatsApp API'
      };

      // استخدام CORS Proxy لحل مشكلة CORS
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const apiUrl = `${apiConfig.base_url}/send-message`;
      
      const response = await fetch(`${corsProxy}${apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status) {
        addToHistory('text', recipientNumber, messageText, 'sent', result);
        toast({
          title: "تم الإرسال",
          description: "تم إرسال الرسالة النصية بنجاح"
        });
        clearTextForm();
      } else {
        throw new Error(result.msg || 'فشل في الإرسال');
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة النصية:', error);
      addToHistory('text', recipientNumber, messageText, 'failed', { error: error.message });
      toast({
        title: "خطأ في الإرسال",
        description: `فشل في إرسال الرسالة: ${error.message}`,
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
      const payload = {
        api_key: apiConfig.api_key,
        sender: apiConfig.sender,
        number: recipientNumber,
        media_type: mediaType,
        url: mediaUrl,
        caption: caption || messageText,
        footer: footer || 'Sent via WhatsApp API'
      };

      // استخدام CORS Proxy لحل مشكلة CORS
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const apiUrl = `${apiConfig.base_url}/send-media`;
      
      const response = await fetch(`${corsProxy}${apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status) {
        addToHistory('media', recipientNumber, `${mediaType}: ${caption || messageText}`, 'sent', result);
        toast({
          title: "تم الإرسال",
          description: "تم إرسال رسالة الوسائط بنجاح"
        });
        clearMediaForm();
      } else {
        throw new Error(result.msg || 'فشل في الإرسال');
      }
    } catch (error) {
      console.error('خطأ في إرسال رسالة الوسائط:', error);
      addToHistory('media', recipientNumber, `${mediaType}: ${caption || messageText}`, 'failed', { error: error.message });
      toast({
        title: "خطأ في الإرسال",
        description: `فشل في إرسال رسالة الوسائط: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إرسال موقع
  const sendLocationMessage = async () => {
    if (!validateBasicFields() || !latitude || !longitude) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        api_key: apiConfig.api_key,
        sender: apiConfig.sender,
        number: recipientNumber,
        latitude: latitude,
        longitude: longitude
      };

      // استخدام CORS Proxy لحل مشكلة CORS
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const apiUrl = `${apiConfig.base_url}/send-location`;
      
      const response = await fetch(`${corsProxy}${apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status) {
        addToHistory('location', recipientNumber, `موقع: ${latitude}, ${longitude}`, 'sent', result);
        toast({
          title: "تم الإرسال",
          description: "تم إرسال الموقع بنجاح"
        });
        clearLocationForm();
      } else {
        throw new Error(result.msg || 'فشل في الإرسال');
      }
    } catch (error) {
      console.error('خطأ في إرسال الموقع:', error);
      addToHistory('location', recipientNumber, `موقع: ${latitude}, ${longitude}`, 'failed', { error: error.message });
      toast({
        title: "خطأ في الإرسال",
        description: `فشل في إرسال الموقع: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إرسال VCard
  const sendVCardMessage = async () => {
    if (!validateBasicFields() || !contactName || !contactPhone) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        api_key: apiConfig.api_key,
        sender: apiConfig.sender,
        number: recipientNumber,
        name: contactName,
        phone: contactPhone
      };

      // استخدام CORS Proxy لحل مشكلة CORS
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const apiUrl = `${apiConfig.base_url}/send-vcard`;
      
      const response = await fetch(`${corsProxy}${apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status) {
        addToHistory('vcard', recipientNumber, `جهة اتصال: ${contactName}`, 'sent', result);
        toast({
          title: "تم الإرسال",
          description: "تم إرسال VCard بنجاح"
        });
        clearVCardForm();
      } else {
        throw new Error(result.msg || 'فشل في الإرسال');
      }
    } catch (error) {
      console.error('خطأ في إرسال VCard:', error);
      addToHistory('vcard', recipientNumber, `جهة اتصال: ${contactName}`, 'failed', { error: error.message });
      toast({
        title: "خطأ في الإرسال",
        description: `فشل في إرسال VCard: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دوال مساعدة
  const validateBasicFields = (): boolean => {
    if (!apiConfig.api_key || !apiConfig.sender) {
      toast({
        title: "خطأ في التكوين",
        description: "يرجى تكوين API أولاً",
        variant: "destructive"
      });
      return false;
    }

    if (!recipientNumber || !messageText) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء رقم المستلم والرسالة",
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

  const clearTextForm = () => {
    setRecipientNumber('');
    setMessageText('');
    setFooter('');
  };

  const clearMediaForm = () => {
    setRecipientNumber('');
    setMessageText('');
    setFooter('');
    setMediaUrl('');
    setMediaType('image');
    setCaption('');
  };

  const clearLocationForm = () => {
    setRecipientNumber('');
    setMessageText('');
    setLatitude('');
    setLongitude('');
  };

  const clearVCardForm = () => {
    setRecipientNumber('');
    setMessageText('');
    setContactName('');
    setContactPhone('');
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
              <p className="text-slate-600 text-lg">إرسال رسائل WhatsApp عبر API من x-growth.tech</p>
            </div>
            
            <Button
              onClick={() => setIsConfigOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 h-12 rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200 hover:scale-105"
            >
              <Settings className="h-5 w-5 ml-2" />
              إعدادات API
            </Button>
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
                    placeholder="+971585700181"
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

            {/* Location Message */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <MapPin className="h-5 w-5" />
                  إرسال موقع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">خط العرض</Label>
                    <Input
                      id="latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="24.121231"
                      type="number"
                      step="any"
                      className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="longitude">خط الطول</Label>
                    <Input
                      id="longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="55.1121221"
                      type="number"
                      step="any"
                      className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={sendLocationMessage}
                  disabled={isLoading || !recipientNumber || !latitude || !longitude}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </div>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 ml-2" />
                      إرسال الموقع
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* VCard Message */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <User className="h-5 w-5" />
                  إرسال جهة اتصال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">اسم جهة الاتصال</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="أحمد محمد"
                      className="border-orange-200 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">رقم الهاتف</Label>
                    <Input
                      id="contactPhone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+971585700181"
                      className="border-orange-200 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={sendVCardMessage}
                  disabled={isLoading || !recipientNumber || !contactName || !contactPhone}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white h-12 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </div>
                  ) : (
                    <>
                      <User className="h-4 w-4 ml-2" />
                      إرسال جهة الاتصال
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
                      <p className="text-sm">ابدأ بإرسال رسالة لرؤية السجل</p>
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
              <h3 className="text-xl font-bold text-slate-800 mb-4">إعدادات API</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={apiConfig.api_key}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="أدخل API Key الخاص بك"
                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sender">رقم المرسل</Label>
                  <Input
                    id="sender"
                    value={apiConfig.sender}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, sender: e.target.value }))}
                    placeholder="+971585700181"
                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">رابط API الأساسي</Label>
                  <Input
                    id="baseUrl"
                    value={apiConfig.base_url}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, base_url: e.target.value }))}
                    placeholder="https://app.x-growth.tech"
                    className="border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
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
                  onClick={saveConfig}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
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
