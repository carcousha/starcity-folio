// Contact Deduplication Service - Enhanced Version
// خدمة إزالة التكرار في جهات الاتصال - نسخة محسّنة

import { supabase } from '@/integrations/supabase/client';
import { whatsappService } from './whatsappService';
import { CreateContactForm, WhatsAppContact } from '@/types/whatsapp';

export interface DuplicateContact {
  id: string; // معرف فريد للمكرر
  phone: string;
  name: string;
  email?: string;
  source_tables: string[];
  data: ContactSourceData[];
  similarity_score: number; // درجة التشابه (0-100)
  merge_priority: 'high' | 'medium' | 'low'; // أولوية الدمج
  last_activity?: string; // آخر نشاط
  total_records: number; // إجمالي السجلات
}

export interface ContactSourceData {
  source: string;
  source_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  additional_data?: Record<string, any>;
}

export interface DeduplicationResult {
  total_duplicates: number;
  cleaned_contacts: number;
  merged_contacts: number;
  errors: string[];
  warnings: string[];
  processing_time: number;
  summary: {
    brokers: number;
    clients: number;
    owners: number;
    tenants: number;
    whatsapp: number;
    total_saved_space: number; // مساحة محفوظة
  };
  detailed_results: {
    successful_merges: Array<{
      contact_name: string;
      phone: string;
      merged_sources: string[];
      master_contact_id: string;
    }>;
    failed_merges: Array<{
      contact_name: string;
      phone: string;
      error: string;
      sources: string[];
    }>;
  };
}

export interface DeduplicationOptions {
  auto_merge: boolean; // دمج تلقائي
  similarity_threshold: number; // حد التشابه (0-100)
  preserve_data: boolean; // الحفاظ على البيانات
  dry_run: boolean; // تشغيل تجريبي
  batch_size: number; // حجم الدفعة
}

class ContactDeduplicationService {
  
  private defaultOptions: DeduplicationOptions = {
    auto_merge: false,
    similarity_threshold: 85,
    preserve_data: true,
    dry_run: false,
    batch_size: 50
  };

  // العثور على جهات الاتصال المكررة مع خوارزمية ذكية
  async findDuplicateContacts(options: Partial<DeduplicationOptions> = {}): Promise<DuplicateContact[]> {
    try {
      console.log('🔍 [Deduplication] Starting intelligent duplicate detection...');
      
      const opts = { ...this.defaultOptions, ...options };
      const duplicates: Map<string, DuplicateContact> = new Map();
      
      // 1. جمع جميع البيانات من جميع المصادر
      const allContacts = await this.gatherAllContacts();
      console.log(`📊 [Deduplication] Gathered ${allContacts.length} total contacts`);
      
      // 2. تطبيق خوارزمية التشابه الذكية
      const duplicateGroups = this.findSimilarityGroups(allContacts, opts.similarity_threshold);
      console.log(`🔍 [Deduplication] Found ${duplicateGroups.length} similarity groups`);
      
      // 3. تحويل المجموعات إلى كائنات DuplicateContact
      const duplicateContacts = duplicateGroups.map((group, index) => {
        const duplicate = this.createDuplicateContact(group, index);
        return duplicate;
      });
      
      console.log(`✅ [Deduplication] Processed ${duplicateContacts.length} duplicate contacts`);
      return duplicateContacts;
      
    } catch (error) {
      console.error('❌ [Deduplication] Error finding duplicates:', error);
      throw error;
    }
  }

