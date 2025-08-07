import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

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

  // قائمة المسارات المحمية - كل شيء عدا صفحة تسجيل الدخول
  const protectedPaths = [
    '/dashboard', '/admin-dashboard', '/crm', '/accounting', '/rental', 
    '/reports', '/employee', '/tasks', '/my-', '/settings'
  ];

  // فحص فوري عند تحميل أي مسار
  useEffect(() => {
    const currentPath = location.pathname;
    const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path)) || currentPath !== '/';
    
    if (isProtectedPath && !loading) {
      if (!session || !user || !profile) {
        console.log(`RouteGuard: Blocking access to protected path: ${currentPath}`);
        window.location.href = '/';
        return;
      }
      
      if (!profile.is_active) {
        console.log('RouteGuard: Inactive user trying to access protected path');
        window.location.href = '/';
        return;
      }
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
    
    if (!session || !user || !profile || !profile.is_active) {
      window.location.href = '/';
      return null;
    }
  }

  return <>{children}</>;
};