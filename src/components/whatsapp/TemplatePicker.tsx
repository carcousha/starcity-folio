import { useQuery } from '@tanstack/react-query';
import { getTemplates, TemplateDTO, WhatsAppStage, Lang } from '@/services/templateService';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface Props {
  stage?: WhatsAppStage;
  lang?: Lang;
  onChange: (template?: TemplateDTO) => void;
}

export default function TemplatePicker({ stage, lang='ar', onChange }: Props) {
  const { data: templates = [] } = useQuery({ queryKey: ['wa-templates', stage, lang], queryFn: ()=> getTemplates({ stage, lang }) });
  const [selected, setSelected] = useState<TemplateDTO | undefined>();

  return (
    <div className="space-y-2">
      <Select onValueChange={(id)=>{ const t = templates.find(x=>x.id===id); setSelected(t); onChange(t); }}>
        <SelectTrigger><SelectValue placeholder="اختر قالب" /></SelectTrigger>
        <SelectContent>
          {templates.map(t=> (
            <SelectItem key={t.id} value={t.id!}>[{t.stage}] {t.name} ({t.lang})</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <Textarea rows={4} readOnly value={selected.body} />
      )}
    </div>
  );
}


