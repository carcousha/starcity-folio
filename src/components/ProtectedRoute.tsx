import { ReactNode } from 'react';
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
  const { user, profile, loading } = useAuth();
  const { checkPermission } = useRoleAccess();
  const navigate = useNavigate();

  // إذا كان التحميل جاري، أظهر loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  // إذا لم يكن هناك مستخدم، توجه لصفحة الدخول
  if (!user) {
    window.location.href = '/';
    return null;
  }

  // إذا لم يتم تحميل profile بعد، أظهر loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  // تحقق من الصلاحية بعد تحميل كل شيء
  if (!checkPermission(requiredPermission)) {
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
};