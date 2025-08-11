/**
 * Middleware لتطبيق إعدادات الذكاء الاصطناعي على النظام الفعلي
 * يتولى تفعيل الإعدادات وتطبيقها على مختلف أجزاء التطبيق
 */

import { aiSettingsService } from '@/services/aiSettingsService';
import { uaeMarketSettingsService } from '@/services/uaeMarketSettingsService';
import { externalIntegrationsService } from '@/services/externalIntegrationsService';

export interface ApplicationState {
  prayerTimes: Array<{ name: string; time: string }>;
  businessHours: { start: string; end: string; adjustForRamadan: boolean };
  culturalSettings: {
    respectPrayerTimes: boolean;
    weekendFridaySaturday: boolean;
    arabicPriority: boolean;
  };
  searchSettings: {
    primaryEmirate: string;
    radiusKm: number;
    includeNearbyAreas: boolean;
  };
  currencySettings: {
    primary: 'AED' | 'USD';
    formatting: 'arabic' | 'western';
    showMultiple: boolean;
  };
  notificationSettings: {
    channels: string[];
    quietHours: { start: string; end: string; enabled: boolean };
    frequency: string;
  };
}

class SettingsMiddleware {
  private currentState: ApplicationState | null = null;
  private listeners: Set<(state: ApplicationState) => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * تهيئة المتوسط
   */
  private async initialize() {
    if (this.isInitialized) return;

    try {
      // تحميل الإعدادات وتطبيقها
      await this.loadAndApplySettings();

      // مراقبة تغييرات الإعدادات
      aiSettingsService.addListener('settings-middleware', () => {
        this.loadAndApplySettings();
      });

      uaeMarketSettingsService.addListener('settings-middleware', () => {
        this.loadAndApplySettings();
      });

      this.isInitialized = true;
      console.log('تم تهيئة middleware الإعدادات بنجاح');
    } catch (error) {
      console.error('خطأ في تهيئة middleware الإعدادات:', error);
    }
  }

  /**
   * تحميل وتطبيق جميع الإعدادات
   */
  private async loadAndApplySettings() {
    try {
      const aiSettings = aiSettingsService.getSettings();
      const uaeSettings = uaeMarketSettingsService.getConfig();

      // بناء حالة التطبيق الجديدة
      const newState: ApplicationState = {
        prayerTimes: this.getPrayerTimes(),
        businessHours: {
          start: uaeSettings.business.businessHours.start,
          end: uaeSettings.business.businessHours.end,
          adjustForRamadan: uaeSettings.business.businessHours.adjustForRamadan
        },
        culturalSettings: {
          respectPrayerTimes: uaeSettings.cultural.respectPrayerTimes,
          weekendFridaySaturday: uaeSettings.cultural.weekendFridaySaturday,
          arabicPriority: uaeSettings.language.primaryLanguage === 'ar'
        },
        searchSettings: {
          primaryEmirate: uaeSettings.location.primaryEmirate,
          radiusKm: uaeSettings.location.radiusKm,
          includeNearbyAreas: uaeSettings.location.nearbyEmiratesIncluded
        },
        currencySettings: {
          primary: uaeSettings.currency.primaryCurrency,
          formatting: uaeSettings.currency.priceFormatting,
          showMultiple: uaeSettings.currency.showMultipleCurrencies
        },
        notificationSettings: {
          channels: this.getActiveNotificationChannels(aiSettings.notifications),
          quietHours: aiSettings.notifications.quietHours,
          frequency: aiSettings.notifications.frequency
        }
      };

      this.currentState = newState;
      this.notifyListeners();

      // تطبيق الإعدادات على مختلف أجزاء النظام
      await this.applySettingsToSystem(newState);

    } catch (error) {
      console.error('خطأ في تحميل وتطبيق الإعدادات:', error);
    }
  }

  /**
   * تطبيق الإعدادات على النظام
   */
  private async applySettingsToSystem(state: ApplicationState) {
    try {
      // تطبيق إعدادات المنطقة الزمنية
      this.applyTimezoneSettings(state);

      // تطبيق إعدادات البحث
      this.applySearchSettings(state);

      // تطبيق إعدادات العملة
      this.applyCurrencySettings(state);

      // تطبيق إعدادات التنبيهات
      this.applyNotificationSettings(state);

      // تطبيق الإعدادات الثقافية
      this.applyCulturalSettings(state);

      console.log('تم تطبيق جميع الإعدادات على النظام بنجاح');
    } catch (error) {
      console.error('خطأ في تطبيق الإعدادات على النظام:', error);
    }
  }

