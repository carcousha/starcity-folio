// Enhanced WhatsApp Service
// خدمة واتساب محسنة مع دعم جميع أنواع الرسائل

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface WhatsAppMessageData {
  api_key: string;
  sender: string;
  number: string;
  message?: string;
  footer?: string;
  
  // للوسائط
  url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  
  // للأزرار
  button?: Array<{
    type: 'reply' | 'call' | 'url' | 'copy';
    displayText: string;
    phoneNumber?: string;
    url?: string;
    copyText?: string;
  }>;
  
  // للاستطلاعات
  name?: string;
  option?: string[];
  countable?: '1' | '0';
}

interface WhatsAppRequest {
  type: 'text' | 'media' | 'button' | 'poll' | 'sticker' | 'product';
  data: WhatsAppMessageData;
}

interface WhatsAppResponse {
  status: boolean;
  message: string;
  error?: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // فحص طريقة الطلب
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          status: false,
          message: 'طريقة الطلب غير مدعومة. استخدم POST'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 405 
        }
      );
    }

    const { type, data }: WhatsAppRequest = await req.json();
    
    // التحقق من البيانات الأساسية
    if (!data.api_key || !data.sender || !data.number) {
      return new Response(
        JSON.stringify({
          status: false,
          message: 'بيانات ناقصة: مفتاح API، المرسل، أو رقم الهاتف مطلوب'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    let result: WhatsAppResponse;

    // معالجة أنواع الرسائل المختلفة
    switch (type) {
      case 'text':
        result = await sendTextMessage(data);
        break;
      case 'media':
        result = await sendMediaMessage(data);
        break;
      case 'button':
        result = await sendButtonMessage(data);
        break;
      case 'poll':
        result = await sendPollMessage(data);
        break;
      case 'sticker':
        result = await sendStickerMessage(data);
        break;
      case 'product':
        result = await sendProductMessage(data);
        break;
      default:
        result = {
          status: false,
          message: `نوع الرسالة غير مدعوم: ${type}`
        };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('خطأ في Edge Function:', error);
    
    return new Response(
      JSON.stringify({ 
        status: false, 
        message: 'حدث خطأ في الخادم',
        error: error.message || error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// إرسال رسالة نصية
async function sendTextMessage(data: WhatsAppMessageData): Promise<WhatsAppResponse> {
  try {
    if (!data.message?.trim()) {
      return {
        status: false,
        message: 'نص الرسالة مطلوب'
      };
    }

    const response = await fetch('https://app.x-growth.tech/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || ''
      })
    });

    const result = await response.json();
    
    return {
      status: result.status || false,
      message: result.message || 'رد غير متوقع من الخادم',
      data: result
    };
  } catch (error) {
    console.error('خطأ في إرسال الرسالة النصية:', error);
    return {
      status: false,
      message: 'فشل في إرسال الرسالة النصية',
      error: error.message
    };
  }
}

// إرسال وسائط
async function sendMediaMessage(data: WhatsAppMessageData): Promise<WhatsAppResponse> {
  try {
    if (!data.url?.trim()) {
      return {
        status: false,
        message: 'رابط الوسائط مطلوب'
      };
    }

    const response = await fetch('https://app.x-growth.tech/send-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        url: data.url,
        media_type: data.media_type || 'image',
        caption: data.caption || '',
        footer: data.footer || ''
      })
    });

    const result = await response.json();
    
    return {
      status: result.status || false,
      message: result.message || 'رد غير متوقع من الخادم',
      data: result
    };
  } catch (error) {
    console.error('خطأ في إرسال الوسائط:', error);
    return {
      status: false,
      message: 'فشل في إرسال الوسائط',
      error: error.message
    };
  }
}

// إرسال أزرار
async function sendButtonMessage(data: WhatsAppMessageData): Promise<WhatsAppResponse> {
  try {
    if (!data.message?.trim()) {
      return {
        status: false,
        message: 'نص الرسالة مطلوب للأزرار'
      };
    }

    if (!data.button || data.button.length === 0) {
      return {
        status: false,
        message: 'يجب إضافة زر واحد على الأقل'
      };
    }

    // التحقق من صحة الأزرار
    for (const button of data.button) {
      if (!button.displayText?.trim()) {
        return {
          status: false,
          message: 'نص الزر مطلوب'
        };
      }
      
      if (button.type === 'call' && !button.phoneNumber) {
        return {
          status: false,
          message: 'رقم الهاتف مطلوب لزر الاتصال'
        };
      }
      
      if (button.type === 'url' && !button.url) {
        return {
          status: false,
          message: 'الرابط مطلوب لزر الرابط'
        };
      }
    }

    const response = await fetch('https://app.x-growth.tech/send-button', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        button: data.button,
        url: data.url || '',
        footer: data.footer || ''
      })
    });

    const result = await response.json();
    
    return {
      status: result.status || false,
      message: result.message || 'رد غير متوقع من الخادم',
      data: result
    };
  } catch (error) {
    console.error('خطأ في إرسال الأزرار:', error);
    return {
      status: false,
      message: 'فشل في إرسال رسالة الأزرار',
      error: error.message
    };
  }
}

