import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Search,
  Filter,
  MessageSquare,
  Image,
  Sticker,
  BarChart3,
  Radio,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  category: string;
  type: 'text' | 'media' | 'sticker' | 'poll' | 'button';
  content: string;
  variables: string[];
  language: 'ar' | 'en' | 'both';
  isDefault: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // محاكاة البيانات
  useEffect(() => {
    const mockTemplates: Template[] = [
      {
        id: '1',
        name: 'ترحيب العميل الجديد',
        category: 'welcome',
        type: 'text',
        content: 'مرحباً {client_name}، نرحب بك في عائلة Starcity! 🏠\n\nنحن متحمسون لمساعدتك في العثور على العقار المثالي.\n\nهل تريد منا الاتصال بك قريباً؟',
        variables: ['client_name'],
        language: 'ar',
        isDefault: true,
        usageCount: 156,
        lastUsed: '2024-01-15 10:30',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-10'
      },
      {
        id: '2',
        name: 'تأكيد الموعد',
        category: 'appointment',
        type: 'text',
        content: 'مرحباً {client_name}،\n\nتأكيد موعدك يوم {appointment_date} الساعة {appointment_time}.\n\nالعنوان: {property_address}\n\nيرجى التأكيد أو إعادة الجدولة.',
        variables: ['client_name', 'appointment_date', 'appointment_time', 'property_address'],
        language: 'ar',
        isDefault: false,
        usageCount: 89,
        lastUsed: '2024-01-15 09:15',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-12'
      },
      {
        id: '3',
        name: 'عرض خاص',
        category: 'offer',
        type: 'media',
        content: 'عرض خاص! 🎯\n\nخصم {discount_percentage}% على {property_type}\n\nالعنوان: {property_address}\n\nالسعر: {price}\n\nالعرض ساري حتى {offer_end_date}',
        variables: ['discount_percentage', 'property_type', 'property_address', 'price', 'offer_end_date'],
        language: 'both',
        isDefault: false,
        usageCount: 234,
        lastUsed: '2024-01-15 14:20',
        createdAt: '2024-01-03',
        updatedAt: '2024-01-08'
      },
      {
        id: '4',
        name: 'تذكير المتابعة',
        category: 'followup',
        type: 'text',
        content: 'مرحباً {client_name}،\n\nكيف حالك؟ هل لديك أي أسئلة حول العقار الذي عرضناه عليك؟\n\nنحن هنا لمساعدتك! 📞\n\nيمكنك الاتصال بنا على: {phone_number}',
        variables: ['client_name', 'phone_number'],
        language: 'ar',
        isDefault: false,
        usageCount: 67,
        lastUsed: '2024-01-14 16:45',
        createdAt: '2024-01-07',
        updatedAt: '2024-01-11'
      },
      {
        id: '5',
        name: 'استطلاع رضا العميل',
        category: 'feedback',
        type: 'poll',
        content: 'كيف تقيم تجربتك معنا؟\n\nالخيارات:\n1️⃣ ممتاز\n2️⃣ جيد\n3️⃣ مقبول\n4️⃣ يحتاج تحسين',
        variables: [],
        language: 'ar',
        isDefault: false,
        usageCount: 45,
        lastUsed: '2024-01-13 11:20',
        createdAt: '2024-01-09',
        updatedAt: '2024-01-13'
      },
      {
        id: '6',
        name: 'رسالة أزرار سريعة',
        category: 'quick_actions',
        type: 'button',
        content: 'مرحباً {client_name}،\n\nكيف يمكننا مساعدتك اليوم؟\n\nالأزرار:\n📋 طلب عرض سعر\n📅 حجز موعد\n📞 الاتصال بنا\n🌐 زيارة موقعنا',
        variables: ['client_name'],
        language: 'ar',
        isDefault: false,
        usageCount: 78,
        lastUsed: '2024-01-15 12:10',
        createdAt: '2024-01-06',
        updatedAt: '2024-01-14'
      }
    ];
    setTemplates(mockTemplates);
  }, []);

  const categories = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'welcome', label: 'الترحيب' },
    { value: 'appointment', label: 'المواعيد' },
    { value: 'offer', label: 'العروض' },
    { value: 'followup', label: 'المتابعة' },
    { value: 'feedback', label: 'التقييم' },
    { value: 'quick_actions', label: 'إجراءات سريعة' }
  ];

  const types = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'text', label: 'نص', icon: '📝' },
    { value: 'media', label: 'وسائط', icon: '🖼️' },
    { value: 'sticker', label: 'ملصق', icon: '😊' },
    { value: 'poll', label: 'استطلاع', icon: '📊' },
    { value: 'button', label: 'أزرار', icon: '🔘' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesType = selectedType === 'all' || template.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: string) => {
    const typeInfo = types.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : '📝';
  };

  const getTypeLabel = (type: string) => {
    const typeInfo = types.find(t => t.value === type);
    return typeInfo ? typeInfo.label : 'نص';
  };

  const getCategoryLabel = (category: string) => {
    const categoryInfo = categories.find(c => c.value === category);
    return categoryInfo ? categoryInfo.label : 'غير محدد';
  };

  const getLanguageLabel = (language: string) => {
    switch (language) {
      case 'ar': return 'العربية';
      case 'en': return 'الإنجليزية';
      case 'both': return 'ثنائي اللغة';
      default: return 'غير محدد';
    }
  };

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "تم النسخ",
      description: "تم نسخ محتوى القالب إلى الحافظة",
    });
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: "تم الحذف",
        description: "تم حذف القالب بنجاح",
      });
    }
  };

  const setAsDefault = (templateId: string) => {
    setTemplates(prev => prev.map(t => ({
      ...t,
      isDefault: t.id === templateId
    })));
    toast({
      title: "تم التحديث",
      description: "تم تعيين القالب كافتراضي",
    });
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">قوالب الرسائل</h1>
          <p className="text-muted-foreground">إدارة قوالب الرسائل الجاهزة</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة قالب جديد
        </Button>
      </div>

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="البحث في القوالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">النوع</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>النتائج</Label>
              <div className="text-sm text-muted-foreground pt-2">
                {filteredTemplates.length} من {templates.length} قالب
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة القوالب */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(template.type)}</span>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(template.category)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getLanguageLabel(template.language)}
                      </Badge>
                      {template.isDefault && (
                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                          افتراضي
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-4">{template.content}</p>
              </div>

              {template.variables.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">المتغيرات:</Label>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>{template.usageCount} استخدام</span>
                </div>
                {template.lastUsed && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{template.lastUsed}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(template)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyTemplate(template)}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  نسخ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAsDefault(template.id)}
                  disabled={template.isDefault}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  افتراضي
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* رسالة إرشادية */}
      {filteredTemplates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قوالب</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' 
                ? 'جرب تغيير الفلاتر أو البحث' 
                : 'ابدأ بإنشاء قوالب رسائل جاهزة'}
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedType === 'all' && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء قالب جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القوالب</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">قالب متاح</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القوالب الافتراضية</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.isDefault).length}
            </div>
            <p className="text-xs text-muted-foreground">قالب افتراضي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستخدام</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {templates.reduce((sum, t) => sum + t.usageCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">مرة استخدام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ثنائي اللغة</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {templates.filter(t => t.language === 'both').length}
            </div>
            <p className="text-xs text-muted-foreground">قالب ثنائي</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
