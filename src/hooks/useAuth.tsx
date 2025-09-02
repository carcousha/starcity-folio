// @ts-nocheck
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
      
      // تحديد timeout قصير
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000);
      });
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('Profile fetch error:', error.message);
        
        // إعادة المحاولة مرة واحدة فقط
        if (retryCount < 1) {
          console.log('Retrying profile fetch...');
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchProfile(userId, retryCount + 1);
        }
        
        return null;
      }

      if (!data) {
        console.log('No profile found, creating default...');
        const session = await supabase.auth.getSession();
        const userEmail = session?.data?.session?.user?.email || '';
        return await createDefaultProfile(userId, userEmail);
      }

      console.log('Profile fetched successfully');
      return data;
    } catch (error) {
      console.error('fetchProfile catch error:', error?.message);
      
      if (retryCount < 1) {
        console.log('Retrying after catch...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchProfile(userId, retryCount + 1);
      }
      
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    console.log('useAuth: Setting up auth listener...');
    setLoading(true);
    
    // Set up auth state listener - simplified version
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state changed', { event, userId: session?.user?.id });
        
        // Immediate state updates only - no async operations
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          console.log('useAuth: No session, clearing all state');
          setProfile(null);
          setLoading(false);
          return;
        }
        
        console.log('useAuth: Session found, deferring profile fetch');
        // Defer profile fetch to avoid blocking auth flow
        setTimeout(async () => {
          try {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } catch (error) {
            console.error('useAuth: Profile fetch failed:', error);
            setProfile(null);
          } finally {
            setLoading(false);
          }
        }, 100);
      }
    );
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('useAuth: Initial session check:', { userId: session?.user?.id, error });
      if (error) {
        console.error('useAuth: Error getting initial session:', error);
        setLoading(false);
      }
      // onAuthStateChange will handle the session
    });

    // Failsafe timeout to prevent infinite loading
    const failsafeTimeout = setTimeout(() => {
      console.log('useAuth: Failsafe timeout reached, forcing completion');
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafeTimeout);
    };
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