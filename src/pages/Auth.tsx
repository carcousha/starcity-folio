import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && profile) {
        // Redirect based on user role
        if (profile.role === 'admin') {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee/dashboard");
        }
      }
    };

    if (profile) {
      checkAuth();
    }
  }, [navigate, profile]);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && profile) {
        // Redirect based on user role
        if (profile.role === 'admin') {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, profile]);

  const handleAuthSuccess = () => {
    // Let the auth state change handler redirect
  };

  return <AuthForm onSuccess={handleAuthSuccess} />;
};

export default Auth;