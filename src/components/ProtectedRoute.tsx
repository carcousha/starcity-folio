import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAccess, RolePermissions } from '@/hooks/useRoleAccess';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission: keyof RolePermissions;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  fallback 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { checkPermission, requirePermission } = useRoleAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      requirePermission(requiredPermission);
    }
  }, [user, loading, requiredPermission, requirePermission, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return null; // سيتم التوجيه لصفحة الدخول
  }

  if (!checkPermission(requiredPermission)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};