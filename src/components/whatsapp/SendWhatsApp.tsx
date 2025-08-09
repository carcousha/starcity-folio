import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TemplatePicker from '@/components/whatsapp/TemplatePicker';
import MessagePreview from '@/components/whatsapp/MessagePreview';
import { buildWhatsAppUrl, renderTemplate, renderBody, Lang } from '@/lib/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface Props {
  leadId: string;
  stage: string;
  phone: string;
  lang: Lang;
  template?: { body_ar: string; body_en: string; id?: string };
  context: Record<string, string>;
}

export function SendWhatsApp({ leadId, stage, phone, lang, template, context }: Props) {
  const [open, setOpen] = useState(false);
  const [pickedTemplate, setPickedTemplate] = useState<any>(template);
  const defaultText = template ? renderTemplate(template.body_ar, template.body_en, lang, context) : renderBody('مرحباً {client_name}', context);
  const [message, setMessage] = useState<string>(defaultText);

  const handleSend = async () => {
    const url = buildWhatsAppUrl(phone, message);
    window.open(url, '_blank');
    await supabase.from('whatsapp_message_logs' as any).insert({
      lead_id: leadId,
      stage,
      template_id: pickedTemplate?.id || null,
      phone_e164: phone,
      lang,
      message_text: message,
      status: 'opened'
    } as any);
    setOpen(false);
  };

  return (
    <>
      <Button onClick={()=>setOpen(true)} size="sm">إرسال واتساب</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>اختيار القالب ومعاينة الرسالة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <TemplatePicker stage={stage as any} lang={lang} onChange={(t)=>{ setPickedTemplate(t); if (t) setMessage(renderBody(t.body, context)); }} />
            <MessagePreview value={message} onChange={setMessage} />
            <div className="flex justify-end"><Button onClick={handleSend}>فتح واتساب الآن</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SendWhatsApp;


