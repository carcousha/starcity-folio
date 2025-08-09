import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, WhatsAppStage, Lang } from '@/services/templateService';
import { AVAILABLE_PLACEHOLDERS, renderBody, mockContext, extractPlaceholders, findMissingPlaceholders } from '@/lib/whatsapp';
import { toast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<{stage?: WhatsAppStage; lang?: Lang}>({});
  const [form, setForm] = useState<{id?: string; name: string; stage: WhatsAppStage; lang: Lang; body: string}>({ name: '', stage: 'Lead', lang: 'ar', body: '' });
  const [preview, setPreview] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['wa-templates', filters],
    queryFn: () => getTemplates(filters)
  });

  const createMut = useMutation({
    mutationFn: () => createTemplate(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-templates'] });
      setForm({ name:'', stage:'Lead', lang:'ar', body:'' });
      toast({ title: 'تم', description: 'تم إضافة القالب بنجاح' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err?.message || 'فشل إضافة القالب. تأكد من الصلاحيات والبيانات.', variant: 'destructive' });
    }
  });
  const updateMut = useMutation({
    mutationFn: () => updateTemplate(form.id!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-templates'] });
      setIsEditing(false);
      setForm({ name:'', stage:'Lead', lang:'ar', body:'' });
      toast({ title: 'تم', description: 'تم تعديل القالب بنجاح' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err?.message || 'فشل تعديل القالب. تأكد من الصلاحيات والبيانات.', variant: 'destructive' });
    }
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-templates'] })
  });

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة قوالب واتساب</h1>
        <div className="flex gap-2">
          <Select onValueChange={(v)=>setFilters(prev=>({...prev, stage: v as WhatsAppStage}))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="المرحلة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Closing">Closing</SelectItem>
              <SelectItem value="PostSale">PostSale</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v)=>setFilters(prev=>({...prev, lang: v as Lang}))}>
            <SelectTrigger className="w-28"><SelectValue placeholder="اللغة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'تعديل قالب' : 'إضافة قالب جديد'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="عنوان القالب" value={form.name} onChange={(e)=>setForm(prev=>({...prev, name:e.target.value}))} />
            <Select value={form.stage} onValueChange={(v)=>setForm(prev=>({...prev, stage: v as WhatsAppStage}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Closing">Closing</SelectItem>
                <SelectItem value="PostSale">PostSale</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.lang} onValueChange={(v)=>setForm(prev=>({...prev, lang: v as Lang}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Textarea rows={8} placeholder="نص القالب (استخدم {client_name} مثلًا)" value={form.body} onChange={(e)=>setForm(prev=>({...prev, body:e.target.value}))} />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setPreview(renderBody(form.body, mockContext()))}>معاينة</Button>
                <Button type="button" variant="outline" onClick={() => {
                  const missing = findMissingPlaceholders(form.body, mockContext());
                  if (missing.length) alert('متغيرات غير معروفة في بيانات الاختبار: ' + missing.join(', ')); else alert('القالب صالح مع بيانات الاختبار');
                }}>تحقق</Button>
              </div>
              {preview && (
                <div className="border rounded p-3 bg-muted/30 whitespace-pre-line text-sm">
                  {preview}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="font-medium">المتغيرات المتاحة</div>
              <div className="space-y-1 max-h-64 overflow-auto pr-1">
                {AVAILABLE_PLACEHOLDERS.map(ph => (
                  <button
                    key={ph.key}
                    type="button"
                    className="w-full text-right p-2 border rounded hover:bg-muted text-sm"
                    onClick={() => {
                      // إدراج المتغير في موضع المؤشر: كحل بسيط نضيفه إلى نهاية النص
                      setForm(prev => ({ ...prev, body: prev.body + (prev.body.endsWith(' ') || prev.body.length === 0 ? '' : ' ') + `{${ph.key}}` }));
                    }}
                    title={ph.description}
                  >
                    {`{${ph.key}}`} — {ph.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <Button onClick={()=>updateMut.mutate()} disabled={updateMut.isPending}>حفظ التعديل</Button>
            ) : (
              <Button onClick={()=>{
                // تحقق أساسي: استخراج المتغيرات وبيانها
                const used = extractPlaceholders(form.body);
                if (!form.name.trim() || !form.body.trim()) {
                  toast({ title: 'تنبيه', description: 'أدخل عنوان القالب ونص القالب.', variant: 'destructive' });
                  return;
                }
                if (used.length === 0 && !confirm('لا توجد متغيرات في النص. هل تريد الحفظ؟')) return;
                createMut.mutate();
              }} disabled={createMut.isPending}>إضافة</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>القوالب</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? 'جار التحميل...' : (
            <div className="space-y-2">
              {templates.map((t:any)=>(
                <div key={t.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="max-w-[75%]">
                    <div className="font-medium">[{t.stage}] {t.name} ({t.lang})</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">{t.body}</div>
                    {Array.isArray(t.variables) && t.variables.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">المتغيرات: {t.variables.join(', ')}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={()=>{ setIsEditing(true); setForm({ id:t.id, name:t.name, stage:t.stage, lang:t.lang, body:t.body }); }}>تعديل</Button>
                    <Button size="sm" variant="destructive" onClick={()=>{ if(confirm('حذف القالب؟')) deleteMut.mutate(t.id); }}>حذف</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