  // جمع جميع جهات الاتصال من جميع المصادر
  private async gatherAllContacts(): Promise<any[]> {
    const contacts: any[] = [];
    
    try {
      // WhatsApp Contacts
      const whatsappContacts = await whatsappService.getContacts();
      whatsappContacts.forEach(contact => {
        contacts.push({
          ...contact,
          source: 'whatsapp_contacts',
          source_id: contact.id,
          phone: this.normalizePhone(contact.phone),
          name: this.normalizeName(contact.name)
        });
      });

      // Land Brokers
      const { data: brokers } = await supabase
        .from('land_brokers')
        .select('id, name, phone, email, office_name, notes, created_at, updated_at');
      
      brokers?.forEach(broker => {
        contacts.push({
          ...broker,
          source: 'land_brokers',
          source_id: broker.id,
          phone: this.normalizePhone(broker.phone),
          name: this.normalizeName(broker.name),
          company: broker.office_name
        });
      });

      // Land Clients
      const { data: clients } = await supabase
        .from('land_clients')
        .select('id, name, phone, email, company, notes, created_at, updated_at');
      
      clients?.forEach(client => {
        contacts.push({
          ...client,
          source: 'land_clients',
          source_id: client.id,
          phone: this.normalizePhone(client.phone),
          name: this.normalizeName(client.name)
        });
      });

      // Property Owners
      const { data: owners } = await supabase
        .from('property_owners')
        .select('id, full_name, mobile_numbers, email, company, notes, created_at, updated_at');
      
      owners?.forEach(owner => {
        if (owner.mobile_numbers && owner.mobile_numbers.length > 0) {
          contacts.push({
            ...owner,
            source: 'property_owners',
            source_id: owner.id,
            phone: this.normalizePhone(owner.mobile_numbers[0]),
            name: this.normalizeName(owner.full_name)
          });
        }
      });

      // Rental Tenants
      const { data: tenants } = await supabase
        .from('rental_tenants')
        .select('id, full_name, phone, email, company, notes, created_at, updated_at');
      
      tenants?.forEach(tenant => {
        contacts.push({
          ...tenant,
          source: 'rental_tenants',
          source_id: tenant.id,
          phone: this.normalizePhone(tenant.phone),
          name: this.normalizeName(tenant.full_name)
        });
      });

    } catch (error) {
      console.error('❌ [Deduplication] Error gathering contacts:', error);
      throw error;
    }

    return contacts;
  }

  // تطبيق خوارزمية التشابه الذكية
  private findSimilarityGroups(contacts: any[], threshold: number): any[][] {
    const groups: any[][] = [];
    const processed = new Set<string>();

    contacts.forEach(contact => {
      if (processed.has(contact.source_id)) return;

      const group = [contact];
      processed.add(contact.source_id);

      contacts.forEach(otherContact => {
        if (processed.has(otherContact.source_id)) return;
        if (contact.source_id === otherContact.source_id) return;

        const similarity = this.calculateSimilarity(contact, otherContact);
        if (similarity >= threshold) {
          group.push(otherContact);
          processed.add(otherContact.source_id);
        }
      });

      if (group.length > 1) {
        groups.push(group);
      }
    });

    return groups;
  }

  // حساب درجة التشابه بين جهات الاتصال
  private calculateSimilarity(contact1: any, contact2: any): number {
    let score = 0;
    let totalWeight = 0;

    // مقارنة رقم الهاتف (وزن عالي)
    if (contact1.phone && contact2.phone) {
      const phoneSimilarity = this.comparePhones(contact1.phone, contact2.phone);
      score += phoneSimilarity * 40; // وزن 40%
      totalWeight += 40;
    }

    // مقارنة الاسم (وزن متوسط)
    if (contact1.name && contact2.name) {
      const nameSimilarity = this.compareNames(contact1.name, contact2.name);
      score += nameSimilarity * 35; // وزن 35%
      totalWeight += 35;
    }

    // مقارنة البريد الإلكتروني (وزن متوسط)
    if (contact1.email && contact2.email) {
      const emailSimilarity = contact1.email.toLowerCase() === contact2.email.toLowerCase() ? 100 : 0;
      score += emailSimilarity * 20; // وزن 20%
      totalWeight += 20;
    }

    // مقارنة الشركة (وزن منخفض)
    if (contact1.company && contact2.company) {
      const companySimilarity = this.compareNames(contact1.company, contact2.company);
      score += companySimilarity * 5; // وزن 5%
      totalWeight += 5;
    }

    return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
  }

  // مقارنة أرقام الهواتف
  private comparePhones(phone1: string, phone2: string): number {
    const clean1 = this.normalizePhone(phone1);
    const clean2 = this.normalizePhone(phone2);

    if (clean1 === clean2) return 100;
    
    // مقارنة آخر 9 أرقام
    const last9_1 = clean1.slice(-9);
    const last9_2 = clean2.slice(-9);
    
    if (last9_1 === last9_2) return 95;
    
    // مقارنة آخر 8 أرقام
    const last8_1 = clean1.slice(-8);
    const last8_2 = clean2.slice(-8);
    
    if (last8_1 === last8_2) return 90;
    
    // حساب المسافة التحريرية
    const distance = this.levenshteinDistance(last9_1, last9_2);
    const maxLength = Math.max(last9_1.length, last9_2.length);
    
    return Math.max(0, 100 - (distance / maxLength) * 100);
  }

