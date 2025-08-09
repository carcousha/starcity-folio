import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Reminder = {
  id: string;
  lead_id: string;
  stage: string;
  template_id?: string | null;
  remind_at: string;
  enabled: boolean;
  surfaced: boolean;
  created_by?: string | null;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing env" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    // نافذة اليوم بالتوقيت المحلي للسيرفر
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    // 1) جلب تذكيرات اليوم المفعلة وغير المعروضة
    const { data: reminders, error: remindersError } = await admin
      .from('whatsapp_reminders')
      .select('*')
      .gte('remind_at', start.toISOString())
      .lte('remind_at', end.toISOString())
      .eq('enabled', true)
      .eq('surfaced', false)
      .order('remind_at', { ascending: true });
    if (remindersError) throw remindersError;

    const dueReminders = (reminders || []) as Reminder[];

    // 2) إنشاء إشعارات داخل النظام لكل تذكير مستحق
    const systemNotifications = dueReminders.map(r => ({
      // سيُولّد id تلقائيًا
      user_id: r.created_by, // يمكن لاحقًا التوسيع لإرسالها للمسؤول أو المالك أيضًا
      title: 'تذكير رسالة واتساب',
      message: `موعد إرسال رسالة واتساب لمرحلة ${r.stage} اليوم عند ${(new Date(r.remind_at)).toLocaleTimeString('ar-AE')}`,
      type: 'system',
      priority: 'normal',
      scheduled_for: null,
      metadata: { module: 'whatsapp', reminder_id: r.id, lead_id: r.lead_id, stage: r.stage }
    }));

    if (systemNotifications.length > 0) {
      const { error: notifError } = await admin.from('system_notifications').insert(systemNotifications as any);
      if (notifError) throw notifError;
    }

    // 3) إرسال بريد إلكتروني بسيط (إن وُجد بريد للمنشئ)
    // ملاحظة: يمكن لاحقًا استخدام بريد رسمي (Resend/Postmark). هنا نُنشئ سجلاً في جدول نشاط/بريد افتراضي.
    // لتبسيط التنفيذ، نتجاوز خطوة البريد إن لم تتوفر بنية جاهزة.

    // 4) تحديث حالة التذكيرات: علامتها surfaced=true (تبقى enabled=true ليقوم المستخدم بالإرسال يدويًا)
    const ids = dueReminders.map(r => r.id);
    if (ids.length > 0) {
      const { error: updError } = await admin
        .from('whatsapp_reminders')
        .update({ surfaced: true })
        .in('id', ids);
      if (updError) throw updError;
    }

    return new Response(JSON.stringify({ success: true, processed: ids.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});


