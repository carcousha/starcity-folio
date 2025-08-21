// Enhanced Text Message Tab Component
// مكون تاب الرسالة النصية المحسن

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare,
  Users,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  X,
  Type,
  Hash,
  AtSign
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { toast } from 'sonner';

interface EnhancedTextMessageTabProps {
  data: any;
  onChange: (data: any) => void;
  isLoading: boolean;
}

interface TextMessage {
  id: string;
  message: string;
  variables: string[];
  footer: string;
}

export const EnhancedTextMessageTab: React.FC<EnhancedTextMessageTabProps> = ({ 
  data, 
  onChange, 
  isLoading 
}) => {
  // حالات الحملة
  const [campaignName, setCampaignName] = useState(data?.campaignName || '');
  const [campaignDescription, setCampaignDescription] = useState(data?.campaignDescription || '');
  
  // حالات الرسائل النصية
  const [textMessages, setTextMessages] = useState<TextMessage[]>([
    {
      id: '1',
      message: '',
      variables: [],
      footer: 'مرسل عبر StarCity Folio'
    }
  ]);

  // حالات جهات الاتصال
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactsFilter, setContactsFilter] = useState('');

  // حالات إضافية
  const [previewMessage, setPreviewMessage] = useState<TextMessage | null>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // قوالب الرسائل الجاهزة
  const messageTemplates = [
    {
      id: 'welcome',
      name: 'ترحيب',
      message: 'مرحباً {name}، نحن سعداء لانضمامك إلينا في {company}. نتطلع للعمل معك!',
      variables: ['name', 'company']
    },
    {
      id: 'offer',
      name: 'عرض خاص',
      message: 'عرض خاص لك {name}! احصل على خصم {discount}% على جميع منتجاتنا. صالح حتى {date}.',
      variables: ['name', 'discount', 'date']
    },
    {
      id: 'reminder',
      name: 'تذكير',
      message: 'تذكير ودود {name}: لديك موعد في {date} في تمام الساعة {time}. نتطلع لرؤيتك!',
      variables: ['name', 'date', 'time']
    },
    {
      id: 'followup',
      name: 'متابعة',
      message: 'شكراً لك {name} على زيارتك لنا. هل تحتاج أي مساعدة إضافية بخصوص {service}؟',
      variables: ['name', 'service']
    }
  ];

  // تحميل جهات الاتصال عند بداية التحميل
  useEffect(() => {
    loadContacts();
  }, []);

  // تحديث البيانات عند تغيير الحالة
  useEffect(() => {
    const updatedData = {
      ...data,
      campaignName,
      campaignDescription,
      textMessages,
      selectedContacts,
      messageType: 'text'
    };
    onChange(updatedData);
  }, [campaignName, campaignDescription, textMessages, selectedContacts]);

  // تحميل جهات الاتصال
  const loadContacts = async () => {
    try {
      const contactsList = await whatsappService.getContacts();
      setContacts(contactsList || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('فشل في تحميل جهات الاتصال');
    }
  };

  // إضافة رسالة نصية جديدة
  const addTextMessage = () => {
    const newMessage: TextMessage = {
      id: Date.now().toString(),
      message: '',
      variables: [],
      footer: 'مرسل عبر StarCity Folio'
    };
    setTextMessages([...textMessages, newMessage]);
  };

  // حذف رسالة نصية
  const removeTextMessage = (id: string) => {
    if (textMessages.length > 1) {
      setTextMessages(textMessages.filter(msg => msg.id !== id));
    } else {
      toast.error('يجب أن تحتوي الحملة على رسالة واحدة على الأقل');
    }
  };

  // تحديث رسالة نصية
  const updateTextMessage = (id: string, updates: Partial<TextMessage>) => {
    setTextMessages(textMessages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  // استخراج المتغيرات من النص
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  // تحديث الرسالة واستخراج المتغيرات
  const updateMessageWithVariables = (id: string, message: string) => {
    const variables = extractVariables(message);
    updateTextMessage(id, { message, variables });
  };

  // تطبيق قالب رسالة
  const applyTemplate = (id: string, template: any) => {
    updateTextMessage(id, {
      message: template.message,
      variables: template.variables
    });
    toast.success(`تم تطبيق قالب "${template.name}"`);
  };

  // تبديل اختيار جهة اتصال
  const toggleContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  // اختيار جميع جهات الاتصال
  const selectAllContacts = () => {
    const filteredIds = filteredContacts.map(contact => contact.id);
    setSelectedContacts(filteredIds);
  };

  // إلغاء اختيار جميع جهات الاتصال
  const deselectAllContacts = () => {
    setSelectedContacts([]);
  };

  // تصفية جهات الاتصال
  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(contactsFilter.toLowerCase()) ||
    contact.phone?.includes(contactsFilter) ||
    contact.company?.toLowerCase().includes(contactsFilter.toLowerCase())
  );

  // معاينة الرسالة مع بيانات جهة اتصال
  const previewWithContact = (message: TextMessage, contact: any) => {
    let previewText = message.message;
    
    // استبدال المتغيرات ببيانات جهة الاتصال
    const replacements: { [key: string]: string } = {
      name: contact.name || 'العميل',
      company: contact.company || 'الشركة',
      phone: contact.phone || '',
      email: contact.email || '',
      date: new Date().toLocaleDateString('ar-SA'),
      time: new Date().toLocaleTimeString('ar-SA'),
      discount: '20',
      service: 'خدماتنا'
    };

    message.variables.forEach(variable => {
      const value = replacements[variable] || `{${variable}}`;
      previewText = previewText.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    });

    return previewText;
  };

  // معاينة الرسالة
  const previewTextMessage = (message: TextMessage) => {
    if (!message.message) {
      toast.error('لا توجد رسالة للمعاينة');
      return;
    }
    setPreviewMessage(message);
    if (selectedContacts.length > 0) {
      const contact = contacts.find(c => c.id === selectedContacts[0]);
      setSelectedContact(contact);
    }
  };

  return (
    <div className="space-y-6">
      {/* معلومات الحملة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            معلومات الحملة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">اسم الحملة</Label>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="اكتب اسم الحملة..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">وصف الحملة</Label>
            <Textarea
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              placeholder="اكتب وصف للحملة..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* الرسائل النصية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              الرسائل النصية ({textMessages.length})
            </div>
            <Button
              onClick={addTextMessage}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة رسالة
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {textMessages.map((message, index) => (
            <div key={message.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">رسالة رقم {index + 1}</h4>
                {textMessages.length > 1 && (
                  <Button
                    onClick={() => removeTextMessage(message.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* القوالب الجاهزة */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  القوالب الجاهزة
                </Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {messageTemplates.map((template) => (
                    <Button
                      key={template.id}
                      onClick={() => applyTemplate(message.id, template)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* قسم كتابة الرسالة */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      نص الرسالة
                    </Label>
                    <Textarea
                      placeholder="اكتب نص الرسالة هنا... يمكنك استخدام متغيرات مثل {name} و {company}"
                      value={message.message}
                      onChange={(e) => updateMessageWithVariables(message.id, e.target.value)}
                      rows={6}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      استخدم {`{name}`} للاسم، {`{company}`} للشركة، {`{date}`} للتاريخ، وهكذا
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      تذييل الرسالة
                    </Label>
                    <Input
                      value={message.footer}
                      onChange={(e) => updateTextMessage(message.id, { footer: e.target.value })}
                      placeholder="تذييل الرسالة..."
                    />
                  </div>

                  {/* المتغيرات المكتشفة */}
                  {message.variables.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        المتغيرات المكتشفة
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {message.variables.map((variable, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* قسم المعاينة */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">معاينة الرسالة</Label>
                  
                  {/* إحصائيات الرسالة */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{message.message.length}</p>
                      <p className="text-xs text-blue-700">حرف</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{message.variables.length}</p>
                      <p className="text-xs text-green-700">متغير</p>
                    </div>
                  </div>

                  {/* معاينة النص */}
                  {message.message && (
                    <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {message.message}
                      </p>
                      {message.footer && (
                        <>
                          <Separator className="my-2" />
                          <p className="text-xs text-gray-500 italic">
                            {message.footer}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* معاينة مع بيانات جهة اتصال */}
                  {selectedContacts.length > 0 && message.message && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        معاينة مع بيانات العميل
                      </Label>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {previewWithContact(message, contacts.find(c => c.id === selectedContacts[0]))}
                        </p>
                        {message.footer && (
                          <>
                            <Separator className="my-2" />
                            <p className="text-xs text-gray-500 italic">
                              {message.footer}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* زر معاينة */}
                  <Button
                    onClick={() => previewTextMessage(message)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!message.message}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    معاينة كاملة
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* اختيار جهات الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              جهات الاتصال ({selectedContacts.length} محدد)
            </div>
            <div className="flex gap-2">
              <Button
                onClick={selectAllContacts}
                size="sm"
                variant="outline"
              >
                اختيار الكل
              </Button>
              <Button
                onClick={deselectAllContacts}
                size="sm"
                variant="outline"
              >
                إلغاء الكل
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* فلتر البحث */}
          <div>
            <Input
              placeholder="البحث في جهات الاتصال..."
              value={contactsFilter}
              onChange={(e) => setContactsFilter(e.target.value)}
            />
          </div>

          {/* قائمة جهات الاتصال */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedContacts.includes(contact.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => toggleContact(contact.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                      {contact.company && (
                        <p className="text-xs text-gray-400">{contact.company}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedContacts.includes(contact.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                لا توجد جهات اتصال متاحة
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* معاينة الرسالة المنبثقة */}
      {previewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">معاينة الرسالة</h3>
              <Button
                onClick={() => setPreviewMessage(null)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* الرسالة الأصلية */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  النص الأصلي
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {previewMessage.message}
                  </p>
                </div>
              </div>

              {/* المعاينة مع البيانات */}
              {selectedContact && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    معاينة مع بيانات: {selectedContact.name}
                  </Label>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {previewWithContact(previewMessage, selectedContact)}
                    </p>
                  </div>
                </div>
              )}

              {/* التذييل */}
              {previewMessage.footer && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    التذييل
                  </Label>
                  <div className="p-2 bg-gray-100 rounded text-center">
                    <p className="text-xs text-gray-600 italic">
                      {previewMessage.footer}
                    </p>
                  </div>
                </div>
              )}

              {/* المتغيرات */}
              {previewMessage.variables.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    المتغيرات المستخدمة
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {previewMessage.variables.map((variable, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
