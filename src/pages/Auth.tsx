import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";

const Auth = () => {
  const navigate = useNavigate();
  const { user, profile, loading, session } = useAuth();

  useEffect(() => {
    // إذا كان المستخدم مسجل دخول بالفعل، وجهه للوحة التحكم
    if (!loading && session && user) {
      console.log('Auth: User already logged in, redirecting to dashboard');
      if (profile && profile.is_active) {
        if (profile.role === 'admin') {
          navigate("/admin-dashboard");
        } else if (profile.role === 'accountant') {
          navigate("/accounting");
        } else {
          navigate("/employee/dashboard");
        }
      } else {
        // إذا لم يكن هناك ملف شخصي، وجه للوحة الادارة افتراضياً
        navigate("/admin-dashboard");
      }
    }
  }, [user, profile, loading, session, navigate]);

  // إذا كان المستخدم مسجل دخول، لا تظهر صفحة تسجيل الدخول
  if (!loading && session && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // سيتم التوجيه تلقائياً عند تغيير حالة المصادقة
    console.log('Auth: Authentication successful');
  };

  return (
    <div className="min-h-screen">
      <AuthForm onSuccess={handleAuthSuccess} />
    </div>
  );
};

export default Auth;