import React, { createContext, useContext, useEffect } from 'react';
import { useAudioNotifications } from '@/hooks/useAudioNotifications';
import { useNotifications } from '@/hooks/useNotifications';

interface AudioNotificationContextType {
  playNewTaskSound: () => void;
  playDeadlineSound: () => void;
  playCommissionSound: () => void;
  playDebtReminderSound: () => void;
  playGeneralNotificationSound: (message: string) => void;
  isPlaying: boolean;
  settings: any;
  updateSettings: (settings: any) => void;
}

const AudioNotificationContext = createContext<AudioNotificationContextType | undefined>(undefined);

export const useAudioNotificationContext = () => {
  const context = useContext(AudioNotificationContext);
  if (!context) {
    throw new Error('useAudioNotificationContext must be used within AudioNotificationProvider');
  }
  return context;
};

interface AudioNotificationProviderProps {
  children: React.ReactNode;
}

export const AudioNotificationProvider: React.FC<AudioNotificationProviderProps> = ({ children }) => {
  const audioNotifications = useAudioNotifications();
  const { notifications } = useNotifications();

  // مراقبة التنبيهات الجديدة وتشغيل الأصوات المناسبة
  useEffect(() => {
    if (notifications.length === 0) return;

    const latestNotification = notifications[0];
    
    // تحديد نوع الصوت بناءً على نوع التنبيه
    switch (latestNotification.type) {
      case 'rental_due':
        audioNotifications.playDeadlineSound();
        break;
      case 'contract_expiry':
        audioNotifications.playGeneralNotificationSound('تذكير: عقد قارب على الانتهاء');
        break;
      case 'government_service':
        audioNotifications.playGeneralNotificationSound('تحديث في خدمة حكومية');
        break;
      case 'debt_payment':
        audioNotifications.playDebtReminderSound();
        break;
      case 'system':
      default:
        audioNotifications.playGeneralNotificationSound(latestNotification.message || 'تنبيه جديد');
        break;
    }
  }, [notifications, audioNotifications]);

  return (
    <AudioNotificationContext.Provider value={audioNotifications}>
      {children}
    </AudioNotificationContext.Provider>
  );
};