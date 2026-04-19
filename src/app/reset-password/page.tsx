'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

type SessionState = 'loading' | 'ready' | 'invalid';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

function getPasswordStrength(password: string, lang: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);

  const labels =
    lang === 'fr'
      ? ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
      : ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];

  return { score, label: labels[score], color: colors[score] };
}

export default function ResetPasswordPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('loading');

  const t = {
    title: lang === 'fr' ? 'Nouveau mot de passe' : 'New Password',
    subtitle:
      lang === 'fr' ?'Choisissez un nouveau mot de passe sécurisé pour votre compte.' :'Choose a new secure password for your account.',
    passwordLabel: lang === 'fr' ? 'Nouveau mot de passe' : 'New password',
    confirmLabel: lang === 'fr' ? 'Confirmer le mot de passe' : 'Confirm password',
    submit: lang === 'fr' ? 'Réinitialiser le mot de passe' : 'Reset password',
    submitting: lang === 'fr' ? 'Mise à jour...' : 'Updating...',
    successTitle: lang === 'fr' ? 'Mot de passe mis à jour' : 'Password updated',
    successMsg:
      lang === 'fr' ?'Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.' :'Your password has been reset successfully. You will be redirected to the sign-in page.',
    goToLogin: lang === 'fr' ? 'Se connecter' : 'Sign in',
    mismatch:
      lang === 'fr' ?'Les mots de passe ne correspondent pas.' :'Passwords do not match.',
    tooShort:
      lang === 'fr' ?'Le mot de passe doit contenir au moins 8 caractères.' :'Password must be at least 8 characters.',
    invalidLinkTitle:
      lang === 'fr' ? 'Lien invalide ou expiré' : 'Invalid or expired link',
    invalidLinkMsg:
      lang === 'fr' ?'Ce lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.' :'This reset link is invalid or has expired. Please request a new one.',
    newRequest: lang === 'fr' ? 'Nouvelle demande' : 'Request new link',
    validatingTitle: lang === 'fr' ? 'Validation du lien...' : 'Validating link...',
    validatingMsg:
      lang === 'fr' ?'Veuillez patienter pendant que nous validons votre lien de réinitialisation.' :'Please wait while we validate your reset link.',
    errorGeneric:
      lang === 'fr' ?'Une erreur est survenue. Veuillez réessayer.' :'An error occurred. Please try again.',
    strengthLabel: lang === 'fr' ? 'Force du mot de passe' : 'Password strength',
    requirements: lang === 'fr' ? 'Exigences' : 'Requirements',
    req8chars: lang === 'fr' ? 'Au moins 8 caractères' : 'At least 8 characters',
    reqUpperLower: lang === 'fr' ? 'Majuscules et minuscules' : 'Upper & lowercase letters',
    reqNumber: lang === 'fr' ? 'Au moins un chiffre' : 'At least one number',
  };

  useEffect(() => {
    const supabase = createClient();

    // Check if there's already a valid session (token in URL hash handled by Supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionState('ready');
      } else if (event === 'SIGNED_OUT') {
        // Only mark invalid if we were still loading
        setSessionState((prev) => (prev === 'loading' ? 'invalid' : prev));
      }
    });

    // Fallback: if no PASSWORD_RECOVERY event within 5s, mark as invalid
    const timeout = setTimeout(() => {
      setSessionState((prev) => (prev === 'loading' ? 'invalid' : prev));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const strength = password ? getPasswordStrength(password, lang) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t.tooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message || t.errorGeneric);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/sign-up-login-screen'), 3000);
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setIsLoading(false);
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
            <span className="font-display text-white font-bold text-lg block leading-tight">GL Capital</span>
            <span className="text-gold text-[10px] font-medium tracking-widest uppercase">Investment SA</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-navy-dark/40 p-8">
          {/* ── Success state ── */}
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-gold" />
              </div>
              <h2 className="font-display text-2xl font-bold text-navy mb-3">{t.successTitle}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{t.successMsg}</p>
              <Link
                href="/sign-up-login-screen"
                className="inline-flex items-center justify-center gap-2 bg-navy text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-navy-light transition-colors"
              >
                {t.goToLogin}
              </Link>
            </div>

          /* ── Loading / validating state ── */
          ) : sessionState === 'loading' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center mx-auto mb-5">
                <Loader2 size={32} className="text-navy animate-spin" />
              </div>
              <h2 className="font-display text-xl font-bold text-navy mb-3">{t.validatingTitle}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{t.validatingMsg}</p>
            </div>

          /* ── Invalid / expired link state ── */
          ) : sessionState === 'invalid' ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h2 className="font-display text-xl font-bold text-navy mb-3">{t.invalidLinkTitle}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{t.invalidLinkMsg}</p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center gap-2 bg-navy text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-navy-light transition-colors"
              >
                {t.newRequest}
              </Link>
            </div>

          /* ── Form state ── */
          ) : (
            <>
              <div className="mb-7">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={20} className="text-gold" />
                  <h2 className="font-display text-2xl font-bold text-navy">{t.title}</h2>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{t.subtitle}</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm leading-snug">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-navy text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {strength && (
                    <div className="mt-2.5">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < strength.score ? strength.color : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        {t.strengthLabel}:{' '}
                        <span
                          className={`font-semibold ${
                            strength.score <= 1
                              ? 'text-red-500'
                              : strength.score === 2
                              ? 'text-yellow-600' :'text-emerald-600'
                          }`}
                        >
                          {strength.label}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Requirements checklist */}
                  <div className="mt-3 space-y-1">
                    {[
                      { check: password.length >= 8, label: t.req8chars },
                      { check: /[A-Z]/.test(password) && /[a-z]/.test(password), label: t.reqUpperLower },
                      { check: /[0-9]/.test(password), label: t.reqNumber },
                    ].map(({ check, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <CheckCircle
                          size={12}
                          className={`flex-shrink-0 transition-colors ${check ? 'text-emerald-500' : 'text-slate-300'}`}
                        />
                        <span className={`text-xs transition-colors ${check ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    {t.confirmLabel}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-navy text-sm placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                          : confirmPassword && confirmPassword === password
                          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200' :'border-slate-200 focus:border-gold focus:ring-gold/30'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {t.mismatch}
                    </p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} />
                      {lang === 'fr' ? 'Les mots de passe correspondent' : 'Passwords match'}
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
                      {t.submitting}
                    </>
                  ) : (
                    t.submit
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
