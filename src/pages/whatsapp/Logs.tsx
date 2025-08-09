import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLogs, resendMessage } from '@/services/logService';
import SendWhatsApp from '@/components/whatsapp/SendWhatsApp';

export default function WhatsAppLogs() {
  const { data: logs = [], isLoading } = useQuery({ queryKey: ['wa-logs'], queryFn: ()=> getLogs({}) });
  return (
    <div className="space-y-6 p-6" dir="rtl">
      <h1 className="text-2xl font-bold">سجل الرسائل</h1>
      <Card>
        <CardHeader><CardTitle>آخر 100 رسالة</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? 'جار التحميل...' : (
            <div className="space-y-2">
              {logs.map((l:any)=>(
                <div key={l.id} className="flex justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{l.phone_e164} • {l.stage} • {l.lang}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">{l.message_text}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">{new Date(l.sent_at).toLocaleString('ar-AE')} — {l.status}</div>
                    <SendWhatsApp
                      leadId={l.lead_id}
                      stage={l.stage}
                      phone={l.phone_e164}
                      lang={l.lang}
                      context={{}}
                    />
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


