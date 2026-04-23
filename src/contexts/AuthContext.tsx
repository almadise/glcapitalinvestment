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
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (!data) {
        // Try user_profiles table as fallback
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .single();
        setUserRole(profileData?.role ?? 'client');
      } else {
        setUserRole(data?.role ?? 'client');
      }
    } catch {
      // Keep client area usable when role table access fails.
      setUserRole('client');
    }
  };

  useEffect(() => {
    const clearStaleAuth = async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('Refresh Token') ||
        msg.includes('refresh_token') ||
        msg.includes('Invalid Refresh Token')
      ) {
        await supabase.auth.signOut({ scope: 'local' });
      }
    };

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          void clearStaleAuth(error);
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        void clearStaleAuth(err);
        setSession(null);
        setUser(null);
        setUserRole(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
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
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        metadata,
        lang: 'fr',
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.error || "Échec de l'inscription");
    }

    return payload;
  };

  // Email/Password Sign In (returns needsMfa when TOTP/phone MFA must be completed - see Supabase AAL)
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      await fetchUserRole(data.user.id);
    }

    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;

    const needsMfa = aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2';

    return { ...data, needsMfa };
  };

  /** Complete MFA after password sign-in (TOTP or phone factor verified in Supabase). */
  const verifyMfa = async (code: string) => {
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) throw listError;

    const verifiedTotp = factors.totp.find((f) => f.status === 'verified');
    const verifiedPhone = factors.phone.find((f) => f.status === 'verified');
    const factorId = verifiedTotp?.id ?? verifiedPhone?.id;

    if (!factorId) {
      throw new Error(
        'Aucun facteur MFA actif trouvé. Configurez le 2FA dans les paramètres de sécurité de votre compte.'
      );
    }

    const { data: challenge, error: chError } = await supabase.auth.mfa.challenge({ factorId });
    if (chError) throw chError;
    const challengeId = challenge.id;
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.replace(/\s/g, ''),
    });
    if (verifyError) throw verifyError;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserRole(session.user.id);
    }
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
  const resendVerificationEmail = async (email: string, _fullName?: string) => {
    const res = await fetch('/api/auth/resend-signup-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        fullName: _fullName || '',
        lang: 'fr',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || "Échec du renvoi de l'email de vérification");
    }
  };

  // Get Current User
  const getCurrentUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
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
    verifyMfa,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile,
    getRoleRedirect,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
