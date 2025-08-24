import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestAuth() {
  const [authStatus, setAuthStatus] = useState<string>('جاري التحقق...');
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. التحقق من الجلسة الحالية
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setAuthStatus(`خطأ في الجلسة: ${sessionError.message}`);
          return;
        }

        if (!session) {
          setAuthStatus('لا توجد جلسة نشطة');
          return;
        }

        setUserData(session.user);
        setAuthStatus(`المستخدم موجود: ${session.user.email}`);

        // 2. البحث عن الملف الشخصي
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          setAuthStatus(`خطأ في الملف الشخصي: ${profileError.message}`);
          return;
        }

        if (!profile) {
          setAuthStatus('الملف الشخصي غير موجود');
          return;
        }

        setProfileData(profile);
        setAuthStatus(`الملف الشخصي موجود: ${profile.first_name} ${profile.last_name} (${profile.role})`);

      } catch (error) {
        setAuthStatus(`خطأ غير متوقع: ${error}`);
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthStatus('تم تسجيل الخروج');
    setUserData(null);
    setProfileData(null);
  };

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl'
    }}>
      <h1>🧪 اختبار المصادقة</h1>
      
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h3>حالة المصادقة:</h3>
        <p>{authStatus}</p>
      </div>

      {userData && (
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h3>بيانات المستخدم:</h3>
          <pre>{JSON.stringify(userData, null, 2)}</pre>
        </div>
      )}

      {profileData && (
        <div style={{
          backgroundColor: '#dcfce7',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h3>الملف الشخصي:</h3>
          <pre>{JSON.stringify(profileData, null, 2)}</pre>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          العودة للصفحة الرئيسية
        </button>

        {userData && (
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            تسجيل الخروج
          </button>
        )}
      </div>
    </div>
  );
}
