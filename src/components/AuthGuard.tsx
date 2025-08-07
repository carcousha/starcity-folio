import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard - طبقة حماية إضافية على مستوى التطبيق
 * تتأكد من أن المستخدم مصادق عليه قبل عرض أي محتوى
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, session, loading } = useAuth();

  // فحص دوري للتأكد من صحة الجلسة
  useEffect(() => {
    const checkAuth = () => {
      if (!loading && (!session || !user)) {
        console.log('AuthGuard: Invalid session detected, redirecting');
        window.location.href = '/';
      }
    };

    // فحص كل 30 ثانية
    const interval = setInterval(checkAuth, 30000);
    
    return () => clearInterval(interval);
  }, [loading, session, user]);

  // إذا كان التحميل جاري
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // إذا لم يكن هناك جلسة صالحة
  if (!session || !user) {
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
};