// إرسال استطلاع
async function sendPollMessage(data: WhatsAppMessageData): Promise<WhatsAppResponse> {
  try {
    if (!data.name?.trim()) {
      return {
        status: false,
        message: 'عنوان الاستطلاع مطلوب'
      };
    }

    if (!data.option || data.option.length < 2) {
      return {
        status: false,
        message: 'يجب إضافة خيارين على الأقل للاستطلاع'
      };
    }

    // تنظيف الخيارات الفارغة
    const validOptions = data.option.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      return {
        status: false,
        message: 'يجب إدخال خيارين صحيحين على الأقل'
      };
    }

    const response = await fetch('https://app.x-growth.tech/send-poll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        name: data.name,
        option: validOptions,
        countable: data.countable || '1'
      })
    });

    const result = await response.json();
    
    return {
      status: result.status || false,
      message: result.message || 'رد غير متوقع من الخادم',
      data: result
    };
  } catch (error) {
    console.error('خطأ في إرسال الاستطلاع:', error);
    return {
      status: false,
      message: 'فشل في إرسال الاستطلاع',
      error: error.message
    };
  }
}

// إرسال ملصق
async function sendStickerMessage(data: WhatsAppMessageData): Promise<WhatsAppResponse> {
  try {
    if (!data.url?.trim()) {
      return {
        status: false,
        message: 'رابط الملصق مطلوب'
      };
    }

    const response = await fetch('https://app.x-growth.tech/send-sticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        url: data.url
      })
    });

    const result = await response.json();
    
    return {
      status: result.status || false,
      message: result.message || 'رد غير متوقع من الخادم',
      data: result
    };
  } catch (error) {
    console.error('خطأ في إرسال الملصق:', error);
    return {
      status: false,
      message: 'فشل في إرسال الملصق',
      error: error.message
    };
  }
}

// إرسال منتج
async function sendProductMessage(data: WhatsAppMessageData): Promise<WhatsAppResponse> {
  try {
    if (!data.url?.trim()) {
      return {
        status: false,
        message: 'رابط المنتج مطلوب'
      };
    }

    const response = await fetch('https://app.x-growth.tech/send-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        url: data.url,
        message: data.message || ''
      })
    });

    const result = await response.json();
    
    return {
      status: result.status || false,
      message: result.message || 'رد غير متوقع من الخادم',
      data: result
    };
  } catch (error) {
    console.error('خطأ في إرسال المنتج:', error);
    return {
      status: false,
      message: 'فشل في إرسال المنتج',
      error: error.message
    };
  }
}

/* 
إرشادات الاستخدام:

1. النص:
POST /whatsapp-enhanced
{
  "type": "text",
  "data": {
    "api_key": "your_key",
    "sender": "971501234567",
    "number": "971501234567",
    "message": "مرحباً!",
    "footer": "Sent via StarCity Folio"
  }
}

2. الوسائط:
POST /whatsapp-enhanced
{
  "type": "media",
  "data": {
    "api_key": "your_key",
    "sender": "971501234567",
    "number": "971501234567",
    "url": "https://example.com/image.jpg",
    "media_type": "image",
    "caption": "وصف الصورة"
  }
}

3. الأزرار:
POST /whatsapp-enhanced
{
  "type": "button",
  "data": {
    "api_key": "your_key",
    "sender": "971501234567",
    "number": "971501234567",
    "message": "اختر أحد الخيارات:",
    "button": [
      {
        "type": "reply",
        "displayText": "نعم"
      },
      {
        "type": "call",
        "displayText": "اتصل بنا",
        "phoneNumber": "971501234567"
      }
    ]
  }
}

4. الاستطلاع:
POST /whatsapp-enhanced
{
  "type": "poll",
  "data": {
    "api_key": "your_key",
    "sender": "971501234567",
    "number": "971501234567",
    "name": "ما رأيك؟",
    "option": ["ممتاز", "جيد", "مقبول"],
    "countable": "1"
  }
}
*/
