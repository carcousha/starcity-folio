import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  type: 'text' | 'media' | 'sticker' | 'poll' | 'button' | 'list';
  data: {
    api_key: string;
    sender: string;
    number: string;
    message?: string;
    media_type?: string;
    url?: string;
    caption?: string;
    footer?: string;
    button?: any[];
    list?: any[];
    poll_name?: string;
    poll_options?: string[];
    poll_countable?: boolean;
  };
}

interface WhatsAppResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // فحص الاتصال إذا كان الطلب من نوع 'test'
    if (req.url.includes('test-connection')) {
      return await testConnection();
    }

    // معالجة الرسائل
    const { type, data }: WhatsAppMessage = await req.json()
    
    if (!data.api_key || !data.sender || !data.number) {
      return new Response(
        JSON.stringify({
          status: false,
          message: 'بيانات ناقصة: مفتاح API، المرسل، أو رقم الهاتف مطلوب'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result: WhatsAppResponse;

    switch (type) {
      case 'text':
        result = await sendTextMessage(data);
        break;
      case 'media':
        result = await sendMediaMessage(data);
        break;
      case 'sticker':
        result = await sendStickerMessage(data);
        break;
      case 'poll':
        result = await sendPollMessage(data);
        break;
      case 'button':
        result = await sendButtonMessage(data);
        break;
      case 'list':
        result = await sendListMessage(data);
        break;
      default:
        result = {
          status: false,
          message: 'نوع الرسالة غير مدعوم'
        };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('خطأ في Edge Function:', error);
    
    return new Response(
      JSON.stringify({ 
        status: false, 
        message: error.message || 'حدث خطأ في الخادم',
        error: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// دالة اختبار الاتصال
async function testConnection(): Promise<Response> {
  try {
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    const sender = Deno.env.get('WHATSAPP_SENDER');

    if (!apiKey || !sender) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'بيانات WhatsApp غير مكتملة',
          api_status: 'error',
          error: 'Missing API key or sender'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // اختبار الاتصال بـ x-growth.tech API
    const testResponse = await fetch('https://app.x-growth.tech/api/whatsapp/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: sender,
        number: '+971501234567',
        message: 'اختبار الاتصال'
      })
    });

    if (testResponse.ok) {
      const data = await testResponse.json();
      return new Response(
        JSON.stringify({ 
          status: true, 
          message: 'تم الاتصال بنجاح بـ x-growth.tech API',
          api_status: 'connected',
          business_info: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await testResponse.text();
      console.error('x-growth.tech API Error:', errorText);
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'فشل في الاتصال بـ x-growth.tech API',
          api_status: 'disconnected',
          error: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Connection Test Error:', error);
    return new Response(
      JSON.stringify({ 
        status: false, 
        message: 'خطأ في الاتصال بـ x-growth.tech API',
        api_status: 'error',
        error: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// إرسال رسالة نصية
async function sendTextMessage(data: any): Promise<WhatsAppResponse> {
  try {
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    const sender = Deno.env.get('WHATSAPP_SENDER');

    if (!apiKey || !sender) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    // إرسال الرسالة عبر x-growth.tech API
    const response = await fetch('https://app.x-growth.tech/api/whatsapp/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: sender,
        number: data.number,
        message: data.message || 'رسالة من Starcity Folio',
        type: 'text'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        status: true,
        message: 'تم إرسال الرسالة النصية بنجاح',
        data: result
      };
    } else {
      const error = await response.text();
      return {
        status: false,
        message: 'فشل في إرسال الرسالة النصية',
        error: error
      };
    }
  } catch (error) {
    return {
      status: false,
      message: 'خطأ في إرسال الرسالة النصية',
      error: error.toString()
    };
  }
}

// إرسال رسالة وسائط
async function sendMediaMessage(data: any): Promise<WhatsAppResponse> {
  try {
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    const sender = Deno.env.get('WHATSAPP_SENDER');

    if (!apiKey || !sender) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    // إرسال الوسائط عبر x-growth.tech API
    const response = await fetch('https://app.x-growth.tech/send-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: sender,
        number: data.number,
        media_type: data.media_type || 'image',
        url: data.url,
        caption: data.caption || '',
        footer: data.footer || ''
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        status: true,
        message: 'تم إرسال الوسائط بنجاح',
        data: result
      };
    } else {
      const error = await response.text();
      return {
        status: false,
        message: 'فشل في إرسال الوسائط',
        error: error
      };
    }
  } catch (error) {
    return {
      status: false,
      message: 'خطأ في إرسال الوسائط',
      error: error.toString()
    };
  }
}

// إرسال رسالة ملصق
async function sendStickerMessage(data: any): Promise<WhatsAppResponse> {
  try {
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    const sender = Deno.env.get('WHATSAPP_SENDER');

    if (!apiKey || !sender) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    // إرسال الملصق عبر x-growth.tech API
    const response = await fetch('https://app.x-growth.tech/send-sticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: sender,
        number: data.number,
        url: data.url
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        status: true,
        message: 'تم إرسال الملصق بنجاح',
        data: result
      };
    } else {
      const error = await response.text();
      return {
        status: false,
        message: 'فشل في إرسال الملصق',
        error: error
      };
    }
  } catch (error) {
    return {
      status: false,
      message: 'خطأ في إرسال الملصق',
      error: error.toString()
    };
  }
}

// إرسال رسالة استطلاع
async function sendPollMessage(data: any): Promise<WhatsAppResponse> {
  try {
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    const sender = Deno.env.get('WHATSAPP_SENDER');

    if (!apiKey || !sender) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    // إرسال الاستطلاع عبر x-growth.tech API
    const response = await fetch('https://app.x-growth.tech/send-poll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: sender,
        number: data.number,
        name: data.poll_name || 'استطلاع',
        option: data.poll_options || [],
        countable: data.poll_countable ? 'true' : 'false'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        status: true,
        message: 'تم إرسال الاستطلاع بنجاح',
        data: result
      };
    } else {
      const error = await response.text();
      return {
        status: false,
        message: 'فشل في إرسال الاستطلاع',
        error: error
      };
    }
  } catch (error) {
    return {
      status: false,
      message: 'خطأ في إرسال الاستطلاع',
      error: error.toString()
    };
  }
}

// إرسال رسالة بأزرار
async function sendButtonMessage(data: any): Promise<WhatsAppResponse> {
  try {
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    const sender = Deno.env.get('WHATSAPP_SENDER');

    if (!apiKey || !sender) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    // إرسال الرسالة بالأزرار عبر x-growth.tech API
    const response = await fetch('https://app.x-growth.tech/send-button', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: sender,
        number: data.number,
        message: data.message || 'رسالة مع أزرار',
        button: data.button || [],
        footer: data.footer || '',
        url: data.url || ''
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        status: true,
        message: 'تم إرسال الرسالة بالأزرار بنجاح',
        data: result
      };
    } else {
      const error = await response.text();
      return {
        status: false,
        message: 'فشل في إرسال الرسالة بالأزرار',
        error: error
      };
    }
  } catch (error) {
    return {
      status: false,
      message: 'خطأ في إرسال الرسالة بالأزرار',
      error: error.toString()
    };
  }
}

// إرسال رسالة قائمة
async function sendListMessage(data: any): Promise<WhatsAppResponse> {
  try {
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    const sender = Deno.env.get('WHATSAPP_SENDER');

    if (!apiKey || !sender) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    // إرسال القائمة عبر x-growth.tech API
    const response = await fetch('https://app.x-growth.tech/send-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender: sender,
        number: data.number,
        message: data.message || 'قائمة خيارات',
        list: data.list || [],
        footer: data.footer || ''
      })
    });

    if (response.ok) {
      const result = await response.json();
      return {
        status: true,
        message: 'تم إرسال القائمة بنجاح',
        data: result
      };
    } else {
      const error = await response.text();
      return {
        status: false,
        message: 'فشل في إرسال القائمة',
        error: error
      };
    }
  } catch (error) {
    return {
      status: false,
      message: 'خطأ في إرسال القائمة',
      error: error.toString()
    };
  }
}
