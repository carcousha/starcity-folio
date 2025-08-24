// Default Sticker Collections
// مجموعات الملصقات الافتراضية

import { 
  Heart, 
  Smile, 
  ThumbsUp, 
  Star, 
  Gift, 
  Coffee, 
  Music, 
  Calendar,
  MapPin,
  Home,
  Car,
  Building,
  Camera,
  Phone,
  Mail,
  Settings,
  Sun,
  Moon,
  Cloud,
  Zap,
  Briefcase,
  Trophy,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export interface StickerItem {
  id: string;
  url: string;
  name: string;
  preview: string;
  description?: string;
}

export interface StickerCategory {
  category: string;
  name: string;
  nameEn: string;
  icon: any;
  description: string;
  stickers: StickerItem[];
}

export const defaultStickerCollections: StickerCategory[] = [
  // فئة المشاعر والتعبيرات
  {
    category: 'emotions',
    name: 'المشاعر والتعبيرات',
    nameEn: 'Emotions & Expressions',
    icon: Heart,
    description: 'ملصقات للتعبير عن المشاعر والانفعالات',
    stickers: [
      { 
        id: 'heart',
        url: 'https://img.icons8.com/color/96/heart.png',
        name: 'قلب أحمر',
        preview: '❤️',
        description: 'للتعبير عن الحب والإعجاب'
      },
      {
        id: 'smile',
        url: 'https://img.icons8.com/color/96/smiling-face.png',
        name: 'وجه مبتسم',
        preview: '😊',
        description: 'للتعبير عن السعادة والرضا'
      },
      {
        id: 'thumbsup',
        url: 'https://img.icons8.com/color/96/thumbs-up.png',
        name: 'إعجاب',
        preview: '👍',
        description: 'للموافقة والاستحسان'
      },
      {
        id: 'star',
        url: 'https://img.icons8.com/color/96/star.png',
        name: 'نجمة ذهبية',
        preview: '⭐',
        description: 'للتقييم والتميز'
      },
      {
        id: 'clapping',
        url: 'https://img.icons8.com/color/96/clapping-hands.png',
        name: 'تصفيق',
        preview: '👏',
        description: 'للتشجيع والإعجاب'
      },
      {
        id: 'thinking',
        url: 'https://img.icons8.com/color/96/thinking-face.png',
        name: 'وجه مفكر',
        preview: '🤔',
        description: 'للتفكير والتأمل'
      },
      {
        id: 'wink',
        url: 'https://img.icons8.com/color/96/winking-face.png',
        name: 'غمزة',
        preview: '😉',
        description: 'للمزاح والدعابة'
      },
      {
        id: 'fire',
        url: 'https://img.icons8.com/color/96/fire.png',
        name: 'نار',
        preview: '🔥',
        description: 'للحماس والإثارة'
      }
    ]
  },

  // فئة الأعمال والمهن
  {
    category: 'business',
    name: 'الأعمال والمهن',
    nameEn: 'Business & Professional',
    icon: Briefcase,
    description: 'ملصقات مناسبة للتواصل المهني والتجاري',
    stickers: [
      {
        id: 'gift',
        url: 'https://img.icons8.com/color/96/gift.png',
        name: 'هدية',
        preview: '🎁',
        description: 'للعروض والهدايا'
      },
      {
        id: 'coffee',
        url: 'https://img.icons8.com/color/96/coffee.png',
        name: 'قهوة',
        preview: '☕',
        description: 'للاستراحة واللقاءات'
      },
      {
        id: 'briefcase',
        url: 'https://img.icons8.com/color/96/briefcase.png',
        name: 'حقيبة عمل',
        preview: '💼',
        description: 'للأعمال والمهام'
      },
      {
        id: 'handshake',
        url: 'https://img.icons8.com/color/96/handshake.png',
        name: 'مصافحة',
        preview: '🤝',
        description: 'للاتفاقيات والشراكة'
      },
      {
        id: 'trophy',
        url: 'https://img.icons8.com/color/96/trophy.png',
        name: 'كأس',
        preview: '🏆',
        description: 'للإنجازات والنجاح'
      },
      {
        id: 'target',
        url: 'https://img.icons8.com/color/96/target.png',
        name: 'هدف',
        preview: '🎯',
        description: 'للأهداف والتركيز'
      },
      {
        id: 'money',
        url: 'https://img.icons8.com/color/96/money.png',
        name: 'أموال',
        preview: '💰',
        description: 'للمعاملات المالية'
      },
      {
        id: 'chart',
        url: 'https://img.icons8.com/color/96/line-chart.png',
        name: 'رسم بياني',
        preview: '📈',
        description: 'للنمو والإحصائيات'
      }
    ]
  },

  // فئة العقارات
  {
    category: 'real_estate',
    name: 'العقارات',
    nameEn: 'Real Estate',
    icon: Building,
    description: 'ملصقات خاصة بمجال العقارات والأملاك',
    stickers: [
      {
        id: 'house',
        url: 'https://img.icons8.com/color/96/house.png',
        name: 'منزل',
        preview: '🏠',
        description: 'للمنازل والفيلات'
      },
      {
        id: 'building',
        url: 'https://img.icons8.com/color/96/building.png',
        name: 'مبنى',
        preview: '🏢',
        description: 'للمباني التجارية'
      },
      {
        id: 'apartment',
        url: 'https://img.icons8.com/color/96/apartment.png',
        name: 'شقة',
        preview: '🏠',
        description: 'للشقق السكنية'
      },
      {
        id: 'key',
        url: 'https://img.icons8.com/color/96/key.png',
        name: 'مفتاح',
        preview: '🔑',
        description: 'للتسليم والاستلام'
      },
      {
        id: 'location',
        url: 'https://img.icons8.com/color/96/map-pin.png',
        name: 'موقع',
        preview: '📍',
        description: 'لتحديد المواقع'
      },
      {
        id: 'contract',
        url: 'https://img.icons8.com/color/96/contract.png',
        name: 'عقد',
        preview: '📄',
        description: 'للعقود والاتفاقيات'
      },
      {
        id: 'sold',
        url: 'https://img.icons8.com/color/96/sold.png',
        name: 'تم البيع',
        preview: '✅',
        description: 'للعقارات المباعة'
      },
      {
        id: 'for_sale',
        url: 'https://img.icons8.com/color/96/for-sale.png',
        name: 'للبيع',
        preview: '🏷️',
        description: 'للعقارات المعروضة للبيع'
      }
    ]
  },

  // فئة الوقت والمواعيد
  {
    category: 'time_schedule',
    name: 'الوقت والمواعيد',
    nameEn: 'Time & Schedule',
    icon: Calendar,
    description: 'ملصقات للمواعيد والوقت والتذكيرات',
    stickers: [
      {
        id: 'calendar',
        url: 'https://img.icons8.com/color/96/calendar.png',
        name: 'تقويم',
        preview: '📅',
        description: 'للمواعيد والتواريخ'
      },
      {
        id: 'clock',
        url: 'https://img.icons8.com/color/96/clock.png',
        name: 'ساعة',
        preview: '🕐',
        description: 'للوقت والمواعيد'
      },
      {
        id: 'alarm',
        url: 'https://img.icons8.com/color/96/alarm-clock.png',
        name: 'منبه',
        preview: '⏰',
        description: 'للتذكيرات المهمة'
      },
      {
        id: 'hourglass',
        url: 'https://img.icons8.com/color/96/hourglass.png',
        name: 'ساعة رملية',
        preview: '⏳',
        description: 'للانتظار والصبر'
      },
      {
        id: 'stopwatch',
        url: 'https://img.icons8.com/color/96/stopwatch.png',
        name: 'مؤقت',
        preview: '⏱️',
        description: 'للعد التنازلي'
      },
      {
        id: 'schedule',
        url: 'https://img.icons8.com/color/96/schedule.png',
        name: 'جدولة',
        preview: '📋',
        description: 'للجداول الزمنية'
      }
    ]
  },

  // فئة التواصل
  {
    category: 'communication',
    name: 'التواصل',
    nameEn: 'Communication',
    icon: Phone,
    description: 'ملصقات للتواصل والاتصال',
    stickers: [
      {
        id: 'phone',
        url: 'https://img.icons8.com/color/96/phone.png',
        name: 'هاتف',
        preview: '📞',
        description: 'للمكالمات والاتصال'
      },
      {
        id: 'email',
        url: 'https://img.icons8.com/color/96/email.png',
        name: 'بريد إلكتروني',
        preview: '📧',
        description: 'للرسائل الإلكترونية'
      },
      {
        id: 'message',
        url: 'https://img.icons8.com/color/96/message.png',
        name: 'رسالة',
        preview: '💬',
        description: 'للرسائل النصية'
      },
      {
        id: 'whatsapp',
        url: 'https://img.icons8.com/color/96/whatsapp.png',
        name: 'واتساب',
        preview: '💚',
        description: 'لتطبيق واتساب'
      },
      {
        id: 'video_call',
        url: 'https://img.icons8.com/color/96/video-call.png',
        name: 'مكالمة فيديو',
        preview: '📹',
        description: 'لمكالمات الفيديو'
      },
      {
        id: 'megaphone',
        url: 'https://img.icons8.com/color/96/megaphone.png',
        name: 'مكبر صوت',
        preview: '📢',
        description: 'للإعلانات والتنبيهات'
      }
    ]
  },

  // فئة الطقس والطبيعة
  {
    category: 'weather_nature',
    name: 'الطقس والطبيعة',
    nameEn: 'Weather & Nature',
    icon: Sun,
    description: 'ملصقات للطقس والعناصر الطبيعية',
    stickers: [
      {
        id: 'sun',
        url: 'https://img.icons8.com/color/96/sun.png',
        name: 'شمس',
        preview: '☀️',
        description: 'للطقس المشمس'
      },
      {
        id: 'moon',
        url: 'https://img.icons8.com/color/96/moon.png',
        name: 'قمر',
        preview: '🌙',
        description: 'لليل والمساء'
      },
      {
        id: 'cloud',
        url: 'https://img.icons8.com/color/96/cloud.png',
        name: 'سحابة',
        preview: '☁️',
        description: 'للطقس الغائم'
      },
      {
        id: 'rain',
        url: 'https://img.icons8.com/color/96/rain.png',
        name: 'مطر',
        preview: '🌧️',
        description: 'للطقس الماطر'
      },
      {
        id: 'rainbow',
        url: 'https://img.icons8.com/color/96/rainbow.png',
        name: 'قوس قزح',
        preview: '🌈',
        description: 'للأمل والتفاؤل'
      },
      {
        id: 'tree',
        url: 'https://img.icons8.com/color/96/tree.png',
        name: 'شجرة',
        preview: '🌳',
        description: 'للطبيعة والبيئة'
      }
    ]
  },

  // فئة الترفيه والأنشطة
  {
    category: 'entertainment',
    name: 'الترفيه والأنشطة',
    nameEn: 'Entertainment & Activities',
    icon: Music,
    description: 'ملصقات للترفيه والأنشطة المختلفة',
    stickers: [
      {
        id: 'music',
        url: 'https://img.icons8.com/color/96/music.png',
        name: 'موسيقى',
        preview: '🎵',
        description: 'للموسيقى والغناء'
      },
      {
        id: 'party',
        url: 'https://img.icons8.com/color/96/party-baloons.png',
        name: 'احتفال',
        preview: '🎉',
        description: 'للاحتفالات والمناسبات'
      },
      {
        id: 'game',
        url: 'https://img.icons8.com/color/96/controller.png',
        name: 'لعبة',
        preview: '🎮',
        description: 'للألعاب والترفيه'
      },
      {
        id: 'movie',
        url: 'https://img.icons8.com/color/96/film-reel.png',
        name: 'فيلم',
        preview: '🎬',
        description: 'للأفلام والسينما'
      },
      {
        id: 'camera',
        url: 'https://img.icons8.com/color/96/camera.png',
        name: 'كاميرا',
        preview: '📷',
        description: 'للتصوير والذكريات'
      },
      {
        id: 'sports',
        url: 'https://img.icons8.com/color/96/football.png',
        name: 'رياضة',
        preview: '⚽',
        description: 'للرياضة واللياقة'
      }
    ]
  },

  // فئة الحالة والتنبيهات
  {
    category: 'status_alerts',
    name: 'الحالة والتنبيهات',
    nameEn: 'Status & Alerts',
    icon: CheckCircle,
    description: 'ملصقات للحالات والتنبيهات المختلفة',
    stickers: [
      {
        id: 'check',
        url: 'https://img.icons8.com/color/96/checkmark.png',
        name: 'صحيح',
        preview: '✅',
        description: 'للموافقة والإنجاز'
      },
      {
        id: 'cross',
        url: 'https://img.icons8.com/color/96/cancel.png',
        name: 'خطأ',
        preview: '❌',
        description: 'للرفض والخطأ'
      },
      {
        id: 'warning',
        url: 'https://img.icons8.com/color/96/warning-shield.png',
        name: 'تحذير',
        preview: '⚠️',
        description: 'للتحذيرات المهمة'
      },
      {
        id: 'info',
        url: 'https://img.icons8.com/color/96/info.png',
        name: 'معلومات',
        preview: 'ℹ️',
        description: 'للمعلومات العامة'
      },
      {
        id: 'question',
        url: 'https://img.icons8.com/color/96/question-mark.png',
        name: 'سؤال',
        preview: '❓',
        description: 'للأسئلة والاستفسارات'
      },
      {
        id: 'exclamation',
        url: 'https://img.icons8.com/color/96/exclamation-mark.png',
        name: 'تعجب',
        preview: '❗',
        description: 'للتأكيد والإلحاح'
      }
    ]
  }
];

// دالة مساعدة للحصول على ملصقات فئة معينة
export const getStickersByCategory = (category: string): StickerItem[] => {
  const categoryData = defaultStickerCollections.find(cat => cat.category === category);
  return categoryData ? categoryData.stickers : [];
};

// دالة مساعدة للحصول على جميع الفئات
export const getAllCategories = (): StickerCategory[] => {
  return defaultStickerCollections;
};

// دالة مساعدة للحصول على ملصق محدد
export const getStickerById = (stickerId: string): StickerItem | null => {
  for (const category of defaultStickerCollections) {
    const sticker = category.stickers.find(s => s.id === stickerId);
    if (sticker) return sticker;
  }
  return null;
};

// دالة مساعدة للبحث في الملصقات
export const searchStickers = (query: string): StickerItem[] => {
  const results: StickerItem[] = [];
  const searchTerm = query.toLowerCase();
  
  for (const category of defaultStickerCollections) {
    for (const sticker of category.stickers) {
      if (
        sticker.name.toLowerCase().includes(searchTerm) ||
        sticker.description?.toLowerCase().includes(searchTerm) ||
        category.name.toLowerCase().includes(searchTerm)
      ) {
        results.push(sticker);
      }
    }
  }
  
  return results;
};
