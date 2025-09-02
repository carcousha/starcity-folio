import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'accountant' | 'employee';
  avatar_url?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// تعديل طريقة تصدير الهوك لتوافق HMR
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { useAuth };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const createDefaultProfile = async (userId: string, userEmail: string) => {
    try {
      console.log('Creating default profile for user:', userId);
      
      const defaultProfile = {
        user_id: userId,
        email: userEmail,
        first_name: userEmail.split('@')[0],
        last_name: '',
        role: 'user' as const,
        is_active: true
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([defaultProfile])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating default profile:', error);
        throw error;
      }
      
      console.log('Default profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception creating default profile:', error);
      throw error;
    }
  };

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Check current session
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session in fetchProfile:', session?.session?.user?.email);
      
      // @ts-ignore - تجاهل أخطاء TypeScript مؤقتاً
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          userId,
          retryCount
        });
        
        // إعادة المحاولة فقط للأخطاء المؤقتة
        const shouldRetry = retryCount < 2 && (
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.code === 'PGRST301'
        );
        
        if (shouldRetry) {
          console.log(`Retrying fetchProfile... Attempt ${retryCount + 1}/2`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retryCount + 1);
        }
        
        // إذا كان الخطأ PGRST116 (لا توجد صفوف)، أنشئ ملف شخصي افتراضي
        if (error.code === 'PGRST116') {
          console.log('No profile found for user (PGRST116), creating default profile:', userId);
          const userEmail = session?.session?.user?.email || '';
          return await createDefaultProfile(userId, userEmail);
        }
        
        // في حالة الأخطاء الأخرى، ارجع null بدلاً من إعادة المحاولة إلى ما لا نهاية
        console.log('Profile fetch failed, returning null');
        return null;
      }

      if (!data) {
        console.log('No profile found for user, creating default profile:', userId);
        const userEmail = session?.session?.user?.email || '';
        return await createDefaultProfile(userId, userEmail);
      }

      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('fetchProfile catch error:', {
        message: error?.message,
        name: error?.name,
        userId,
        retryCount
      });
      
      // إعادة المحاولة فقط مرة واحدة للأخطاء الشبكية
      const shouldRetry = retryCount < 1 && (
        error instanceof TypeError ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('network')
      );
      
      if (shouldRetry) {
        console.log(`Retrying fetchProfile after catch... Attempt ${retryCount + 1}/1`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retryCount + 1);
      }
      
      console.log('Profile fetch failed after retries, returning null');
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    setLoading(true);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed', { event, userId: session?.user?.id });
        
        if (!session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session.user);
        
        try {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } catch (error) {
          console.error('useAuth: Error fetching profile:', error);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    );
    
    // Get initial session (this will trigger onAuthStateChange)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('useAuth: Initial session check:', { userId: session?.user?.id });
      if (error) {
        console.error('useAuth: Error getting initial session:', error);
        setLoading(false);
      }
      // Session handling is done in onAuthStateChange
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};