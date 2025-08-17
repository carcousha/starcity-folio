// مكتبة إرسال رسائل واتساب عبر Edge Function
export class WhatsAppSender {
  
  private supabaseUrl: string;
  private anonKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.anonKey) {
      console.error('Supabase configuration missing');
    }
  }

  // إرسال رسالة نصية
  async sendTextMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    message: string;
    footer?: string;
  }): Promise<{ status: boolean; message: string; data?: any }> {
    try {
      console.log('إرسال رسالة نصية:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          data: {
            api_key: data.api_key,
            sender: data.sender,
            number: data.number,
            message: data.message,
            footer: data.footer || ''
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('استجابة API:', result);
      
      return {
        status: result.status,
        message: result.message || 'تم إرسال الرسالة بنجاح',
        data: result.data
      };
    } catch (error) {
      console.error('خطأ في إرسال الرسالة النصية:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال الرسالة'
      };
    }
  }

  // إرسال وسائط
  async sendMediaMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    media_type: string;
    url: string;
    caption?: string;
    footer?: string;
  }): Promise<{ status: boolean; message: string; data?: any }> {
    try {
      console.log('إرسال وسائط:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'media',
          data: {
            api_key: data.api_key,
            sender: data.sender,
            number: data.number,
            media_type: data.media_type,
            url: data.url,
            caption: data.caption || '',
            footer: data.footer || ''
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('استجابة API:', result);
      
      return {
        status: result.status,
        message: result.message || 'تم إرسال الوسائط بنجاح',
        data: result.data
      };
    } catch (error) {
      console.error('خطأ في إرسال الوسائط:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال الوسائط'
      };
    }
  }

  // إرسال ملصق
  async sendStickerMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    url: string;
  }): Promise<{ status: boolean; message: string; data?: any }> {
    try {
      console.log('إرسال ملصق:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sticker',
          data: {
            api_key: data.api_key,
            sender: data.sender,
            number: data.number,
            url: data.url
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('استجابة API:', result);
      
      return {
        status: result.status,
        message: result.message || 'تم إرسال الملصق بنجاح',
        data: result.data
      };
    } catch (error) {
      console.error('خطأ في إرسال الملصق:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال الملصق'
      };
    }
  }

  // إرسال استطلاع
  async sendPollMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    name: string;
    option: string[];
    countable: boolean;
  }): Promise<{ status: boolean; message: string; data?: any }> {
    try {
      console.log('إرسال استطلاع:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'poll',
          data: {
            api_key: data.api_key,
            sender: data.sender,
            number: data.number,
            poll_name: data.name,
            poll_options: data.option,
            poll_countable: data.countable
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('استجابة API:', result);
      
      return {
        status: result.status,
        message: result.message || 'تم إرسال الاستطلاع بنجاح',
        data: result.data
      };
    } catch (error) {
      console.error('خطأ في إرسال الاستطلاع:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال الاستطلاع'
      };
    }
  }

  // إرسال رسالة بأزرار
  async sendButtonMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    message: string;
    button: any[];
    footer?: string;
    url?: string;
  }): Promise<{ status: boolean; message: string; data?: any }> {
    try {
      console.log('إرسال رسالة بأزرار:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'button',
          data: {
            api_key: data.api_key,
            sender: data.sender,
            number: data.number,
            message: data.message,
            button: data.button,
            footer: data.footer || '',
            url: data.url || ''
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('استجابة API:', result);
      
      return {
        status: result.status,
        message: result.message || 'تم إرسال الرسالة بالأزرار بنجاح',
        data: result.data
      };
    } catch (error) {
      console.error('خطأ في إرسال الرسالة بالأزرار:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال الرسالة'
      };
    }
  }

  // إرسال رسالة قائمة
  async sendListMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    message: string;
    list: any[];
    footer?: string;
  }): Promise<{ status: boolean; message: string; data?: any }> {
    try {
      console.log('إرسال رسالة قائمة:', data);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'list',
          data: {
            api_key: data.api_key,
            sender: data.sender,
            number: data.number,
            message: data.message,
            list: data.list,
            footer: data.footer || ''
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('استجابة API:', result);
      
      return {
        status: result.status,
        message: result.message || 'تم إرسال القائمة بنجاح',
        data: result.data
      };
    } catch (error) {
      console.error('خطأ في إرسال القائمة:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال القائمة'
      };
    }
  }

  // اختبار الاتصال
  async testConnection(): Promise<{ status: boolean; message: string; data?: any }> {
    try {
      console.log('اختبار الاتصال بـ WhatsApp API');
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-api?test-connection=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          data: {
            api_key: 'test',
            sender: 'test',
            number: '+971501234567',
            message: 'اختبار الاتصال'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('نتيجة اختبار الاتصال:', result);
      
      return {
        status: result.status,
        message: result.message,
        data: result.data
      };
    } catch (error) {
      console.error('خطأ في اختبار الاتصال:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء اختبار الاتصال'
      };
    }
  }
}

export const whatsappSender = new WhatsAppSender();
