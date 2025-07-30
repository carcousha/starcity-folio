import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نراك قريباً!",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-40">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
              
              {profile && (
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-foreground">
                    مرحباً، {profile.first_name}!
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {profile.role === 'admin' ? 'لوحة تحكم المدير' : 
                     profile.role === 'accountant' ? 'لوحة تحكم المحاسب' : 
                     'لوحة تحكم الموظف'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </Button>
              
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
          </div>
        </header>

        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 pt-16 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}