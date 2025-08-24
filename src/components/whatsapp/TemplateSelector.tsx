// Template Selector Component
// مكون اختيار القوالب الجاهزة

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Search,
  Eye,
  Copy,
  Star,
  Filter,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { toast } from 'sonner';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  language: 'ar' | 'en';
  status: 'active' | 'pending' | 'rejected';
  created_at: string;
  updated_at: string;
  usage_count?: number;
  rating?: number;
  tags?: string[];
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: WhatsAppTemplate) => void;
  selectedTemplateId?: string;
  messageType: 'text' | 'media' | 'sticker';
  disabled?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  selectedTemplateId,
  messageType,
  disabled = false
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);

  // فئات القوالب
  const categories = [
    { id: 'all', name: 'جميع القوالب', icon: FileText },
    { id: 'welcome', name: 'ترحيب', icon: User },
    { id: 'marketing', name: 'تسويق', icon: Star },
    { id: 'support', name: 'دعم فني', icon: Calendar },
    { id: 'reminder', name: 'تذكير', icon: Calendar },
    { id: 'notification', name: 'إشعار', icon: Tag },
    { id: 'real_estate', name: 'عقارات', icon: FileText }
  ];

  // قوالب تجريبية (سيتم استبدالها بالبيانات الحقيقية)
  const mockTemplates: WhatsAppTemplate[] = [
    {
      id: '1',
      name: 'رسالة ترحيب للعملاء الجدد',
      category: 'welcome',
      content: 'مرحباً {name}! نحن سعداء بانضمامك إلى {company}. فريقنا هنا لمساعدتك في أي وقت.',
      variables: ['name', 'company'],
      language: 'ar',
      status: 'active',
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
      usage_count: 245,
      rating: 4.8,
      tags: ['ترحيب', 'عملاء جدد', 'خدمة العملاء']
    },
    {
      id: '2',
      name: 'عرض خاص محدود الوقت',
      category: 'marketing',
      content: 'عرض خاص لك {name}! احصل على خصم {discount}% على جميع منتجاتنا. العرض صالح حتى {expiry_date}. لا تفوت الفرصة!',
      variables: ['name', 'discount', 'expiry_date'],
      language: 'ar',
      status: 'active',
      created_at: '2024-01-10',
      updated_at: '2024-01-12',
      usage_count: 189,
      rating: 4.6,
      tags: ['تسويق', 'عروض', 'خصومات']
    },
    {
      id: '3',
      name: 'تذكير موعد',
      category: 'reminder',
      content: 'تذكير ودود {name}: لديك موعد في {date} في تمام الساعة {time}. الموقع: {location}. نتطلع لرؤيتك!',
      variables: ['name', 'date', 'time', 'location'],
      language: 'ar',
      status: 'active',
      created_at: '2024-01-08',
      updated_at: '2024-01-08',
      usage_count: 156,
      rating: 4.9,
      tags: ['تذكير', 'مواعيد', 'عملاء']
    },
    {
      id: '4',
      name: 'عقار جديد متاح',
      category: 'real_estate',
      content: 'عقار جديد متاح! {property_type} في {location} بمساحة {area} متر مربع. السعر: {price}. للاستفسار اتصل على {phone}.',
      variables: ['property_type', 'location', 'area', 'price', 'phone'],
      language: 'ar',
      status: 'active',
      created_at: '2024-01-05',
      updated_at: '2024-01-05',
      usage_count: 89,
      rating: 4.7,
      tags: ['عقارات', 'جديد', 'استثمار']
    },
    {
      id: '5',
      name: 'شكر بعد الخدمة',
      category: 'support',
      content: 'شكراً لك {name} على تواصلك معنا. نأمل أن تكون خدمتنا قد لبت توقعاتك. نقدر ثقتك في {company}.',
      variables: ['name', 'company'],
      language: 'ar',
      status: 'active',
      created_at: '2024-01-03',
      updated_at: '2024-01-03',
      usage_count: 134,
      rating: 4.5,
      tags: ['شكر', 'خدمة عملاء', 'متابعة']
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // هنا سيتم استدعاء API الحقيقي لجلب القوالب
      // const templatesData = await whatsappService.getTemplates();
      
      // في الوقت الحالي نستخدم البيانات التجريبية
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('فشل في تحميل القوالب');
      // في حالة الخطأ، نستخدم البيانات التجريبية
      setTemplates(mockTemplates);
    } finally {
      setLoading(false);
    }
  };

  // تصفية القوالب
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags?.some(tag => tag.includes(searchQuery));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleTemplateSelect = (template: WhatsAppTemplate) => {
    onTemplateSelect(template);
    toast.success(`تم اختيار القالب: ${template.name}`);
  };

  const copyTemplateContent = (template: WhatsAppTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast.success('تم نسخ محتوى القالب');
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : FileText;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          اختيار من القوالب الجاهزة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* شريط البحث والفلترة */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في القوالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* قائمة القوالب */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">جاري تحميل القوالب...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد قوالب مطابقة للبحث</p>
            </div>
          ) : (
            filteredTemplates.map(template => {
              const CategoryIcon = getCategoryIcon(template.category);
              const isSelected = selectedTemplateId === template.id;
              
              return (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => !disabled && handleTemplateSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryIcon className="h-4 w-4 text-gray-500" />
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          {template.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-600">{template.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {template.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>الاستخدام: {template.usage_count || 0}</span>
                          <span>المتغيرات: {template.variables.length}</span>
                          <Badge variant="outline" className="text-xs">
                            {categories.find(cat => cat.id === template.category)?.name || template.category}
                          </Badge>
                        </div>
                        
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(template);
                          }}
                          disabled={disabled}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyTemplateContent(template);
                          }}
                          disabled={disabled}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* معاينة القالب */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">معاينة القالب</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">اسم القالب</Label>
                  <p className="text-sm text-gray-900">{previewTemplate.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">المحتوى</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {previewTemplate.content}
                    </p>
                  </div>
                </div>
                
                {previewTemplate.variables.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">المتغيرات</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {previewTemplate.variables.map((variable, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      handleTemplateSelect(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                    className="flex-1"
                    disabled={disabled}
                  >
                    استخدام هذا القالب
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyTemplateContent(previewTemplate)}
                    disabled={disabled}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    نسخ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* إحصائيات سريعة */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-500">
            {filteredTemplates.length} قالب متاح
          </span>
          {selectedTemplateId && (
            <Badge variant="secondary">
              تم اختيار قالب
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
