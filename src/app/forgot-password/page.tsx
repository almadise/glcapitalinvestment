'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, RefreshCw, Clock } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { createClient } from '../../lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const RESEND_COOLDOWN = 60; // seconds

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const t = {
    title: lang === 'fr' ? 'Mot de passe oublié' : 'Forgot Password',
    subtitle:
      lang === 'fr'
        ? 'Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.'
        : 'Enter your email address and we will send you a reset link.',
    emailLabel: lang === 'fr' ? 'Adresse email' : 'Email address',
    emailPlaceholder: 'vous@exemple.com',
    submit: lang === 'fr' ? 'Envoyer le lien' : 'Send reset link',
    sending: lang === 'fr' ? 'Envoi en cours...' : 'Sending...',
    backToLogin: lang === 'fr' ? 'Retour à la connexion' : 'Back to login',
    successTitle: lang === 'fr' ? 'Vérifiez votre boîte mail' : 'Check your inbox',
    successMsg:
      lang === 'fr'
        ? `Nous avons envoyé un lien de réinitialisation à`
        : `We've sent a password reset link to`,
    successHint:
      lang === 'fr'
        ? 'Le lien est valable 60 minutes. Pensez à vérifier vos spams si vous ne le trouvez pas.'
        : "The link is valid for 60 minutes. Check your spam folder if you don't see it.",
    resend: lang === 'fr' ? 'Renvoyer le lien' : 'Resend link',
    resending: lang === 'fr' ? 'Renvoi...' : 'Resending...',
    resendIn: lang === 'fr' ? 'Renvoyer dans' : 'Resend in',
    resendSuccess: lang === 'fr' ? 'Lien renvoyé !' : 'Link resent!',
    errorGeneric:
      lang === 'fr'
        ? 'Une erreur est survenue. Veuillez réessayer.'
        : 'An error occurred. Please try again.',
    invalidEmail:
      lang === 'fr'
        ? 'Veuillez entrer une adresse email valide.'
        : 'Please enter a valid email address.',
    wrongDomain:
      lang === 'fr'
        ? 'Le domaine email semble invalide. Vérifiez votre saisie.'
        : 'The email domain appears invalid. Please check your entry.',
  };

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateEmail = useCallback(
    (value: string): string | null => {
      if (!value.trim()) return t.invalidEmail;
      if (!EMAIL_REGEX.test(value)) return t.invalidEmail;
      const domain = value.split('@')[1] ?? '';
      if (!domain.includes('.') || domain.endsWith('.')) return t.wrongDomain;
      return null;
    },
    [t.invalidEmail, t.wrongDomain]
  );

  const sendResetEmail = async (targetEmail: string): Promise<boolean> => {
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
    if (resetError) {
      setError(resetError.message || t.errorGeneric);
      return false;
    }
    // Send branded email via Resend (non-blocking)
    fetch('/api/send-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
        lang,
      }),
    }).catch(() => {});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }
    setEmailError(null);
    setIsLoading(true);

    try {
      const ok = await sendResetEmail(email);
      if (ok) {
        setSent(true);
        setResendCooldown(RESEND_COOLDOWN);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const ok = await sendResetEmail(email);
      if (ok) setResendCooldown(RESEND_COOLDOWN);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-dark via-navy to-navy-light px-4 py-12">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(201,168,76,1) 40px,rgba(201,168,76,1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(201,168,76,1) 40px,rgba(201,168,76,1) 41px)`,
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <AppLogo size={40} />
          <div>
            <span className="font-display text-white font-bold text-lg block leading-tight">
              GL Capital
            </span>
            <span className="text-gold text-[10px] font-medium tracking-widest uppercase">
              Investment SA
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-navy-dark/40 p-8">
          {sent ? (
            /* ── Confirmation / Success state ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-gold" />
              </div>
              <h2 className="font-display text-2xl font-bold text-navy mb-3">{t.successTitle}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-1">{t.successMsg}</p>
              <p className="text-navy font-semibold text-sm mb-5 break-all">{email}</p>

              {/* Hint box */}
              <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                <Clock size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-500 text-xs leading-relaxed">{t.successHint}</p>
              </div>

              {/* Error from resend */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-left">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-xs leading-snug">{error}</p>
                </div>
              )}

              {/* Resend button */}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="w-full flex items-center justify-center gap-2 border border-navy/20 text-navy font-semibold text-sm py-3 rounded-xl hover:bg-navy/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isResending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t.resending}
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw size={15} />
                    {t.resendIn} {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    {t.resend}
                  </>
                )}
              </button>

              <Link
                href="/sign-up-login-screen"
                className="inline-flex items-center gap-2 text-slate-500 text-sm hover:text-navy transition-colors"
              >
                <ArrowLeft size={14} />
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-7">
                <h2 className="font-display text-2xl font-bold text-navy mb-2">{t.title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed">{t.subtitle}</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm leading-snug">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      onBlur={() => {
                        if (email) setEmailError(validateEmail(email));
                      }}
                      required
                      placeholder={t.emailPlaceholder}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-navy text-sm placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                        emailError
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                          : 'border-slate-200 focus:border-gold focus:ring-gold/30'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {emailError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-navy text-white font-bold text-sm py-3.5 rounded-xl hover:bg-navy-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    t.submit
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/sign-up-login-screen"
                  className="inline-flex items-center gap-2 text-slate-500 text-sm hover:text-navy transition-colors"
                >
                  <ArrowLeft size={14} />
                  {t.backToLogin}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
