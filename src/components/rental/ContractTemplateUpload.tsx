import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface TemplateFormData {
  template_name: string;
  template_type: string;
  description: string;
}

const ContractTemplateUpload = () => {
  const { checkPermission } = useRoleAccess();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: '',
    template_type: 'إيجار عقاري',
    description: ''
  });

  const queryClient = useQueryClient();

  // جلب قوالب العقود
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const uploadTemplateMutation = useMutation({
    mutationFn: async (data: { formData: TemplateFormData; file: File }) => {
      const fileName = `template-${Date.now()}-${data.file.name}`;
      
      // رفع الملف إلى Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-templates')
        .upload(fileName, data.file, {
          contentType: data.file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // حفظ بيانات القالب في قاعدة البيانات
      const { data: template, error: templateError } = await supabase
        .from('contract_templates')
        .insert({
          template_name: data.formData.template_name,
          template_type: data.formData.template_type,
          description: data.formData.description,
          template_file_url: uploadData.path, // استخدام الحقل الصحيح
          uploaded_file_path: uploadData.path,
          file_size: data.file.size,
          mime_type: data.file.type,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          is_active: true
        })
        .select()
        .single();

      if (templateError) throw templateError;

      return template;
    },
    onSuccess: () => {
      toast({
        title: "تم رفع القالب بنجاح",
        description: "تم حفظ قالب العقد ويمكن استخدامه الآن"
      });
      
      // إعادة تعيين النموذج
      setFormData({
        template_name: '',
        template_type: 'إيجار عقاري',
        description: ''
      });
      setFile(null);
      
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في رفع القالب",
        description: "حدث خطأ أثناء رفع قالب العقد. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // حذف القالب من قاعدة البيانات
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف القالب",
        description: "تم حذف قالب العقد بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
    },
    onError: () => {
      toast({
        title: "خطأ في حذف القالب",
        description: "حدث خطأ أثناء حذف القالب",
        variant: "destructive"
      });
    }
  });

  const downloadTemplate = async (template: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('contract-templates')
        .download(template.uploaded_file_path);

      if (error) throw error;

      // إنشاء رابط التحميل
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.template_name}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل القالب",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // التحقق من نوع الملف
      if (!selectedFile.type.includes('wordprocessing') && !selectedFile.name.endsWith('.docx')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى رفع ملف Word (.docx) فقط",
          variant: "destructive"
        });
        return;
      }
      
      // التحقق من حجم الملف (50MB حد أقصى)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "حجم الملف يجب أن يكون أقل من 50 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "يرجى اختيار ملف Word للرفع",
        variant: "destructive"
      });
      return;
    }

    if (!formData.template_name.trim()) {
      toast({
        title: "اسم القالب مطلوب",
        description: "يرجى إدخال اسم للقالب",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    uploadTemplateMutation.mutate({ formData, file }, {
      onSettled: () => setIsUploading(false)
    });
  };

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">غير مصرح</h3>
          <p className="text-muted-foreground">لا تملك صلاحية إدارة قوالب العقود</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نموذج رفع قالب جديد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع قالب عقد Word
          </CardTitle>
          <CardDescription>
            ارفع ملف Word ليستخدم كقالب للعقود. يمكن استخدام متغيرات مثل {'{'}tenant_name{'}'} و {'{'}rent_amount{'}'} في القالب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">اسم القالب*</Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="أدخل اسم القالب"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template_type">نوع القالب</Label>
                <Select 
                  value={formData.template_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع القالب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="إيجار عقاري">إيجار عقاري</SelectItem>
                    <SelectItem value="إيجار تجاري">إيجار تجاري</SelectItem>
                    <SelectItem value="إيجار سكني">إيجار سكني</SelectItem>
                    <SelectItem value="عام">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف القالب</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للقالب واستخداماته"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">ملف Word*</Label>
              <Input
                id="file"
                type="file"
                accept=".docx,.doc"
                onChange={handleFileChange}
                required
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileCheck className="h-4 w-4" />
                  تم اختيار: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">المتغيرات المتاحة:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                <span>{'{{tenant_name}}'}</span>
                <span>{'{{property_title}}'}</span>
                <span>{'{{location}}'}</span>
                <span>{'{{rent_amount}}'}</span>
                <span>{'{{security_deposit}}'}</span>
                <span>{'{{contract_start_date}}'}</span>
                <span>{'{{contract_end_date}}'}</span>
                <span>{'{{payment_method}}'}</span>
                <span>{'{{installments_count}}'}</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                استخدم هذه المتغيرات في ملف Word وسيتم استبدالها تلقائياً بالقيم الفعلية
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading || !file}
            >
              {isUploading ? "جارٍ الرفع..." : "رفع القالب"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* قائمة القوالب المرفوعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قوالب العقود المرفوعة
          </CardTitle>
          <CardDescription>
            إدارة جميع قوالب العقود المرفوعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جارٍ التحميل...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد قوالب مرفوعة بعد
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{template.template_name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>النوع: {template.template_type}</span>
                        {template.file_size && (
                          <span>الحجم: {(template.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                        <span>تاريخ الرفع: {new Date(template.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.is_active ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          غير نشط
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadTemplate(template)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      تحميل
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractTemplateUpload;