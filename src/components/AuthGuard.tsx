import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard - طبقة حماية صارمة على مستوى التطبيق
 * تضمن عدم وصول أي زائر غير مسجل لأي محتوى داخلي
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, session, profile, loading } = useAuth();
  const location = useLocation();

  // حماية فورية عند تغيير المسار
  useEffect(() => {
    const isLoginPage = location.pathname === '/';
    
    if (!loading && !isLoginPage) {
      if (!session || !user || !profile) {
        console.log('AuthGuard: Unauthorized access detected, redirecting immediately');
        window.location.href = '/';
        return;
      }
      
      // فحص إضافي للتأكد من صحة البيانات
      if (!profile.is_active) {
        console.log('AuthGuard: Inactive user detected, redirecting');
        window.location.href = '/';
        return;
      }
    }
  }, [loading, session, user, profile, location.pathname]);

  // فحص دوري مشدد للتأكد من صحة الجلسة
  useEffect(() => {
    if (location.pathname === '/') return;

    const checkAuthStrict = () => {
      if (!session || !user || !profile) {
        console.log('AuthGuard: Periodic check failed, redirecting');
        window.location.href = '/';
      }
    };

    // فحص كل 15 ثانية للحماية المشددة
    const interval = setInterval(checkAuthStrict, 15000);
    
    return () => clearInterval(interval);
  }, [session, user, profile, location.pathname]);

  // إذا كانت صفحة تسجيل الدخول، اعرضها
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  // إذا كان التحميل جاري، أظهر شاشة تحميل فقط
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  // حماية مطلقة: لا جلسة أو مستخدم أو profile = منع كامل
  if (!session || !user || !profile) {
    window.location.href = '/';
    return null;
  }

  // فحص إضافي: المستخدم غير نشط
  if (!profile.is_active) {
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
};