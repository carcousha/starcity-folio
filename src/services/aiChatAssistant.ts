import { 
  Client, 
  Property, 
  Conversation, 
  Message, 
  ClientIntentScore,
  MessageTemplate,
  AISettings
} from '../types/ai';

/**
 * 🤖 مساعد الذكاء الاصطناعي للمحادثات
 * يوفر ردود ذكية وفورية للعملاء
 */
export class AIChatAssistant {
  private templates: MessageTemplate[] = [];
  private settings: Map<string, AISettings> = new Map();
  private conversationHistory: Map<string, Conversation[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultSettings();
  }

  /**
   * إنشاء رد ذكي بناءً على سياق المحادثة
   */
  async generateIntelligentResponse(
    client: Client,
    message: string,
    conversationId: string,
    availableProperties: Property[] = []
  ): Promise<Message> {
    try {
      // تحليل نية العميل
      const intent = this.analyzeClientIntent(message);
      
      // تحديد نوع الرد المطلوب
      const responseType = this.determineResponseType(intent, message);
      
      // إنشاء الرد المناسب
      const response = await this.createResponse(
        client,
        intent,
        responseType,
        message,
        availableProperties
      );

      return {
        id: this.generateMessageId(),
        conversation_id: conversationId,
        sender_type: 'ai_assistant',
        sender_id: 'ai_system',
        content: response,
        message_type: 'text',
        timestamp: new Date().toISOString(),
        is_ai_generated: true,
        sentiment: this.analyzeSentiment(response),
        keywords: this.extractKeywords(response)
      };
    } catch (error) {
      console.error('خطأ في إنشاء الرد الذكي:', error);
      return this.createFallbackResponse(conversationId);
    }
  }

  /**
   * تحليل نية العميل من الرسالة
   */
  private analyzeClientIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // البحث عن العقارات
    if (this.containsKeywords(lowerMessage, ['عقار', 'فيلا', 'شقة', 'أرض', 'بحث', 'سعر'])) {
      return 'property_search';
    }
    
    // الاستفسار عن الموقع
    if (this.containsKeywords(lowerMessage, ['أين', 'موقع', 'منطقة', 'حي', 'مدينة'])) {
      return 'location_inquiry';
    }
    
    // الاستفسار عن السعر
    if (this.containsKeywords(lowerMessage, ['كم', 'سعر', 'تكلفة', 'ميزانية', 'ثمن'])) {
      return 'price_inquiry';
    }
    
    // طلب موعد
    if (this.containsKeywords(lowerMessage, ['موعد', 'زيارة', 'لقاء', 'مقابلة', 'عند'])) {
      return 'appointment_request';
    }
    
    // استفسار عام
    if (this.containsKeywords(lowerMessage, ['كيف', 'متى', 'أين', 'لماذا', 'ما هو'])) {
      return 'general_inquiry';
    }
    
