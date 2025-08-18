// WhatsApp Quick Send Component
// صفحة الإرسال السريع للرسائل

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Users,
  FileText,
  Image,
  Video,
  File,
  BarChart3,
  Plus,
  Minus,
  Phone,
  Search,
  X,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Import services and types
import { whatsappService } from '@/services/whatsappService';
import {
  WhatsAppContact,
  WhatsAppTemplate,
  SendSingleMessageForm,
  WhatsAppButton,
  MessageType
} from '@/types/whatsapp';

interface QuickSendState {
  selectedContact: WhatsAppContact | null;
  phoneNumber: string;
  messageType: MessageType;
  customMessage: string;
  selectedTemplate: WhatsAppTemplate | null;
  mediaUrl: string;
  buttons: WhatsAppButton[];
  pollOptions: string[];
  isLoading: boolean;
  isSending: boolean;
}

export default function WhatsAppQuickSend() {
  const [state, setState] = useState<QuickSendState>({
    selectedContact: null,
    phoneNumber: '',
    messageType: 'text',
    customMessage: '',
    selectedTemplate: null,
    mediaUrl: '',
    buttons: [],
    pollOptions: ['', ''],
    isLoading: false,
    isSending: false
  });

  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactSearch, setShowContactSearch] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
    loadTemplates();
  }, []);

  const loadContacts = async () => {
    try {
      const contactsData = await whatsappService.getContacts({
        is_active: true
      });
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل جهات الاتصال",
        variant: "destructive"
      });
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await whatsappService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل القوالب",
        variant: "destructive"
      });
    }
  };

  const updateState = (updates: Partial<QuickSendState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const selectContact = (contact: WhatsAppContact) => {
    updateState({
      selectedContact: contact,
      phoneNumber: contact.whatsapp_number || contact.phone
    });
    setShowContactSearch(false);
    setContactSearch('');
  };

  const selectTemplate = (template: WhatsAppTemplate) => {
    updateState({
      selectedTemplate: template,
      messageType: template.template_type,
      customMessage: template.content,
      mediaUrl: template.media_url || '',
      buttons: template.buttons || [],
      pollOptions: template.poll_options.length > 0 ? template.poll_options : ['', '']
    });
  };

  const addButton = () => {
    const newButton: WhatsAppButton = {
      type: 'reply',
      displayText: ''
    };
    updateState({
      buttons: [...state.buttons, newButton]
    });
  };

  const updateButton = (index: number, updates: Partial<WhatsAppButton>) => {
    const newButtons = [...state.buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    updateState({ buttons: newButtons });
  };

  const removeButton = (index: number) => {
    updateState({
      buttons: state.buttons.filter((_, i) => i !== index)
    });
  };

  const addPollOption = () => {
    updateState({
      pollOptions: [...state.pollOptions, '']
    });
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...state.pollOptions];
    newOptions[index] = value;
    updateState({ pollOptions: newOptions });
  };

  const removePollOption = (index: number) => {
    if (state.pollOptions.length > 2) {
      updateState({
        pollOptions: state.pollOptions.filter((_, i) => i !== index)
      });
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!state.phoneNumber && !state.selectedContact) {
      errors.push('يجب اختيار جهة اتصال أو إدخال رقم هاتف');
    }

    if (state.phoneNumber && !state.selectedContact) {
      const validation = whatsappService.validatePhoneNumber(state.phoneNumber);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    if (!state.customMessage.trim()) {
      errors.push('نص الرسالة مطلوب');
    }

    if (state.messageType === 'media' && !state.mediaUrl) {
      errors.push('رابط الوسائط مطلوب');
    }

    if (state.messageType === 'button' && state.buttons.length === 0) {
      errors.push('يجب إضافة زر واحد على الأقل');
    }

    if (state.messageType === 'button') {
      state.buttons.forEach((button, index) => {
        if (!button.displayText.trim()) {
          errors.push(`نص الزر ${index + 1} مطلوب`);
        }
        if (button.type === 'call' && !button.phoneNumber) {
          errors.push(`رقم الهاتف مطلوب للزر ${index + 1}`);
        }
        if (button.type === 'url' && !button.url) {
          errors.push(`الرابط مطلوب للزر ${index + 1}`);
        }
      });
    }

    if (state.messageType === 'poll') {
      const validOptions = state.pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        errors.push('يجب إدخال خيارين على الأقل للاستطلاع');
      }
    }

    return errors;
  };

  const sendMessage = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "خطأ في البيانات",
        description: errors.join('، '),
        variant: "destructive"
      });
      return;
    }

    // تحقق إضافي من عدم إرسال لنفس الرقم
    const settings = await whatsappService.getSettings();
    if (settings && settings.sender_number === state.phoneNumber) {
      toast({
        title: "خطأ في الرقم",
        description: "لا يمكن إرسال رسالة لنفس رقم المرسل. يرجى اختيار رقم مختلف.",
        variant: "destructive"
      });
      return;
    }

    updateState({ isSending: true });

    try {
      const messageData: SendSingleMessageForm = {
        contact_id: state.selectedContact?.id,
        phone_number: state.phoneNumber,
        template_id: state.selectedTemplate?.id,
        custom_message: state.customMessage,
        message_type: state.messageType,
        media_url: state.mediaUrl || undefined,
        buttons: state.buttons,
        poll_options: state.pollOptions.filter(opt => opt.trim())
      };

      await whatsappService.sendSingleMessage(messageData);

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال الرسالة بنجاح",
        variant: "default"
      });

      // Reset form
      updateState({
        selectedContact: null,
        phoneNumber: '',
        customMessage: '',
        selectedTemplate: null,
        mediaUrl: '',
        buttons: [],
        pollOptions: ['', '']
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال الرسالة",
        variant: "destructive"
      });
    } finally {
      updateState({ isSending: false });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.phone.includes(contactSearch) ||
    (contact.company && contact.company.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'text': return <MessageSquare className="h-4 w-4" />;
      case 'media': return <Image className="h-4 w-4" />;
      case 'button': return <Plus className="h-4 w-4" />;
      case 'poll': return <BarChart3 className="h-4 w-4" />;
      case 'sticker': return <FileText className="h-4 w-4" />;
      case 'product': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getContactTypeBadge = (type: string) => {
    const typeMap = {
      'owner': { label: 'مالك', color: 'bg-blue-100 text-blue-800' },
      'marketer': { label: 'مسوق', color: 'bg-green-100 text-green-800' },
      'client': { label: 'عميل', color: 'bg-purple-100 text-purple-800' }
    };
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">الإرسال السريع</h2>
          <p className="text-gray-600">إرسال رسائل واتساب منفردة</p>
        </div>
        <Button 
          onClick={sendMessage} 
          disabled={state.isSending}
          className="bg-green-600 hover:bg-green-700"
        >
          {state.isSending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="ml-2 h-4 w-4" />
          )}
          {state.isSending ? 'جاري الإرسال...' : 'إرسال الآن'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المستقبل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="ml-2 h-5 w-5" />
              المستقبل
            </CardTitle>
            <CardDescription>اختر جهة اتصال أو أدخل رقم هاتف</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* جهة الاتصال المحددة */}
            {state.selectedContact ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">{state.selectedContact.name}</p>
                    <p className="text-sm text-gray-600">{state.selectedContact.phone}</p>
                    {state.selectedContact.company && (
                      <p className="text-xs text-gray-500">{state.selectedContact.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {getContactTypeBadge(state.selectedContact.contact_type)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateState({ selectedContact: null, phoneNumber: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* البحث في جهات الاتصال */}
                <div className="space-y-2">
                  <Label>البحث في جهات الاتصال</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="ابحث عن جهة اتصال..."
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value);
                        setShowContactSearch(true);
                      }}
                      onFocus={() => setShowContactSearch(true)}
                    />
                  </div>
                  {showContactSearch && contactSearch && (
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {filteredContacts.slice(0, 5).map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => selectContact(contact)}
                          className="w-full text-right p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-gray-600">{contact.phone}</p>
                            </div>
                            {getContactTypeBadge(contact.contact_type)}
                          </div>
                        </button>
                      ))}
                      {filteredContacts.length === 0 && (
                        <p className="p-3 text-gray-500 text-center">لا توجد نتائج</p>
                      )}
                    </div>
                  )}
                </div>

                {/* أو أدخل رقم هاتف */}
                <div className="space-y-2">
                  <Label>أو أدخل رقم الهاتف مباشرة</Label>
                  <Input
                    placeholder="971501234567"
                    value={state.phoneNumber}
                    onChange={(e) => updateState({ phoneNumber: e.target.value })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* محتوى الرسالة */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="ml-2 h-5 w-5" />
              محتوى الرسالة
            </CardTitle>
            <CardDescription>اكتب رسالتك أو اختر قالب جاهز</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={state.messageType} onValueChange={(value) => updateState({ messageType: value as MessageType })}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text" className="flex items-center space-x-2">
                  {getMessageTypeIcon('text')}
                  <span>نص</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center space-x-2">
                  {getMessageTypeIcon('media')}
                  <span>وسائط</span>
                </TabsTrigger>
                <TabsTrigger value="button" className="flex items-center space-x-2">
                  {getMessageTypeIcon('button')}
                  <span>أزرار</span>
                </TabsTrigger>
                <TabsTrigger value="poll" className="flex items-center space-x-2">
                  {getMessageTypeIcon('poll')}
                  <span>استطلاع</span>
                </TabsTrigger>
              </TabsList>

              {/* قوالب جاهزة */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>القوالب الجاهزة</Label>
                  <Select onValueChange={(value) => {
                    const template = templates.find(t => t.id === value);
                    if (template) selectTemplate(template);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قالب جاهز..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter(t => !state.messageType || t.template_type === state.messageType)
                        .map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {getMessageTypeIcon(template.template_type)}
                            <span>{template.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* نص الرسالة */}
              <div className="space-y-2">
                <Label>نص الرسالة</Label>
                <Textarea
                  placeholder="اكتب رسالتك هنا..."
                  value={state.customMessage}
                  onChange={(e) => updateState({ customMessage: e.target.value })}
                  rows={4}
                />
              </div>

              {/* وسائط */}
              <TabsContent value="media" className="space-y-4">
                <div className="space-y-2">
                  <Label>رابط الوسائط</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={state.mediaUrl}
                    onChange={(e) => updateState({ mediaUrl: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    يدعم الصور، الفيديو، الصوت، والمستندات
                  </p>
                </div>
              </TabsContent>

              {/* أزرار */}
              <TabsContent value="button" className="space-y-4">
                <div className="space-y-4">
                  {state.buttons.map((button, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>الزر {index + 1}</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeButton(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>نوع الزر</Label>
                          <Select
                            value={button.type}
                            onValueChange={(value) => updateButton(index, { type: value as any })}
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
                        
                        <div className="space-y-2">
                          <Label>نص الزر</Label>
                          <Input
                            placeholder="نص الزر"
                            value={button.displayText}
                            onChange={(e) => updateButton(index, { displayText: e.target.value })}
                          />
                        </div>
                      </div>

                      {button.type === 'call' && (
                        <div className="space-y-2">
                          <Label>رقم الهاتف</Label>
                          <Input
                            placeholder="971501234567"
                            value={button.phoneNumber || ''}
                            onChange={(e) => updateButton(index, { phoneNumber: e.target.value })}
                          />
                        </div>
                      )}

                      {button.type === 'url' && (
                        <div className="space-y-2">
                          <Label>الرابط</Label>
                          <Input
                            placeholder="https://example.com"
                            value={button.url || ''}
                            onChange={(e) => updateButton(index, { url: e.target.value })}
                          />
                        </div>
                      )}

                      {button.type === 'copy' && (
                        <div className="space-y-2">
                          <Label>النص المراد نسخه</Label>
                          <Input
                            placeholder="النص المراد نسخه"
                            value={button.copyText || ''}
                            onChange={(e) => updateButton(index, { copyText: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <Button onClick={addButton} variant="outline" className="w-full">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة زر
                  </Button>
                </div>
              </TabsContent>

              {/* استطلاع */}
              <TabsContent value="poll" className="space-y-4">
                <div className="space-y-3">
                  <Label>خيارات الاستطلاع</Label>
                  {state.pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 space-x-reverse">
                      <Input
                        placeholder={`الخيار ${index + 1}`}
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                      />
                      {state.pollOptions.length > 2 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePollOption(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button onClick={addPollOption} variant="outline" size="sm">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة خيار
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* معاينة الرسالة */}
      {state.customMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="ml-2 h-5 w-5 text-green-600" />
              معاينة الرسالة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className="bg-green-600 rounded-full p-1">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    إلى: {state.selectedContact?.name || state.phoneNumber}
                  </p>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="whitespace-pre-wrap">{state.customMessage}</p>
                    
                    {state.messageType === 'media' && state.mediaUrl && (
                      <div className="mt-2 text-sm text-blue-600">
                        📎 مرفق: {state.mediaUrl}
                      </div>
                    )}
                    
                    {state.messageType === 'button' && state.buttons.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {state.buttons.map((button, index) => (
                          <div key={index} className="bg-gray-100 px-3 py-1 rounded text-sm">
                            🔘 {button.displayText}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {state.messageType === 'poll' && state.pollOptions.some(opt => opt.trim()) && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">📊 استطلاع رأي:</p>
                        {state.pollOptions.filter(opt => opt.trim()).map((option, index) => (
                          <div key={index} className="bg-gray-100 px-3 py-1 rounded text-sm mb-1">
                            {index + 1}. {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
