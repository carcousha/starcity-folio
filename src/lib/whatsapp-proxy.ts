import { WhatsAppApiResponse, SendMessageRequest } from '@/types/whatsapp';

export class WhatsAppProxy {
  private static instance: WhatsAppProxy;
  private constructor() {}

  public static getInstance(): WhatsAppProxy {
    if (!WhatsAppProxy.instance) {
      WhatsAppProxy.instance = new WhatsAppProxy();
    }
    return WhatsAppProxy.instance;
  }

  public async sendMessage(data: SendMessageRequest): Promise<WhatsAppApiResponse> {
    return new Promise((resolve) => {
      // بناء URL مع المعاملات
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || "Sent via StarCity Folio"
      });

      const url = `https://app.x-growth.tech/send-message?${params.toString()}`;

      // إنشاء iframe مخفي
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';

      document.body.appendChild(iframe);

      // تعيين URL للـ iframe
      iframe.src = url;

      // انتظار 3 ثوانٍ ثم افتراض النجاح (بناءً على تجربة المستخدم السابقة)
      setTimeout(() => {
        // إزالة الـ iframe
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }

        // بناءً على تجربة المستخدم، الرسائل تصل فعلاً
        // لذا نعتبر الإرسال ناجح مع تحذير حول CORS
        resolve({
          status: true,
          message: 'تم إرسال الطلب بنجاح. تحقق من واتساب للتأكد من وصول الرسالة. (ملاحظة: لا يمكن التأكد من النتيجة بسبب قيود المتصفح)'
        });
      }, 3000);

      // معالجة الأخطاء
      iframe.onerror = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve({
          status: false,
          message: 'فشل في تحميل صفحة الإرسال'
        });
      };
    });
  }

  // طريقة بديلة باستخدام fetch مع no-cors
  public async sendMessageAlternative(data: SendMessageRequest): Promise<WhatsAppApiResponse> {
    try {
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || "Sent via StarCity Folio"
      });

      const url = `https://app.x-growth.tech/send-message?${params.toString()}`;

      // محاولة fetch مع no-cors
      const response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json'
        }
      });

      // مع no-cors، لا يمكن قراءة الاستجابة
      // لكن بناءً على تجربة المستخدم، الرسائل تصل
      return {
        status: true,
        message: 'تم إرسال الطلب. تحقق من واتساب للتأكد من وصول الرسالة.'
      };

    } catch (error) {
      console.error('Alternative method failed:', error);
      return {
        status: false,
        message: 'فشل في إرسال الرسالة: ' + (error instanceof Error ? error.message : 'خطأ غير معروف')
      };
    }
  }

  // طريقة ثالثة باستخدام XMLHttpRequest
  public async sendMessageXHR(data: SendMessageRequest): Promise<WhatsAppApiResponse> {
    return new Promise((resolve) => {
      const params = new URLSearchParams({
        api_key: data.api_key,
        sender: data.sender,
        number: data.number,
        message: data.message,
        footer: data.footer || "Sent via StarCity Folio"
      });

      const url = `https://app.x-growth.tech/send-message?${params.toString()}`;

      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              status: response.status === true,
              message: response.msg || response.message || 'تم إرسال الرسالة بنجاح'
            });
          } catch {
            // إذا لم نتمكن من قراءة JSON، نفترض النجاح
            resolve({
              status: true,
              message: 'تم إرسال الطلب. تحقق من واتساب للتأكد من وصول الرسالة.'
            });
          }
        } else {
          resolve({
            status: false,
            message: `خطأ في الاستجابة: ${xhr.status}`
          });
        }
      };

      xhr.onerror = function() {
        resolve({
          status: false,
          message: 'فشل في الاتصال بالخادم'
        });
      };

      xhr.ontimeout = function() {
        resolve({
          status: false,
          message: 'انتهت مهلة الاتصال'
        });
      };

      xhr.timeout = 10000; // 10 ثوانٍ
      xhr.send();
    });
  }
}
