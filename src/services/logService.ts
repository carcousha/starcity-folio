import { supabase } from '@/integrations/supabase/client';

export async function getLogs(filters?: { from?: string; to?: string; stage?: string; template_id?: string }) {
  let q = (supabase as any).from('whatsapp_message_logs').select('*').order('sent_at', { ascending: false });
  if (filters?.from) q = q.gte('sent_at', filters.from);
  if (filters?.to) q = q.lte('sent_at', filters.to);
  if (filters?.stage) q = q.eq('stage', filters.stage);
  if (filters?.template_id) q = q.eq('template_id', filters.template_id);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function resendMessage(logId: string) {
  const { data, error } = await (supabase as any).from('whatsapp_message_logs').select('*').eq('id', logId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function hasRecentWhatsAppMessage(leadId: string, hours = 24) {
  const since = new Date(Date.now() - hours*60*60*1000).toISOString();
  const { data, error } = await (supabase as any)
    .from('whatsapp_message_logs')
    .select('id', { count: 'exact', head: true })
    .eq('lead_id', leadId)
    .gte('sent_at', since);
  if (error) throw error;
  // supabase head queries: use data?.length? but count available via response context; fallback to data
  return (data && data.length > 0) || false;
}


