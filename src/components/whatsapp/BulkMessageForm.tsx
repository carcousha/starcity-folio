// Bulk Message Form Component
// مكون نموذج الرسالة الجماعية

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, Filter, Settings, MessageSquare, Image, Link, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { bulkMessageService } from '@/services/bulkMessageService';
import { whatsappService } from '@/services/whatsappService';

interface BulkMessageFormProps {
  onMessageCreated?: (messageId: string) => void;
  onCancel?: () => void;
}

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  type: string;
  company?: string;
  tags?: string[];
}

interface Template {
  id: string;
  name: string;
  content: string;
  type: string;
}

export const BulkMessageForm: React.FC<BulkMessageFormProps> = ({ onMessageCreated, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);

  // التحقق من وجود بيانات من صفحة المهام المتقدمة
  useEffect(() => {
    const bulkSendData = localStorage.getItem('bulkSendFromLandBrokers');
    if (bulkSendData) {
      try {
        setIsLoadingData(true);
        console.log('📥 [BulkMessageForm] Loading data from Advanced Tasks...');
        const parsedData = JSON.parse(bulkSendData);
        
        // تعبئة النموذج بالبيانات المحولة
        setFormData(prev => ({
          ...prev,
          name: parsedData.campaignName || '',
          message_content: parsedData.messageContent || '',
        }));

        // تعبئة إعدادات التخصيص
        if (parsedData.personalizationEnabled) {
          setPersonalizationSettings(prev => ({
            ...prev,
            enabled: true,
          }));
        }

        // تعبئة إعدادات التوقيت
        if (parsedData.timingSettings) {
          const timing = parsedData.timingSettings;
          setSendSettings(prev => ({
            ...prev,
            send_type: timing.useRandomTiming ? 'gradual' : 'immediate',
            gradual_settings: {
              ...prev.gradual_settings,
              enabled: timing.useRandomTiming,
              delay_minutes: timing.fixedIntervalMinutes || 2,
            },
          }));
        }

        // إضافة المستلمين المحولين
        if (parsedData.recipients && Array.isArray(parsedData.recipients)) {
          const convertedContacts = parsedData.recipients.map((recipient: any) => ({
            id: recipient.id,
            name: recipient.name,
            phone_number: recipient.phone_number,
            type: recipient.type,
            company: recipient.company,
            tags: recipient.tags || [],
          }));
          
          setContacts(convertedContacts);
          setSelectedContacts(convertedContacts.map(c => c.id));
          
          console.log('✅ [BulkMessageForm] Loaded', convertedContacts.length, 'recipients from Advanced Tasks');
        }

        // تأخير مسح البيانات من localStorage لضمان عدم فقدان البيانات
        setTimeout(() => {
          localStorage.removeItem('bulkSendFromLandBrokers');
          console.log('✅ [BulkMessageForm] Data cleared from localStorage after form population');
        }, 3000); // تأخير 3 ثواني
        
      } catch (error) {
        console.error('❌ [BulkMessageForm] Error loading data from Advanced Tasks:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
  }, []);

  // بيانات الرسالة الأساسية
  const [formData, setFormData] = useState({
    name: '',
    message_content: '',
    message_type: 'text' as 'text' | 'media' | 'button' | 'poll',
    media_url: '',
    media_type: '',
    button_text: '',
    button_url: '',
    template_id: '',
  });

  // إعدادات المستلمين
  const [recipientSettings, setRecipientSettings] = useState({
    recipient_type: 'all' as 'all' | 'by_type' | 'by_company' | 'by_tags' | 'custom',
    filters: {
      contact_types: [] as string[],
      companies: [] as string[],
      tags: [] as string[],
      has_phone: true,
      is_active: true,
    },
    custom_recipients: [] as string[],
    exclude_duplicates: true,
    max_recipients: 1000,
  });

  // إعدادات الإرسال
  const [sendSettings, setSendSettings] = useState({
    send_type: 'immediate' as 'immediate' | 'scheduled' | 'gradual',
    scheduled_at: '',
    gradual_settings: {
      enabled: false,
      batch_size: 10,
      delay_minutes: 2,
      max_concurrent: 5,
    },
  });

  // إعدادات التخصيص
  const [personalizationSettings, setPersonalizationSettings] = useState({
    enabled: false,
    fields: {
      name: true,
      company: false,
      type: false,
      custom_field: false,
    },
    custom_field_name: '',
    fallback_text: '',
  });

  // إعدادات متقدمة
  const [advancedSettings, setAdvancedSettings] = useState({
    retry_failed: true,
    max_retries: 3,
    retry_delay_minutes: 5,
    stop_on_error: false,
    send_confirmation: false,
    track_opens: false,
    track_clicks: false,
  });

  useEffect(() => {
    loadContacts();
    loadTemplates();
  }, []);

  const loadContacts = async () => {
    try {
      const contactsData = await whatsappService.getContacts();
      // Map WhatsAppContact to Contact interface
      const mappedContacts = contactsData.map(contact => ({
        id: contact.id,
        name: contact.name,
        phone_number: contact.phone || contact.whatsapp_number,
        type: contact.contact_type || 'client',
        company: contact.company,
        tags: contact.tags
      }));
      setContacts(mappedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('فشل في تحميل جهات الاتصال');
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await whatsappService.getTemplates();
      // Map WhatsAppTemplate to Template interface
      const mappedTemplates = templatesData.map(template => ({
        id: template.id,
        name: template.name,
        content: template.content,
        type: template.template_type || 'text'
      }));
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('فشل في تحميل القوالب');
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRecipientChange = (field: string, value: any) => {
    setRecipientSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendSettingsChange = (field: string, value: any) => {
    setSendSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonalizationChange = (field: string, value: any) => {
    setPersonalizationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdvancedSettingsChange = (field: string, value: any) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFilteredContacts = () => {
    let filtered = contacts;

    // فلترة حسب النوع
    if (recipientSettings.filters.contact_types.length > 0) {
      filtered = filtered.filter(contact => 
        recipientSettings.filters.contact_types.includes(contact.type)
      );
    }

    // فلترة حسب الشركة
    if (recipientSettings.filters.companies.length > 0) {
      filtered = filtered.filter(contact => 
        contact.company && recipientSettings.filters.companies.includes(contact.company)
      );
    }

    // فلترة حسب العلامات
    if (recipientSettings.filters.tags.length > 0) {
      filtered = filtered.filter(contact => 
        contact.tags && contact.tags.some(tag => 
          recipientSettings.filters.tags.includes(tag)
        )
      );
    }

    // فلترة حسب وجود رقم الهاتف
    if (recipientSettings.filters.has_phone) {
      filtered = filtered.filter(contact => contact.phone_number);
    }

    // فلترة حسب الحالة النشطة
    if (recipientSettings.filters.is_active) {
      filtered = filtered.filter(contact => contact.phone_number && contact.phone_number.length > 0);
    }

    // إزالة التكرار
    if (recipientSettings.exclude_duplicates) {
      const unique = new Map();
      filtered.forEach(contact => {
        if (!unique.has(contact.phone_number)) {
          unique.set(contact.phone_number, contact);
        }
      });
      filtered = Array.from(unique.values());
    }

    // تحديد الحد الأقصى
    if (recipientSettings.max_recipients > 0) {
      filtered = filtered.slice(0, recipientSettings.max_recipients);
    }

    return filtered;
  };

  const getPersonalizedContent = (contact: Contact) => {
    if (!personalizationSettings.enabled) {
      return formData.message_content;
    }

    let content = formData.message_content;

    // استبدال اسم جهة الاتصال
    if (personalizationSettings.fields.name) {
      content = content.replace(/\{name\}/g, contact.name || 'عزيزي');
    }

    // استبدال الشركة
    if (personalizationSettings.fields.company && contact.company) {
      content = content.replace(/\{company\}/g, contact.company);
    }

    // استبدال النوع
    if (personalizationSettings.fields.type) {
      content = content.replace(/\{type\}/g, contact.type || '');
    }

    // استبدال الحقل المخصص
    if (personalizationSettings.fields.custom_field && personalizationSettings.custom_field_name) {
      const customValue = (contact as any)[personalizationSettings.custom_field_name] || personalizationSettings.fallback_text;
      content = content.replace(/\{custom\}/g, customValue);
    }

    return content;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // الحصول على جهات الاتصال المفلترة
      const filteredContacts = getFilteredContacts();
      
      if (filteredContacts.length === 0) {
        toast.error('لا توجد جهات اتصال تطابق المعايير المحددة');
        return;
      }

      // إنشاء الرسالة الجماعية
      const bulkMessage = {
        ...formData,
        recipient_type: recipientSettings.recipient_type,
        recipient_filters: recipientSettings.filters,
        custom_recipients: recipientSettings.custom_recipients,
        send_type: sendSettings.send_type,
        scheduled_at: sendSettings.scheduled_at || null,
        gradual_settings: sendSettings.gradual_settings,
        personalization_settings: personalizationSettings,
        advanced_settings: advancedSettings,
      };

      const messageResult = await bulkMessageService.createBulkMessage(bulkMessage);

      // إنشاء المستلمين (سيتم التعامل معهم في createBulkMessage)
      console.log('✅ Bulk message created with recipients:', filteredContacts.length);

      toast.success(`تم إنشاء الرسالة الجماعية بنجاح! سيتم إرسالها إلى ${filteredContacts.length} جهة اتصال`);
      
      if (onMessageCreated) {
        onMessageCreated(messageResult.id);
      }
    } catch (error) {
      console.error('Error creating bulk message:', error);
      toast.error('فشل في إنشاء الرسالة الجماعية');
    } finally {
      setIsLoading(false);
    }
  };

  const getContactTypes = () => {
    const types = new Set(contacts.map(contact => contact.type));
    return Array.from(types);
  };

  const getCompanies = () => {
    const companies = new Set(contacts.map(contact => contact.company).filter(Boolean));
    return Array.from(companies);
  };

  const getTags = () => {
    const tags = new Set();
    contacts.forEach(contact => {
      if (contact.tags) {
        contact.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  };

  const filteredContacts = getFilteredContacts();

  return (
    <div className="space-y-6">
      {/* مؤشر تحميل البيانات */}
      {isLoadingData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-800">
                جاري تحميل البيانات من صفحة المهام المتقدمة...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            إنشاء رسالة جماعية جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* البيانات الأساسية */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم الرسالة *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="مثال: رسالة ترحيب بالعملاء الجدد"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message_type">نوع الرسالة</Label>
                  <Select value={formData.message_type} onValueChange={(value) => handleFormChange('message_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">نص</SelectItem>
                      <SelectItem value="media">وسائط</SelectItem>
                      <SelectItem value="button">أزرار تفاعلية</SelectItem>
                      <SelectItem value="poll">استطلاع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message_content">محتوى الرسالة *</Label>
                <Textarea
                  id="message_content"
                  value={formData.message_content}
                  onChange={(e) => handleFormChange('message_content', e.target.value)}
                  placeholder="اكتب محتوى الرسالة هنا..."
                  rows={4}
                  required
                />
                {personalizationSettings.enabled && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>متغيرات التخصيص المتاحة:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {personalizationSettings.fields.name && <Badge variant="secondary">{'{name}'}</Badge>}
                      {personalizationSettings.fields.company && <Badge variant="secondary">{'{company}'}</Badge>}
                      {personalizationSettings.fields.type && <Badge variant="secondary">{'{type}'}</Badge>}
                      {personalizationSettings.fields.custom_field && <Badge variant="secondary">{'{custom}'}</Badge>}
                    </div>
                  </div>
                )}
              </div>

              {formData.message_type === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="media_url">رابط الوسائط</Label>
                    <Input
                      id="media_url"
                      value={formData.media_url}
                      onChange={(e) => handleFormChange('media_url', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="media_type">نوع الوسائط</Label>
                    <Select value={formData.media_type} onValueChange={(value) => handleFormChange('media_type', value)}>
                      <SelectTrigger>
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
                </div>
              )}

              {formData.message_type === 'button' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="button_text">نص الزر</Label>
                    <Input
                      id="button_text"
                      value={formData.button_text}
                      onChange={(e) => handleFormChange('button_text', e.target.value)}
                      placeholder="اضغط هنا"
                    />
                  </div>
                  <div>
                    <Label htmlFor="button_url">رابط الزر</Label>
                    <Input
                      id="button_url"
                      value={formData.button_url}
                      onChange={(e) => handleFormChange('button_url', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* إعدادات المستلمين */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h3 className="text-lg font-semibold">إعدادات المستلمين</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient_type">نوع المستلمين</Label>
                  <Select value={recipientSettings.recipient_type} onValueChange={(value) => handleRecipientChange('recipient_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع جهات الاتصال</SelectItem>
                      <SelectItem value="by_type">حسب النوع</SelectItem>
                      <SelectItem value="by_company">حسب الشركة</SelectItem>
                      <SelectItem value="by_tags">حسب العلامات</SelectItem>
                      <SelectItem value="custom">أرقام مخصصة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_recipients">الحد الأقصى للمستلمين</Label>
                  <Input
                    id="max_recipients"
                    type="number"
                    value={recipientSettings.max_recipients}
                    onChange={(e) => handleRecipientChange('max_recipients', parseInt(e.target.value))}
                    min="1"
                    max="10000"
                  />
                </div>
              </div>

              {/* الفلاتر المتقدمة */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Label>الفلاتر المتقدمة</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recipientSettings.recipient_type === 'by_type' && (
                    <div>
                      <Label>أنواع جهات الاتصال</Label>
                      <div className="space-y-2">
                        {getContactTypes().map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`type-${type}`}
                              checked={recipientSettings.filters.contact_types.includes(type)}
                              onChange={(e) => {
                                const newTypes = e.target.checked
                                  ? [...recipientSettings.filters.contact_types, type]
                                  : recipientSettings.filters.contact_types.filter(t => t !== type);
                                handleRecipientChange('filters', {
                                  ...recipientSettings.filters,
                                  contact_types: newTypes
                                });
                              }}
                            />
                            <Label htmlFor={`type-${type}`}>{type}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipientSettings.recipient_type === 'by_company' && (
                    <div>
                      <Label>الشركات</Label>
                      <div className="space-y-2">
                       {getCompanies().map((company, index) => (
                          <div key={`company-${index}`} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`company-${index}`}
                              checked={recipientSettings.filters.companies.includes(String(company))}
                              onChange={(e) => {
                                const newCompanies = e.target.checked
                                  ? [...recipientSettings.filters.companies, String(company)]
                                  : recipientSettings.filters.companies.filter(c => c !== String(company));
                                handleRecipientChange('filters', {
                                  ...recipientSettings.filters,
                                  companies: newCompanies
                                });
                              }}
                            />
                            <Label htmlFor={`company-${index}`}>{String(company)}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipientSettings.recipient_type === 'by_tags' && (
                    <div>
                      <Label>العلامات</Label>
                      <div className="space-y-2">
                       {getTags().map((tag, index) => (
                          <div key={`tag-${index}`} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`tag-${index}`}
                              checked={recipientSettings.filters.tags.includes(String(tag))}
                              onChange={(e) => {
                                const newTags = e.target.checked
                                  ? [...recipientSettings.filters.tags, String(tag)]
                                  : recipientSettings.filters.tags.filter(t => t !== String(tag));
                                handleRecipientChange('filters', {
                                  ...recipientSettings.filters,
                                  tags: newTags
                                });
                              }}
                            />
                            <Label htmlFor={`tag-${index}`}>{String(tag)}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="exclude_duplicates"
                    checked={recipientSettings.exclude_duplicates}
                    onChange={(e) => handleRecipientChange('exclude_duplicates', e.target.checked)}
                  />
                  <Label htmlFor="exclude_duplicates">إزالة التكرار</Label>
                </div>
              </div>

              {/* عرض المستلمين المفلترة */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">جهات الاتصال المحددة:</span>
                  <Badge variant="secondary">{filteredContacts.length} جهة اتصال</Badge>
                </div>
                {filteredContacts.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredContacts.slice(0, 10).map(contact => (
                        <div key={contact.id} className="text-sm text-gray-600">
                          {contact.name} - {contact.phone_number}
                        </div>
                      ))}
                      {filteredContacts.length > 10 && (
                        <div className="text-sm text-gray-500">
                          ... و {filteredContacts.length - 10} جهة اتصال أخرى
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* إعدادات التخصيص */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">إعدادات التخصيص</h3>
                </div>
                <Switch
                  checked={showPersonalization}
                  onCheckedChange={setShowPersonalization}
                />
              </div>

              {showPersonalization && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={personalizationSettings.enabled}
                      onCheckedChange={(checked) => handlePersonalizationChange('enabled', checked)}
                    />
                    <Label>تفعيل التخصيص</Label>
                  </div>

                  {personalizationSettings.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={personalizationSettings.fields.name}
                            onCheckedChange={(checked) => handlePersonalizationChange('fields', {
                              ...personalizationSettings.fields,
                              name: checked
                            })}
                          />
                          <Label>تخصيص الاسم</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={personalizationSettings.fields.company}
                            onCheckedChange={(checked) => handlePersonalizationChange('fields', {
                              ...personalizationSettings.fields,
                              company: checked
                            })}
                          />
                          <Label>تخصيص الشركة</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={personalizationSettings.fields.type}
                            onCheckedChange={(checked) => handlePersonalizationChange('fields', {
                              ...personalizationSettings.fields,
                              type: checked
                            })}
                          />
                          <Label>تخصيص النوع</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={personalizationSettings.fields.custom_field}
                            onCheckedChange={(checked) => handlePersonalizationChange('fields', {
                              ...personalizationSettings.fields,
                              custom_field: checked
                            })}
                          />
                          <Label>حقل مخصص</Label>
                        </div>
                      </div>

                      {personalizationSettings.fields.custom_field && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="custom_field_name">اسم الحقل المخصص</Label>
                            <Input
                              id="custom_field_name"
                              value={personalizationSettings.custom_field_name}
                              onChange={(e) => handlePersonalizationChange('custom_field_name', e.target.value)}
                              placeholder="مثال: city, department"
                            />
                          </div>
                          <div>
                            <Label htmlFor="fallback_text">النص البديل</Label>
                            <Input
                              id="fallback_text"
                              value={personalizationSettings.fallback_text}
                              onChange={(e) => handlePersonalizationChange('fallback_text', e.target.value)}
                              placeholder="نص بديل إذا لم يوجد الحقل"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* إعدادات الإرسال */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg font-semibold">إعدادات الإرسال</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="send_type">نوع الإرسال</Label>
                  <Select value={sendSettings.send_type} onValueChange={(value) => handleSendSettingsChange('send_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">فوري</SelectItem>
                      <SelectItem value="scheduled">مجدول</SelectItem>
                      <SelectItem value="gradual">تدريجي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sendSettings.send_type === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduled_at">موعد الإرسال</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={sendSettings.scheduled_at}
                      onChange={(e) => handleSendSettingsChange('scheduled_at', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {sendSettings.send_type === 'gradual' && (
                <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium">إعدادات الإرسال التدريجي</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="batch_size">حجم الدفعة</Label>
                      <Input
                        id="batch_size"
                        type="number"
                        value={sendSettings.gradual_settings.batch_size}
                        onChange={(e) => handleSendSettingsChange('gradual_settings', {
                          ...sendSettings.gradual_settings,
                          batch_size: parseInt(e.target.value)
                        })}
                        min="1"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delay_minutes">التأخير بين الدفعات (دقائق)</Label>
                      <Input
                        id="delay_minutes"
                        type="number"
                        value={sendSettings.gradual_settings.delay_minutes}
                        onChange={(e) => handleSendSettingsChange('gradual_settings', {
                          ...sendSettings.gradual_settings,
                          delay_minutes: parseInt(e.target.value)
                        })}
                        min="1"
                        max="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_concurrent">الحد الأقصى للإرسال المتزامن</Label>
                      <Input
                        id="max_concurrent"
                        type="number"
                        value={sendSettings.gradual_settings.max_concurrent}
                        onChange={(e) => handleSendSettingsChange('gradual_settings', {
                          ...sendSettings.gradual_settings,
                          max_concurrent: parseInt(e.target.value)
                        })}
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* الإعدادات المتقدمة */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">الإعدادات المتقدمة</h3>
                </div>
                <Switch
                  checked={showAdvancedOptions}
                  onCheckedChange={setShowAdvancedOptions}
                />
              </div>

              {showAdvancedOptions && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={advancedSettings.retry_failed}
                        onCheckedChange={(checked) => handleAdvancedSettingsChange('retry_failed', checked)}
                      />
                      <Label>إعادة المحاولة للرسائل الفاشلة</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={advancedSettings.stop_on_error}
                        onCheckedChange={(checked) => handleAdvancedSettingsChange('stop_on_error', checked)}
                      />
                      <Label>إيقاف الإرسال عند حدوث خطأ</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={advancedSettings.send_confirmation}
                        onCheckedChange={(checked) => handleAdvancedSettingsChange('send_confirmation', checked)}
                      />
                      <Label>إرسال تأكيد الإرسال</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={advancedSettings.track_opens}
                        onCheckedChange={(checked) => handleAdvancedSettingsChange('track_opens', checked)}
                      />
                      <Label>تتبع فتح الرسائل</Label>
                    </div>
                  </div>

                  {advancedSettings.retry_failed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max_retries">الحد الأقصى للمحاولات</Label>
                        <Input
                          id="max_retries"
                          type="number"
                          value={advancedSettings.max_retries}
                          onChange={(e) => handleAdvancedSettingsChange('max_retries', parseInt(e.target.value))}
                          min="1"
                          max="10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="retry_delay_minutes">التأخير بين المحاولات (دقائق)</Label>
                        <Input
                          id="retry_delay_minutes"
                          type="number"
                          value={advancedSettings.retry_delay_minutes}
                          onChange={(e) => handleAdvancedSettingsChange('retry_delay_minutes', parseInt(e.target.value))}
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* أزرار التحكم */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  إلغاء
                </Button>
                <div className="text-sm text-gray-600">
                  سيتم إرسال الرسالة إلى {filteredContacts.length} جهة اتصال
                </div>
              </div>
              <Button type="submit" disabled={isLoading || filteredContacts.length === 0}>
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء وإرسال'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
