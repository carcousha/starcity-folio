// Text Message Tab Component
// مكون تاب الرسالة النصية

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Smile, 
  Bold, 
  Italic, 
  Strikethrough, 
  Underline, 
  Type,
  Users,
  Phone,
  MessageSquare
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';

interface TextMessageTabProps {
  data: any;
  onChange: (data: any) => void;
  isLoading: boolean;
}

export const TextMessageTab: React.FC<TextMessageTabProps> = ({ 
  data, 
  onChange, 
  isLoading 
}) => {
  const [senderNumber, setSenderNumber] = useState('971522001189');
  const [recipientNumbers, setRecipientNumbers] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const contactsData = await whatsappService.getContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleSenderChange = (value: string) => {
    setSenderNumber(value);
    onChange({
      ...data,
      sender: value
    });
  };

  const handleRecipientsChange = (value: string) => {
    setRecipientNumbers(value);
    onChange({
      ...data,
      recipients: value
    });
  };

  const handleMessageChange = (value: string) => {
    setMessageContent(value);
    onChange({
      ...data,
      messageContent: value
    });
  };

  const handleContactSelect = (contactId: string) => {
    const newSelected = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    
    setSelectedContacts(newSelected);
    
    // تحديث أرقام المستلمين
    const selectedContactNumbers = contacts
      .filter(contact => newSelected.includes(contact.id))
      .map(contact => contact.phone || contact.whatsapp_number)
      .join('|');
    
    setRecipientNumbers(selectedContactNumbers);
    onChange({
      ...data,
      recipients: selectedContactNumbers,
      selectedContacts: newSelected
    });
  };

  const formatText = (format: string) => {
    // هنا يمكن إضافة منطق تنسيق النص
    console.log('Formatting text with:', format);
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">رسالة نصية</h2>
        <p className="text-gray-600">إنشاء رسالة نصية بسيطة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر - إعدادات الرسالة */}
        <div className="lg:col-span-2 space-y-6">
          {/* المرسل والمستلم */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="sender" className="text-sm font-medium text-gray-700 mb-2 block">
                  المرسل
                </Label>
                <Input
                  id="sender"
                  value={senderNumber}
                  onChange={(e) => handleSenderChange(e.target.value)}
                  placeholder="971522001189"
                  className="text-left"
                />
              </div>

              <div>
                <Label htmlFor="recipients" className="text-sm font-medium text-gray-700 mb-2 block">
                  رقم المستلم *
                </Label>
                <Textarea
                  id="recipients"
                  value={recipientNumbers}
                  onChange={(e) => handleRecipientsChange(e.target.value)}
                  placeholder="628xxx|628xxx|628xxx"
                  className="text-left resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك إضافة عدة أرقام مفصولة بـ | أو اختيار من جهات الاتصال
                </p>
              </div>
            </CardContent>
          </Card>

          {/* شريط أدوات التنسيق */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('emoji')}
                  className="text-orange-500 hover:text-orange-600"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('bold')}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('italic')}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('strikethrough')}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('underline')}
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => formatText('font')}
                >
                  <Type className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* محرر الرسالة */}
          <Card>
            <CardContent className="p-6">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                رسالة نصية
              </Label>
              <Textarea
                id="message"
                value={messageContent}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="مثال: {مرحباً} {أهلاً} رقمك هو {number}"
                className="text-right resize-none"
                rows={8}
              />
              <div className="mt-2 text-xs text-gray-500">
                <p>متغيرات التخصيص المتاحة:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">{'{name}'}</Badge>
                  <Badge variant="secondary" className="text-xs">{'{phone}'}</Badge>
                  <Badge variant="secondary" className="text-xs">{'{company}'}</Badge>
                  <Badge variant="secondary" className="text-xs">{'{type}'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن - جهات الاتصال */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">جهات الاتصال</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Phone className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد جهات اتصال</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedContacts.includes(contact.id)
                            ? 'bg-purple-50 border-r-2 border-purple-500'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleContactSelect(contact.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {contact.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.phone || contact.whatsapp_number}
                            </div>
                            {contact.company && (
                              <div className="text-xs text-gray-400">
                                {contact.company}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={contact.contact_type === 'client' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {contact.contact_type === 'client' ? 'عميل' : 
                               contact.contact_type === 'owner' ? 'مالك' : 'مسوق'}
                            </Badge>
                            {selectedContacts.includes(contact.id) && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات سريعة */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">جهات الاتصال المحددة:</span>
                  <Badge variant="secondary">{selectedContacts.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">إجمالي جهات الاتصال:</span>
                  <Badge variant="outline">{contacts.length}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">طول الرسالة:</span>
                  <Badge variant="outline">{messageContent.length} حرف</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
