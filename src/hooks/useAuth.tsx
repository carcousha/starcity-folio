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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Check current session
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session in fetchProfile:', session?.session?.user?.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        console.error('Error details:', error.message, error.code, error.details);
        return null;
      }

      if (!data) {
        console.error('No profile found for user:', userId);
        return null;
      }

      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    console.log('useAuth: Setting up auth state listener');
    let isInitialized = false;
    
    // Check for existing session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('useAuth: Initial session check:', { userId: session?.user?.id });
      
      if (!session) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        isInitialized = true;
        return;
      }
      
      setSession(session);
      setUser(session.user);
      
      try {
        console.log('useAuth: Fetching profile for user:', session.user.id);
        const profileData = await fetchProfile(session.user.id);
        console.log('useAuth: Profile result:', profileData);
        setProfile(profileData);
      } catch (error) {
        console.error('useAuth: Profile fetch error:', error);
        setProfile(null);
      } finally {
        setLoading(false);
        isInitialized = true;
      }
    });

    // Set up auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed', { event, userId: session?.user?.id, isInitialized });
        
        // Skip if this is the initial load (already handled above)
        if (!isInitialized) return;
        
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
          console.error('useAuth: Profile fetch error:', error);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    console.log('useAuth: Signing out user');
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