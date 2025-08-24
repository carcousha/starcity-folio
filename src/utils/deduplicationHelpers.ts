// Deduplication Helper Functions
// دوال مساعدة لنظام إزالة التكرار

import { DuplicateContact, ContactSourceData } from '@/types/whatsapp';

/**
 * إنشاء بيانات تجريبية لاختبار نظام إزالة التكرار
 */
export function createTestData() {
  const testContacts: ContactSourceData[] = [
    // بيانات WhatsApp
    {
      source: 'whatsapp_contacts',
      source_id: 'wc_1',
      name: 'أحمد محمد علي',
      phone: '966501234567',
      email: 'ahmed@example.com',
      company: 'شركة العقارات المتحدة',
      notes: 'عميل نشط',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z'
    },
    {
      source: 'whatsapp_contacts',
      source_id: 'wc_2',
      name: 'فاطمة أحمد',
      phone: '966502345678',
      email: 'fatima@example.com',
      company: 'مكتب الوساطة',
      notes: 'وسيط نشط',
      created_at: '2024-01-02T09:00:00Z',
      updated_at: '2024-01-16T11:20:00Z'
    },
    
    // بيانات وسطاء
    {
      source: 'land_brokers',
      source_id: 'lb_1',
      name: 'أحمد محمد علي',
      phone: '966501234567',
      email: 'ahmed@example.com',
      company: 'شركة العقارات المتحدة',
      notes: 'وسيط محترف',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z'
    },
    {
      source: 'land_brokers',
      source_id: 'lb_2',
      name: 'فاطمة أحمد',
      phone: '966502345678',
      email: 'fatima@example.com',
      company: 'مكتب الوساطة',
      notes: 'وسيط نشط',
      created_at: '2024-01-02T09:00:00Z',
      updated_at: '2024-01-16T11:20:00Z'
    },
    
    // بيانات عملاء
    {
      source: 'land_clients',
      source_id: 'lc_1',
      name: 'محمد عبدالله',
      phone: '966503456789',
      email: 'mohammed@example.com',
      company: 'شركة التطوير',
      notes: 'عميل محتمل',
      created_at: '2024-01-03T08:00:00Z',
      updated_at: '2024-01-17T10:15:00Z'
    },
    {
      source: 'land_clients',
      source_id: 'lc_2',
      name: 'سارة خالد',
      phone: '966504567890',
      email: 'sara@example.com',
      company: 'مؤسسة الاستثمار',
      notes: 'عميل نشط',
      created_at: '2024-01-04T07:00:00Z',
      updated_at: '2024-01-18T09:45:00Z'
    },
    
    // بيانات ملاك
    {
      source: 'property_owners',
      source_id: 'po_1',
      name: 'علي حسن',
      phone: '966505678901',
      email: 'ali@example.com',
      company: 'شركة الممتلكات',
      notes: 'مالك عقار',
      created_at: '2024-01-05T06:00:00Z',
      updated_at: '2024-01-19T08:30:00Z'
    },
    
    // بيانات مستأجرين
    {
      source: 'rental_tenants',
      source_id: 'rt_1',
      name: 'خالد سعد',
      phone: '966506789012',
      email: 'khalid@example.com',
      company: 'شركة الإيجار',
      notes: 'مستأجر نشط',
      created_at: '2024-01-06T05:00:00Z',
      updated_at: '2024-01-20T07:15:00Z'
    }
  ];

  return testContacts;
}

/**
 * إنشاء مكررات تجريبية لاختبار النظام
 */