  // مقارنة الأسماء
  private compareNames(name1: string, name2: string): number {
    const clean1 = this.normalizeName(name1);
    const clean2 = this.normalizeName(name2);

    if (clean1 === clean2) return 100;
    
    // تقسيم الأسماء إلى كلمات
    const words1 = clean1.split(/\s+/).filter(w => w.length > 1);
    const words2 = clean2.split(/\s+/).filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // حساب الكلمات المتطابقة
    let matchingWords = 0;
    words1.forEach(word1 => {
      words2.forEach(word2 => {
        if (this.levenshteinDistance(word1, word2) <= 1) {
          matchingWords++;
        }
      });
    });
    
    const totalWords = Math.max(words1.length, words2.length);
    return Math.round((matchingWords / totalWords) * 100);
  }

  // حساب المسافة التحريرية (Levenshtein Distance)
  private levenshteinDistance(str1: string, str2: string): number {
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

  // تطبيع رقم الهاتف
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '').slice(-9);
  }

  // تطبيع الاسم
  private normalizeName(name: string): string {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // إنشاء كائن DuplicateContact
  private createDuplicateContact(group: any[], index: number): DuplicateContact {
    const primaryContact = group[0]; // أول جهة اتصال في المجموعة
    
    // حساب درجة التشابه الإجمالية
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        totalSimilarity += this.calculateSimilarity(group[i], group[j]);
        comparisons++;
      }
    }
    
    const averageSimilarity = comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 0;
    
    // تحديد أولوية الدمج
    let mergePriority: 'high' | 'medium' | 'low' = 'medium';
    if (averageSimilarity >= 95) mergePriority = 'high';
    else if (averageSimilarity < 80) mergePriority = 'low';
    
    // تحديد آخر نشاط
    const lastActivity = group.reduce((latest, contact) => {
      const contactDate = contact.updated_at || contact.created_at;
      if (!latest || (contactDate && contactDate > latest)) {
        return contactDate;
      }
      return latest;
    }, null);

    return {
      id: `duplicate_${index}_${Date.now()}`,
      phone: primaryContact.phone,
      name: primaryContact.name,
      email: primaryContact.email,
      source_tables: [...new Set(group.map(c => c.source))],
      data: group.map(contact => ({
        source: contact.source,
        source_id: contact.source_id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
        notes: contact.notes,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
        additional_data: contact
      })),
      similarity_score: averageSimilarity,
      merge_priority: mergePriority,
      last_activity: lastActivity,
      total_records: group.length
    };
  }

  // دمج البيانات المكررة مع خوارزمية ذكية
  async mergeDuplicateContacts(
    duplicates: DuplicateContact[], 
    options: Partial<DeduplicationOptions> = {}
  ): Promise<DeduplicationResult> {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    
    const result: DeduplicationResult = {
      total_duplicates: duplicates.length,
      cleaned_contacts: 0,
      merged_contacts: 0,
      errors: [],
      warnings: [],
      processing_time: 0,
      summary: {
        brokers: 0,
        clients: 0,
        owners: 0,
        tenants: 0,
        whatsapp: 0,
        total_saved_space: 0
      },
      detailed_results: {
        successful_merges: [],
        failed_merges: []
      }
    };
    
    try {
      console.log(`🔧 [Deduplication] Starting intelligent merge process for ${duplicates.length} duplicates...`);
      
      // معالجة المكررات في دفعات
      const batches = this.chunkArray(duplicates, opts.batch_size);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 [Deduplication] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);
        
        for (const duplicate of batch) {
          try {
            if (opts.dry_run) {
              // تشغيل تجريبي - فقط محاكاة
              await this.simulateMerge(duplicate, result);
            } else {
              // دمج فعلي
              await this.processSingleDuplicate(duplicate, result, opts);
            }
          } catch (error) {
            console.error(`❌ [Deduplication] Error processing duplicate for ${duplicate.name}:`, error);
            result.errors.push(`خطأ في معالجة ${duplicate.name}: ${error}`);
            
            result.detailed_results.failed_merges.push({
              contact_name: duplicate.name,
              phone: duplicate.phone,
              error: String(error),
              sources: duplicate.source_tables
            });
          }
        }
        
        // تأخير قصير بين الدفعات لتجنب الضغط على قاعدة البيانات
        if (batchIndex < batches.length - 1) {
          await this.delay(100);
        }
      }
      
      result.processing_time = Date.now() - startTime;
      console.log('✅ [Deduplication] Merge process completed');
      console.log('📊 [Deduplication] Summary:', result.summary);
      
      return result;
      
    } catch (error) {
      console.error('❌ [Deduplication] Fatal error in merge process:', error);
      throw error;
    }
  }

  // محاكاة الدمج (للتشغيل التجريبي)
  private async simulateMerge(duplicate: DuplicateContact, result: DeduplicationResult): Promise<void> {
    console.log(`🎭 [Deduplication] Simulating merge for: ${duplicate.name} (${duplicate.phone})`);
    
    // محاكاة النتائج
    result.merged_contacts++;
    result.cleaned_contacts += duplicate.total_records - 1;
    
    // تحديث الإحصائيات
    duplicate.source_tables.forEach(source => {
      switch (source) {
        case 'land_brokers': result.summary.brokers++; break;
        case 'land_clients': result.summary.clients++; break;
        case 'property_owners': result.summary.owners++; break;
        case 'rental_tenants': result.summary.tenants++; break;
        case 'whatsapp_contacts': result.summary.whatsapp++; break;
      }
    });
    
    result.detailed_results.successful_merges.push({
      contact_name: duplicate.name,
      phone: duplicate.phone,
      merged_sources: duplicate.source_tables,
      master_contact_id: `simulated_${duplicate.id}`
    });
  }

  // معالجة جهة اتصال مكررة واحدة
  private async processSingleDuplicate(
    duplicate: DuplicateContact, 
    result: DeduplicationResult,
    options: DeduplicationOptions
  ): Promise<void> {
    console.log(`🔄 [Deduplication] Processing duplicate: ${duplicate.name} (${duplicate.phone}) - Priority: ${duplicate.merge_priority}`);
    
    // 1. البحث عن أو إنشاء جهة الاتصال الرئيسية في WhatsApp
    let masterContact: WhatsAppContact;
    
    const whatsappData = duplicate.data.find(d => d.source === 'whatsapp_contacts');
    if (whatsappData) {
      // تحديث جهة الاتصال الموجودة في WhatsApp
      console.log(`📱 [Deduplication] Updating existing WhatsApp contact...`);
      const mergedData = this.mergeContactData(duplicate.data);
      masterContact = await whatsappService.updateContact(whatsappData.source_id, mergedData);
      result.summary.whatsapp++;
    } else {
      // إنشاء جهة اتصال جديدة في WhatsApp
      console.log(`📱 [Deduplication] Creating new WhatsApp contact...`);
      const mergedData = this.mergeContactData(duplicate.data);
      masterContact = await whatsappService.createContact(mergedData);
      result.summary.whatsapp++;
    }
    
    // 2. تحديث المراجع في الجداول الأخرى
    await this.updateOrRemoveSecondaryContacts(duplicate, masterContact, result, options);
    
    result.merged_contacts++;
    result.cleaned_contacts += duplicate.total_records - 1;
    
    result.detailed_results.successful_merges.push({
      contact_name: duplicate.name,
      phone: duplicate.phone,
      merged_sources: duplicate.source_tables,
      master_contact_id: masterContact.id
    });
  }

  // دمج بيانات جهة الاتصال من مصادر متعددة مع خوارزمية ذكية
  private mergeContactData(dataArray: any[]): CreateContactForm {
    const merged: CreateContactForm = {
      name: '',
      phone: '',
      whatsapp_number: '',
      contact_type: 'client',
      email: '',
      company: '',
      notes: '',
      tags: []
    };
    
    // أولوية المصادر مع أوزان
    const sourceWeights: Record<string, number> = {
      'whatsapp_contacts': 100,
      'land_brokers': 90,
      'property_owners': 85,
      'land_clients': 80,
      'rental_tenants': 75
    };
    
    // ترتيب البيانات حسب الأولوية
    const sortedData = dataArray.sort((a, b) => 
      (sourceWeights[b.source] || 0) - (sourceWeights[a.source] || 0)
    );
    
    // دمج البيانات مع مراعاة الأولوية
    for (const data of sortedData) {
      // الاسم
      if (!merged.name && data.name) {
        merged.name = data.name;
      } else if (data.name && this.isBetterName(data.name, merged.name)) {
        merged.name = data.name;
      }
      
      // رقم الهاتف
      if (!merged.phone && data.phone) {
        merged.phone = data.phone;
      } else if (data.phone && this.isBetterPhone(data.phone, merged.phone)) {
        merged.phone = data.phone;
      }
      
      // رقم WhatsApp
      if (!merged.whatsapp_number && data.whatsapp_number) {
        merged.whatsapp_number = data.whatsapp_number;
      } else if (data.whatsapp_number && this.isBetterPhone(data.whatsapp_number, merged.whatsapp_number)) {
        merged.whatsapp_number = data.whatsapp_number;
      }
      
      // البريد الإلكتروني
      if (!merged.email && data.email) {
        merged.email = data.email;
      } else if (data.email && this.isBetterEmail(data.email, merged.email)) {
        merged.email = data.email;
      }
      
      // الشركة
      if (!merged.company && data.company) {
        merged.company = data.company;
      } else if (data.company && this.isBetterCompany(data.company, merged.company)) {
        merged.company = data.company;
      }
      
      // تحديد نوع جهة الاتصال
      if (data.source === 'land_brokers') merged.contact_type = 'marketer';
      else if (data.source === 'property_owners') merged.contact_type = 'owner';
      else if (data.source === 'land_clients') merged.contact_type = 'client';
      else if (data.source === 'rental_tenants') merged.contact_type = 'client';
      
      // جمع الملاحظات
      if (data.notes && !merged.notes?.includes(data.notes)) {
        merged.notes = merged.notes ? `${merged.notes}; ${data.notes}` : data.notes;
      }
      
      // جمع التاجز
      const sourceTags = this.getSourceTags(data.source);
      merged.tags = [...new Set([...merged.tags, ...sourceTags])];
    }
    
    // تنظيف وتطبيع البيانات
    merged.phone = merged.phone || '';
    merged.whatsapp_number = merged.whatsapp_number || merged.phone;
    merged.email = merged.email || '';
    merged.company = merged.company || '';
    merged.notes = merged.notes || '';
    
    return merged;
  }

  // تحديد ما إذا كان الاسم أفضل
  private isBetterName(newName: string, currentName: string): boolean {
    if (!currentName) return true;
    
    // تفضيل الأسماء الأطول (أكثر تفصيلاً)
    if (newName.length > currentName.length) return true;
    
    // تفضيل الأسماء التي تحتوي على كلمات أكثر
    const newWords = newName.split(/\s+/).length;
    const currentWords = currentName.split(/\s+/).length;
    if (newWords > currentWords) return true;
    
    return false;
  }

  // تحديد ما إذا كان رقم الهاتف أفضل
  private isBetterPhone(newPhone: string, currentPhone: string): boolean {
    if (!currentPhone) return true;
    
    // تفضيل الأرقام الأطول (أكثر اكتمالاً)
    if (newPhone.length > currentPhone.length) return true;
    
    // تفضيل الأرقام التي تبدأ بـ 966 (كود السعودية)
    if (newPhone.startsWith('966') && !currentPhone.startsWith('966')) return true;
    
    return false;
  }

  // تحديد ما إذا كان البريد الإلكتروني أفضل
  private isBetterEmail(newEmail: string, currentEmail: string): boolean {
    if (!currentEmail) return true;
    
    // تفضيل البريد الإلكتروني الذي يحتوي على اسم الشركة
    if (newEmail.includes('@') && currentEmail.includes('@')) {
      const newDomain = newEmail.split('@')[1];
      const currentDomain = currentEmail.split('@')[1];
      
      // تفضيل النطاقات التجارية
      if (newDomain.includes('.com') && !currentDomain.includes('.com')) return true;
      if (newDomain.includes('.sa') && !currentDomain.includes('.sa')) return true;
    }
    
    return false;
  }

  // تحديد ما إذا كانت الشركة أفضل
  private isBetterCompany(newCompany: string, currentCompany: string): boolean {
    if (!currentCompany) return true;
    
    // تفضيل أسماء الشركات الأطول (أكثر تفصيلاً)
    if (newCompany.length > currentCompany.length) return true;
    
    return false;
  }

  // الحصول على تاجز مناسبة حسب المصدر
  private getSourceTags(source: string): string[] {
    const tagMap: Record<string, string[]> = {
      'land_brokers': ['وسيط', 'أراضي', 'broker', 'land'],
      'land_clients': ['عميل', 'أراضي', 'client', 'land'],
      'property_owners': ['مالك', 'عقار', 'owner', 'property'],
      'rental_tenants': ['مستأجر', 'إيجار', 'tenant', 'rental'],
      'whatsapp_contacts': ['whatsapp', 'اتصال']
    };
    return tagMap[source] || [];
  }

  // تحديث أو حذف جهات الاتصال الثانوية
  private async updateOrRemoveSecondaryContacts(
    duplicate: DuplicateContact, 
    masterContact: WhatsAppContact, 
    result: DeduplicationResult,
    options: DeduplicationOptions
  ): Promise<void> {
    
    try {
      for (const sourceData of duplicate.data) {
        if (sourceData.source === 'whatsapp_contacts') continue; // تخطي WhatsApp
        
        try {
          // إضافة مرجع إلى جهة الاتصال الرئيسية
          await this.linkToWhatsAppContact(sourceData, masterContact.id);
          
          // تحديث الإحصائيات
          switch (sourceData.source) {
            case 'land_brokers': result.summary.brokers++; break;
            case 'land_clients': result.summary.clients++; break;
            case 'property_owners': result.summary.owners++; break;
            case 'rental_tenants': result.summary.tenants++; break;
          }
          
          console.log(`🔗 [Deduplication] Linked ${sourceData.source} ${sourceData.source_id} to WhatsApp contact`);
          
        } catch (error) {
          console.error(`❌ [Deduplication] Error linking ${sourceData.source}:`, error);
          result.warnings.push(`فشل في ربط ${sourceData.source} ${sourceData.name}: ${error}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ [Deduplication] Error linking secondary contacts:`, error);
      result.errors.push(`فشل في ربط جهات الاتصال الثانوية: ${error}`);
    }
  }

  // ربط جهة الاتصال بـ WhatsApp
  private async linkToWhatsAppContact(sourceData: ContactSourceData, whatsappContactId: string): Promise<void> {
    const tableMap: Record<string, string> = {
      'land_brokers': 'land_brokers',
      'land_clients': 'land_clients',
      'property_owners': 'property_owners',
      'rental_tenants': 'rental_tenants'
    };
    
    const table = tableMap[sourceData.source];
    if (!table) return;
    
    await supabase
      .from(table)
      .update({ whatsapp_contact_id: whatsappContactId })
      .eq('id', sourceData.source_id);
  }

  // تشغيل عملية إزالة التكرار الكاملة
  async runFullDeduplication(options: Partial<DeduplicationOptions> = {}): Promise<DeduplicationResult> {
    try {
      console.log('🚀 [Deduplication] Starting full deduplication process...');
      
      const opts = { ...this.defaultOptions, ...options };
      
      // 1. البحث عن المكررات
      const duplicates = await this.findDuplicateContacts(opts);
      
      if (duplicates.length === 0) {
        console.log('✅ [Deduplication] No duplicates found');
        return {
          total_duplicates: 0,
          cleaned_contacts: 0,
          merged_contacts: 0,
          errors: [],
          warnings: [],
          processing_time: 0,
          summary: { brokers: 0, clients: 0, owners: 0, tenants: 0, whatsapp: 0, total_saved_space: 0 },
          detailed_results: { successful_merges: [], failed_merges: [] }
        };
      }
      
      // 2. دمج المكررات
      const result = await this.mergeDuplicateContacts(duplicates, opts);
      
      // 3. حساب المساحة المحفوظة
      result.summary.total_saved_space = duplicates.length * 1024; // تقدير تقريبي
      
      console.log('🎉 [Deduplication] Full deduplication completed successfully');
      return result;
      
    } catch (error) {
      console.error('💥 [Deduplication] Fatal error in full deduplication:', error);
      throw error;
    }
  }

  // معاينة المكررات بدون تعديل
  async previewDuplicates(options: Partial<DeduplicationOptions> = {}): Promise<DuplicateContact[]> {
    return await this.findDuplicateContacts({ ...options, dry_run: true });
  }

  // تقسيم المصفوفة إلى دفعات
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // تأخير
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // الحصول على إحصائيات سريعة
  async getQuickStats(): Promise<{
    total_contacts: number;
    estimated_duplicates: number;
    potential_savings: number;
  }> {
    try {
      const allContacts = await this.gatherAllContacts();
      const duplicates = await this.findDuplicateContacts({ similarity_threshold: 90 });
      
      return {
        total_contacts: allContacts.length,
        estimated_duplicates: duplicates.length,
        potential_savings: duplicates.length * 1024 // تقدير تقريبي
      };
    } catch (error) {
      console.error('❌ [Deduplication] Error getting quick stats:', error);
      throw error;
    }
  }
}

export const contactDeduplicationService = new ContactDeduplicationService();


