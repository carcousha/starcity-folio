import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Building, Shield, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Security: Server-side rate limiting check
  const checkRateLimit = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier: email,
        max_attempts: 5,
        window_minutes: 15
      });
      
      if (error) {
        console.error('Rate limit check failed:', error);
        return true; // Allow on error (fail open)
      }
      
      return data;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error (fail open)
    }
  };
  
  // Security: Password strength validation
  const validatePasswordStrength = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
      suggestions: [
        !minLength && "8 أحرف على الأقل",
        !hasUpperCase && "حرف كبير واحد على الأقل",
        !hasLowerCase && "حرف صغير واحد على الأقل", 
        !hasNumbers && "رقم واحد على الأقل"
      ].filter(Boolean)
    };
  };

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = signInForm.email.trim().toLowerCase();
    
    // Security: Check server-side rate limiting
    const canAttempt = await checkRateLimit(email);
    if (!canAttempt) {
      setError("تم تجاوز عدد المحاولات المسموح. يرجى المحاولة مرة أخرى لاحقاً.");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: signInForm.password,
      });

      if (error) {
        // Log failed attempt server-side
        await supabase.rpc('log_auth_attempt', {
          attempt_type: 'sign_in',
          user_identifier: email,
          success: false,
          error_message: error.message
        });
        
        // Generic error message for security
        setError("فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.");
        return;
      }

      // Log successful attempt server-side
      await supabase.rpc('log_auth_attempt', {
        attempt_type: 'sign_in',
        user_identifier: email,
        success: true
      });
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام ستار سيتي العقاري",
      });
      
      onSuccess();
    } catch (err: any) {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      setIsLoading(false);
      return;
    }

    // Enhanced password validation
    const passwordValidation = validatePasswordStrength(signUpForm.password);
    if (!passwordValidation.isValid) {
      setError(`كلمة المرور ضعيفة. يجب أن تحتوي على: ${passwordValidation.suggestions.join('، ')}`);
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signUpForm.email.trim().toLowerCase(),
        password: signUpForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: signUpForm.firstName.trim(),
            last_name: signUpForm.lastName.trim(),
          }
        }
      });

      if (error) {
        // Log failed attempt server-side
        await supabase.rpc('log_auth_attempt', {
          attempt_type: 'sign_up',
          user_identifier: signUpForm.email.trim().toLowerCase(),
          success: false,
          error_message: error.message
        });
        
        // Generic error message for security
        setError("فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.");
        return;
      }

      // Log successful attempt server-side
      await supabase.rpc('log_auth_attempt', {
        attempt_type: 'sign_up',
        user_identifier: signUpForm.email.trim().toLowerCase(),
        success: true
      });

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في نظام ستار سيتي العقاري",
      });
      
      onSuccess();
    } catch (err: any) {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};