export function createTestDuplicates(): DuplicateContact[] {
  return [
    {
      id: 'dup_1',
      phone: '966501234567',
      name: 'أحمد محمد علي',
      email: 'ahmed@example.com',
      source_tables: ['whatsapp_contacts', 'land_brokers'],
      data: [
        {
          source: 'whatsapp_contacts',
          source_id: 'wc_1',
          name: 'أحمد محمد علي',
          phone: '966501234567',
          email: 'ahmed@example.com',
          company: 'شركة العقارات المتحدة',
          notes: 'عميل نشط',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-15T14:30:00Z'
        },
        {
          source: 'land_brokers',
          source_id: 'lb_1',
          name: 'أحمد محمد علي',
          phone: '966501234567',
          email: 'ahmed@example.com',
          company: 'شركة العقارات المتحدة',
          notes: 'وسيط محترف',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-15T14:30:00Z'
        }
      ],
      similarity_score: 95,
      merge_priority: 'high',
      last_activity: '2024-01-15T14:30:00Z',
      total_records: 2
    },
    {
      id: 'dup_2',
      phone: '966502345678',
      name: 'فاطمة أحمد',
      email: 'fatima@example.com',
      source_tables: ['whatsapp_contacts', 'land_brokers'],
      data: [
        {
          source: 'whatsapp_contacts',
          source_id: 'wc_2',
          name: 'فاطمة أحمد',
          phone: '966502345678',
          email: 'fatima@example.com',
          company: 'مكتب الوساطة',
          notes: 'وسيط نشط',
          created_at: '2024-01-02T09:00:00Z',
          updated_at: '2024-01-16T11:20:00Z'
        },
        {
          source: 'land_brokers',
          source_id: 'lb_2',
          name: 'فاطمة أحمد',
          phone: '966502345678',
          email: 'fatima@example.com',
          company: 'مكتب الوساطة',
          notes: 'وسيط نشط',
          created_at: '2024-01-02T09:00:00Z',
          updated_at: '2024-01-16T11:20:00Z'
        }
      ],
      similarity_score: 98,
      merge_priority: 'high',
      last_activity: '2024-01-16T11:20:00Z',
      total_records: 2
    }
  ];
}

/**
 * محاكاة نتائج إزالة التكرار
 */
export function createMockDeduplicationResult() {
  return {
    total_duplicates: 2,
    cleaned_contacts: 2,
    merged_contacts: 2,
    errors: [],
    warnings: [],
    processing_time: 1500,
    summary: {
      brokers: 2,
      clients: 0,
      owners: 0,
      tenants: 0,
      whatsapp: 2,
      total_saved_space: 2048
    },
    detailed_results: {
      successful_merges: [
        {
          contact_name: 'أحمد محمد علي',
          phone: '966501234567',
          merged_sources: ['whatsapp_contacts', 'land_brokers'],
          master_contact_id: 'wc_1'
        },
        {
          contact_name: 'فاطمة أحمد',
          phone: '966502345678',
          merged_sources: ['whatsapp_contacts', 'land_brokers'],
          master_contact_id: 'wc_2'
        }
      ],
      failed_merges: []
    }
  };
}

/**
 * حساب درجة التشابه بين نصين
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const clean1 = text1.toLowerCase().trim();
  const clean2 = text2.toLowerCase().trim();
  
  if (clean1 === clean2) return 100;
  
  // حساب المسافة التحريرية
  const distance = levenshteinDistance(clean1, clean2);
  const maxLength = Math.max(clean1.length, clean2.length);
  
  return Math.max(0, 100 - (distance / maxLength) * 100);
}

/**
 * حساب المسافة التحريرية (Levenshtein Distance)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * تنظيف رقم الهاتف للمقارنة
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-9);
}

/**
 * تنظيف النص للمقارنة
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * تقسيم النص إلى كلمات
 */
export function splitIntoWords(text: string): string[] {
  if (!text) return [];
  return text.split(/\s+/).filter(word => word.length > 1);
}

/**
 * حساب تشابه الكلمات
 */
export function calculateWordSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matchingWords = 0;
  words1.forEach(word1 => {
    words2.forEach(word2 => {
      if (levenshteinDistance(word1, word2) <= 1) {
        matchingWords++;
      }
    });
  });
  
  const totalWords = Math.max(words1.length, words2.length);
  return Math.round((matchingWords / totalWords) * 100);
}

/**
 * إنشاء تقرير تحليل البيانات
 */
export function createDataAnalysisReport(contacts: ContactSourceData[]) {
  const report = {
    total_contacts: contacts.length,
    sources: {} as Record<string, number>,
    contact_types: {} as Record<string, number>,
    phone_formats: {} as Record<string, number>,
    email_domains: {} as Record<string, number>,
    companies: {} as Record<string, number>,
    potential_duplicates: 0,
    data_quality_score: 0
  };

  contacts.forEach(contact => {
    // إحصائيات المصادر
    report.sources[contact.source] = (report.sources[contact.source] || 0) + 1;
    
    // إحصائيات الشركات
    if (contact.company) {
      report.companies[contact.company] = (report.companies[contact.company] || 0) + 1;
    }
    
    // إحصائيات البريد الإلكتروني
    if (contact.email) {
      const domain = contact.email.split('@')[1];
      if (domain) {
        report.email_domains[domain] = (report.email_domains[domain] || 0) + 1;
      }
    }
    
    // إحصائيات أرقام الهواتف
    if (contact.phone) {
      const format = contact.phone.length;
      report.phone_formats[format.toString()] = (report.phone_formats[format.toString()] || 0) + 1;
    }
  });

  // حساب جودة البيانات
  const hasPhone = contacts.filter(c => c.phone).length;
  const hasEmail = contacts.filter(c => c.email).length;
  const hasCompany = contacts.filter(c => c.company).length;
  
  report.data_quality_score = Math.round(
    ((hasPhone + hasEmail + hasCompany) / (contacts.length * 3)) * 100
  );

  return report;
}