  /**
   * تطبيق إعدادات المنطقة الزمنية وأوقات الصلاة
   */
  private applyTimezoneSettings(state: ApplicationState) {
    // تعيين المنطقة الزمنية للإمارات
    const timezone = 'Asia/Dubai';
    
    // تطبيق أوقات العمل
    const businessHours = state.businessHours;
    if (businessHours.adjustForRamadan) {
      // تعديل أوقات العمل لرمضان (يمكن تحسينها بناءً على التاريخ الفعلي)
      const isRamadan = this.isRamadanSeason();
      if (isRamadan) {
        // تقليل ساعات العمل في رمضان
        document.documentElement.style.setProperty('--business-hours-start', '10:00');
        document.documentElement.style.setProperty('--business-hours-end', '16:00');
      } else {
        document.documentElement.style.setProperty('--business-hours-start', businessHours.start);
        document.documentElement.style.setProperty('--business-hours-end', businessHours.end);
      }
    }

    // تعيين أوقات الصلاة في DOM للوصول إليها من أجزاء أخرى
    if (state.culturalSettings.respectPrayerTimes) {
      document.documentElement.setAttribute('data-prayer-times', JSON.stringify(state.prayerTimes));
    }
  }

  /**
   * تطبيق إعدادات البحث
   */
  private applySearchSettings(state: ApplicationState) {
    // تعيين إعدادات البحث الافتراضية
    const searchConfig = {
      defaultEmirate: state.searchSettings.primaryEmirate,
      searchRadius: state.searchSettings.radiusKm,
      includeNearby: state.searchSettings.includeNearbyAreas
    };

    // حفظ إعدادات البحث في localStorage للوصول إليها من مكونات البحث
    localStorage.setItem('default_search_config', JSON.stringify(searchConfig));

    // تعيين متغيرات CSS للمسافات
    document.documentElement.style.setProperty('--default-search-radius', `${state.searchSettings.radiusKm}km`);
  }

  /**
   * تطبيق إعدادات العملة
   */
  private applyCurrencySettings(state: ApplicationState) {
    const currency = state.currencySettings;
    
    // تعيين العملة الافتراضية
    document.documentElement.setAttribute('data-primary-currency', currency.primary);
    document.documentElement.setAttribute('data-currency-format', currency.formatting);
    document.documentElement.setAttribute('data-show-multiple-currencies', currency.showMultiple.toString());

    // تطبيق تنسيق الأرقام
    if (currency.formatting === 'arabic') {
      document.documentElement.setAttribute('data-number-format', 'arabic');
      // يمكن إضافة CSS لتطبيق الخطوط العربية للأرقام
    } else {
      document.documentElement.setAttribute('data-number-format', 'western');
    }

    // حفظ إعدادات العملة في localStorage
    localStorage.setItem('currency_settings', JSON.stringify(currency));
  }

  /**
   * تطبيق إعدادات التنبيهات
   */
  private applyNotificationSettings(state: ApplicationState) {
    const notifications = state.notificationSettings;
    
    // تعيين قنوات التنبيه النشطة
    localStorage.setItem('notification_channels', JSON.stringify(notifications.channels));
    
    // تطبيق ساعات الهدوء
    if (notifications.quietHours.enabled) {
      document.documentElement.setAttribute('data-quiet-hours-start', notifications.quietHours.start);
      document.documentElement.setAttribute('data-quiet-hours-end', notifications.quietHours.end);
    }

    // تعيين تكرار التنبيهات
    document.documentElement.setAttribute('data-notification-frequency', notifications.frequency);
  }

  /**
   * تطبيق الإعدادات الثقافية
   */
  private applyCulturalSettings(state: ApplicationState) {
    const cultural = state.culturalSettings;
    
    // تطبيق أولوية اللغة العربية
    if (cultural.arabicPriority) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    }

    // تطبيق إعدادات نهاية الأسبوع
    if (cultural.weekendFridaySaturday) {
      document.documentElement.setAttribute('data-weekend', 'friday-saturday');
    } else {
      document.documentElement.setAttribute('data-weekend', 'saturday-sunday');
    }

