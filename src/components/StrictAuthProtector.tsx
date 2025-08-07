import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

/**
 * StrictAuthProtector - حماية مطلقة على مستوى الجذر
 * لا يسمح بعرض أي محتوى نهائياً إلا لصفحة تسجيل الدخول أو للمستخدمين المصادق عليهم
 */
export const StrictAuthProtector = ({ children }: { children: React.ReactNode }) => {
  const { user, session, profile, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // حماية فورية عند تحميل أي صفحة
  useEffect(() => {
    // إذا لم تكن صفحة تسجيل الدخول
    if (currentPath !== '/') {
      // وإذا لم يكن هناك جلسة صالحة
      if (!loading && (!session || !user || !profile)) {
        console.log('StrictAuthProtector: Unauthorized access blocked, redirecting immediately');
        window.location.href = '/';
        return;
      }
      
      // أو إذا كان المستخدم غير نشط
      if (!loading && profile && !profile.is_active) {
        console.log('StrictAuthProtector: Inactive user blocked');
        window.location.href = '/';
        return;
      }
    }
  }, [currentPath, loading, session, user, profile]);

  // إذا كانت صفحة تسجيل الدخول، اعرضها
  if (currentPath === '/') {
    return <>{children}</>;
  }

  // إذا كان التحميل جاري لأي صفحة أخرى
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">جاري التحقق من صحة الهوية...</p>
        </div>
      </div>
    );
  }

  // منع مطلق لأي محتوى بدون مصادقة صحيحة
  if (!session || !user || !profile) {
    window.location.href = '/';
    return null;
  }

  // منع مطلق للمستخدمين غير النشطين
  if (!profile.is_active) {
    window.location.href = '/';
    return null;
  }

  // فقط المستخدمون المصادق عليهم والنشطون يمكنهم رؤية المحتوى
  return <>{children}</>;
};