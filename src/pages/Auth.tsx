import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";

const Auth = () => {
  const navigate = useNavigate();
  const { user, profile, loading, session } = useAuth();
  const hasRedirected = useRef(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  const handleRedirect = useCallback(() => {
    if (hasRedirected.current) return;
    
    console.log('Auth: User already logged in, redirecting to dashboard');
    hasRedirected.current = true;
    
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
  }, [navigate, profile]);

  useEffect(() => {
    // إذا كان المستخدم مسجل دخول بالفعل، وجهه للوحة التحكم
    // انتظار حتى يتم جلب الملف الشخصي أو التأكد من عدم وجوده
    if (!loading && session && user && profile) {
      handleRedirect();
    }
    
    // إضافة timeout لتجنب التحميل اللانهائي
    const timeoutId = setTimeout(() => {
      if (session && user && !profile) {
        console.log('Auth: Profile fetch timeout, proceeding with redirect');
        setAuthTimeout(true);
        handleRedirect();
      }
    }, 5000); // 5 ثوان timeout
    
    return () => clearTimeout(timeoutId);
  }, [user, profile, loading, session, handleRedirect]);

  // إذا كان المستخدم مسجل دخول، لا تظهر صفحة تسجيل الدخول
  if (loading || (session && user && !profile && !authTimeout)) {
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