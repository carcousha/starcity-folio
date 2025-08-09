import Mustache from 'mustache';

export type Lang = 'ar' | 'en';

export type PlaceholderSpec = {
  key: string; // without braces
  label: string; // Arabic label
  description: string;
  example?: string;
};

// قائمة المتغيرات المدعومة في النظام
export const AVAILABLE_PLACEHOLDERS: PlaceholderSpec[] = [
  { key: 'client_name', label: 'اسم العميل', description: 'اسم العميل كاملًا', example: 'أحمد محمد' },
  { key: 'phone', label: 'هاتف العميل', description: 'رقم الهاتف بصيغة محلية أو دولية', example: '0501234567' },
  { key: 'property_name', label: 'اسم العقار', description: 'عنوان أو اسم العقار' },
  { key: 'property_type', label: 'نوع العقار', description: 'شقة، فيلا، عمارة، ...' },
  { key: 'price', label: 'السعر', description: 'سعر العقار أو الميزانية' },
  { key: 'stage', label: 'مرحلة المبيعات', description: 'Lead, Negotiation, Closing, PostSale' },
  { key: 'appointment_date', label: 'تاريخ الموعد', description: 'تاريخ الزيارة أو التواصل' },
  { key: 'appointment_time', label: 'وقت الموعد', description: 'وقت الزيارة أو التواصل' },
  { key: 'appointment_location', label: 'موقع الموعد', description: 'العنوان أو الموقع' },
  { key: 'agent_name', label: 'اسم الموظف', description: 'اسم الموظف/الوسيط المسؤول' },
];

export function renderTemplate(bodyAr: string, bodyEn: string, lang: Lang, ctx: Record<string, string>) {
  const source = lang === 'ar' ? bodyAr : bodyEn;
  return Mustache.render(source, ctx);
}

export function renderBody(body: string, ctx: Record<string, string>) {
  // Support both {name} and {{name}} placeholders
  const normalized = body.replace(/\{\s*(\w+)\s*\}/g, '{{$1}}');
  return Mustache.render(normalized, ctx);
}

// استخراج قائمة المتغيرات من نص القالب
export function extractPlaceholders(source: string): string[] {
  if (!source) return [];
  // التعرّف على {var} أو {{var}}
  const normalized = source.replace(/\{\s*(\w+)\s*\}/g, '{{$1}}');
  const regex = /\{\{\s*(\w+)\s*\}\}/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(normalized)) !== null) {
    if (m[1]) found.add(m[1]);
  }
  return Array.from(found);
}

// التحقق من المتغيرات المفقودة عند التوليد
export function findMissingPlaceholders(source: string, ctx: Record<string, any>): string[] {
  const vars = extractPlaceholders(source);
  const missing = vars.filter((k) => ctx[k] === undefined || ctx[k] === null || ctx[k] === '');
  return missing;
}

// بيانات تجريبية للمعاينة
export function mockContext(): Record<string, string> {
  return {
    client_name: 'أحمد محمد',
    phone: '+971501234567',
    property_name: 'شقة فاخرة في الجرف',
    property_type: 'سكني',
    price: '450,000',
    stage: 'Lead',
    appointment_date: new Date().toLocaleDateString('ar-AE'),
    appointment_time: '05:30 PM',
    appointment_location: 'مكتب الشركة',
    agent_name: 'موظف المبيعات'
  };
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


