import { supabase } from '@/integrations/supabase/client';

export async function getTodayReminders() {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  const { data, error } = await (supabase as any)
    .from('whatsapp_reminders')
    .select('*')
    .gte('remind_at', start.toISOString())
    .lte('remind_at', end.toISOString())
    .eq('enabled', true);
  if (error) throw error;
  return data || [];
}

export async function markReminderDone(id: string) {
  const { error } = await (supabase as any)
    .from('whatsapp_reminders')
    .update({ surfaced: true })
    .eq('id', id);
  if (error) throw error;
  return true;
}


