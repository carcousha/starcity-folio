/**
 * خدمة إدارة إعدادات السوق الإماراتي المتخصصة
 * تتولى حفظ واسترجاع الإعدادات المحلية للعقارات في الإمارات
 */

import { supabase } from '@/integrations/supabase/client';

export interface UAEMarketConfig {
  // الإعدادات الجغرافية
  location: {
    primaryEmirate: string;
    focusAreas: string[];
    nearbyEmiratesIncluded: boolean;
    radiusKm: number;
  };
  // إعدادات اللغة
  language: {
    primaryLanguage: 'ar' | 'en';
    secondaryLanguage: 'ar' | 'en' | 'none';
    arabicDialect: 'gulf' | 'levantine' | 'egyptian' | 'standard';
    translationQuality: number;
  };
  // الإعدادات الثقافية
  cultural: {
    respectPrayerTimes: boolean;
    observeLocalHolidays: boolean;
    weekendFridaySaturday: boolean;
    culturalSensitivity: boolean;
    familyOrientedContent: boolean;
    genderSeparateOptions: boolean;
  };
  // الإعدادات القانونية
  legal: {
    uaePropertyLaws: boolean;
    visaRequirements: boolean;
    bankingRegulations: boolean;
    emiratiPreference: boolean;
    foreignOwnershipRules: boolean;
  };
  // إعدادات العملة
  currency: {
    primaryCurrency: 'AED' | 'USD';
    showMultipleCurrencies: boolean;
    exchangeRateUpdates: boolean;
    priceFormatting: 'arabic' | 'western';
  };
  // إعدادات العمل
  business: {
    businessHours: {
      start: string;
      end: string;
      adjustForRamadan: boolean;
    };
    communicationStyle: 'formal' | 'friendly' | 'mixed';
    clientFollowUpFrequency: number;
    localPartnerPreference: boolean;
  };
}

// الإعدادات الافتراضية للسوق الإماراتي
const DEFAULT_UAE_CONFIG: UAEMarketConfig = {
  location: {
    primaryEmirate: 'عجمان',
    focusAreas: ['مدينة عجمان', 'الراشدية', 'النعيمية', 'الحميدية'],
    nearbyEmiratesIncluded: true,
    radiusKm: 50
  },
  language: {
    primaryLanguage: 'ar',
    secondaryLanguage: 'en',
    arabicDialect: 'gulf',
    translationQuality: 85
  },
  cultural: {
    respectPrayerTimes: true,
    observeLocalHolidays: true,
    weekendFridaySaturday: true,
    culturalSensitivity: true,
    familyOrientedContent: true,
    genderSeparateOptions: false
  },
  legal: {
    uaePropertyLaws: true,
    visaRequirements: true,
    bankingRegulations: true,
    emiratiPreference: true,
    foreignOwnershipRules: true
  },
  currency: {
    primaryCurrency: 'AED',
    showMultipleCurrencies: true,
    exchangeRateUpdates: true,
    priceFormatting: 'arabic'
  },
  business: {
    businessHours: {
      start: '09:00',
      end: '18:00',
      adjustForRamadan: true
    },
    communicationStyle: 'friendly',
    clientFollowUpFrequency: 3,
    localPartnerPreference: true
  }
};

export class UAEMarketSettingsService {
  private config: UAEMarketConfig;
  private listeners: Map<string, (config: UAEMarketConfig) => void> = new Map();
  private storageKey = 'starcity_uae_market_settings';
  private userId: string | null = null;
  private isOnline = true;

  constructor() {
    this.initializeService();
  }

  /**
   * تهيئة الخدمة
   */
  private async initializeService() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
      this.config = await this.loadConfig();