    // تطبيق مراعاة أوقات الصلاة
    document.documentElement.setAttribute('data-respect-prayer-times', cultural.respectPrayerTimes.toString());
  }

  /**
   * الحصول على أوقات الصلاة (يمكن تحسينها للحصول على أوقات حقيقية)
   */
  private getPrayerTimes(): Array<{ name: string; time: string }> {
    // أوقات تقديرية لأبوظبي/دبي (يمكن تحسينها باستخدام API أوقات الصلاة)
    return [
      { name: 'الفجر', time: '05:30' },
      { name: 'الظهر', time: '12:15' },
      { name: 'العصر', time: '15:45' },
      { name: 'المغرب', time: '18:30' },
      { name: 'العشاء', time: '20:00' }
    ];
  }

  /**
   * تحديد ما إذا كان الوقت الحالي في موسم رمضان
   */
  private isRamadanSeason(): boolean {
    // تحديد بسيط (يمكن تحسينه باستخدام تقويم هجري دقيق)
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // تواريخ تقديرية لرمضان (تحتاج تحديث سنوي)
    const ramadanDates = {
      2025: { start: new Date(2025, 2, 1), end: new Date(2025, 2, 30) }, // مارس 2025
      2026: { start: new Date(2026, 1, 18), end: new Date(2026, 2, 19) }, // فبراير/مارس 2026
    };

    const ramadan = ramadanDates[currentYear as keyof typeof ramadanDates];
    if (ramadan) {
      return now >= ramadan.start && now <= ramadan.end;
    }

    return false;
  }

  /**
   * الحصول على قنوات التنبيه النشطة
   */
  private getActiveNotificationChannels(notifications: any): string[] {
    const channels: string[] = [];
    
    if (notifications.email) channels.push('email');
    if (notifications.sms) channels.push('sms');
    if (notifications.whatsapp) channels.push('whatsapp');
    if (notifications.push) channels.push('push');
    if (notifications.inApp) channels.push('inApp');
    
    return channels;
  }

  /**
   * الحصول على الحالة الحالية للتطبيق
   */
  getCurrentState(): ApplicationState | null {
    return this.currentState;
  }

  /**
   * التحقق من ما إذا كان الوقت الحالي في ساعات الهدوء
   */
  isQuietHours(): boolean {
    if (!this.currentState?.notificationSettings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const quietHours = this.currentState.notificationSettings.quietHours;
    const startTime = this.parseTime(quietHours.start);
    const endTime = this.parseTime(quietHours.end);
    
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // ساعات الهدوء تمتد عبر منتصف الليل
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * التحقق من ما إذا كان الوقت الحالي وقت صلاة
   */
  isPrayerTime(): boolean {
    if (!this.currentState?.culturalSettings.respectPrayerTimes) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return this.currentState.prayerTimes.some(prayer => {
      const prayerTime = this.parseTime(prayer.time);
      // نعتبر فترة 15 دقيقة حول وقت الصلاة
      return Math.abs(currentTime - prayerTime) <= 15;
    });
  }

  /**
   * تحويل وقت نصي إلى دقائق
   */
  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * إضافة مستمع للتغييرات
   */
  addListener(callback: (state: ApplicationState) => void): void {
    this.listeners.add(callback);
  }

  /**
   * إزالة مستمع
   */
  removeListener(callback: (state: ApplicationState) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * إشعار جميع المستمعين
   */
  private notifyListeners(): void {
    if (this.currentState) {
      this.listeners.forEach(callback => callback(this.currentState!));
    }
  }

  /**
   * فرض إعادة تحميل الإعدادات
   */
  async forceReload(): Promise<void> {
    await this.loadAndApplySettings();
  }

  /**
   * الحصول على معلومات حالة النظام
   */
  getSystemInfo(): {
    isInitialized: boolean;
    hasSettings: boolean;
    isQuietHours: boolean;
    isPrayerTime: boolean;
    currentEmirate: string | null;
    primaryCurrency: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      hasSettings: !!this.currentState,
      isQuietHours: this.isQuietHours(),
      isPrayerTime: this.isPrayerTime(),
      currentEmirate: this.currentState?.searchSettings.primaryEmirate || null,
      primaryCurrency: this.currentState?.currencySettings.primary || null
    };
  }
}

// تصدير نسخة افتراضية من المتوسط
export const settingsMiddleware = new SettingsMiddleware();


