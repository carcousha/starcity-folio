// Smart Message Service - خدمة الرسائل الذكية
// معالجة البدائل النصية، المتغيرات المتقدمة، وإدارة التوقيت

export interface MessageVariable {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'phone' | 'email';
  required?: boolean;
}

export interface TimingSettings {
  type: 'fixed' | 'random';
  fixedDelay?: number; // بالثواني
  randomMin?: number;  // أقل وقت بالثواني
  randomMax?: number;  // أكثر وقت بالثواني
}

export interface SendProgress {
  id: string;
  contactName: string;
  contactPhone: string;
  status: 'pending' | 'sending' | 'success' | 'failed';
  message?: string;
  error?: string;
  timestamp?: Date;
  retryCount?: number;
}

export interface MessagePreview {
  contactName: string;
  contactPhone: string;
  processedMessage: string;
  variables: Record<string, string>;
}

class SmartMessageService {
  
  // 📝 المتغيرات المتاحة
  getAvailableVariables(): MessageVariable[] {
    return [
      { key: 'name', label: 'الاسم الكامل', description: 'اسم جهة الاتصال كاملاً', type: 'text', required: true },
      { key: 'short_name', label: 'الاسم المختصر', description: 'الاسم المختصر أو الكنية', type: 'text' },
      { key: 'first_name', label: 'الاسم الأول', description: 'الاسم الأول فقط', type: 'text' },
      { key: 'last_name', label: 'الاسم الأخير', description: 'اسم العائلة', type: 'text' },
      { key: 'company', label: 'الشركة', description: 'اسم الشركة أو المؤسسة', type: 'text' },
      { key: 'phone', label: 'رقم الهاتف', description: 'رقم الهاتف الأساسي', type: 'phone' },
      { key: 'email', label: 'البريد الإلكتروني', description: 'عنوان البريد الإلكتروني', type: 'email' },
      { key: 'date', label: 'التاريخ الحالي', description: 'تاريخ اليوم', type: 'date' },
      { key: 'time', label: 'الوقت الحالي', description: 'الوقت الحالي', type: 'date' },
      { key: 'day_name', label: 'اسم اليوم', description: 'اسم اليوم (الأحد، الإثنين...)', type: 'text' },
      { key: 'month_name', label: 'اسم الشهر', description: 'اسم الشهر الحالي', type: 'text' },
      { key: 'year', label: 'السنة', description: 'السنة الحالية', type: 'number' },
      { key: 'discount', label: 'نسبة الخصم', description: 'نسبة خصم افتراضية', type: 'number' },
      { key: 'service', label: 'اسم الخدمة', description: 'نوع الخدمة المقدمة', type: 'text' },
      { key: 'topic', label: 'الموضوع', description: 'موضوع الرسالة', type: 'text' },
      { key: 'office_name', label: 'اسم المكتب', description: 'اسم المكتب العقاري', type: 'text' },
      { key: 'areas_specialization', label: 'التخصص', description: 'مناطق التخصص', type: 'text' },
      { key: 'deals_count', label: 'عدد الصفقات', description: 'عدد الصفقات المنجزة', type: 'number' },
      { key: 'total_sales', label: 'إجمالي المبيعات', description: 'إجمالي قيمة المبيعات', type: 'number' }
    ];
  }

  // 🎲 معالجة البدائل النصية مثل {أهلاً|هاي|مرحباً}
  processTextAlternatives(text: string): string {
    const alternativePattern = /\{([^}]+)\}/g;
    