    return 'general_inquiry';
  }

  /**
   * تحديد نوع الرد المطلوب
   */
  private determineResponseType(intent: string, message: string): string {
    switch (intent) {
      case 'property_search':
        return 'property_recommendation';
      case 'location_inquiry':
        return 'location_info';
      case 'price_inquiry':
        return 'price_analysis';
      case 'appointment_request':
        return 'appointment_scheduling';
      default:
        return 'general_response';
    }
  }

  /**
   * إنشاء الرد المناسب
   */
  private async createResponse(
    client: Client,
    intent: string,
    responseType: string,
    originalMessage: string,
    availableProperties: Property[]
  ): Promise<string> {
    const template = this.findBestTemplate(responseType, client.preferred_area[0]);
    
    if (template) {
      return this.fillTemplate(template, {
        client_name: client.full_name,
        area: client.preferred_area[0],
        property_type: client.property_type[0],
        budget_range: `${client.budget_min.toLocaleString()} - ${client.budget_max.toLocaleString()} ريال`,
        message: originalMessage
      });
    }

    // إنشاء رد مخصص
    return this.generateCustomResponse(intent, responseType, client, availableProperties);
  }

  /**
   * إنشاء رد مخصص
   */
  private generateCustomResponse(
    intent: string,
    responseType: string,
    client: Client,
    availableProperties: Property[]
  ): string {
    switch (responseType) {
      case 'property_recommendation':
        return this.generatePropertyRecommendationResponse(client, availableProperties);
      
      case 'location_info':
        return this.generateLocationInfoResponse(client.preferred_area[0]);
      
      case 'price_analysis':
        return this.generatePriceAnalysisResponse(client, availableProperties);
      
      case 'appointment_scheduling':
        return this.generateAppointmentResponse(client);
      
      default:
        return this.generateGeneralResponse(client);
    }
  }

  /**
   * إنشاء رد توصية العقارات
   */
  private generatePropertyRecommendationResponse(client: Client, properties: Property[]): string {
    const relevantProperties = properties.filter(p => 
      p.status === 'available' &&
      p.price >= client.budget_min &&
      p.price <= client.budget_max &&
      client.preferred_area.includes(p.area_name) &&
      client.property_type.includes(p.property_type)
    );

    if (relevantProperties.length === 0) {
      return `مرحباً ${client.full_name}، 
      للأسف لا توجد عقارات متاحة حالياً تناسب متطلباتك في منطقة ${client.preferred_area[0]}.
      هل تود مني البحث في مناطق أخرى أو تعديل معايير البحث؟`;
    }

    const topProperty = relevantProperties[0];
    return `مرحباً ${client.full_name}، 
    وجدت لك عقار ممتاز في ${topProperty.area_name}!
    
    🏠 ${topProperty.title}
    💰 السعر: ${topProperty.price.toLocaleString()} ريال
    📏 المساحة: ${topProperty.area} متر مربع
    🛏️ غرف النوم: ${topProperty.bedrooms}
    🚿 الحمامات: ${topProperty.bathrooms}
    
    هل تود مني إرسال المزيد من التفاصيل أو ترتيب موعد للزيارة؟`;
  }

  /**
   * إنشاء رد معلومات الموقع
   */
  private generateLocationInfoResponse(area: string): string {
    const areaInfo: Record<string, string> = {
      'الروضة': 'الروضة من أفضل المناطق السكنية في الرياض، تتميز بموقعها الاستراتيجي وخدماتها المتكاملة.',
      'النرجس': 'النرجس منطقة راقية وهادئة، مناسبة للعائلات مع جميع الخدمات الأساسية.',
      'الملز': 'الملز منطقة حيوية في قلب الرياض، قريبة من المراكز التجارية والخدمات.',
      'الرياض': 'الرياض العاصمة، مركز النشاط الاقتصادي والتجاري في المملكة.'
    };

    return areaInfo[area] || `منطقة ${area} تتميز بموقعها المميز وخدماتها المتكاملة. هل تود معرفة المزيد عن العقارات المتاحة فيها؟`;
  }

  /**
   * إنشاء رد تحليل الأسعار
   */
  private generatePriceAnalysisResponse(client: Client, properties: Property[]): string {
    const relevantProperties = properties.filter(p => 
      p.status === 'available' &&
      client.preferred_area.includes(p.area_name) &&
      client.property_type.includes(p.property_type)
    );

    if (relevantProperties.length === 0) {
      return `مرحباً ${client.full_name}، 
      بناءً على متطلباتك، نطاق السعر المناسب هو ${client.budget_min.toLocaleString()} - ${client.budget_max.toLocaleString()} ريال.
      هل تود مني البحث عن عقارات في مناطق أخرى؟`;
    }

    const avgPrice = relevantProperties.reduce((sum, p) => sum + p.price, 0) / relevantProperties.length;
    const priceRange = relevantProperties.reduce((range, p) => {
      range.min = Math.min(range.min, p.price);
      range.max = Math.max(range.max, p.price);
      return range;
    }, { min: Infinity, max: -Infinity });

    return `مرحباً ${client.full_name}، 
    بناءً على السوق الحالي في ${client.preferred_area[0]}:
    
    💰 متوسط السعر: ${Math.round(avgPrice).toLocaleString()} ريال
    📊 نطاق الأسعار: ${priceRange.min.toLocaleString()} - ${priceRange.max.toLocaleString()} ريال
    
    ميزانيتك ${client.budget_min.toLocaleString()} - ${client.budget_max.toLocaleString()} ريال مناسبة جداً لهذا السوق!
    هل تود مني البحث عن أفضل العقارات في نطاق ميزانيتك؟`;
  }

  /**
   * إنشاء رد طلب الموعد
   */
  private generateAppointmentResponse(client: Client): string {
    return `مرحباً ${client.full_name}، 
    يسعدني ترتيب موعد لك!
    
    📅 متى تفضل الموعد؟
    🕐 ما هو الوقت المناسب لك؟
    📍 هل تفضل اللقاء في المكتب أم زيارة العقار مباشرة؟
    
    سأقوم بتنسيق الموعد مع أحد خبرائنا وسأتواصل معك قريباً لتأكيد التفاصيل.`;
  }

  /**
   * إنشاء رد عام
   */
  private generateGeneralResponse(client: Client): string {
    return `مرحباً ${client.full_name}، 
    كيف يمكنني مساعدتك اليوم؟
    
    🔍 هل تبحث عن عقار معين؟
    📍 هل تريد معرفة المزيد عن منطقة معينة؟
    💰 هل تريد استشارة حول الأسعار؟
    📅 هل تريد ترتيب موعد؟
    
    أنا هنا لمساعدتك في كل ما يتعلق بالعقارات!`;
  }

  /**
   * البحث عن أفضل قالب
   */
  private findBestTemplate(responseType: string, area: string): MessageTemplate | null {
    return this.templates.find(t => 
      t.category === responseType && 
      t.is_active && 
      (t.language === 'ar' || t.language === 'en')
    ) || null;
  }

  /**
   * ملء القالب بالبيانات
   */
  private fillTemplate(template: MessageTemplate, data: Record<string, string>): string {
    let content = template.content;
    
    for (const [key, value] of Object.entries(data)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return content;
  }

  /**
   * تحليل مشاعر الرسالة
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['ممتاز', 'رائع', 'جميل', 'ممتاز', 'مفيد', 'شكراً', 'أحسنت'];
    const negativeWords = ['سيء', 'رديء', 'مشكلة', 'خطأ', 'فشل', 'مخيب'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * استخراج الكلمات المفتاحية
   */
  private extractKeywords(text: string): string[] {
    const keywords = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g) || [];
    return [...new Set(keywords)].slice(0, 5);
  }

  /**
   * التحقق من وجود كلمات مفتاحية
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * إنشاء رد احتياطي
   */
  private createFallbackResponse(conversationId: string): Message {
    return {
      id: this.generateMessageId(),
      conversation_id: conversationId,
      sender_type: 'ai_assistant',
      sender_id: 'ai_system',
      content: 'عذراً، حدث خطأ في معالجة رسالتك. هل يمكنك إعادة صياغة طلبك؟',
      message_type: 'text',
      timestamp: new Date().toISOString(),
      is_ai_generated: true,
      sentiment: 'neutral',
      keywords: ['خطأ', 'معالجة']
    };
  }

  /**
   * إنشاء معرف فريد للرسالة
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * تهيئة القوالب الافتراضية
   */
  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: '1',
        name: 'ترحيب العميل',
        category: 'general',
        content: 'مرحباً {{client_name}}، كيف يمكنني مساعدتك اليوم؟',
        variables: ['client_name'],
        language: 'ar',
        is_active: true,
        usage_count: 0,
        success_rate: 0.95,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'توصية العقار',
        category: 'property_match',
        content: 'مرحباً {{client_name}}، وجدت لك عقار ممتاز في {{area}}! {{message}}',
        variables: ['client_name', 'area', 'message'],
        language: 'ar',
        is_active: true,
        usage_count: 0,
        success_rate: 0.88,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * تهيئة الإعدادات الافتراضية
   */
  private initializeDefaultSettings(): void {
    const defaultSettings: AISettings[] = [
      {
        id: '1',
        setting_key: 'response_delay',
        setting_value: 1000,
        setting_type: 'number',
        description: 'تأخير الرد بالميلي ثانية',
        is_editable: true,
        category: 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        setting_key: 'max_response_length',
        setting_value: 500,
        setting_type: 'number',
        description: 'الحد الأقصى لطول الرد',
        is_editable: true,
        category: 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    defaultSettings.forEach(setting => {
      this.settings.set(setting.setting_key, setting);
    });
  }

  /**
   * تحديث القوالب
   */
  updateTemplates(templates: MessageTemplate[]): void {
    this.templates = templates;
  }

  /**
   * تحديث الإعدادات
   */
  updateSettings(key: string, value: any): void {
    const setting = this.settings.get(key);
    if (setting) {
      setting.setting_value = value;
      setting.updated_at = new Date().toISOString();
    }
  }

  /**
   * الحصول على الإعدادات
   */
  getSettings(): AISettings[] {
    return Array.from(this.settings.values());
  }

  /**
   * الحصول على القوالب
   */
  getTemplates(): MessageTemplate[] {
    return this.templates;
  }
}

// تصدير نسخة افتراضية
export const defaultAIChatAssistant = new AIChatAssistant();
