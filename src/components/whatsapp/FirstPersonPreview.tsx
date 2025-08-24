// First Person Preview Component
// مكون معاينة الرسالة قبل الإرسال مع نموذج أول شخص

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Eye,
  User,
  MessageSquare,
  Copy,
  RefreshCw,
  Settings,
  Smartphone,
  Globe,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  phone: string;
  shortName?: string;
  fullName?: string;
  company?: string;
  position?: string;
  city?: string;
}

interface MessageTemplate {
  id: string;
  content: string;
  variables: string[];
  footer: string;
}

interface FirstPersonPreviewProps {
  messageTemplate: MessageTemplate;
  contacts: Contact[];
  selectedContacts: string[];
  onSendMessage?: (contactId: string, message: string) => void;
  onPreviewChange?: (preview: string) => void;
}

export function FirstPersonPreview({
  messageTemplate,
  contacts,
  selectedContacts,
  onSendMessage,
  onPreviewChange
}: FirstPersonPreviewProps) {
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [autoGenerateNames, setAutoGenerateNames] = useState(true);
  const [useEmojis, setUseEmojis] = useState(true);
  const [useFormalLanguage, setUseFormalLanguage] = useState(false);

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  useEffect(() => {
    if (selectedContacts.length > 0 && !selectedContactId) {
      setSelectedContactId(selectedContacts[0]);
    }
  }, [selectedContacts, selectedContactId]);

  useEffect(() => {
    if (selectedContact && autoGenerateNames) {
      generateContactVariables(selectedContact);
    }
  }, [selectedContact, autoGenerateNames]);

  const generateContactVariables = (contact: Contact) => {
    const variables: Record<string, string> = {};
    
    // توليد اسم مختصر
    if (contact.shortName) {
      variables.short_name = contact.shortName;
    } else if (contact.name) {
      variables.short_name = contact.name.split(' ')[0] || contact.name;
    } else {
      variables.short_name = 'أخي الكريم';
    }
    
    // توليد اسم كامل
    if (contact.fullName) {
      variables.full_name = contact.fullName;
    } else if (contact.name) {
      variables.full_name = contact.name;
    } else {
      variables.full_name = 'أخي الكريم';
    }
    
    // متغيرات أخرى
    variables.company = contact.company || 'StarCity Folio';
    variables.position = contact.position || 'عميل';
    variables.city = contact.city || 'دبي';
    
    setCustomVariables(variables);
  };

  const generateMessage = (template: string, variables: Record<string, string>): string => {
    let message = template;
    
    // استبدال المتغيرات
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, value);
    });
    
    // إضافة تذييل الرسالة
    if (messageTemplate.footer) {
      message += `\n\n${messageTemplate.footer}`;
    }
    
    return message;
  };

  const getPreviewMessage = (): string => {
    if (!selectedContact) return '';
    
    const allVariables = {
      ...customVariables,
      // إضافة متغيرات إضافية
      phone: selectedContact.phone,
      contact_name: selectedContact.name || 'عميل'
    };
    
    return generateMessage(messageTemplate.content, allVariables);
  };

  const copyMessage = () => {
    const message = getPreviewMessage();
    navigator.clipboard.writeText(message);
    toast.success('تم نسخ الرسالة إلى الحافظة');
  };

  const sendTestMessage = () => {
    if (!selectedContact) {
      toast.error('يرجى اختيار جهة اتصال');
      return;
    }
    
    const message = getPreviewMessage();
    if (onSendMessage) {
      onSendMessage(selectedContact.id, message);
      toast.success('تم إرسال رسالة تجريبية');
    }
  };

  const updateVariable = (key: string, value: string) => {
    setCustomVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetVariables = () => {
    if (selectedContact) {
      generateContactVariables(selectedContact);
    }
    toast.success('تم إعادة تعيين المتغيرات');
  };

  const getPreviewStyle = () => {
    switch (previewMode) {
      case 'whatsapp':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'sms':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'email':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPreviewIcon = () => {
    switch (previewMode) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'email':
        return <Globe className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const previewMessage = getPreviewMessage();

  useEffect(() => {
    if (onPreviewChange) {
      onPreviewChange(previewMessage);
    }
  }, [previewMessage, onPreviewChange]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          معاينة الرسالة قبل الإرسال
          <Badge variant="secondary" className="text-xs">
            نموذج أول شخص
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* اختيار جهة الاتصال */}
        <div className="space-y-3">
          <Label>جهة الاتصال للمعاينة</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contacts.slice(0, 6).map(contact => (
              <Button
                key={contact.id}
                variant={selectedContactId === contact.id ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setSelectedContactId(contact.id)}
              >
                <User className="h-4 w-4 ml-2" />
                <div className="text-right">
                  <div className="font-medium">{contact.name || 'جهة اتصال'}</div>
                  <div className="text-xs opacity-70">{contact.phone}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {selectedContact && (
          <>
            <Separator />
            
            {/* معلومات جهة الاتصال */}
            <div className="space-y-3">
              <Label>معلومات جهة الاتصال</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">الاسم:</span>
                  <div className="font-medium">{selectedContact.name || 'غير محدد'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">الهاتف:</span>
                  <div className="font-medium">{selectedContact.phone}</div>
                </div>
                {selectedContact.company && (
                  <div>
                    <span className="text-sm text-gray-600">الشركة:</span>
                    <div className="font-medium">{selectedContact.company}</div>
                  </div>
                )}
                {selectedContact.position && (
                  <div>
                    <span className="text-sm text-gray-600">المنصب:</span>
                    <div className="font-medium">{selectedContact.position}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* تعديل المتغيرات */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>تعديل المتغيرات</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoGenerateNames}
                    onCheckedChange={setAutoGenerateNames}
                  />
                  <span className="text-sm">توليد تلقائي</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shortName">الاسم المختصر</Label>
                  <Input
                    id="shortName"
                    value={customVariables.short_name || ''}
                    onChange={(e) => updateVariable('short_name', e.target.value)}
                    placeholder="مثال: أحمد"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    value={customVariables.full_name || ''}
                    onChange={(e) => updateVariable('full_name', e.target.value)}
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div>
                  <Label htmlFor="company">الشركة</Label>
                  <Input
                    id="company"
                    value={customVariables.company || ''}
                    onChange={(e) => updateVariable('company', e.target.value)}
                    placeholder="مثال: StarCity Folio"
                  />
                </div>
                <div>
                  <Label htmlFor="position">المنصب</Label>
                  <Input
                    id="position"
                    value={customVariables.position || ''}
                    onChange={(e) => updateVariable('position', e.target.value)}
                    placeholder="مثال: مدير"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetVariables}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة تعيين
                </Button>
              </div>
            </div>

            <Separator />

            {/* إعدادات المعاينة */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>إعدادات المعاينة</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  <Settings className="h-4 w-4 ml-2" />
                  {showAdvancedSettings ? 'إخفاء' : 'إظهار'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={previewMode === 'whatsapp'}
                    onCheckedChange={() => setPreviewMode('whatsapp')}
                  />
                  <Label>WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={previewMode === 'sms'}
                    onCheckedChange={() => setPreviewMode('sms')}
                  />
                  <Label>SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={previewMode === 'email'}
                    onCheckedChange={() => setPreviewMode('email')}
                  />
                  <Label>Email</Label>
                </div>
              </div>
              
              {showAdvancedSettings && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={useEmojis}
                      onCheckedChange={setUseEmojis}
                    />
                    <Label>استخدام الرموز التعبيرية</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={useFormalLanguage}
                      onCheckedChange={setUseFormalLanguage}
                    />
                    <Label>لغة رسمية</Label>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* معاينة الرسالة */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">معاينة الرسالة</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyMessage}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    نسخ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestMessage}
                  >
                    <MessageSquare className="h-4 w-4 ml-2" />
                    إرسال تجريبي
                  </Button>
                </div>
              </div>
              
              <Card className={`${getPreviewStyle()} border-2`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getPreviewIcon()}
                    <span className="font-medium">
                      {previewMode === 'whatsapp' ? 'WhatsApp' : 
                       previewMode === 'sms' ? 'SMS' : 'Email'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm opacity-70">
                      إلى: {selectedContact.phone}
                    </div>
                    <div className="whitespace-pre-wrap font-medium">
                      {previewMessage}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* معلومات إضافية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800">عدد الأحرف</div>
                <div className="text-2xl font-bold text-blue-600">
                  {previewMessage.length}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">عدد الكلمات</div>
                <div className="text-2xl font-bold text-green-600">
                  {previewMessage.split(/\s+/).length}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-800">عدد الأسطر</div>
                <div className="text-2xl font-bold text-purple-600">
                  {previewMessage.split('\n').length}
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedContact && (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>يرجى اختيار جهة اتصال لعرض المعاينة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
