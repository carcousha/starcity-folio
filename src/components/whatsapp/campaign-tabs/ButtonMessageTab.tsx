// Button Message Tab Component
// مكون تاب الرسالة الزرية

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Link, 
  Phone, 
  Copy, 
  MessageSquare,
  Users,
  Phone as PhoneIcon
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';

interface ButtonMessageTabProps {
  data: any;
  onChange: (data: any) => void;
  isLoading: boolean;
}

interface Button {
  id: string;
  type: 'reply' | 'call' | 'url' | 'copy';
  displayText: string;
  phoneNumber?: string;
  url?: string;
  copyText?: string;
}

export const ButtonMessageTab: React.FC<ButtonMessageTabProps> = ({ 
  data, 
  onChange, 
  isLoading 
}) => {
  const [senderNumber, setSenderNumber] = useState('971522001189');
  const [recipientNumbers, setRecipientNumbers] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [buttons, setButtons] = useState<Button[]>([]);
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

  const addButton = () => {
    if (buttons.length >= 3) {
      alert('يمكن إضافة 3 أزرار كحد أقصى');
      return;
    }

    const newButton: Button = {
      id: Date.now().toString(),
      type: 'reply',
      displayText: '',
    };

    const newButtons = [...buttons, newButton];
    setButtons(newButtons);
    onChange({
      ...data,
      buttons: newButtons
    });
  };

  const removeButton = (buttonId: string) => {
    const newButtons = buttons.filter(btn => btn.id !== buttonId);
    setButtons(newButtons);
    onChange({
      ...data,
      buttons: newButtons
    });
  };

  const updateButton = (buttonId: string, updates: Partial<Button>) => {
    const newButtons = buttons.map(btn => 
      btn.id === buttonId ? { ...btn, ...updates } : btn
    );
    setButtons(newButtons);
    onChange({
      ...data,
      buttons: newButtons
    });
  };

  const handleContactSelect = (contactId: string) => {
    const newSelected = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    
    setSelectedContacts(newSelected);
    
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

  const getButtonTypeLabel = (type: string) => {
    switch (type) {
      case 'reply': return 'رد';
      case 'call': return 'اتصال';
      case 'url': return 'رابط';
      case 'copy': return 'نسخ';
      default: return type;
    }
  };

  const getButtonTypeIcon = (type: string) => {
    switch (type) {
      case 'reply': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'url': return <Link className="h-4 w-4" />;
      case 'copy': return <Copy className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">رسالة زر</h2>
        <p className="text-gray-600">إنشاء رسالة مع أزرار تفاعلية</p>
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
                placeholder="اكتب رسالتك هنا..."
                className="text-right resize-none"
                rows={6}
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

          {/* إعدادات الأزرار */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <h3 className="font-semibold text-gray-900">الأزرار التفاعلية</h3>
                </div>
                <Button
                  onClick={addButton}
                  disabled={buttons.length >= 3}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  إضافة زر
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {buttons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد أزرار مضافة</p>
                  <p className="text-sm">اضغط "إضافة زر" لإنشاء أزرار تفاعلية</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {buttons.map((button, index) => (
                    <div key={button.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          الزر {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeButton(button.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            نوع الزر
                          </Label>
                          <Select 
                            value={button.type} 
                            onValueChange={(value) => updateButton(button.id, { type: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reply">رد</SelectItem>
                              <SelectItem value="call">اتصال</SelectItem>
                              <SelectItem value="url">رابط</SelectItem>
                              <SelectItem value="copy">نسخ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            نص الزر
                          </Label>
                          <Input
                            value={button.displayText}
                            onChange={(e) => updateButton(button.id, { displayText: e.target.value })}
                            placeholder="نص الزر"
                            className="text-right"
                          />
                        </div>
                      </div>

                      {/* حقول إضافية حسب نوع الزر */}
                      {button.type === 'call' && (
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            رقم الهاتف
                          </Label>
                          <Input
                            value={button.phoneNumber || ''}
                            onChange={(e) => updateButton(button.id, { phoneNumber: e.target.value })}
                            placeholder="971522001189"
                            className="text-left"
                          />
                        </div>
                      )}

                      {button.type === 'url' && (
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            الرابط
                          </Label>
                          <Input
                            value={button.url || ''}
                            onChange={(e) => updateButton(button.id, { url: e.target.value })}
                            placeholder="https://example.com"
                            className="text-left"
                          />
                        </div>
                      )}

                      {button.type === 'copy' && (
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            النص المراد نسخه
                          </Label>
                          <Input
                            value={button.copyText || ''}
                            onChange={(e) => updateButton(button.id, { copyText: e.target.value })}
                            placeholder="النص المراد نسخه"
                            className="text-right"
                          />
                        </div>
                      )}

                      {/* معاينة الزر */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getButtonTypeIcon(button.type)}
                          <span className="text-sm font-medium">
                            {getButtonTypeLabel(button.type)}: {button.displayText || 'نص الزر'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium mb-1">ملاحظات:</p>
                <ul className="space-y-1">
                  <li>• يمكن إضافة 3 أزرار كحد أقصى</li>
                  <li>• يجب أن يكون نص الزر واضحاً ومختصراً</li>
                  <li>• الأزرار ستظهر في أسفل الرسالة</li>
                </ul>
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
                    <PhoneIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
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
                  <span className="text-sm text-gray-600">عدد الأزرار:</span>
                  <Badge variant="outline">{buttons.length}/3</Badge>
                </div>
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
