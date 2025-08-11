import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut, loading, user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // حماية صارمة: فحص الجلسة في كل مرة
  useEffect(() => {
    if (!loading && location.pathname !== "/" && (!session || !user || !profile)) {
      console.log('AppLayout: Unauthorized access attempt, redirecting to login');
      window.location.href = '/';
    }
  }, [loading, session, user, profile, location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نراك قريباً!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  // حماية مطلقة: إذا كان التحميل جاري ولم تكن صفحة تسجيل الدخول
  if (loading && location.pathname !== "/") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // إذا كانت صفحة تسجيل الدخول، اعرضها بدون layout
  if (location.pathname === "/") {
    return <>{children}</>;
  }

  // حماية صارمة: لا session أو user أو profile = إعادة توجيه فورية
  if (!session || !user || !profile) {
    window.location.href = '/';
    return null;
  }

  // فحص إضافي: التأكد من أن المستخدم نشط
  if (!profile.is_active) {
    window.location.href = '/';
    return null;
  }

  function LayoutShell({ children: layoutChildren }: { children: ReactNode }) {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const paddingRightClass = collapsed ? "md:pr-0" : "md:pr-[--sidebar-width]";

    return (
      <div className="min-h-screen flex flex-row-reverse w-full bg-background" dir="rtl">
        {/* Sidebar */}
        <AppSidebar />

        {/* Header */}
<<<<<<< HEAD
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-40 md:pr-[--sidebar-width] peer-data-[state=collapsed]:md:pr-0">
          <div className="h-full px-4 md:pr-[--sidebar-width] peer-data-[state=collapsed]:md:pr-0 flex items-center justify-between flex-row-reverse">
=======
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-40">
          <div className={`h-full px-4 flex items-center justify-between flex-row-reverse ${paddingRightClass}`}>
>>>>>>> b116669 (Smart AI Edi 2t)
            {/* Actions (left in RTL) */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <ThemeToggle />
              <NotificationCenter />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 ml-2" />
                خروج
              </Button>
            </div>

            {/* Sidebar trigger + greeting (right in RTL) */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
              {profile && (
                <div className="hidden md:flex items-center space-x-3 space-x-reverse">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                    <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <h1 className="text-xl font-bold text-foreground">
                      مرحباً، {profile.first_name} {profile.last_name}!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {profile.role === 'admin' ? 'لوحة تحكم المدير' :
                       profile.role === 'accountant' ? 'لوحة تحكم المحاسب' :
                       'لوحة تحكم الموظف'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 pt-16 p-6 overflow-auto transition-[padding] duration-200 ${paddingRightClass}`}>
          {layoutChildren}

          {/* Developer Credit */}
          <div className="fixed bottom-4 left-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground z-30">
            البرمجة تمت بواسطة mohamed kamel egywbas@gmail.com
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <LayoutShell>{children}</LayoutShell>
    </SidebarProvider>
  );
}