import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = signInForm.email.trim().toLowerCase();
    
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: signInForm.password,
      });

      if (error) {
        console.error("تفاصيل خطأ تسجيل الدخول:", error);
        
        if (error.message.includes('Invalid login credentials')) {
          setError("بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.");
        } else if (error.message.includes('Email not confirmed')) {
          setError("البريد الإلكتروني غير مؤكد. يرجى تأكيد البريد الإلكتروني أولاً.");
        } else if (error.message.includes('Too many requests')) {
          setError("محاولات كثيرة جداً. يرجى الانتظار قليلاً والمحاولة مرة أخرى.");
        } else {
          setError("فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.");
        }
        return;
      }
      
      if (data?.user) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في نظام ستار سيتي العقاري",
        });
        
        // انتظار قصير للسماح لـ useAuth بإكمال جلب الملف الشخصي
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err: any) {
      console.error("خطأ في تسجيل الدخول:", err);
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError("مشكلة في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
      } else if (err.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
        setError("لا يمكن الوصول إلى الخادم. يرجى التحقق من اتصالك بالإنترنت.");
      } else {
        setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/0ebdd2d6-a147-4eaa-a1ee-3b88e1c3739f.png" 
              alt="ستار سيتي العقارية"
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">ستار سيتي العقارية</CardTitle>
          <CardDescription>
            نظام إدارة العقارات الشامل في عجمان
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">البريد الإلكتروني</Label>
              <Input
                id="signin-email"
                type="email"
                value={signInForm.email}
                onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                placeholder="user@example.com"
                required
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signin-password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={signInForm.password}
                  onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                  placeholder="كلمة المرور"
                  required
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">بيانات تسجيل الدخول التجريبية:</p>
              <p className="text-xs font-mono">admin@starcity.ae</p>
              <p className="text-xs font-mono">admin123</p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => {
                  setSignInForm({
                    email: "admin@starcity.ae",
                    password: "admin123"
                  });
                }}
              >
                استخدام البيانات التجريبية
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};