// Service Worker للتنبيهات
const CACHE_NAME = 'star-city-notifications-v1';

// تفعيل Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// التعامل مع الرسائل من التطبيق الرئيسي
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    showNotification(title, options);
  }
});

// عرض الإشعار
function showNotification(title, options = {}) {
  const defaultOptions = {
    body: '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'عرض',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'إغلاق',
        icon: '/favicon.ico'
      }
    ]
  };

  const notificationOptions = { ...defaultOptions, ...options };

  return self.registration.showNotification(title, notificationOptions);
}

// التعامل مع النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const { action, notification } = event;
  const { data } = notification;

  // إغلاق الإشعار
  notification.close();

  if (action === 'dismiss') {
    return;
  }

  // فتح التطبيق أو التركيز عليه
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // البحث عن نافذة مفتوحة للتطبيق
      const existingClient = clients.find(
        (client) => client.url.includes(self.location.origin) && 'focus' in client
      );

      if (existingClient) {
        // التركيز على النافذة الموجودة
        existingClient.focus();
        
        // إرسال رسالة للتطبيق الرئيسي للتنقل إذا كان هناك رابط
        if (data && data.url) {
          existingClient.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: data.url,
            notificationId: data.notificationId
          });
        }
      } else {
        // فتح نافذة جديدة
        const targetUrl = data && data.url 
          ? `${self.location.origin}${data.url}`
          : self.location.origin;
        
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// التعامل مع إغلاق الإشعار
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // يمكن إضافة تتبع للإحصائيات هنا
  const { notification } = event;
  const { data } = notification;
  
  if (data && data.notificationId) {
    // إرسال إحصائيات الإغلاق
    console.log(`Notification ${data.notificationId} was closed`);
  }
});

// التعامل مع الرسائل من الخادم (إذا كان هناك push notifications)
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, url, notificationId, priority } = data;

    const options = {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: notificationId || 'default',
      requireInteraction: priority === 'urgent',
      data: {
        url,
        notificationId
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

// التعامل مع الأخطاء
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event);
});