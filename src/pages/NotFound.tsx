import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const NotFound = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-4">الصفحة غير موجودة</p>
        <a href="/employee/dashboard" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
};

export default NotFound;
