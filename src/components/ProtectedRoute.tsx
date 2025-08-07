import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAccess, PermissionKey } from '@/hooks/useRoleAccess';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission: PermissionKey;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  fallback 
}: ProtectedRouteProps) => {
  const { user, profile, loading, session } = useAuth();
  const { checkPermission } = useRoleAccess();
  const navigate = useNavigate();

  // منع عرض أي محتوى إذا لم يكن هناك session صالح
  useEffect(() => {
    if (!loading && (!session || !user)) {
      console.log('ProtectedRoute: No valid session, redirecting to login');
      window.location.href = '/';
    }
  }, [loading, session, user]);

  // إذا كان التحميل جاري، أظهر loading بدون أي محتوى
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // فحص صارم: لا session أو user = إعادة توجيه فورية
  if (!session || !user) {
    window.location.href = '/';
    return null;
  }

  // إذا لم يتم تحميل profile بعد، لا تظهر أي محتوى
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // فحص الـ profile للتأكد من أن المستخدم نشط
  if (!profile.is_active) {
    window.location.href = '/';
    return null;
  }

  // تحقق من الصلاحية بعد تحميل كل شيء
  if (!checkPermission(requiredPermission)) {
    console.log('ProtectedRoute: Permission denied, redirecting to login');
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
};