// مكتبة إرسال رسائل واتساب مع تجنب CORS
export class WhatsAppSender {
  
  // إرسال رسالة نصية
  async sendTextMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    message: string;
    footer?: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      console.log('إرسال رسالة نصية:', data);
      
      // استخدام Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
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
        message: result.message || 'تم إرسال الرسالة بنجاح'
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
  }): Promise<{ status: boolean; message: string }> {
    try {
      console.log('إرسال وسائط:', data);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
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
        message: result.message || 'تم إرسال الوسائط بنجاح'
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
  }): Promise<{ status: boolean; message: string }> {
    try {
      console.log('إرسال ملصق:', data);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
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
        message: result.message || 'تم إرسال الملصق بنجاح'
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
    countable: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      console.log('إرسال استطلاع:', data);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'poll',
          data: {
            api_key: data.api_key,
            sender: data.sender,
            number: data.number,
            name: data.name,
            option: data.option,
            countable: data.countable
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
        message: result.message || 'تم إرسال الاستطلاع بنجاح'
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
  }): Promise<{ status: boolean; message: string }> {
    try {
      console.log('إرسال رسالة بأزرار:', data);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
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
        message: result.message || 'تم إرسال الرسالة بالأزرار بنجاح'
      };
    } catch (error) {
      console.error('خطأ في إرسال الرسالة بالأزرار:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال الرسالة'
      };
    }
  }
}

export const whatsappSender = new WhatsAppSender();