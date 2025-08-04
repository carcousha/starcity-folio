import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
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
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />

          {profile && (
            <div className="hidden md:flex items-center space-x-3 space-x-reverse">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                  {profile.first_name?.[0]}
                  {profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
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

        <div className="flex items-center space-x-2 space-x-reverse">
          {children}
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
  );
}

