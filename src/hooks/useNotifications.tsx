import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'rental_due' | 'contract_expiry' | 'government_service' | 'debt_payment' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  is_browser_sent: boolean;
  is_sound_played: boolean;
  related_table?: string;
  related_id?: string;
  scheduled_for?: string;
  sent_at?: string;
  read_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  browser_notifications: boolean;
  in_app_notifications: boolean;
  sound_notifications: boolean;
  sound_file: string;
  reminder_frequency: number;
  do_not_disturb_start?: string;
  do_not_disturb_end?: string;
  enabled_types: string[];
}

function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // طلب صلاحية الإشعارات
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
      return permission === 'granted';
    }

    return false;
  }, []);

  // تشغيل الصوت
  const playNotificationSound = useCallback((soundFile: string = 'ping') => {
    try {
      const audio = new Audio(`/sounds/${soundFile}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // فحص وقت عدم الإزعاج
  const isDoNotDisturbTime = useCallback((settings: NotificationSettings) => {
    if (!settings.do_not_disturb_start || !settings.do_not_disturb_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.do_not_disturb_start.split(':').map(Number);
    const [endHour, endMin] = settings.do_not_disturb_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // العبور عبر منتصف الليل
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, []);

  // عرض إشعار المتصفح
  const showBrowserNotification = useCallback(async (notification: SystemNotification) => {
    if (!hasPermission || !settings?.browser_notifications) return;
    
    if (isDoNotDisturbTime(settings)) return;

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      browserNotification.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        browserNotification.close();
      };

      // تحديث حالة الإرسال
      await supabase
        .from('system_notifications')
        .update({ 
          is_browser_sent: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);

    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, [hasPermission, settings, isDoNotDisturbTime]);

  // عرض Toast
  const showInAppNotification = useCallback((notification: SystemNotification) => {
    if (!settings?.in_app_notifications) return;
    
    if (isDoNotDisturbTime(settings)) return;

    const variant = {
      'low': 'default',
      'normal': 'default',
      'high': 'destructive',
      'urgent': 'destructive'
    }[notification.priority] as 'default' | 'destructive';

    toast({
      title: notification.title,
      description: notification.message,
      variant,
      duration: notification.priority === 'urgent' ? 0 : 5000
    });
  }, [settings, isDoNotDisturbTime]);

  // جلب التنبيهات
  const fetchNotifications = useCallback(async (retryCount = 0) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('user_id', user?.id as string)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        is_read: item.is_read,
        is_browser_sent: item.is_browser_sent,
        is_sound_played: item.is_sound_played,
        related_table: item?.related_table || null,
        related_id: item.related_id,
        scheduled_for: item.scheduled_for,
        sent_at: item.sent_at,
        read_at: item.read_at,
        metadata: item.metadata,
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: (item as any).type as SystemNotification['type'],
        priority: (item as any).priority as SystemNotification['priority']
      }));

      setNotifications(typedData);
      
      // حساب غير المقروءة
      const unread = typedData?.filter(n => !n.is_read && 
        (!n.scheduled_for || new Date(n.scheduled_for) <= new Date())
      ).length || 0;
      
      setUnreadCount(unread);
    } catch (error) {
      console.log('Notifications fetch error:', error?.message || error);
      
      // إعادة المحاولة في حالة فشل الشبكة
      if (retryCount < 2 && (error instanceof TypeError || error?.message?.includes('fetch'))) {
        console.log(`Retrying fetchNotifications... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchNotifications(retryCount + 1), 1000 * (retryCount + 1));
      }
    }
  }, [user]);

  // جلب الإعدادات
  const fetchSettings = useCallback(async (retryCount = 0) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const typedSettings: NotificationSettings = {
          browser_notifications: data.browser_notifications,
          in_app_notifications: data.in_app_notifications,
          sound_notifications: data.sound_notifications,
          sound_file: data.sound_file,
          reminder_frequency: data.reminder_frequency,
          do_not_disturb_start: data.do_not_disturb_start,
          do_not_disturb_end: data.do_not_disturb_end,
          enabled_types: data.enabled_types 
            ? (Array.isArray(data.enabled_types) 
                ? data.enabled_types as string[]
                : JSON.parse(data.enabled_types as string))
            : ['rental_due', 'contract_expiry', 'government_service', 'debt_payment']
        };
        setSettings(typedSettings);
      } else {
        // إنشاء إعدادات افتراضية
        const defaultSettings = {
          user_id: user.id,
          browser_notifications: true,
          in_app_notifications: true,
          sound_notifications: true,
          sound_file: 'ping',
          reminder_frequency: 60,
          enabled_types: JSON.stringify(['rental_due', 'contract_expiry', 'government_service', 'debt_payment'])
        };

        const { data: newSettings, error: createError } = await supabase
          .from('user_notification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) throw createError;
        
        const typedNewSettings: NotificationSettings = {
          browser_notifications: newSettings.browser_notifications,
          in_app_notifications: newSettings.in_app_notifications,
          sound_notifications: newSettings.sound_notifications,
          sound_file: newSettings.sound_file,
          reminder_frequency: newSettings.reminder_frequency,
          do_not_disturb_start: newSettings.do_not_disturb_start,
          do_not_disturb_end: newSettings.do_not_disturb_end,
          enabled_types: newSettings.enabled_types 
            ? (Array.isArray(newSettings.enabled_types) 
                ? newSettings.enabled_types as string[]
                : JSON.parse(newSettings.enabled_types as string))
            : ['rental_due', 'contract_expiry', 'government_service', 'debt_payment']
        };
        setSettings(typedNewSettings);
      }
    } catch (error) {
      console.log('Notification settings fetch error:', error?.message || error);
      
      // إعادة المحاولة في حالة فشل الشبكة
      if (retryCount < 2 && (error instanceof TypeError || error?.message?.includes('fetch'))) {
        console.log(`Retrying fetchSettings... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchSettings(retryCount + 1), 1000 * (retryCount + 1));
      }
    }
  }, [user]);

  // تحديث الإعدادات
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!user || !settings) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .update(newSettings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      const typedUpdatedSettings: NotificationSettings = {
        browser_notifications: data.browser_notifications,
        in_app_notifications: data.in_app_notifications,
        sound_notifications: data.sound_notifications,
        sound_file: data.sound_file,
        reminder_frequency: data.reminder_frequency,
        do_not_disturb_start: data.do_not_disturb_start,
        do_not_disturb_end: data.do_not_disturb_end,
        enabled_types: data.enabled_types 
          ? (Array.isArray(data.enabled_types) 
              ? data.enabled_types as string[]
              : JSON.parse(data.enabled_types as string))
          : ['rental_due', 'contract_expiry', 'government_service', 'debt_payment']
      };
      setSettings(typedUpdatedSettings);
    } catch (error) {
      console.log('Notification settings update error:', error?.message || error);
      throw error;
    }
  }, [user, settings]);

  // وضع علامة كمقروء
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.log('Mark as read error:', error?.message || error);
    }
  }, []);

  // وضع علامة على الكل كمقروء
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.log('Mark all as read error:', error?.message || error);
    }
  }, [user]);

  // إنشاء تنبيه جديد
  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: SystemNotification['type'],
    priority: SystemNotification['priority'] = 'normal',
    relatedTable?: string,
    relatedId?: string,
    scheduledFor?: Date,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('create_system_notification', {
        p_user_id: user.id,
        p_title: title,
        p_message: message,
        p_type: type,
        p_priority: priority,
        p_related_table: relatedTable,
        p_related_id: relatedId,
        p_scheduled_for: scheduledFor?.toISOString(),
        p_metadata: metadata || {}
      });

      if (error) throw error;

      // تحديث القائمة
      await fetchNotifications();
      
      return data;
    } catch (error) {
      console.log('Create notification error:', error?.message || error);
      throw error;
    }
  }, [user, fetchNotifications]);

  // معالجة التنبيهات الجديدة
  const processNewNotifications = useCallback((newNotifications: SystemNotification[]) => {
    if (!settings) return;

    newNotifications.forEach(notification => {
      // فحص نوع التنبيه مفعل
      if (!settings.enabled_types.includes(notification.type)) return;

      // عرض في التطبيق
      if (settings.in_app_notifications) {
        showInAppNotification(notification);
      }

      // عرض في المتصفح
      if (settings.browser_notifications && hasPermission) {
        showBrowserNotification(notification);
      }

      // تشغيل الصوت
      if (settings.sound_notifications && !notification.is_sound_played) {
        playNotificationSound(settings.sound_file);
        
        // تحديث حالة الصوت
        supabase
          .from('system_notifications')
          .update({ is_sound_played: true })
          .eq('id', notification.id)
          .then(() => {});
      }
    });
  }, [settings, hasPermission, showInAppNotification, showBrowserNotification, playNotificationSound]);

  // الاستماع للتحديثات المباشرة
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('system_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: SystemNotification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type as SystemNotification['type'],
            priority: payload.new.priority as SystemNotification['priority'],
            is_read: payload.new.is_read,
            is_browser_sent: payload.new.is_browser_sent,
            is_sound_played: payload.new.is_sound_played,
            related_table: payload.new.related_table,
            related_id: payload.new.related_id,
            scheduled_for: payload.new.scheduled_for,
            sent_at: payload.new.sent_at,
            read_at: payload.new.read_at,
            metadata: payload.new.metadata,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // معالجة التنبيه الجديد
          processNewNotifications([newNotification]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, processNewNotifications]);

  // التحميل الأولي
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchNotifications(),
        fetchSettings(),
        requestNotificationPermission()
      ]);
      setLoading(false);
    };

    init();
  }, [user, fetchNotifications, fetchSettings, requestNotificationPermission]);

  // التذكير الدوري
  useEffect(() => {
    if (!settings || !user) return;

    const interval = setInterval(async () => {
      if (unreadCount > 0 && !isDoNotDisturbTime(settings)) {
        const message = `لديك ${unreadCount} تنبيه${unreadCount > 1 ? 'ات' : ''} غير مقروء${unreadCount > 1 ? 'ة' : ''}`;
        
        if (settings.in_app_notifications) {
          toast({
            title: "تذكير",
            description: message,
            duration: 5000
          });
        }

        if (settings.sound_notifications) {
          playNotificationSound(settings.sound_file);
        }
      }
    }, settings.reminder_frequency * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings, unreadCount, isDoNotDisturbTime, playNotificationSound]);

  return {
    notifications,
    unreadCount,
    settings,
    loading,
    hasPermission,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    updateSettings,
    requestNotificationPermission
  };
}

export { useNotifications };