    return text.replace(alternativePattern, (match, alternatives) => {
      const options = alternatives.split('|').map((option: string) => option.trim());
      if (options.length === 0) return match;
      
      // اختيار عشوائي من البدائل
      const randomIndex = Math.floor(Math.random() * options.length);
      return options[randomIndex];
    });
  }

  // 🔄 معالجة المتغيرات
  processVariables(text: string, contact: any, additionalVars: Record<string, string> = {}): string {
    let processedText = text;
    
    // معالجة المتغيرات الأساسية
    const variables: Record<string, string> = {
      name: contact.name || 'العميل',
      short_name: contact.short_name || contact.name?.split(' ')[0] || 'العميل',
      first_name: contact.name?.split(' ')[0] || 'العميل',
      last_name: contact.name?.split(' ').slice(1).join(' ') || '',
      company: contact.company || contact.office_name || 'الشركة',
      phone: contact.phone || '',
      email: contact.email || '',
      office_name: contact.office_name || '',
      areas_specialization: Array.isArray(contact.areas_specialization) 
        ? contact.areas_specialization.join(', ') 
        : contact.areas_specialization || '',
      deals_count: contact.deals_count?.toString() || '0',
      total_sales: contact.total_sales_amount?.toLocaleString() || '0',
      
      // متغيرات التاريخ والوقت
      date: new Date().toLocaleDateString('ar-SA'),
      time: new Date().toLocaleTimeString('ar-SA'),
      day_name: this.getDayName(),
      month_name: this.getMonthName(),
      year: new Date().getFullYear().toString(),
      
      // متغيرات افتراضية
      discount: '20',
      service: 'خدماتنا المميزة',
      topic: 'عرض خاص',
      
      ...additionalVars
    };

    // استبدال المتغيرات
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processedText = processedText.replace(regex, value || '');
    });

    return processedText;
  }

  // 📝 معالجة الرسالة الكاملة (البدائل + المتغيرات)
  processMessage(template: string, contact: any, additionalVars: Record<string, string> = {}): string {
    // أولاً: معالجة البدائل النصية للحصول على تنويع
    let processedMessage = this.processTextAlternatives(template);
    
    // ثانياً: معالجة المتغيرات
    processedMessage = this.processVariables(processedMessage, contact, additionalVars);
    
    return processedMessage;
  }

  // ⏱️ حساب التأخير بناءً على إعدادات التوقيت
  calculateDelay(settings: TimingSettings): number {
    if (settings.type === 'fixed') {
      return (settings.fixedDelay || 3) * 1000; // تحويل لميللي ثانية
    } else {
      const min = (settings.randomMin || 3) * 1000;
      const max = (settings.randomMax || 10) * 1000;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }

  // 📊 إنشاء معاينة للرسائل
  generatePreview(template: string, contacts: any[], count: number = 3): MessagePreview[] {
    const previews: MessagePreview[] = [];
    const contactsToPreview = contacts.slice(0, count);

    contactsToPreview.forEach(contact => {
      const processedMessage = this.processMessage(template, contact);
      
      previews.push({
        contactName: contact.name || 'غير محدد',
        contactPhone: contact.phone || 'غير محدد',
        processedMessage,
        variables: {
          name: contact.name || '',
          short_name: contact.short_name || contact.name?.split(' ')[0] || '',
          company: contact.company || '',
          phone: contact.phone || '',
          email: contact.email || ''
        }
      });
    });

    return previews;
  }

  // 🎯 تحليل القالب للمتغيرات المستخدمة
  analyzeTemplate(template: string): {
    variables: string[];
    alternatives: string[];
    estimatedVariations: number;
  } {
    // البحث عن المتغيرات
    const variableMatches = template.match(/\{([a-zA-Z_]+)\}/g) || [];
    const variables = variableMatches.map(match => match.slice(1, -1));

    // البحث عن البدائل
    const alternativeMatches = template.match(/\{([^}]*\|[^}]*)\}/g) || [];
    const alternatives = alternativeMatches.map(match => match.slice(1, -1));

    // حساب عدد الاختلافات المحتملة
    let estimatedVariations = 1;
    alternatives.forEach(alt => {
      const options = alt.split('|').length;
      estimatedVariations *= options;
    });

    return {
      variables: [...new Set(variables)],
      alternatives,
      estimatedVariations
    };
  }

  // 📅 دوال مساعدة للتاريخ
  private getDayName(): string {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[new Date().getDay()];
  }

  private getMonthName(): string {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[new Date().getMonth()];
  }

  // 🔍 التحقق من صحة القالب
  validateTemplate(template: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من الأقواس المغلقة
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('أقواس غير متوازنة في القالب');
    }

    // التحقق من البدائل الفارغة
    const emptyAlternatives = template.match(/\{\s*\|\s*\}/g);
    if (emptyAlternatives) {
      errors.push('يوجد بدائل فارغة في القالب');
    }

    // التحقق من المتغيرات غير المعروفة
    const availableVars = this.getAvailableVariables().map(v => v.key);
    const usedVars = this.analyzeTemplate(template).variables;
    const unknownVars = usedVars.filter(v => !availableVars.includes(v));
    
    if (unknownVars.length > 0) {
      warnings.push(`متغيرات غير معروفة: ${unknownVars.join(', ')}`);
    }

    // التحقق من طول الرسالة
    if (template.length > 1000) {
      warnings.push('الرسالة طويلة جداً، قد تتسبب في مشاكل في الإرسال');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // 🚀 معالجة دفعة من الرسائل مع تقرير مفصل
  async processBulkMessages(
    template: string,
    contacts: any[],
    timingSettings: TimingSettings,
    onProgress?: (progress: SendProgress) => void,
    onComplete?: (results: SendProgress[]) => void
  ): Promise<SendProgress[]> {
    const results: SendProgress[] = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const progress: SendProgress = {
        id: `msg_${Date.now()}_${i}`,
        contactName: contact.name || 'غير محدد',
        contactPhone: contact.phone || 'غير محدد',
        status: 'pending'
      };

      results.push(progress);
      
      // تحديث الحالة إلى "جاري الإرسال"
      progress.status = 'sending';
      progress.timestamp = new Date();
      
      if (onProgress) {
        onProgress(progress);
      }

      try {
        // معالجة الرسالة للجهة الحالية
        const processedMessage = this.processMessage(template, contact);
        progress.message = processedMessage;

        // محاكاة الإرسال (سيتم استبدالها بالإرسال الفعلي)
        await this.simulateSend(processedMessage, contact.phone);
        
        progress.status = 'success';
        
      } catch (error) {
        progress.status = 'failed';
        progress.error = error instanceof Error ? error.message : 'خطأ غير معروف';
      }

      // تأخير قبل الرسالة التالية
      if (i < contacts.length - 1) {
        const delay = this.calculateDelay(timingSettings);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (onComplete) {
      onComplete(results);
    }

    return results;
  }

  // 🔄 إعادة إرسال الرسائل الفاشلة
  async retryFailedMessages(
    template: string,
    failedResults: SendProgress[],
    timingSettings: TimingSettings,
    onProgress?: (progress: SendProgress) => void
  ): Promise<SendProgress[]> {
    const retryResults: SendProgress[] = [];

    for (const failedResult of failedResults) {
      const retryProgress: SendProgress = {
        ...failedResult,
        status: 'sending',
        retryCount: (failedResult.retryCount || 0) + 1,
        timestamp: new Date(),
        error: undefined
      };

      retryResults.push(retryProgress);

      if (onProgress) {
        onProgress(retryProgress);
      }

      try {
        // محاولة الإرسال مرة أخرى
        await this.simulateSend(failedResult.message || '', failedResult.contactPhone);
        retryProgress.status = 'success';
        
      } catch (error) {
        retryProgress.status = 'failed';
        retryProgress.error = error instanceof Error ? error.message : 'فشل في المحاولة المتكررة';
      }

      // تأخير بين المحاولات
      const delay = this.calculateDelay(timingSettings);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return retryResults;
  }

  // 🎭 محاكاة الإرسال للاختبار
  private async simulateSend(message: string, phone: string): Promise<void> {
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // محاكاة احتمالية فشل 10%
    if (Math.random() < 0.1) {
      throw new Error('فشل في الاتصال بخادم WhatsApp');
    }
  }
}

export const smartMessageService = new SmartMessageService();
