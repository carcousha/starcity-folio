import { supabase } from '@/integrations/supabase/client';

export type WhatsAppStage = 'Lead' | 'Negotiation' | 'Closing' | 'PostSale';
export type Lang = 'ar' | 'en';

export interface TemplateDTO {
  id?: string;
  stage: WhatsAppStage;
  name: string;
  lang: Lang;
  body: string;
  header?: string | null;
  footer?: string | null;
  variables?: string[];
  is_default?: boolean;
}

export async function getTemplates(filters?: { stage?: WhatsAppStage; lang?: Lang }) {
  let query = (supabase as any).from('whatsapp_templates').select('*').order('created_at', { ascending: false });
  if (filters?.stage) query = query.eq('stage', filters.stage);
  if (filters?.lang) query = query.eq('lang', filters.lang);
  const { data, error } = await query;
  if (error) throw error;
  return data as TemplateDTO[];
}

export async function createTemplate(data: TemplateDTO) {
  const payload: any = { ...data, variables: JSON.stringify(data.variables || []) };
  const { data: res, error } = await (supabase as any).from('whatsapp_templates').insert(payload).select().single();
  if (error) throw error;
  return res as TemplateDTO;
}

export async function updateTemplate(id: string, data: Partial<TemplateDTO>) {
  const payload: any = { ...data };
  if (data.variables) payload.variables = JSON.stringify(data.variables);
  const { data: res, error } = await (supabase as any).from('whatsapp_templates').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return res as TemplateDTO;
}

export async function deleteTemplate(id: string) {
  const { error } = await (supabase as any).from('whatsapp_templates').delete().eq('id', id);
  if (error) throw error;
  return true;
}


