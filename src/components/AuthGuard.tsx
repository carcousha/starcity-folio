import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  // حماية بسيطة بدون loops
  useEffect(() => {
    const isLoginPage = location.pathname === '/';
    
    // فقط إعادة التوجيه إذا لم يكن في صفحة تسجيل الدخول وليس هناك session
    if (!isLoginPage && !loading && !session) {
      console.log('AuthGuard: No session, redirecting to login');
      navigate('/', { replace: true });
    }
  }, [session, loading, location.pathname, navigate]);

  // إذا كانت صفحة تسجيل الدخول، اعرضها
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  // إذا كان التحميل جاري، أظهر شاشة تحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // حماية بسيطة: لا session = منع
  if (!session || !user) {
    return null; // سيتم التعامل معه في useEffect
  }

  return <>{children}</>;
};