// مكتبة إرسال رسائل واتساب مباشرة عبر API
export interface WhatsAppMessage {
  type: 'text' | 'media' | 'sticker' | 'poll' | 'button' | 'list' | 'test';
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

export interface WhatsAppResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

class WhatsAppDirectSender {
  private async makeDirectAPICall(endpoint: string, data: any): Promise<WhatsAppResponse> {
    try {
      console.log(`📤 إرسال طلب مباشر إلى: ${endpoint}`);
      console.log(`📋 البيانات:`, data);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data)
      });

      console.log(`📡 حالة الاستجابة: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ في الاستجابة:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'خطأ في الخادم'}`);
      }

      const result = await response.json();
      console.log('✅ نتيجة الإرسال:', result);

      return {
        status: true,
        message: 'تم إرسال الرسالة بنجاح',
        data: result
      };

    } catch (error: any) {
      console.error('❌ خطأ في الإرسال:', error);
      
      // معالجة أنواع مختلفة من الأخطاء
      let errorMessage = 'حدث خطأ في الإرسال';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'فشل في الاتصال بخادم API - تحقق من الاتصال بالإنترنت';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'مشكلة CORS - تحقق من إعدادات API';
      } else if (error.message.includes('401')) {
        errorMessage = 'مفتاح API غير صحيح';
      } else if (error.message.includes('403')) {
        errorMessage = 'غير مسموح - تحقق من صلاحيات API';
      } else if (error.message.includes('404')) {
        errorMessage = 'خدمة API غير متوفرة';
      } else if (error.message.includes('500')) {
        errorMessage = 'خطأ في خادم API';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        status: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  async sendMessage(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
    const { type, data } = messageData;
    
    // تحديد الـ endpoint حسب نوع الرسالة
    let endpoint = '';
    let payload: any = {
      api_key: data.api_key,
      sender: data.sender,
      number: data.number
    };

    switch (type) {
      case 'text':
        endpoint = 'https://app.x-growth.tech/send-message';
        payload = {
          ...payload,
          message: data.message || '',
          footer: data.footer || ''
        };
        break;
        
      case 'media':
        endpoint = 'https://app.x-growth.tech/send-media';
        payload = {
          ...payload,
          media_type: data.media_type || 'image',
          url: data.url || '',
          caption: data.caption || '',
          footer: data.footer || ''
        };
        break;
        
      case 'sticker':
        endpoint = 'https://app.x-growth.tech/send-sticker';
        payload = {
          ...payload,
          url: data.url || ''
        };
        break;
        
      case 'poll':
        endpoint = 'https://app.x-growth.tech/send-poll';
        payload = {
          ...payload,
          name: data.poll_name || '',
          option: data.poll_options || [],
          countable: data.poll_countable ? 'true' : 'false'
        };
        break;
        
      case 'button':
        endpoint = 'https://app.x-growth.tech/send-button';
        payload = {
          ...payload,
          message: data.message || '',
          button: data.button || [],
          footer: data.footer || '',
          url: data.url || ''
        };
        break;
        
      case 'list':
        endpoint = 'https://app.x-growth.tech/send-list';
        payload = {
          ...payload,
          message: data.message || '',
          list: data.list || [],
          footer: data.footer || ''
        };
        break;
        
      case 'test':
        endpoint = 'https://app.x-growth.tech/send-message';
        payload = {
          ...payload,
          message: 'اختبار الاتصال من StarCity Folio',
          footer: 'رسالة اختبار'
        };
        break;
        
      default:
        return {
          status: false,
          message: 'نوع رسالة غير مدعوم',
          error: `Unsupported message type: ${type}`
        };
    }

    return this.makeDirectAPICall(endpoint, payload);
  }

  async testConnection(apiKey: string, sender: string): Promise<WhatsAppResponse> {
    return this.sendMessage({
      type: 'test',
      data: {
        api_key: apiKey,
        sender,
        number: '+971522001189', // رقم المستخدم للاختبار
        message: 'اختبار الاتصال من StarCity Folio'
      }
    });
  }
}

// Create singleton instance
const whatsappDirectSender = new WhatsAppDirectSender();

export default whatsappDirectSender;

// Export specific methods for easier use
export const sendWhatsAppMessage = (messageData: WhatsAppMessage) => 
  whatsappDirectSender.sendMessage(messageData);

export const testWhatsAppConnection = (apiKey: string, sender: string) => 
  whatsappDirectSender.testConnection(apiKey, sender);