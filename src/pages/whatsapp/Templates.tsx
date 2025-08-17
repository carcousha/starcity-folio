import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Copy, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Template {
  id: string;
  name: string;
  description?: string;
  message_type: 'text' | 'media' | 'button' | 'list' | 'poll';
  content: any;
  variables: string[];
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    message_type: 'text' as const,
    content: {
      text: '',
      footer: '',
      buttons: [],
      media_url: '',
      list_items: []
    },
    category: 'general',
    variables: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل القوالب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم القالب",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert([{
          ...newTemplate,
          content: newTemplate.content,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setTemplates([data, ...templates]);
      setShowCreateDialog(false);
      resetNewTemplate();

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء القالب بنجاح"
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء القالب",
        variant: "destructive"
      });
    }
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      message_type: 'text',
      content: {
        text: '',
        footer: '',
        buttons: [],
        media_url: '',
        list_items: []
      },
      category: 'general',
      variables: []
    });
  };

  const extractVariables = (text: string) => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const handleTextChange = (text: string) => {
    const variables = extractVariables(text);
    setNewTemplate({
      ...newTemplate,
      content: { ...newTemplate.content, text },
      variables
    });
  };

  const getMessageTypeLabel = (type: string) => {
    const types = {
      text: 'نصية',
      media: 'وسائط',
      button: 'تفاعلية',
      list: 'قائمة',
      poll: 'استطلاع'
    };
    return types[type as keyof typeof types] || type;
  };

  const getMessageTypeColor = (type: string) => {
    const colors = {
      text: 'bg-blue-100 text-blue-800',
      media: 'bg-purple-100 text-purple-800',
      button: 'bg-green-100 text-green-800',
      list: 'bg-orange-100 text-orange-800',
      poll: 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const renderPreviewContent = (template: Template) => {
    switch (template.message_type) {
      case 'text':
        return (
          <div className="space-y-3">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
              <p className="whitespace-pre-wrap">{template.content.text}</p>
              {template.content.footer && (
                <p className="text-sm text-gray-500 mt-2 border-t pt-2">
                  {template.content.footer}
                </p>
              )}
            </div>
          </div>
        );
      case 'media':
        return (
          <div className="space-y-3">
            {template.content.media_url && (
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-sm text-gray-600">صورة/فيديو</p>
                <p className="text-xs text-gray-500">{template.content.media_url}</p>
              </div>
            )}
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
              <p className="whitespace-pre-wrap">{template.content.text}</p>
            </div>
          </div>
        );
      case 'button':
        return (
          <div className="space-y-3">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
              <p className="whitespace-pre-wrap">{template.content.text}</p>
            </div>
            <div className="space-y-2">
              {template.content.buttons?.map((button: any, index: number) => (
                <Button key={index} variant="outline" className="w-full">
                  {button.text}
                </Button>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600">معاينة غير متاحة لهذا النوع</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="space-y-6">
        {/* العنوان والأزرار */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-8 w-8" />
              قوالب الرسائل
            </h1>
            <p className="text-muted-foreground mt-1">
              إنشاء وإدارة قوالب رسائل واتساب قابلة لإعادة الاستخدام
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إنشاء قالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>إنشاء قالب رسالة جديد</DialogTitle>
                <DialogDescription>
                  إنشاء قالب قابل لإعادة الاستخدام في الحملات
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">اسم القالب *</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="اسم القالب"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-category">الفئة</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عام</SelectItem>
                      <SelectItem value="marketing">تسويق</SelectItem>
                      <SelectItem value="notifications">تنبيهات</SelectItem>
                      <SelectItem value="welcome">ترحيب</SelectItem>
                      <SelectItem value="followup">متابعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="template-description">وصف القالب</Label>
                  <Input
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    placeholder="وصف مختصر للقالب"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message-type">نوع الرسالة</Label>
                  <Select value={newTemplate.message_type} onValueChange={(value: any) => setNewTemplate({...newTemplate, message_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">رسالة نصية</SelectItem>
                      <SelectItem value="media">رسالة وسائط</SelectItem>
                      <SelectItem value="button">رسالة تفاعلية</SelectItem>
                      <SelectItem value="list">قائمة اختيارات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newTemplate.message_type === 'media' && (
                  <div>
                    <Label htmlFor="media-url">رابط الوسائط</Label>
                    <Input
                      id="media-url"
                      value={newTemplate.content.media_url}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        content: { ...newTemplate.content, media_url: e.target.value }
                      })}
                      placeholder="https://example.com/image.jpg"
                      dir="ltr"
                    />
                  </div>
                )}
                
                <div className="col-span-2">
                  <Label htmlFor="message-text">نص الرسالة *</Label>
                  <Textarea
                    id="message-text"
                    value={newTemplate.content.text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="اكتب نص الرسالة هنا... استخدم {{المتغير}} للمتغيرات"
                    rows={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    استخدم المتغيرات مثل: &#123;&#123;name&#125;&#125;، &#123;&#123;company&#125;&#125;، &#123;&#123;date&#125;&#125;
                  </p>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="message-footer">تذييل الرسالة</Label>
                  <Input
                    id="message-footer"
                    value={newTemplate.content.footer}
                    onChange={(e) => setNewTemplate({
                      ...newTemplate,
                      content: { ...newTemplate.content, footer: e.target.value }
                    })}
                    placeholder="نص التذييل (اختياري)"
                  />
                </div>
                
                {newTemplate.variables.length > 0 && (
                  <div className="col-span-2">
                    <Label>المتغيرات المكتشفة</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newTemplate.variables.map((variable, index) => (
                        <Badge key={index} variant="outline">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateTemplate}>
                  إنشاء القالب
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* جدول القوالب */}
        <Card>
          <CardHeader>
            <CardTitle>القوالب ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم القالب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المتغيرات</TableHead>
                  <TableHead>مرات الاستخدام</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMessageTypeColor(template.message_type)}>
                        {getMessageTypeLabel(template.message_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables?.slice(0, 2).map((variable, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.variables.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{template.usage_count}</TableCell>
                    <TableCell>
                      {new Date(template.created_at).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 ml-2" />
                              نسخ القالب
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 ml-2" />
                              تحرير القالب
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف القالب
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {templates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد قوالب حتى الآن. ابدأ بإنشاء قالبك الأول!
              </div>
            )}
          </CardContent>
        </Card>

        {/* معاينة القالب */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>معاينة القالب: {selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                هكذا ستظهر الرسالة للمستلمين
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="max-w-sm mx-auto bg-white rounded-lg shadow-sm">
                <div className="bg-green-600 text-white p-3 rounded-t-lg">
                  <p className="text-sm font-medium">واتساب</p>
                </div>
                <div className="p-4">
                  {selectedTemplate && renderPreviewContent(selectedTemplate)}
                </div>
              </div>
            </div>
            
            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div className="mt-4">
                <Label>المتغيرات في هذا القالب:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplate.variables.map((variable, index) => (
                    <Badge key={index} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ستحتاج لتحديد قيم هذه المتغيرات عند استخدام القالب في الحملات
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}