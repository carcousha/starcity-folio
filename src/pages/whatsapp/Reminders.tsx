import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayReminders, markReminderDone } from '@/services/reminderService';
import SendWhatsApp from '@/components/whatsapp/SendWhatsApp';
import { Button } from '@/components/ui/button';

export default function WhatsAppReminders() {
  const qc = useQueryClient();
  const { data: reminders = [], isLoading } = useQuery({ queryKey: ['wa-reminders-all'], queryFn: ()=> getTodayReminders() });
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
                  <div className="flex items-center gap-2">
                    <SendWhatsApp
                      leadId={r.lead_id}
                      stage={r.stage}
                      phone={'' as any}
                      lang={'ar'}
                      context={{}}
                    />
                    <Button variant="outline" size="sm" onClick={()=>{ markReminderDone(r.id).then(()=> qc.invalidateQueries({ queryKey: ['wa-reminders-all'] })); }}>تم</Button>
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


