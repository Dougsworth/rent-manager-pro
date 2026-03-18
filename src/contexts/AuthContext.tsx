import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/app.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; role: 'landlord' | 'tenant' }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isLandlord: boolean;
  isTenant: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };

    // Friendly error messages
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Please check your inbox and verify your email before signing in.' };
    }
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Incorrect email or password. Please try again.' };
    }
    return { error: error.message };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; role: 'landlord' | 'tenant' }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/email-verified`,
      },
    });

    // Fire-and-forget welcome email for new landlords
    if (!error && metadata.role === 'landlord') {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-landlord-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: metadata.first_name,
          last_name: metadata.last_name,
        }),
      }).catch((err) => console.error('Landlord welcome email failed:', err));
    }

    if (!error) return { error: null };

    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with this email already exists. Try signing in instead.' };
    }
    if (error.message.toLowerCase().includes('sending confirmation')) {
      return { error: 'Something went wrong sending your verification email. Please try again.' };
    }
    return { error: error.message };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isLandlord: profile?.role === 'landlord',
    isTenant: profile?.role === 'tenant',
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
