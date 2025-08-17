// WhatsApp Templates Component
// صفحة إدارة قوالب الرسائل

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  MessageSquare,
  Image,
  Users,
  BarChart3,
  Loader2,
  Eye,
  TrendingUp,
  Calendar
} from 'lucide-react';

import { whatsappService } from '@/services/whatsappService';
import {
  WhatsAppTemplate,
  CreateTemplateForm,
  MessageType,
  TemplateCategory
} from '@/types/whatsapp';

interface TemplatesState {
  templates: WhatsAppTemplate[];
  isLoading: boolean;
  searchTerm: string;
  categoryFilter: TemplateCategory | 'all';
  typeFilter: MessageType | 'all';
  showCreateDialog: boolean;
  showEditDialog: boolean;
  editingTemplate: WhatsAppTemplate | null;
  newTemplate: CreateTemplateForm;
}

const initialTemplate: CreateTemplateForm = {
  name: '',
  content: '',
  template_type: 'text',
  category: 'other',
  media_url: '',
  buttons: [],
  poll_options: []
};

export default function WhatsAppTemplates() {
  const [state, setState] = useState<TemplatesState>({
    templates: [],
    isLoading: false,
    searchTerm: '',
    categoryFilter: 'all',
    typeFilter: 'all',
    showCreateDialog: false,
    showEditDialog: false,
    editingTemplate: null,
    newTemplate: { ...initialTemplate }
  });

  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const updateState = (updates: Partial<TemplatesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const loadTemplates = async () => {
    try {
      updateState({ isLoading: true });
      const templatesData = await whatsappService.getTemplates();
      updateState({ templates: templatesData });
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل القوالب",
        variant: "destructive"
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const validation = whatsappService.validateTemplate(state.newTemplate);
      if (!validation.isValid) {
        toast({
          title: "خطأ في البيانات",
          description: validation.errors.join('، '),
          variant: "destructive"
        });
        return;
      }

      await whatsappService.createTemplate(state.newTemplate);
      
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة القالب بنجاح",
        variant: "default"
      });

      updateState({
        showCreateDialog: false,
        newTemplate: { ...initialTemplate }
      });

      loadTemplates();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "فشل في إضافة القالب",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!state.editingTemplate) return;

    try {
      await whatsappService.updateTemplate(state.editingTemplate.id, state.newTemplate);
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث القالب",
        variant: "default"
      });

      updateState({
        showEditDialog: false,
        editingTemplate: null,
        newTemplate: { ...initialTemplate }
      });

      loadTemplates();
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث القالب",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (template: WhatsAppTemplate) => {
    if (!confirm(`هل أنت متأكد من حذف القالب "${template.name}"؟`)) return;

    try {
      await whatsappService.deleteTemplate(template.id);
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف القالب",
        variant: "default"
      });

      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف القالب",
        variant: "destructive"
      });
    }
  };

  const startEditTemplate = (template: WhatsAppTemplate) => {
    updateState({
      editingTemplate: template,
      newTemplate: {
        name: template.name,
        content: template.content,
        template_type: template.template_type,
        category: template.category,
        media_url: template.media_url || '',
        buttons: template.buttons || [],
        poll_options: template.poll_options || []
      },
      showEditDialog: true
    });
  };

  const duplicateTemplate = async (template: WhatsAppTemplate) => {
    const duplicated: CreateTemplateForm = {
      name: `${template.name} - نسخة`,
      content: template.content,
      template_type: template.template_type,
      category: template.category,
      media_url: template.media_url || '',
      buttons: template.buttons || [],
      poll_options: template.poll_options || []
    };

    try {
      await whatsappService.createTemplate(duplicated);
      toast({
        title: "تم النسخ بنجاح",
        description: "تم إنشاء نسخة من القالب",
        variant: "default"
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "فشل في نسخ القالب",
        variant: "destructive"
      });
    }
  };

  const filteredTemplates = state.templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesCategory = state.categoryFilter === 'all' || template.category === state.categoryFilter;
    const matchesType = state.typeFilter === 'all' || template.template_type === state.typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'text': return <MessageSquare className="h-4 w-4" />;
      case 'media': return <Image className="h-4 w-4" />;
      case 'button': return <Plus className="h-4 w-4" />;
      case 'poll': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: MessageType) => {
    const typeMap = {
      'text': { label: 'نص', color: 'bg-blue-100 text-blue-800' },
      'media': { label: 'وسائط', color: 'bg-green-100 text-green-800' },
      'button': { label: 'أزرار', color: 'bg-purple-100 text-purple-800' },
      'poll': { label: 'استطلاع', color: 'bg-orange-100 text-orange-800' },
      'sticker': { label: 'ملصق', color: 'bg-pink-100 text-pink-800' },
      'product': { label: 'منتج', color: 'bg-indigo-100 text-indigo-800' }
    };
    
    const typeInfo = typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  const getCategoryBadge = (category: TemplateCategory) => {
    const categoryMap = {
      'real_estate_offer': { label: 'عرض عقاري', color: 'bg-emerald-100 text-emerald-800' },
      'advertisement': { label: 'إعلان', color: 'bg-yellow-100 text-yellow-800' },
      'reminder': { label: 'تذكير', color: 'bg-red-100 text-red-800' },
      'other': { label: 'أخرى', color: 'bg-gray-100 text-gray-800' }
    };
    
    const categoryInfo = categoryMap[category] || { label: category, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">قوالب الرسائل</h2>
          <p className="text-gray-600">إدارة القوالب الجاهزة للرسائل</p>
        </div>
        <Button onClick={() => updateState({ showCreateDialog: true })}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة قالب جديد
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في القوالب..."
                value={state.searchTerm}
                onChange={(e) => updateState({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={state.categoryFilter}
              onValueChange={(value) => updateState({ categoryFilter: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="real_estate_offer">عرض عقاري</SelectItem>
                <SelectItem value="advertisement">إعلان</SelectItem>
                <SelectItem value="reminder">تذكير</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={state.typeFilter}
              onValueChange={(value) => updateState({ typeFilter: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="text">نص</SelectItem>
                <SelectItem value="media">وسائط</SelectItem>
                <SelectItem value="button">أزرار</SelectItem>
                <SelectItem value="poll">استطلاع</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadTemplates} variant="outline" disabled={state.isLoading}>
              {state.isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="ml-2 h-4 w-4" />
              )}
              إعادة تحميل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.isLoading ? (
          <div className="col-span-full text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">جاري تحميل القوالب...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد قوالب متطابقة مع البحث</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {getTypeIcon(template.template_type)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => startEditTemplate(template)}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                        <Copy className="ml-2 h-4 w-4" />
                        نسخ
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-red-600"
                      >
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex space-x-2 space-x-reverse">
                  {getTypeBadge(template.template_type)}
                  {getCategoryBadge(template.category)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
                </div>
                
                {template.media_url && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    📎 يحتوي على وسائط
                  </div>
                )}
                
                {template.buttons && template.buttons.length > 0 && (
                  <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                    🔘 {template.buttons.length} أزرار
                  </div>
                )}
                
                {template.poll_options && template.poll_options.length > 0 && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    📊 {template.poll_options.length} خيارات استطلاع
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <TrendingUp className="h-3 w-3" />
                    <span>استُخدم {template.usage_count} مرة</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(template.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={state.showCreateDialog} onOpenChange={(open) => updateState({ showCreateDialog: open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة قالب جديد</DialogTitle>
            <DialogDescription>
              أنشئ قالب جديد لاستخدامه في الرسائل
            </DialogDescription>
          </DialogHeader>
          
          <TemplateForm
            template={state.newTemplate}
            onChange={(updates) => updateState({ newTemplate: { ...state.newTemplate, ...updates } })}
            onSubmit={handleCreateTemplate}
            onCancel={() => updateState({ showCreateDialog: false, newTemplate: { ...initialTemplate } })}
            submitLabel="إضافة القالب"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={state.showEditDialog} onOpenChange={(open) => updateState({ showEditDialog: open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل القالب</DialogTitle>
            <DialogDescription>
              تعديل بيانات القالب "{state.editingTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <TemplateForm
            template={state.newTemplate}
            onChange={(updates) => updateState({ newTemplate: { ...state.newTemplate, ...updates } })}
            onSubmit={handleUpdateTemplate}
            onCancel={() => updateState({ 
              showEditDialog: false, 
              editingTemplate: null, 
              newTemplate: { ...initialTemplate } 
            })}
            submitLabel="حفظ التغييرات"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template Form Component
interface TemplateFormProps {
  template: CreateTemplateForm;
  onChange: (updates: Partial<CreateTemplateForm>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}

function TemplateForm({ template, onChange, onSubmit, onCancel, submitLabel }: TemplateFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">اسم القالب *</Label>
          <Input
            id="name"
            value={template.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="اسم القالب"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">الفئة *</Label>
          <Select
            value={template.category}
            onValueChange={(value) => onChange({ category: value as TemplateCategory })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real_estate_offer">عرض عقاري</SelectItem>
              <SelectItem value="advertisement">إعلان</SelectItem>
              <SelectItem value="reminder">تذكير</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template_type">نوع القالب *</Label>
        <Select
          value={template.template_type}
          onValueChange={(value) => onChange({ template_type: value as MessageType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">نص</SelectItem>
            <SelectItem value="media">وسائط</SelectItem>
            <SelectItem value="button">أزرار</SelectItem>
            <SelectItem value="poll">استطلاع</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">محتوى القالب *</Label>
        <Textarea
          id="content"
          value={template.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="اكتب محتوى القالب هنا... يمكنك استخدام {name} للاسم و {company} للشركة"
          rows={4}
          required
        />
        <p className="text-xs text-gray-500">
          يمكنك استخدام المتغيرات: {'{name}'} للاسم، {'{company}'} للشركة، {'{phone}'} للهاتف
        </p>
      </div>

      {template.template_type === 'media' && (
        <div className="space-y-2">
          <Label htmlFor="media_url">رابط الوسائط</Label>
          <Input
            id="media_url"
            value={template.media_url}
            onChange={(e) => onChange({ media_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      )}

      <div className="flex space-x-3 space-x-reverse pt-4">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          إلغاء
        </Button>
      </div>
    </form>
  );
}
