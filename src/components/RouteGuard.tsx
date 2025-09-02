import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * RouteGuard - حماية إضافية على مستوى الروتس
 * يضمن عدم الوصول لأي رابط داخلي بدون مصادقة
 */
export const RouteGuard = ({ children }: RouteGuardProps) => {
  const { user, session, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // قائمة المسارات المحمية - كل شيء عدا صفحة تسجيل الدخول
  const protectedPaths = [
    '/dashboard', '/admin-dashboard', '/crm', '/accounting', '/rental', 
    '/reports', '/employee', '/tasks', '/my-', '/settings', '/whatsapp',
    '/land-sales', '/ai-intelligence-hub', '/security-audit'
  ];

  // فحص فوري عند تحميل أي مسار
  useEffect(() => {
    const currentPath = location.pathname;
    const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path)) || currentPath !== '/';
    
    // تخطي التحقق إذا كان التحميل جاريًا أو إذا كان المسار غير محمي
    if (!isProtectedPath || loading) {
      return;
    }
    
    // التحقق من حالة الاتصال قبل إعادة التوجيه
    if (!navigator.onLine) {
      console.log('RouteGuard: No internet connection, skipping redirect');
      return;
    }
    
    if (!session || !user || !profile) {
      console.log(`RouteGuard: Blocking access to protected path: ${currentPath}`);
      // تخزين المسار الحالي للعودة إليه بعد تسجيل الدخول
      sessionStorage.setItem('redirectPath', currentPath);
      navigate('/', { replace: true });
      return;
    }
    
    if (!profile.is_active) {
      console.log('RouteGuard: Inactive user trying to access protected path');
      navigate('/', { replace: true });
      return;
    }
  }, [location.pathname, loading, session, user, profile]);

  // منع عرض أي محتوى محمي بدون مصادقة
  const currentPath = location.pathname;
  const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path)) || currentPath !== '/';
  
  if (isProtectedPath) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    // التحقق من حالة الاتصال قبل إعادة التوجيه
    if (!navigator.onLine) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="text-destructive text-xl mb-4">خطأ في الاتصال</div>
          <p className="mb-4">يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك وإعادة تحميل الصفحة.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            إعادة تحميل
          </button>
        </div>
      );
    }
    
    if (!session || !user || !profile || !profile.is_active) {
      // تخزين المسار الحالي للعودة إليه بعد تسجيل الدخول
      sessionStorage.setItem('redirectPath', currentPath);
      // نقل navigate إلى useEffect لتجنب updating component during render
      setTimeout(() => navigate('/', { replace: true }), 0);
      return null;
    }
  }

  return <>{children}</>;
};