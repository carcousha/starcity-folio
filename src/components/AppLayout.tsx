import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== "/auth") {
      navigate("/auth");
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  // Don't show layout for auth page
  if (location.pathname === "/auth") {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Header>
          <NotificationCenter />
        </Header>

        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 pt-16 p-6 overflow-auto">
          {children}
          
          {/* Developer Credit */}
          <div className="fixed bottom-4 left-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground z-30">
            البرمجة تمت بواسطة mohamed kamel egywbas@gmail.com
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}