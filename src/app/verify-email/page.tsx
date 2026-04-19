'use client';
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  // Check verification status
  useEffect(() => {
    if (!loading && user) {
      const verified = !!user.email_confirmed_at;
      setIsVerified(verified);
      if (verified) {
        // Auto-redirect after 3s if already verified
        const t = setTimeout(() => router.push('/client-dashboard'), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [user, loading, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (!user?.email || cooldown > 0) return;
    setResending(true);
    setResendError(null);
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new'}/auth/callback`,
        },
      });
      if (error) throw error;
      setResendSuccess(true);
      setCooldown(60);
    } catch (err: any) {
      setResendError(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setResending(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle size={40} className="text-amber-500 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-navy mb-2">Session expirée</h2>
          <p className="text-slate-500 text-sm mb-6">Veuillez vous reconnecter pour vérifier votre email.</p>
          <Link
            href="/sign-up-login-screen"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 transition-colors"
          >
            <ArrowLeft size={15} />
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center gap-3">
        <AppLogo size={32} />
        <span className="font-display text-navy font-bold text-base">GL Capital</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 max-w-md w-full">

          {/* Verified state */}
          {isVerified ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-navy mb-2">Email vérifié ✓</h1>
              <p className="text-slate-500 text-sm mb-6">
                Votre adresse email <span className="font-semibold text-slate-700">{user.email}</span> a été confirmée avec succès.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
                <Clock size={13} />
                Redirection automatique vers le tableau de bord…
              </div>
              <Link
                href="/client-dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 transition-colors"
              >
                Accéder au tableau de bord
              </Link>
            </div>
          ) : (
            /* Pending verification state */
            <div>
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
                <Mail size={32} className="text-amber-500" />
              </div>

              <h1 className="font-display text-2xl font-bold text-navy text-center mb-2">
                Vérifiez votre email
              </h1>
              <p className="text-slate-500 text-sm text-center mb-6">
                Un email de confirmation a été envoyé à{' '}
                <span className="font-semibold text-slate-700">{user.email}</span>.
                Cliquez sur le lien dans l&apos;email pour activer votre compte.
              </p>

              {/* Status badge */}
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <p className="text-amber-700 text-xs font-medium">
                  Statut : En attente de vérification
                </p>
              </div>

              {/* Resend success */}
              {resendSuccess && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-emerald-700 text-xs font-medium">
                    Email renvoyé avec succès. Vérifiez votre boîte de réception.
                  </p>
                </div>
              )}

              {/* Resend error */}
              {resendError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-xs font-medium">{resendError}</p>
                </div>
              )}

              {/* Resend button */}
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mb-4"
              >
                {resending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours…
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Clock size={15} />
                    Renvoyer dans {cooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Renvoyer l&apos;email de vérification
                  </>
                )}
              </button>

              {/* Tips */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
                <p className="text-xs font-semibold text-slate-600 mb-2">Vous ne trouvez pas l&apos;email ?</p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li className="flex items-start gap-1.5"><span className="text-slate-400 mt-0.5">•</span> Vérifiez votre dossier spam ou courrier indésirable</li>
                  <li className="flex items-start gap-1.5"><span className="text-slate-400 mt-0.5">•</span> L&apos;email peut prendre quelques minutes à arriver</li>
                  <li className="flex items-start gap-1.5"><span className="text-slate-400 mt-0.5">•</span> Assurez-vous que l&apos;adresse email est correcte</li>
                </ul>
              </div>

              <div className="text-center">
                <Link
                  href="/sign-up-login-screen"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ArrowLeft size={13} />
                  Retour à la connexion
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
