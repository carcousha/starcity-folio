import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, WhatsAppStage, Lang } from '@/services/templateService';

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<{stage?: WhatsAppStage; lang?: Lang}>({});
  const [form, setForm] = useState<{id?: string; name: string; stage: WhatsAppStage; lang: Lang; body: string}>({ name: '', stage: 'Lead', lang: 'ar', body: '' });
  const [isEditing, setIsEditing] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['wa-templates', filters],
    queryFn: () => getTemplates(filters)
  });

  const createMut = useMutation({
    mutationFn: () => createTemplate(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wa-templates'] }); setForm({ name:'', stage:'Lead', lang:'ar', body:'' }); }
  });
  const updateMut = useMutation({
    mutationFn: () => updateTemplate(form.id!, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wa-templates'] }); setIsEditing(false); setForm({ name:'', stage:'Lead', lang:'ar', body:'' }); }
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
          <Textarea rows={5} placeholder="نص القالب" value={form.body} onChange={(e)=>setForm(prev=>({...prev, body:e.target.value}))} />
          <div className="flex gap-2">
            {isEditing ? (
              <Button onClick={()=>updateMut.mutate()} disabled={updateMut.isPending}>حفظ التعديل</Button>
            ) : (
              <Button onClick={()=>createMut.mutate()} disabled={createMut.isPending}>إضافة</Button>
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
                  <div>
                    <div className="font-medium">[{t.stage}] {t.name} ({t.lang})</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">{t.body}</div>
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


