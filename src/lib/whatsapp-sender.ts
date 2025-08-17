// مكتبة إرسال رسائل واتساب مع تجنب CORS باستخدام iframe
export class WhatsAppSender {
  
  // دالة إرسال بديلة باستخدام fetch مع CORS proxy موثوق
  private async sendViaFetch(url: string, data: any): Promise<boolean> {
    try {
      console.log('🌐 محاولة الإرسال عبر fetch مع CORS proxy...');
      
      // CORS proxy موثوق واحد فقط
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      
      try {
        console.log('🔄 محاولة الإرسال عبر CORS proxy...');
        const proxyUrl = `${corsProxy}${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          timeout: 15000
        });
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('📥 استجابة من CORS proxy:', responseText);
          
          // البحث عن مؤشرات النجاح
          if (responseText.includes('success') || responseText.includes('تم') || responseText.includes('نجح')) {
            console.log('✅ مؤشرات النجاح موجودة في الاستجابة');
            return true;
          } else {
            console.log('❌ لا توجد مؤشرات نجاح في الاستجابة');
            return false;
          }
        } else {
          console.log('❌ CORS proxy فشل:', response.status);
          return false;
        }
      } catch (proxyError) {
        console.log('❌ خطأ في CORS proxy:', proxyError.message);
        return false;
      }
      
    } catch (error) {
      console.error('❌ خطأ في sendViaFetch:', error);
      return false;
    }
  }
  
  // إرسال رسالة باستخدام CORS Proxy (الحل الأكثر موثوقية)
  private async sendViaIframe(url: string): Promise<boolean> {
    try {
      console.log('🚀 محاولة الإرسال عبر CORS Proxy...');
      
      // استخدام CORS Proxy موثوق
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const proxyUrl = `${corsProxy}${encodeURIComponent(url)}`;
      
      console.log('🌐 CORS Proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        timeout: 15000
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('📥 استجابة من CORS Proxy:', responseText.substring(0, 200));
        
        // البحث عن مؤشرات النجاح
        if (responseText.includes('success') || responseText.includes('تم') || responseText.includes('نجح')) {
          console.log('✅ مؤشرات النجاح موجودة');
          return true;
        } else {
          console.log('❌ لا توجد مؤشرات نجاح واضحة');
          return false;
        }
      } else {
        console.log('❌ CORS Proxy فشل:', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ خطأ في CORS Proxy:', error);
      return false;
    }
  }

  // إرسال رسالة نصية
  async sendTextMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    message: string;
    footer?: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      console.log('📤 إرسال رسالة نصية:', {
        api_key: data.api_key.substring(0, 10) + '...',
        sender: data.sender,
        number: data.number,
        message: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
        footer: data.footer || ''
      });
      
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || ''
      });
      
      const url = `https://app.x-growth.tech/send-message?${params.toString()}`;
      console.log('🌐 URL الإرسال:', url);
      
      // استخدام CORS Proxy مباشرة (الحل الأكثر موثوقية)
      let success = await this.sendViaIframe(url);
      
      if (success) {
        console.log('✅ تم إرسال الرسالة بنجاح');
        return {
          status: true,
          message: 'تم إرسال الرسالة بنجاح'
        };
      } else {
        console.log('❌ فشل في إرسال الرسالة');
        return {
          status: false,
          message: 'فشل في إرسال الرسالة - جرب مرة أخرى'
        };
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة النصية:', error);
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
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        media_type: data.media_type,
        url: data.url,
        caption: data.caption || '',
        footer: data.footer || ''
      });
      
      const url = `https://app.x-growth.tech/send-media?${params.toString()}`;
      const success = await this.sendViaIframe(url);
      
      return {
        status: success,
        message: success ? 'تم إرسال الوسائط بنجاح' : 'فشل في إرسال الوسائط'
      };
    } catch (error) {
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
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        url: data.url
      });
      
      const url = `https://app.x-growth.tech/send-sticker?${params.toString()}`;
      const success = await this.sendViaIframe(url);
      
      return {
        status: success,
        message: success ? 'تم إرسال الملصق بنجاح' : 'فشل في إرسال الملصق'
      };
    } catch (error) {
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
      // للاستطلاعات نحتاج POST، لذا سنستخدم form submission
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://app.x-growth.tech/send-poll';
      form.target = '_blank';
      form.style.display = 'none';
      
      const fields = {
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        name: data.name,
        countable: data.countable
      };
      
      // إضافة الحقول العادية
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      // إضافة خيارات الاستطلاع
      data.option.forEach((option, index) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = `option[${index}]`;
        input.value = option;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      return {
        status: true,
        message: 'تم إرسال الاستطلاع بنجاح'
      };
    } catch (error) {
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
      // للأزرار نحتاج POST أيضاً
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://app.x-growth.tech/send-button';
      form.target = '_blank';
      form.style.display = 'none';
      
      const fields = {
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || '',
        url: data.url || ''
      };
      
      // إضافة الحقول العادية
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      // إضافة الأزرار
      const buttonInput = document.createElement('input');
      buttonInput.type = 'hidden';
      buttonInput.name = 'button';
      buttonInput.value = JSON.stringify(data.button);
      form.appendChild(buttonInput);
      
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      return {
        status: true,
        message: 'تم إرسال الرسالة بالأزرار بنجاح'
      };
    } catch (error) {
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
  }): Promise<{ status: boolean; message: string }> {
    try {
      // للقوائم نحتاج POST أيضاً
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://app.x-growth.tech/send-list';
      form.target = '_blank';
      form.style.display = 'none';
      
      const fields = {
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || ''
      };
      
      // إضافة الحقول العادية
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      // إضافة القائمة
      const listInput = document.createElement('input');
      listInput.type = 'hidden';
      listInput.name = 'list';
      listInput.value = JSON.stringify(data.list);
      form.appendChild(listInput);
      
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      return {
        status: true,
        message: 'تم إرسال القائمة بنجاح'
      };
    } catch (error) {
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال القائمة'
      };
    }
  }

  // اختبار الاتصال
    async testConnection(data: {
    api_key: string;
    sender: string;
  }): Promise<{ status: boolean; message: string; api_status: string }> {
    try {
      console.log('🔍 اختبار الاتصال بـ x-growth.tech...');
      console.log('📋 البيانات:', {
        api_key: data.api_key.substring(0, 10) + '...',
        sender: data.sender
      });
  
      // استخدام نقطة النهاية الصحيحة لاختبار الاتصال
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: '+971501234567',
        message: 'اختبار الاتصال'
      });
      
      // استخدام send-message بدلاً من test-connection
      const url = `https://app.x-growth.tech/send-message?${params.toString()}`;
      console.log('🌐 URL الاختبار:', url);
      
      // استخدام CORS Proxy مباشرة
      const success = await this.sendViaIframe(url);
      console.log('✅ نتيجة الاختبار:', success);
      
      return {
        status: success,
        message: success ? 'تم الاتصال بنجاح' : 'فشل في الاتصال',
        api_status: success ? 'connected' : 'disconnected'
      };
    } catch (error) {
      console.error('❌ خطأ في اختبار الاتصال:', error);
      return {
        status: false,
        message: 'حدث خطأ أثناء اختبار الاتصال',
        api_status: 'error'
      };
    }
  }
}

export const whatsappSender = new WhatsAppSender();
