'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Eye,
  EyeOff,
  Shield,
  Lock,
  Mail,
  Building2,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  AlertCircle,
  MailCheck,
  RefreshCw,
} from 'lucide-react';

type AuthMode = 'login' | 'register';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  country: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptNcnda: boolean;
}

export default function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, verifyMfa, signOut, getRoleRedirect, resendVerificationEmail } =
    useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  // Email verification states
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');

  const loginForm = useForm<LoginForm>({
    defaultValues: { email: '', password: '', remember: false },
  });
  const registerForm = useForm<RegisterForm>();

  // Handle cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = loginForm.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      setIsLoading(false);
      if (result.needsMfa) {
        setMfaStep(true);
      } else {
        toast.success(t('Connexion réussie', 'Signed in successfully'));
        const redirect = getRoleRedirect();
        router.push(redirect);
        router.refresh();
      }
    } catch (error: any) {
      setIsLoading(false);
      loginForm.setError('email', {
        message: error.message || t('Identifiants invalides', 'Invalid credentials'),
      });
    }
  });

  const handleMfaSubmit = async () => {
    setIsLoading(true);
    try {
      await verifyMfa(mfaCode);
      setIsLoading(false);
      toast.success(t('Connexion réussie', 'Signed in successfully'));
      const redirect = getRoleRedirect();
      router.push(redirect);
      router.refresh();
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.message || t('Code invalide ou expiré', 'Invalid or expired code'));
    }
  };

  const handleMfaBack = async () => {
    setMfaStep(false);
    setMfaCode('');
    await signOut();
  };

  const handleRegister = registerForm.handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', {
        message: t('Les mots de passe ne correspondent pas', 'Passwords do not match'),
      });
      return;
    }
    setIsLoading(true);
    try {
      const fullName = `${data.firstName} ${data.lastName}`;
      await signUp(data.email, data.password, {
        fullName,
        organization: data.organization,
        country: data.country,
      });
      setIsLoading(false);
      setRegisteredEmail(data.email);
      setRegisteredName(fullName);
      setVerificationSent(true);
      setResendCooldown(60);
      toast.success(
        t(
          'Compte créé - veuillez vérifier votre email',
          'Account created - please verify your email'
        )
      );
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.message || t("Échec de l'inscription", 'Registration failed'));
    }
  });

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await resendVerificationEmail(registeredEmail, registeredName);
      setResendCooldown(60);
      toast.success(
        t(
          'Email de vérification renvoyé - vérifiez votre boîte de réception',
          'Verification email resent - check your inbox'
        )
      );
    } catch (error: any) {
      toast.error(
        error.message ||
          t("Échec du renvoi de l'email de vérification", 'Failed to resend verification email')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy-950">
      <Toaster position="bottom-right" richColors />

      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-hero p-12 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* Glow */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-gold-500/5 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <AppLogo size={44} />
            <div>
              <p className="text-white font-bold text-xl">GL Capital</p>
              <p className="text-gold-500 text-xs font-mono tracking-widest uppercase">
                Investment SA
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            {t('Portail de Financement', 'Secure Financing')}
            <br />
            <span className="text-gradient-gold">{t('Sécurisé', 'Advisory Portal')}</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            {t(
              'Soumettez, suivez et gérez vos dossiers de financement via notre plateforme sécurisée de qualité institutionnelle.',
              'Submit, track, and manage your financing dossiers through our institutional-grade secure platform.'
            )}
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {[
            {
              icon: Shield,
              textFr: 'Traitement conforme KYC/AML',
              textEn: 'KYC/AML compliant processing',
              subFr: 'Chaque dossier est contrôlé',
              subEn: 'Every dossier screened',
            },
            {
              icon: Lock,
              textFr: 'Stockage chiffré TLS',
              textEn: 'TLS encrypted document storage',
              subFr: 'Sécurité de bout en bout',
              subEn: 'End-to-end security',
            },
            {
              icon: CheckCircle2,
              textFr: "Piste d'audit immuable",
              textEn: 'Immutable audit trail',
              subFr: 'Traçabilité complète',
              subEn: 'Full traceability',
            },
            {
              icon: Smartphone,
              textFr: 'Authentification multi-facteurs',
              textEn: 'Multi-factor authentication',
              subFr: 'MFA disponible',
              subEn: 'MFA available',
            },
          ].map((item, i) => (
            <div key={`feature-${i}`} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                <item.icon size={16} className="text-gold-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{t(item.textFr, item.textEn)}</p>
                <p className="text-white/40 text-xs">{t(item.subFr, item.subEn)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="relative z-10 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/40 text-xs leading-relaxed">
            {t(
              "GL Capital n'exécute pas de transactions financières et ne détient pas de licences bancaires. Toutes les transactions sont exécutées par des institutions dûment agréées.",
              'GL Capital does not execute financial transactions or hold banking licenses. All transactions are executed by duly licensed institutions.'
            )}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <AppLogo size={32} />
          <span className="text-white font-bold">GL Capital</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          {/* ── Email Verification Pending Screen ── */}
          {verificationSent ? (
            <div className="animate-scale-in">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-5">
                  <MailCheck size={36} className="text-gold-400" />
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">
                  {t('Vérifiez votre email', 'Verify your email')}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  {t(
                    'Nous avons envoyé un lien de vérification à',
                    'We sent a verification link to'
                  )}
                  <br />
                  <span className="text-gold-400 font-mono font-semibold">{registeredEmail}</span>
                </p>
              </div>

              <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5 mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/70 text-xs">
                    {t(
                      "Cliquez sur le lien dans l'email pour activer votre compte",
                      'Click the link in the email to activate your account'
                    )}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/70 text-xs">
                    {t('Le lien expire dans 24 heures', 'The link expires in 24 hours')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/70 text-xs">
                    {t(
                      "Vérifiez votre dossier spam si vous ne voyez pas l'email",
                      'Check your spam folder if you do not see the email'
                    )}
                  </p>
                </div>
              </div>

              {/* Resend button */}
              <button
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || isLoading}
                className="w-full py-3 flex items-center justify-center gap-2 border border-gold-500/40 text-gold-400 hover:bg-gold-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-xl transition-all duration-200 mb-4"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {resendCooldown > 0
                  ? t(`Renvoyer dans ${resendCooldown}s`, `Resend in ${resendCooldown}s`)
                  : t("Renvoyer l'email de vérification", 'Resend verification email')}
              </button>

              <button
                onClick={() => {
                  setVerificationSent(false);
                  setMode('login');
                }}
                className="w-full text-white/40 text-sm hover:text-white/60 transition-colors py-2"
              >
                {t('← Retour à la connexion', '← Back to sign in')}
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              {!mfaStep && (
                <div className="flex bg-navy-800 rounded-xl p-1 mb-8">
                  {(['login', 'register'] as AuthMode[]).map((m) => (
                    <button
                      key={`tab-${m}`}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        mode === m
                          ? 'bg-gold-500 text-navy-900 shadow-gold'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {m === 'login'
                        ? t('Connexion', 'Sign In')
                        : t('Créer un compte', 'Create Account')}
                    </button>
                  ))}
                </div>
              )}

              {/* MFA Step */}
              {mfaStep ? (
                <div className="animate-scale-in">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
                      <Smartphone size={28} className="text-gold-400" />
                    </div>
                    <h2 className="text-white text-2xl font-bold mb-2">
                      {t('Authentification à deux facteurs', 'Two-Factor Authentication')}
                    </h2>
                    <p className="text-white/50 text-sm">
                      {t(
                        "Entrez le code à 6 chiffres affiché par votre application d'authentification (Google Authenticator, Authy, etc.).",
                        'Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.).'
                      )}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-navy-800 border border-navy-600 text-white text-center text-3xl font-mono tracking-[0.5em] px-4 py-4 rounded-xl focus:outline-none focus:border-gold-500 transition-colors"
                    />
                    <button
                      onClick={handleMfaSubmit}
                      disabled={mfaCode.length < 6 || isLoading}
                      className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-900 font-semibold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                      ) : (
                        <>
                          {t('Vérifier & Se connecter', 'Verify & Sign In')}{' '}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleMfaBack}
                      className="w-full text-white/40 text-sm hover:text-white/60 transition-colors py-2"
                    >
                      {t('← Retour à la connexion', '← Back to login')}
                    </button>
                  </div>
                </div>
              ) : mode === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                  <div>
                    <h2 className="text-white text-2xl font-bold mb-1">
                      {t('Bon retour', 'Welcome back')}
                    </h2>
                    <p className="text-white/40 text-sm">
                      {t(
                        'Connectez-vous à votre portail GL Capital',
                        'Sign in to your GL Capital portal'
                      )}
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1.5">
                      {t('Adresse email', 'Email address')}
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type="email"
                        {...loginForm.register('email', {
                          required: t('Email requis', 'Email is required'),
                        })}
                        placeholder="vous@votreentreprise.com"
                        className="w-full bg-navy-800 border border-navy-600 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1.5">
                      {t('Mot de passe', 'Password')}
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm.register('password', {
                          required: t('Mot de passe requis', 'Password is required'),
                        })}
                        placeholder="••••••••••"
                        className="w-full bg-navy-800 border border-navy-600 text-white pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...loginForm.register('remember')}
                        className="w-4 h-4 accent-gold-500 rounded"
                      />
                      <span className="text-white/50 text-sm">
                        {t('Se souvenir de moi', 'Remember me')}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-gold-400 text-sm hover:text-gold-300 transition-colors"
                    >
                      {t('Mot de passe oublié ?', 'Forgot password?')}
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-navy-900 font-semibold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('Se connecter au portail', 'Sign In to Portal')} <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                  <div>
                    <h2 className="text-white text-2xl font-bold mb-1">
                      {t('Créer votre compte', 'Create your account')}
                    </h2>
                    <p className="text-white/40 text-sm">
                      {t(
                        'Accédez au portail sécurisé GL Capital',
                        'Access the GL Capital secure portal'
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/70 text-xs font-medium mb-1.5">
                        {t('Prénom', 'First Name')}
                      </label>
                      <input
                        {...registerForm.register('firstName', {
                          required: t('Requis', 'Required'),
                        })}
                        placeholder="Amadou"
                        className="w-full bg-navy-800 border border-navy-600 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-xs font-medium mb-1.5">
                        {t('Nom', 'Last Name')}
                      </label>
                      <input
                        {...registerForm.register('lastName', {
                          required: t('Requis', 'Required'),
                        })}
                        placeholder="Diallo"
                        className="w-full bg-navy-800 border border-navy-600 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-1.5">
                      {t('Email professionnel', 'Professional Email')}
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type="email"
                        {...registerForm.register('email', {
                          required: t('Email requis', 'Email is required'),
                        })}
                        placeholder="vous@votreentreprise.com"
                        className="w-full bg-navy-800 border border-navy-600 text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                    </div>
                    <p className="text-white/30 text-xs mt-1">
                      {t(
                        'Utilisez votre email professionnel. Gmail/Hotmail déconseillé.',
                        'Use your corporate email. Gmail/Hotmail not recommended.'
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-1.5">
                      {t('Organisation / Entreprise', 'Organization / Company')}
                    </label>
                    <div className="relative">
                      <Building2
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        {...registerForm.register('organization', {
                          required: t('Organisation requise', 'Organization is required'),
                        })}
                        placeholder="West Africa Energy Holdings Ltd"
                        className="w-full bg-navy-800 border border-navy-600 text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-1.5">
                      {t("Pays d'immatriculation", 'Country of Registration')}
                    </label>
                    <select
                      {...registerForm.register('country', {
                        required: t('Pays requis', 'Country is required'),
                      })}
                      className="w-full bg-navy-800 border border-navy-600 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm"
                    >
                      <option value="">{t('Sélectionner un pays...', 'Select country...')}</option>
                      <option value="FR">France</option>
                      <option value="DE">Germany</option>
                      <option value="GB">United Kingdom</option>
                      <option value="SN">Senegal</option>
                      <option value="CI">Côte d&apos;Ivoire</option>
                      <option value="NG">Nigeria</option>
                      <option value="MA">Morocco</option>
                      <option value="ZA">South Africa</option>
                      <option value="AE">UAE</option>
                      <option value="SG">Singapore</option>
                      <option value="OTHER">{t('Autre', 'Other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-1.5">
                      {t('Mot de passe', 'Password')}
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerForm.register('password', {
                          required: t('Mot de passe requis', 'Password is required'),
                          minLength: {
                            value: 10,
                            message: t('Minimum 10 caractères', 'Minimum 10 characters'),
                          },
                          pattern: {
                            value: /(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
                            message: t(
                              'Doit inclure majuscule, chiffre et caractère spécial',
                              'Must include uppercase, number, and special character'
                            ),
                          },
                        })}
                        placeholder={t(
                          'Min. 10 car., majuscule, chiffre, symbole',
                          'Min. 10 chars, uppercase, number, symbol'
                        )}
                        className="w-full bg-navy-800 border border-navy-600 text-white pl-9 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-red-400 text-xs mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-1.5">
                      {t('Confirmer le mot de passe', 'Confirm Password')}
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerForm.register('confirmPassword', {
                          required: t(
                            'Veuillez confirmer votre mot de passe',
                            'Please confirm your password'
                          ),
                        })}
                        placeholder={t('Répéter le mot de passe', 'Repeat password')}
                        className="w-full bg-navy-800 border border-navy-600 text-white pl-9 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 transition-colors text-sm placeholder:text-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-gold-500/5 border border-gold-500/20 rounded-xl space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...registerForm.register('acceptTerms', { required: true })}
                        className="mt-0.5 accent-gold-500"
                      />
                      <span className="text-white/60 text-xs leading-relaxed">
                        {t("J'accepte les ", 'I accept the ')}
                        <span className="text-gold-400 underline cursor-pointer">
                          {t("Conditions d'utilisation", 'Terms of Use')}
                        </span>
                        {t(' et la ', ' and ')}
                        <span className="text-gold-400 underline cursor-pointer">
                          {t('Politique de confidentialité', 'Privacy Policy')}
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...registerForm.register('acceptNcnda', { required: true })}
                        className="mt-0.5 accent-gold-500"
                      />
                      <span className="text-white/60 text-xs leading-relaxed">
                        {t('Je reconnais le cadre ', 'I acknowledge the ')}
                        <span className="text-gold-400 underline cursor-pointer">NCNDA</span>
                        {t(
                          ' - la non-divulgation des partenaires est obligatoire et contraignante',
                          ' framework - partner non-disclosure is mandatory and binding'
                        )}
                      </span>
                    </label>
                  </div>

                  {/* Email verification notice */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2">
                    <MailCheck size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-300 text-xs leading-relaxed">
                      {t(
                        "Un email de vérification sera envoyé à votre adresse. Votre compte doit être vérifié avant d'accéder au portail.",
                        'A verification email will be sent to your address. Your account must be verified before you can access the portal.'
                      )}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-navy-900 font-semibold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('Créer un compte sécurisé', 'Create Secure Account')}{' '}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Back to site */}
          <div className="mt-6 text-center">
            <Link
              href="/home-page"
              className="text-white/30 text-xs hover:text-white/50 transition-colors"
            >
              {t('← Retour au site GL Capital', '← Return to GL Capital website')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
