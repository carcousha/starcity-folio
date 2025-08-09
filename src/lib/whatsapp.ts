import Mustache from 'mustache';

export type Lang = 'ar' | 'en';

export function renderTemplate(bodyAr: string, bodyEn: string, lang: Lang, ctx: Record<string, string>) {
  const source = lang === 'ar' ? bodyAr : bodyEn;
  return Mustache.render(source, ctx);
}

export function renderBody(body: string, ctx: Record<string, string>) {
  // Support both {name} and {{name}} placeholders
  const normalized = body.replace(/\{\s*(\w+)\s*\}/g, '{{$1}}');
  return Mustache.render(normalized, ctx);
}

export function toE164(raw: string): string {
  // naive normalize; in production use libphonenumber-js
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (!digits.startsWith('+')) return `+${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phoneE164: string, text: string): string {
  const to = toE164(phoneE164);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${to}?text=${encoded}`;
}


