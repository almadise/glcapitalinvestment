
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext<any>({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (!data) {
        // Try user_profiles table as fallback
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .single();
        setUserRole(profileData?.role ?? null);
      } else {
        setUserRole(data?.role ?? null);
      }
    } catch {
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Email/Password Sign Up
  const signUp = async (email: string, password: string, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: (metadata as any)?.fullName || '',
          avatar_url: (metadata as any)?.avatarUrl || '',
          notif_dossier_updates: (metadata as any)?.notif_dossier_updates ?? true,
          notif_pipeline_alerts: (metadata as any)?.notif_pipeline_alerts ?? true,
          notif_documents_pending: (metadata as any)?.notif_documents_pending ?? true,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new'}/auth/callback`
      }
    });
    if (error) throw error;

    // Send branded confirmation email via Resend (non-blocking)
    if (data?.user) {
      const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new'}/auth/callback`;
      fetch('/api/send-signup-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName: (metadata as any)?.fullName || '',
          confirmationUrl,
          lang: 'fr',
        }),
      }).catch(() => {});
    }

    return data;
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    // Fetch role immediately after sign in
    if (data.user) {
      await fetchUserRole(data.user.id);
    }
    return data;
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Get role-based redirect path
  const getRoleRedirect = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'compliance') return '/compliance-dashboard';
    if (userRole === 'analyst') return '/analyst-dashboard';
    if (userRole === 'gestionnaire_contenu') return '/content-dashboard';
    return '/client-dashboard';
  };

  // Resend verification email via API route
  const resendVerificationEmail = async (email: string, fullName?: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
    const confirmationUrl = `${siteUrl}/auth/callback`;
    const res = await fetch('/api/send-signup-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName: fullName || '', confirmationUrl, lang: 'fr' }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Échec du renvoi de l\'email de vérification');
    }
  };

  // Get Current User
  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  // Check if Email is Verified
  const isEmailVerified = () => {
    return user?.email_confirmed_at !== null;
  };

  // Get User Profile from Database
  const getUserProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile,
    getRoleRedirect,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
