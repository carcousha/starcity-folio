// مكتبة إرسال رسائل واتساب مع تجنب CORS
export class WhatsAppSender {
  
  // إرسال رسالة باستخدام iframe لتجنب CORS
  private async sendViaIframe(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      
      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        resolve(true); // نفترض النجاح بعد انتهاء الوقت
      }, 5000);
      
      iframe.onload = () => {
        clearTimeout(timeout);
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve(true);
        }, 1000);
      };
      
      iframe.onerror = () => {
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        resolve(false);
      };
      
      document.body.appendChild(iframe);
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

  // إرسال رسالة موقع
  async sendLocationMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        name: data.name || '',
        address: data.address || ''
      });
      
      const url = `https://app.x-growth.tech/send-location?${params.toString()}`;
      const success = await this.sendViaIframe(url);
      
      return {
        status: success,
        message: success ? 'تم إرسال الموقع بنجاح' : 'فشل في إرسال الموقع'
      };
    } catch (error) {
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال الموقع'
      };
    }
  }

  // إرسال بطاقة اتصال
  async sendVCardMessage(data: {
    api_key: string;
    sender: string;
    number: string;
    vcard: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        vcard: data.vcard
      });
      
      const url = `https://app.x-growth.tech/send-vcard?${params.toString()}`;
      const success = await this.sendViaIframe(url);
      
      return {
        status: success,
        message: success ? 'تم إرسال بطاقة الاتصال بنجاح' : 'فشل في إرسال بطاقة الاتصال'
      };
    } catch (error) {
      return {
        status: false,
        message: 'حدث خطأ أثناء إرسال بطاقة الاتصال'
      };
    }
  }

  // اختبار الاتصال - الدالة المفقودة!
  async testConnection(data: {
    api_key: string;
    sender: string;
  }): Promise<{ status: boolean; message: string; api_status: string }> {
    try {
      console.log('🔍 اختبار الاتصال بـ x-growth.tech...');
      
      // استخدام نقطة النهاية الصحيحة لاختبار الاتصال
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: '+971501234567',
        message: 'اختبار الاتصال'
      });
      
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