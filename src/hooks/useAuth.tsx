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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
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
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed', { event, userId: session?.user?.id });
        
        if (!session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          console.log('useAuth: No session, clearing all state');
          return;
        }
        
        setSession(session);
        setUser(session.user);
        
        try {
          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile(profileData);
            console.log('useAuth: Profile loaded successfully', profileData);
          } else {
            console.error('useAuth: Failed to load profile, clearing session');
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('useAuth: Error loading profile, clearing session', error);
          setSession(null);
          setUser(null);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    console.log('useAuth: Checking for existing session');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('useAuth: Existing session check', { userId: session?.user?.id });
      
      if (!session) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        console.log('useAuth: No existing session found');
        return;
      }
      
      setSession(session);
      setUser(session.user);
      
      try {
        const profileData = await fetchProfile(session.user.id);
        if (profileData) {
          setProfile(profileData);
          console.log('useAuth: Profile loaded from existing session', profileData);
        } else {
          console.error('useAuth: Failed to load profile from existing session');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('useAuth: Error loading profile from existing session', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

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