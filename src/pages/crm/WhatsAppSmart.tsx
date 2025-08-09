import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import SendWhatsApp from '@/components/whatsapp/SendWhatsApp';

export default function WhatsAppSmart() {
  const { data: today = [] } = useQuery({
    queryKey: ['wa-reminders-today'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('whatsapp_reminders')
        .select('*')
        .lte('remind_at', new Date().toISOString())
        .eq('enabled', true)
        .eq('surfaced', false)
        .limit(50);
      return data || [];
    }
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">واتساب الذكي</h1>
        <p className="text-muted-foreground">قائمة بالرسائل المقترحة للإرسال اليوم حسب مراحل المبيعات</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المطلوب اليوم</CardTitle>
          <CardDescription>التذكيرات المستحقة حتى الآن</CardDescription>
        </CardHeader>
        <CardContent>
          {today.length === 0 ? (
            <div className="text-muted-foreground">لا يوجد تذكيرات مستحقة</div>
          ) : (
            <div className="space-y-3">
              {today.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium">مرحلة: {r.stage}</div>
                    <div className="text-sm text-muted-foreground">موعد: {new Date(r.remind_at).toLocaleString('ar-AE')}</div>
                  </div>
                  <div className="flex gap-2">
                    <SendWhatsApp
                      leadId={r.lead_id}
                      stage={r.stage}
                      phone={'' as any}
                      lang={'ar'}
                      template={undefined as any}
                      context={{ client_name: '', property_type: '', appointment_date: '', appointment_time: '', appointment_location: '' }}
                    />
                    <Button variant="outline" size="sm">تأجيل</Button>
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


