import { Textarea } from '@/components/ui/textarea';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function MessagePreview({ value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm">نص الرسالة</label>
      <Textarea rows={6} value={value} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}


