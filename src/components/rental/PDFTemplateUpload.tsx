import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface PDFTemplate {
  id: string;
  template_name: string;
  template_type: string;
  file_path: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

interface TemplateFormData {
  template_name: string;
  template_type: string;
}

const PDFTemplateUpload = () => {
  const { isAdmin, isAccountant } = useRoleAccess();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: '',
    template_type: 'rental_contract'
  });

  const queryClient = useQueryClient();

  // جلب قوالب PDF
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['pdf-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const uploadTemplateMutation = useMutation({
    mutationFn: async (data: { formData: TemplateFormData; file: File }) => {
      // إنشاء اسم ملف آمن
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const safeFileName = `pdf_template_${timestamp}_${randomString}.pdf`;
      
      // رفع الملف إلى Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-templates')
        .upload(safeFileName, data.file, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // حفظ بيانات القالب في قاعدة البيانات
      const { data: template, error: templateError } = await supabase
        .from('pdf_templates')
        .insert({
          template_name: data.formData.template_name,
          template_type: data.formData.template_type,
          file_path: uploadData.path,
          field_positions: {},
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .single();

      if (templateError) throw templateError;

      return template;
    },
    onSuccess: () => {
      toast({
        title: "تم رفع قالب PDF بنجاح",
        description: "تم حفظ القالب ويمكن استخدامه الآن"
      });
      
      // إعادة تعيين النموذج
      setFormData({
        template_name: '',
        template_type: 'rental_contract'
      });
      setFile(null);
      
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في رفع القالب",
        description: "حدث خطأ أثناء رفع قالب PDF. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // جلب بيانات القالب أولاً للحصول على مسار الملف
      const { data: template, error: getError } = await supabase
        .from('pdf_templates')
        .select('file_path')
        .eq('id', templateId)
        .single();

      if (getError) throw getError;

      // حذف الملف من Storage
      const { error: storageError } = await supabase.storage
        .from('pdf-templates')
        .remove([template.file_path]);

      if (storageError) {
        console.warn('Warning: Could not delete file from storage:', storageError);
      }

      // حذف القالب من قاعدة البيانات
      const { error } = await supabase
        .from('pdf_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف القالب",
        description: "تم حذف قالب PDF بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
    },
    onError: () => {
      toast({
        title: "خطأ في حذف القالب",
        description: "حدث خطأ أثناء حذف القالب",
        variant: "destructive"
      });
    }
  });

  const downloadTemplate = async (template: PDFTemplate) => {
    try {
      const { data, error } = await supabase.storage
        .from('pdf-templates')
        .download(template.file_path);

      if (error) throw error;

      // إنشاء رابط التحميل
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.template_name}.pdf`;
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
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى رفع ملف PDF فقط",
          variant: "destructive"
        });
        return;
      }
      
      // التحقق من حجم الملف (10MB حد أقصى)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "حجم الملف يجب أن يكون أقل من 10 ميجابايت",
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
        description: "يرجى اختيار ملف PDF للرفع",
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

    uploadTemplateMutation.mutate({ formData, file });
  };

  if (!isAdmin && !isAccountant) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">غير مصرح</h3>
          <p className="text-muted-foreground">لا تملك صلاحية إدارة قوالب PDF</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نموذج رفع قالب PDF جديد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع قالب PDF جديد
          </CardTitle>
          <CardDescription>
            ارفع ملف PDF ليستخدم كقالب للعقود المتقدمة. سيتم ملء الحقول تلقائياً بالبيانات المدخلة
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
                    <SelectItem value="rental_contract">عقد إيجار</SelectItem>
                    <SelectItem value="sales_contract">عقد بيع</SelectItem>
                    <SelectItem value="management_contract">عقد إدارة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">ملف PDF*</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
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
              <h4 className="font-medium text-blue-800 mb-2">متغيرات القالب المتاحة:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                <span>اسم المستأجر</span>
                <span>اسم المالك</span>
                <span>عنوان العقار</span>
                <span>المنطقة</span>
                <span>رقم الوحدة</span>
                <span>نوع الوحدة</span>
                <span>الغرض من الاستخدام</span>
                <span>قيمة الإيجار</span>
                <span>طريقة الدفع</span>
                <span>عدد الأقساط</span>
                <span>تاريخ البداية</span>
                <span>تاريخ النهاية</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                سيتم ملء هذه الحقول تلقائياً في ملف PDF عند إنشاء العقد
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={uploadTemplateMutation.isPending || !file}
            >
              {uploadTemplateMutation.isPending ? "جارٍ الرفع..." : "رفع قالب PDF"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* قائمة قوالب PDF المرفوعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قوالب PDF المرفوعة ({templates.length})
          </CardTitle>
          <CardDescription>
            إدارة جميع قوالب PDF المرفوعة للعقود
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جارٍ التحميل...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">لا توجد قوالب PDF</h3>
              <p>ابدأ برفع أول قالب PDF للعقود</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{template.template_name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>النوع: {template.template_type}</span>
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
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        disabled={deleteTemplateMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        حذف
                      </Button>
                    )}
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

export default PDFTemplateUpload;