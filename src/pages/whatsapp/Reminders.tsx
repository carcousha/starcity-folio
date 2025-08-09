import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function WhatsAppReminders() {
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['wa-reminders-all'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('whatsapp_reminders').select('*').order('remind_at', { ascending: true }).limit(200);
      return data || [];
    }
  });
  return (
    <div className="space-y-6 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">التذكيرات</h1>
      <Card>
        <CardHeader><CardTitle>كل التذكيرات</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? 'جار التحميل...' : (
            <div className="space-y-2">
              {reminders.map((r:any)=>(
                <div key={r.id} className="flex justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{r.stage}</div>
                    <div className="text-sm text-muted-foreground">موعد: {new Date(r.remind_at).toLocaleString('ar-AE')}</div>
                  </div>
                  <div className="text-sm">{r.enabled ? 'مفعّل' : 'معطّل'}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


