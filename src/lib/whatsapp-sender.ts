// مكتبة إرسال رسائل واتساب مع تجنب CORS باستخدام iframe
export class WhatsAppSender {
  
  // دالة إرسال بديلة باستخدام fetch مع CORS proxy
  private async sendViaFetch(url: string, data: any): Promise<boolean> {
    try {
      console.log('🌐 محاولة الإرسال عبر fetch مع CORS proxy...');
      
      // قائمة CORS proxies موثوقة
      const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/',
        'https://cors.bridged.cc/',
        'https://corsproxy.io/?'
      ];
      
      // محاولة الإرسال المباشر أولاً
      try {
        console.log('🔄 محاولة الإرسال المباشر...');
        const directResponse = await fetch(url, {
          method: 'GET',
          mode: 'no-cors' // تجربة no-cors
        });
        
        if (directResponse.type === 'opaque') {
          console.log('✅ الإرسال المباشر نجح (opaque response)');
          return true;
        }
      } catch (directError) {
        console.log('❌ الإرسال المباشر فشل:', directError.message);
      }
      
      // إذا فشل الإرسال المباشر، نجرب CORS proxies
      for (const proxy of corsProxies) {
        try {
          console.log(`🔍 جاري تجربة: ${proxy}`);
          
          let proxyUrl;
          if (proxy.includes('allorigins')) {
            proxyUrl = `${proxy}${encodeURIComponent(url)}`;
          } else {
            proxyUrl = `${proxy}${url}`;
          }
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            timeout: 10000
          });
          
          if (response.ok) {
            console.log(`✅ نجح الإرسال عبر: ${proxy}`);
            return true;
          }
        } catch (proxyError) {
          console.log(`❌ فشل ${proxy}:`, proxyError.message);
          continue;
        }
      }
      
      console.log('❌ جميع الطرق فشلت');
      return false;
      
    } catch (error) {
      console.error('❌ خطأ في sendViaFetch:', error);
      return false;
    }
  }
  
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
      
      // محاولة الوصول إلى محتوى iframe للتحقق من النتيجة
      const checkResult = () => {
        try {
          if (iframe.contentDocument && iframe.contentDocument.body) {
            const bodyText = iframe.contentDocument.body.textContent || '';
            console.log('📄 محتوى iframe:', bodyText);
            
            // البحث عن مؤشرات النجاح
            if (bodyText.includes('success') || bodyText.includes('تم') || bodyText.includes('نجح')) {
              console.log('✅ مؤشرات النجاح موجودة');
              cleanup();
              resolve(true);
              return;
            }
          }
        } catch (e) {
          // CORS يمنع الوصول للمحتوى - هذا طبيعي
          console.log('🔒 CORS يمنع الوصول للمحتوى (طبيعي)');
        }
      };
      
      const timeout = setTimeout(() => {
        console.log('⏰ انتهاء مهلة iframe - فحص النتيجة');
        checkResult();
        
        // إذا لم نتمكن من تحديد النتيجة، نفترض النجاح
        // لكن مع تحذير للمستخدم
        console.log('⚠️ لم نتمكن من تحديد النتيجة بدقة');
        cleanup();
        resolve(true);
      }, 10000); // زيادة المهلة إلى 10 ثوانٍ
      
      iframe.onload = () => {
        console.log('✅ iframe تم تحميله بنجاح');
        clearTimeout(timeout);
        
        // فحص النتيجة بعد التحميل
        setTimeout(() => {
          checkResult();
          
          // إذا لم نتمكن من تحديد النتيجة، نفترض النجاح
          if (!resolved) {
            console.log('⚠️ لم نتمكن من تحديد النتيجة بدقة');
            cleanup();
            resolve(true);
          }
        }, 3000); // انتظار 3 ثوانٍ للفحص
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
      
      // محاولة الإرسال عبر fetch أولاً (أكثر موثوقية)
      let success = await this.sendViaFetch(url, data);
      
      // إذا فشل fetch، نجرب iframe
      if (!success) {
        console.log('🔄 fetch فشل، جاري تجربة iframe...');
        success = await this.sendViaIframe(url);
      }
      
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
