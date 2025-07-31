import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface PDFTemplate {
  id: string;
  template_name: string;
  template_type: string;
  file_path: string;
  field_positions: any;
  is_active: boolean;
  created_at: string;
}

interface TemplateFormData {
  template_name: string;
  template_type: string;
}

export const PDFTemplateUpload: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isAccountant } = useRoleAccess();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: '',
    template_type: 'rental_contract'
  });

  // جلب القوالب الموجودة
  const { data: templates, isLoading } = useQuery({
    queryKey: ['pdf-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PDFTemplate[];
    }
  });

  // رفع القالب الجديد
  const uploadTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !formData.template_name) {
        throw new Error('يجب اختيار ملف وإدخال اسم القالب');
      }

      // رفع الملف إلى التخزين
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-templates')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // حفظ معلومات القالب في قاعدة البيانات
      const { data, error } = await supabase
        .from('pdf_templates')
        .insert({
          template_name: formData.template_name,
          template_type: formData.template_type,
          file_path: uploadData.path,
          field_positions: {},
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "تم رفع القالب بنجاح",
        description: "يمكنك الآن استخدام هذا القالب في إنشاء العقود"
      });
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
      setSelectedFile(null);
      setFormData({ template_name: '', template_type: 'rental_contract' });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في رفع القالب",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // حذف القالب
  const deleteTemplateMutation = useMutation({
    mutationFn: async (template: PDFTemplate) => {
      // حذف الملف من التخزين
      await supabase.storage
        .from('contract-templates')
        .remove([template.file_path]);

      // حذف من قاعدة البيانات
      const { error } = await supabase
        .from('pdf_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف القالب",
        description: "تم حذف القالب بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف القالب",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
      });
      
      // Validate file type - accept multiple PDF MIME types
      const validPdfTypes = [
        'application/pdf',
        'application/x-pdf',
        'application/acrobat',
        'applications/vnd.pdf',
        'text/pdf',
        'text/x-pdf'
      ];
      
      const isPdf = validPdfTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
      
      if (!isPdf) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: `الملف المحدد: ${file.type}. يجب أن يكون الملف من نوع PDF`,
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        toast({
          title: "حجم الملف كبير",
          description: `حجم الملف (${fileSizeMB} ميجابايت) يجب أن يكون أقل من 10 ميجابايت`,
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      toast({
        title: "تم اختيار الملف",
        description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} ميجابايت)`
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadTemplateMutation.mutate();
  };

  const downloadTemplate = async (template: PDFTemplate) => {
    try {
      const { data, error } = await supabase.storage
        .from('contract-templates')
        .download(template.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.template_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الملف",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!isAdmin && !isAccountant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            ليس لديك صلاحية لإدارة قوالب PDF
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* نموذج رفع قالب جديد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع قالب PDF جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="template_name">اسم القالب</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                placeholder="أدخل اسم القالب"
                required
              />
            </div>

            <div>
              <Label htmlFor="template_type">نوع القالب</Label>
              <select
                id="template_type"
                value={formData.template_type}
                onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="rental_contract">عقد إيجار</option>
                <option value="sale_contract">عقد بيع</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <Label htmlFor="pdf_file">ملف PDF</Label>
              <Input
                id="pdf_file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
              {selectedFile && (
                <p className="mt-1 text-sm text-muted-foreground">
                  الملف المختار: {selectedFile.name}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={uploadTemplateMutation.isPending || !selectedFile}
              className="w-full"
            >
              {uploadTemplateMutation.isPending ? 'جارٍ الرفع...' : 'رفع القالب'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">المتغيرات المتاحة:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <code>{`{{tenant_name}}`}</code>
              <code>{`{{property_title}}`}</code>
              <code>{`{{rent_amount}}`}</code>
              <code>{`{{start_date}}`}</code>
              <code>{`{{end_date}}`}</code>
              <code>{`{{security_deposit}}`}</code>
              <code>{`{{installments_count}}`}</code>
              <code>{`{{payment_method}}`}</code>
              <code>{`{{contract_duration}}`}</code>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              استخدم هذه المتغيرات في ملف PDF الخاص بك وسيتم استبدالها بالقيم الفعلية
            </p>
          </div>
        </CardContent>
      </Card>

      {/* عرض القوالب الموجودة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            القوالب المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>جارٍ التحميل...</p>
          ) : !templates || templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد قوالب متاحة. قم برفع قالب جديد أولاً.
            </p>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{template.template_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.template_type === 'rental_contract' ? 'عقد إيجار' : 
                       template.template_type === 'sale_contract' ? 'عقد بيع' : 'أخرى'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      تم الرفع: {new Date(template.created_at).toLocaleDateString('ar-AE')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate(template)}
                    >
                      <Download className="h-4 w-4" />
                      تحميل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTemplateMutation.mutate(template)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
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