      // مراقبة تغييرات المصادقة
      supabase.auth.onAuthStateChange((event, session) => {
        this.userId = session?.user?.id || null;
        if (event === 'SIGNED_IN') {
          this.syncFromDatabase();
        }
      });
    } catch (error) {
      console.warn('تعذر الاتصال بقاعدة البيانات، سيتم استخدام التخزين المحلي:', error);
      this.isOnline = false;
      this.config = this.loadConfigFromLocal();
    }
  }

  /**
   * تحميل الإعدادات من قاعدة البيانات أو التخزين المحلي
   */
  private async loadConfig(): Promise<UAEMarketConfig> {
    if (this.isOnline && this.userId) {
      try {
        return await this.loadConfigFromDatabase();
      } catch (error) {
        console.warn('فشل تحميل إعدادات السوق الإماراتي من قاعدة البيانات:', error);
      }
    }
    return this.loadConfigFromLocal();
  }

  /**
   * تحميل الإعدادات من قاعدة البيانات
   */
  private async loadConfigFromDatabase(): Promise<UAEMarketConfig> {
    if (!this.userId) {
      throw new Error('المستخدم غير مصادق عليه');
    }

    try {
      const { data, error } = await supabase
        .from('uae_market_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // لا توجد إعدادات محفوظة، استخدم الافتراضية
          return DEFAULT_UAE_CONFIG;
        }
        throw error;
      }

      // تحويل البيانات من قاعدة البيانات إلى التنسيق المطلوب
      const config: UAEMarketConfig = {
        location: {
          primaryEmirate: data.primary_emirate || DEFAULT_UAE_CONFIG.location.primaryEmirate,
          focusAreas: data.focus_areas || DEFAULT_UAE_CONFIG.location.focusAreas,
          nearbyEmiratesIncluded: data.nearby_emirates_included ?? DEFAULT_UAE_CONFIG.location.nearbyEmiratesIncluded,
          radiusKm: data.search_radius_km || DEFAULT_UAE_CONFIG.location.radiusKm
        },
        language: {
          primaryLanguage: data.primary_language || DEFAULT_UAE_CONFIG.language.primaryLanguage,
          secondaryLanguage: data.secondary_language || DEFAULT_UAE_CONFIG.language.secondaryLanguage,
          arabicDialect: data.arabic_dialect || DEFAULT_UAE_CONFIG.language.arabicDialect,
          translationQuality: data.translation_quality || DEFAULT_UAE_CONFIG.language.translationQuality
        },
        cultural: {
          respectPrayerTimes: data.respect_prayer_times ?? DEFAULT_UAE_CONFIG.cultural.respectPrayerTimes,
          observeLocalHolidays: data.observe_local_holidays ?? DEFAULT_UAE_CONFIG.cultural.observeLocalHolidays,
          weekendFridaySaturday: data.weekend_friday_saturday ?? DEFAULT_UAE_CONFIG.cultural.weekendFridaySaturday,
          culturalSensitivity: data.cultural_sensitivity ?? DEFAULT_UAE_CONFIG.cultural.culturalSensitivity,
          familyOrientedContent: data.family_oriented_content ?? DEFAULT_UAE_CONFIG.cultural.familyOrientedContent,
          genderSeparateOptions: data.gender_separate_options ?? DEFAULT_UAE_CONFIG.cultural.genderSeparateOptions
        },
        legal: {
          uaePropertyLaws: data.uae_property_laws ?? DEFAULT_UAE_CONFIG.legal.uaePropertyLaws,
          visaRequirements: data.visa_requirements ?? DEFAULT_UAE_CONFIG.legal.visaRequirements,
          bankingRegulations: data.banking_regulations ?? DEFAULT_UAE_CONFIG.legal.bankingRegulations,
          emiratiPreference: data.emirati_preference ?? DEFAULT_UAE_CONFIG.legal.emiratiPreference,
          foreignOwnershipRules: data.foreign_ownership_rules ?? DEFAULT_UAE_CONFIG.legal.foreignOwnershipRules
        },
        currency: {
          primaryCurrency: data.primary_currency || DEFAULT_UAE_CONFIG.currency.primaryCurrency,
          showMultipleCurrencies: data.show_multiple_currencies ?? DEFAULT_UAE_CONFIG.currency.showMultipleCurrencies,
          exchangeRateUpdates: data.exchange_rate_updates ?? DEFAULT_UAE_CONFIG.currency.exchangeRateUpdates,
          priceFormatting: data.price_formatting || DEFAULT_UAE_CONFIG.currency.priceFormatting
        },
        business: {
          businessHours: {
            start: data.business_hours_start || DEFAULT_UAE_CONFIG.business.businessHours.start,
            end: data.business_hours_end || DEFAULT_UAE_CONFIG.business.businessHours.end,
            adjustForRamadan: data.adjust_for_ramadan ?? DEFAULT_UAE_CONFIG.business.businessHours.adjustForRamadan
          },
          communicationStyle: data.communication_style || DEFAULT_UAE_CONFIG.business.communicationStyle,
          clientFollowUpFrequency: data.client_followup_frequency || DEFAULT_UAE_CONFIG.business.clientFollowUpFrequency,
          localPartnerPreference: data.local_partner_preference ?? DEFAULT_UAE_CONFIG.business.localPartnerPreference
        }
      };

      return config;
    } catch (error) {
      console.error('خطأ في تحميل إعدادات السوق الإماراتي من قاعدة البيانات:', error);
      throw error;
    }
  }

  /**
   * تحميل الإعدادات من التخزين المحلي
   */
  private loadConfigFromLocal(): UAEMarketConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_UAE_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات السوق الإماراتي من التخزين المحلي:', error);
    }
    return DEFAULT_UAE_CONFIG;
  }

  /**
   * حفظ الإعدادات
   */
  async saveConfig(config: Partial<UAEMarketConfig>): Promise<void> {
    try {
      // دمج الإعدادات الجديدة مع الموجودة
      this.config = {
        ...this.config,
        ...config,
        location: { ...this.config.location, ...config.location },
        language: { ...this.config.language, ...config.language },
        cultural: { ...this.config.cultural, ...config.cultural },
        legal: { ...this.config.legal, ...config.legal },
        currency: { ...this.config.currency, ...config.currency },
        business: { 
          ...this.config.business, 
          ...config.business,
          businessHours: { 
            ...this.config.business.businessHours, 
            ...config.business?.businessHours 
          }
        }
      };

      // حفظ في التخزين المحلي
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));

      // حفظ في قاعدة البيانات
      if (this.isOnline && this.userId) {
        await this.saveToDatabase(this.config);
      }

      // إشعار المستمعين
      this.notifyListeners();

      console.log('تم حفظ إعدادات السوق الإماراتي بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ إعدادات السوق الإماراتي:', error);
      throw error;
    }
  }

  /**
   * حفظ الإعدادات في قاعدة البيانات
   */
  private async saveToDatabase(config: UAEMarketConfig): Promise<void> {
    if (!this.userId) {
      throw new Error('المستخدم غير مصادق عليه');
    }

    try {
      const databaseRecord = {
        user_id: this.userId,
        primary_emirate: config.location.primaryEmirate,
        focus_areas: config.location.focusAreas,
        nearby_emirates_included: config.location.nearbyEmiratesIncluded,
        search_radius_km: config.location.radiusKm,
        primary_language: config.language.primaryLanguage,
        secondary_language: config.language.secondaryLanguage,
        arabic_dialect: config.language.arabicDialect,
        translation_quality: config.language.translationQuality,
        respect_prayer_times: config.cultural.respectPrayerTimes,
        observe_local_holidays: config.cultural.observeLocalHolidays,
        weekend_friday_saturday: config.cultural.weekendFridaySaturday,
        cultural_sensitivity: config.cultural.culturalSensitivity,
        family_oriented_content: config.cultural.familyOrientedContent,
        gender_separate_options: config.cultural.genderSeparateOptions,
        uae_property_laws: config.legal.uaePropertyLaws,
        visa_requirements: config.legal.visaRequirements,
        banking_regulations: config.legal.bankingRegulations,
        emirati_preference: config.legal.emiratiPreference,
        foreign_ownership_rules: config.legal.foreignOwnershipRules,
        primary_currency: config.currency.primaryCurrency,
        show_multiple_currencies: config.currency.showMultipleCurrencies,
        exchange_rate_updates: config.currency.exchangeRateUpdates,
        price_formatting: config.currency.priceFormatting,
        business_hours_start: config.business.businessHours.start,
        business_hours_end: config.business.businessHours.end,
        adjust_for_ramadan: config.business.businessHours.adjustForRamadan,
        communication_style: config.business.communicationStyle,
        client_followup_frequency: config.business.clientFollowUpFrequency,
        local_partner_preference: config.business.localPartnerPreference,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('uae_market_settings')
        .upsert(databaseRecord, {
          onConflict: 'user_id,company_id'
        });

      if (error) throw error;

      console.log('تم حفظ إعدادات السوق الإماراتي في قاعدة البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في حفظ إعدادات السوق الإماراتي في قاعدة البيانات:', error);
      throw error;
    }
  }

  /**
   * مزامنة الإعدادات من قاعدة البيانات
   */
  async syncFromDatabase(): Promise<void> {
    if (!this.isOnline || !this.userId) return;

    try {
      const databaseConfig = await this.loadConfigFromDatabase();
      this.config = databaseConfig;
      
      // تحديث التخزين المحلي
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
      
      // إشعار المستمعين
      this.notifyListeners();
      
      console.log('تم مزامنة إعدادات السوق الإماراتي من قاعدة البيانات');
    } catch (error) {
      console.error('خطأ في مزامنة إعدادات السوق الإماراتي:', error);
    }
  }

  /**
   * الحصول على الإعدادات الحالية
   */
  getConfig(): UAEMarketConfig {
    return { ...this.config };
  }

  /**
   * الحصول على إعدادات فئة معينة
   */
  getCategoryConfig<T extends keyof UAEMarketConfig>(category: T): UAEMarketConfig[T] {
    return { ...this.config[category] };
  }

  /**
   * تحديث إعدادات فئة معينة
   */
  async updateCategoryConfig<T extends keyof UAEMarketConfig>(
    category: T,
    config: Partial<UAEMarketConfig[T]>
  ): Promise<void> {
    await this.saveConfig({
      [category]: {
        ...this.config[category],
        ...config
      }
    } as Partial<UAEMarketConfig>);
  }

  /**
   * إعادة تعيين إلى الإعدادات الافتراضية
   */
  async resetToDefaults(): Promise<void> {
    this.config = { ...DEFAULT_UAE_CONFIG };
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    
    if (this.isOnline && this.userId) {
      await this.saveToDatabase(this.config);
    }
    
    this.notifyListeners();
  }

  /**
   * التحقق من صحة الإعدادات
   */
  validateConfig(config: Partial<UAEMarketConfig>): string[] {
    const errors: string[] = [];

    // فحص إعدادات الموقع
    if (config.location?.radiusKm && (config.location.radiusKm < 1 || config.location.radiusKm > 500)) {
      errors.push('نطاق البحث يجب أن يكون بين 1 و 500 كيلومتر');
    }

    // فحص إعدادات اللغة
    if (config.language?.translationQuality && 
        (config.language.translationQuality < 50 || config.language.translationQuality > 100)) {
      errors.push('جودة الترجمة يجب أن تكون بين 50% و 100%');
    }

    // فحص إعدادات العمل
    if (config.business?.clientFollowUpFrequency && 
        (config.business.clientFollowUpFrequency < 1 || config.business.clientFollowUpFrequency > 30)) {
      errors.push('تكرار متابعة العملاء يجب أن يكون بين 1 و 30 يوم');
    }

    return errors;
  }

  /**
   * إضافة مستمع للتغييرات
   */
  addListener(id: string, callback: (config: UAEMarketConfig) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * إزالة مستمع
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * إشعار جميع المستمعين
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.config));
  }

  /**
   * تصدير الإعدادات
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * استيراد الإعدادات
   */
  async importConfig(configJSON: string): Promise<void> {
    try {
      const imported = JSON.parse(configJSON);
      const errors = this.validateConfig(imported);
      
      if (errors.length > 0) {
        throw new Error(`إعدادات غير صالحة: ${errors.join(', ')}`);
      }
      
      await this.saveConfig(imported);
    } catch (error) {
      console.error('خطأ في استيراد إعدادات السوق الإماراتي:', error);
      throw new Error('ملف الإعدادات غير صالح');
    }
  }

  /**
   * الحصول على حالة الخدمة
   */
  getServiceStatus(): {
    isOnline: boolean;
    isConfigured: boolean;
    databaseConnected: boolean;
    lastUpdated: string | null;
  } {
    return {
      isOnline: this.isOnline,
      isConfigured: !!this.config,
      databaseConnected: this.isOnline && !!this.userId,
      lastUpdated: new Date().toISOString() // يمكن تحسينه لاحقاً
    };
  }
}

// تصدير نسخة افتراضية من الخدمة
export const uaeMarketSettingsService = new UAEMarketSettingsService();


