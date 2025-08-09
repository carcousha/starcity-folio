import { Button } from '@/components/ui/button';
import { buildWhatsAppUrl, renderTemplate, Lang } from '@/lib/whatsapp';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  leadId: string;
  stage: string;
  phone: string;
  lang: Lang;
  template?: { body_ar: string; body_en: string; id?: string };
  context: Record<string, string>;
}

export function SendWhatsApp({ leadId, stage, phone, lang, template, context }: Props) {
  const text = template ? renderTemplate(template.body_ar, template.body_en, lang, context) : '';
  const url = buildWhatsAppUrl(phone, text);

  const logOpen = async () => {
    await supabase.from('whatsapp_message_logs' as any).insert({
      lead_id: leadId,
      stage,
      template_id: template?.id || null,
      phone_e164: phone,
      lang,
      message_text: text,
      status: 'opened'
    } as any);
  };

  return (
    <Button onClick={() => { window.open(url, '_blank'); logOpen(); }} size="sm">
      إرسال واتساب
    </Button>
  );
}

export default SendWhatsApp;


