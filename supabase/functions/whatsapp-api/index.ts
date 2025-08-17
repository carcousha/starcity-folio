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
    // اختبار الاتصال بـ WhatsApp Business API
    const testResponse = await fetch('https://graph.facebook.com/v18.0/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      const data = await testResponse.json();
      return new Response(
        JSON.stringify({ 
          status: true, 
          message: 'تم الاتصال بنجاح بـ WhatsApp Business API',
          api_status: 'connected',
          business_info: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'فشل في الاتصال بـ WhatsApp Business API',
          api_status: 'disconnected',
          error: await testResponse.text()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: false, 
        message: 'خطأ في الاتصال بـ WhatsApp Business API',
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
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: data.number,
        type: 'text',
        text: {
          body: data.message || 'رسالة من Starcity Folio'
        }
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
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: data.number,
        type: 'image',
        image: {
          link: data.url,
          caption: data.caption || ''
        }
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
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: data.number,
        type: 'sticker',
        sticker: {
          link: data.url
        }
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
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: data.number,
        type: 'interactive',
        interactive: {
          type: 'poll',
          body: {
            text: data.poll_name || 'استطلاع'
          },
          action: {
            options: (data.poll_options || []).map((option: string, index: number) => ({
              id: `option_${index}`,
              text: option
            }))
          }
        }
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
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: data.number,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: data.message || 'رسالة مع أزرار'
          },
          action: {
            buttons: (data.button || []).map((btn: any, index: number) => ({
              type: 'reply',
              reply: {
                id: `btn_${index}`,
                title: btn.title || `زر ${index + 1}`
              }
            }))
          }
        }
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
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      return {
        status: false,
        message: 'بيانات WhatsApp غير مكتملة'
      };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: data.number,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: data.message || 'قائمة خيارات'
          },
          action: {
            button: 'اختر خياراً',
            sections: [
              {
                title: 'الخيارات المتاحة',
                rows: (data.list || []).map((item: any, index: number) => ({
                  id: `item_${index}`,
                  title: item.title || `عنوان ${index + 1}`,
                  description: item.description || `وصف ${index + 1}`
                }))
              }
            ]
          }
        }
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
