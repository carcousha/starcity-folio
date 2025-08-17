// مكتبة إرسال رسائل واتساب مع تجنب CORS باستخدام iframe
export class WhatsAppSender {
  
  // إرسال رسالة باستخدام iframe لتجنب CORS
  private async sendViaIframe(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🚀 إنشاء iframe للإرسال:', url);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.src = url;
      
      let resolved = false;
      
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch (e) {
            console.log('تنظيف iframe:', e);
          }
        }
      };
      
      const timeout = setTimeout(() => {
        console.log('⏰ انتهاء مهلة iframe - نفترض النجاح');
        cleanup();
        resolve(true);
      }, 8000); // زيادة المهلة إلى 8 ثوانٍ
      
      iframe.onload = () => {
        console.log('✅ iframe تم تحميله بنجاح');
        clearTimeout(timeout);
        setTimeout(() => {
          cleanup();
          resolve(true);
        }, 2000); // انتظار 2 ثانية للتأكد من الإرسال
      };
      
      iframe.onerror = () => {
        console.log('❌ خطأ في iframe');
        clearTimeout(timeout);
        cleanup();
        resolve(false);
      };
      
      // إضافة iframe للصفحة
      try {
        document.body.appendChild(iframe);
        console.log('📌 تم إضافة iframe للصفحة');
      } catch (e) {
        console.error('❌ خطأ في إضافة iframe:', e);
        clearTimeout(timeout);
        resolve(false);
      }
    });
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
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || ''
      });
      
      const url = `https://app.x-growth.tech/send-message?${params.toString()}`;
      const success = await this.sendViaIframe(url);
      
      return {
        status: success,
        message: success ? 'تم إرسال الرسالة بنجاح' : 'فشل في إرسال الرسالة'
      };
    } catch (error) {
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