/**
 * إنشاء خطة إزالة التكرار
 */
export function createDeduplicationPlan(duplicates: DuplicateContact[]) {
  const plan = {
    total_duplicates: duplicates.length,
    high_priority: duplicates.filter(d => d.merge_priority === 'high').length,
    medium_priority: duplicates.filter(d => d.merge_priority === 'medium').length,
    low_priority: duplicates.filter(d => d.merge_priority === 'low').length,
    estimated_time: 0,
    estimated_savings: 0,
    risk_level: 'low' as 'low' | 'medium' | 'high',
    recommendations: [] as string[]
  };

  // حساب الوقت المقدر
  plan.estimated_time = duplicates.length * 2; // 2 ثانية لكل مكرر
  
  // حساب التوفير المقدر
  plan.estimated_savings = duplicates.length * 1024; // 1KB لكل مكرر
  
  // تحديد مستوى المخاطر
  if (plan.high_priority > duplicates.length * 0.7) {
    plan.risk_level = 'high';
  } else if (plan.high_priority > duplicates.length * 0.3) {
    plan.risk_level = 'medium';
  }
  
  // التوصيات
  if (plan.high_priority > 0) {
    plan.recommendations.push('يُنصح بمراجعة المكررات عالية الأولوية قبل الدمج');
  }
  
  if (plan.estimated_time > 300) { // أكثر من 5 دقائق
    plan.recommendations.push('يُنصح بتقسيم العملية إلى دفعات أصغر');
  }
  
  if (plan.risk_level === 'high') {
    plan.recommendations.push('يُنصح بإجراء نسخة احتياطية قبل البدء');
  }
  
  return plan;
}

/**
 * إنشاء تقرير الأداء
 */
export function createPerformanceReport(startTime: number, endTime: number, results: any) {
  const processingTime = endTime - startTime;
  const throughput = results.total_duplicates / (processingTime / 1000); // مكررات في الثانية
  
  return {
    processing_time: processingTime,
    throughput: throughput.toFixed(2),
    efficiency: (results.merged_contacts / results.total_duplicates * 100).toFixed(1),
    success_rate: (results.merged_contacts / results.total_duplicates * 100).toFixed(1),
    error_rate: (results.errors.length / results.total_duplicates * 100).toFixed(1),
    performance_score: calculatePerformanceScore(processingTime, throughput, results),
    recommendations: generatePerformanceRecommendations(processingTime, throughput, results)
  };
}

/**
 * حساب درجة الأداء
 */
function calculatePerformanceScore(processingTime: number, throughput: number, results: any): number {
  let score = 100;
  
  // خصم نقاط للوقت الطويل
  if (processingTime > 10000) score -= 20; // أكثر من 10 ثوان
  else if (processingTime > 5000) score -= 10; // أكثر من 5 ثوان
  
  // خصم نقاط للكفاءة المنخفضة
  if (throughput < 1) score -= 15; // أقل من مكرر في الثانية
  else if (throughput < 2) score -= 10; // أقل من مكررين في الثانية
  
  // خصم نقاط للأخطاء
  if (results.errors.length > 0) score -= 10;
  
  return Math.max(0, score);
}

/**
 * توليد توصيات الأداء
 */
function generatePerformanceRecommendations(processingTime: number, throughput: number, results: any): string[] {
  const recommendations: string[] = [];
  
  if (processingTime > 10000) {
    recommendations.push('يُنصح بتقليل حجم الدفعة لتحسين الأداء');
  }
  
  if (throughput < 1) {
    recommendations.push('يُنصح بتحسين خوارزمية المقارنة');
  }
  
  if (results.errors.length > 0) {
    recommendations.push('يُنصح بمراجعة معالجة الأخطاء');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('الأداء ممتاز! لا توجد توصيات');
  }
  
  return recommendations;
}

/**
 * تصدير البيانات بصيغة CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * تصدير البيانات بصيغة JSON
 */
export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
