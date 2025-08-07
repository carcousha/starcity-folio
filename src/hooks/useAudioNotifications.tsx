import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AudioNotificationSettings {
  enabled: boolean;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  volume: number;
}

export const useAudioNotifications = () => {
  const [settings, setSettings] = useState<AudioNotificationSettings>({
    enabled: true,
    voice: 'alloy',
    volume: 0.7,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // تشغيل التنبيه الصوتي
  const playNotification = useCallback(async (text: string) => {
    if (!settings.enabled || isPlaying) {
      return;
    }

    try {
      setIsPlaying(true);
      console.log('Playing audio notification:', text);

      // استدعاء Edge Function لتحويل النص إلى صوت
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text,
          voice: settings.voice
        }
      });

      if (error) {
        console.error('TTS Error:', error);
        return;
      }

      if (data?.audioContent) {
        // تحويل base64 إلى blob وتشغيله
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mp3' });

        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }

        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = settings.volume;
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audioRef.current.play();
        console.log('Audio notification played successfully');
      }
    } catch (error) {
      console.error('Error playing audio notification:', error);
      setIsPlaying(false);
    }
  }, [settings, isPlaying]);

  // تشغيل أصوات التنبيهات المختلفة
  const playNewTaskSound = useCallback(() => {
    playNotification('لديك مهمة جديدة');
  }, [playNotification]);

  const playDeadlineSound = useCallback(() => {
    playNotification('تذكير: لديك مهمة قريبة الانتهاء');
  }, [playNotification]);

  const playCommissionSound = useCallback(() => {
    playNotification('تم إضافة عمولة جديدة');
  }, [playNotification]);

  const playDebtReminderSound = useCallback(() => {
    playNotification('تذكير: لديك دين مستحق');
  }, [playNotification]);

  const playGeneralNotificationSound = useCallback((message: string) => {
    playNotification(message);
  }, [playNotification]);

  // إيقاف التشغيل
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
    }
  }, []);

  // تحديث الإعدادات
  const updateSettings = useCallback((newSettings: Partial<AudioNotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    isPlaying,
    playNewTaskSound,
    playDeadlineSound,
    playCommissionSound,
    playDebtReminderSound,
    playGeneralNotificationSound,
    stopAudio,
    updateSettings,
  };
};