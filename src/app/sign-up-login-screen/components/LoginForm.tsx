'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Smartphone,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

type RegisterValues = {
  fullName: string;
  organization: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  notifDossierUpdates: boolean;
  notifPipelineAlerts: boolean;
  notifDocumentsPending: boolean;
};

export default function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, signUp, verifyMfa, signOut, getRoleRedirect } = useAuth();
  const router = useRouter();
  const { lang } = useLanguage();
  const emailPlaceholder = lang === 'fr' ? 'vous@exemple.com' : 'you@example.com';

  // Simple useState for login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  const registerForm = useForm<RegisterValues>({
    defaultValues: {
      fullName: '',
      organization: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      notifDossierUpdates: true,
      notifPipelineAlerts: true,
      notifDocumentsPending: true,
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = "L'email est requis.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Email invalide.';
    if (!password) errors.password = 'Le mot de passe est requis.';
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    setLoginErrors({});
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await signIn(email, password);
      if (data.needsMfa) {
        setMfaStep(true);
        return;
      }
      toast.success('Connexion réussie - Bienvenue !');
      router.push(getRoleRedirect());
      router.refresh();
    } catch (err: any) {
      const msg = err?.message || 'Identifiants invalides. Veuillez réessayer.';
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length < 6) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      await verifyMfa(mfaCode);
      toast.success('Connexion réussie - Bienvenue !');
      router.push(getRoleRedirect());
      router.refresh();
    } catch (err: any) {
      setAuthError(err?.message || 'Code invalide ou expiré. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaBack = async () => {
    setMfaStep(false);
    setMfaCode('');
    setAuthError(null);
    await signOut();
  };

  const handleRegister = async (data: RegisterValues) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', {
        message: 'Les mots de passe ne correspondent pas.',
      });
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      await signUp(data.email, data.password, {
        fullName: data.fullName,
        notif_dossier_updates: data.notifDossierUpdates,
        notif_pipeline_alerts: data.notifPipelineAlerts,
        notif_documents_pending: data.notifDocumentsPending,
      });
      toast.success('Compte créé - Vérifiez votre email pour confirmer votre inscription.');
      router.push('/verify-email');
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de la création du compte.';
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <Toaster richColors position="top-right" />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-gradient-navy flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(201,168,76,1) 40px,rgba(201,168,76,1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(201,168,76,1) 40px,rgba(201,168,76,1) 41px)`,
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-navy-dark/60 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
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

        {/* Center content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-gold text-xs font-semibold tracking-widest uppercase">
              Portail sécurisé
            </span>
          </div>
          <h2 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-5">
            Accédez à votre
            <br />
            <span className="text-gradient-gold">espace dossiers</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-md mb-8">
            Suivez en temps réel le statut de vos dossiers de financement, téléchargez vos documents
            et échangez de façon sécurisée avec nos analystes.
          </p>

          {/* Features */}
          <div className="space-y-3">
            {[
              {
                icon: Shield,
                label: 'Chiffrement de bout en bout',
                sub: 'Documents protégés par URLs signées',
              },
              {
                icon: Lock,
                label: 'Authentification sécurisée',
                sub: 'Supabase Auth · MFA disponible',
              },
              { icon: Building2, label: 'Confidentialité NCNDA', sub: 'Partenaires non divulgués' },
            ].map((f) => (
              <div key={`feature-${f.label}`} className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <f.icon size={16} className="text-gold" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{f.label}</div>
                  <div className="text-slate-500 text-xs">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-600 border-t border-white/10 pt-6">
          GL Capital n&apos;est pas une banque. Aucun dépôt n&apos;est accepté. Aucun rendement
          n&apos;est garanti.
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-14 xl:px-20 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-6 sm:mb-8">
          <AppLogo size={32} />
          <span className="font-display text-navy font-bold text-base">GL Capital</span>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6 sm:mb-8">
            <button
              onClick={() => {
                setMode('login');
                setAuthError(null);
                setMfaStep(false);
                setMfaCode('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setMode('register');
                setAuthError(null);
                setMfaStep(false);
                setMfaCode('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && mfaStep && (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={26} className="text-gold" />
                </div>
                <h2 className="font-display text-xl font-bold text-navy mb-2">
                  Authentification à deux facteurs
                </h2>
                <p className="text-slate-500 text-sm">
                  Entrez le code à 6 chiffres de votre application d&apos;authentification.
                </p>
              </div>
              <div>
                <label className="label-field">Code de vérification</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="input-field text-center text-2xl font-mono tracking-[0.4em]"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || mfaCode.length < 6}
                className="w-full flex items-center justify-center gap-2.5 bg-navy text-white font-bold py-3.5 rounded-xl hover:bg-navy-light active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ minHeight: '52px' }}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Valider et se connecter <ArrowRight size={16} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleMfaBack}
                className="w-full text-slate-500 text-sm hover:text-navy py-2"
              >
                ← Retour à la connexion
              </button>
              {authError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm leading-snug">{authError}</p>
                </div>
              )}
            </form>
          )}

          {mode === 'login' && !mfaStep && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label-field">Adresse email</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    placeholder={emailPlaceholder}
                    className="input-field pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-red-500 text-xs mt-1.5">{loginErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-field">Mot de passe</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-gold hover:text-gold-light transition-colors font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-red-500 text-xs mt-1.5">{loginErrors.password}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-slate-300 text-navy accent-navy"
                />
                <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
                  Se souvenir de moi pendant 30 jours
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-navy text-white font-bold py-3.5 rounded-xl hover:bg-navy-light active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ minHeight: '52px' }}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Se connecter
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Auth error displayed below submit button */}
              {authError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm leading-snug">{authError}</p>
                </div>
              )}
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className="label-field">Nom complet</label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Prénom Nom"
                    className="input-field pl-10"
                    {...registerForm.register('fullName', { required: 'Le nom est requis.' })}
                  />
                </div>
                {registerForm.formState.errors.fullName && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {registerForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label-field">Organisation / Société</label>
                <p className="text-xs text-slate-500 mb-1.5">Nom légal de votre entité juridique</p>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Example Corp SA"
                    className="input-field pl-10"
                    {...registerForm.register('organization', {
                      required: "L'organisation est requise.",
                    })}
                  />
                </div>
                {registerForm.formState.errors.organization && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {registerForm.formState.errors.organization.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label-field">Email professionnel</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    placeholder="vous@votre-entreprise.com"
                    className="input-field pl-10"
                    {...registerForm.register('email', {
                      required: "L'email est requis.",
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide.' },
                    })}
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Mot de passe</label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input-field pl-9 pr-9 text-sm"
                      {...registerForm.register('password', {
                        required: 'Requis.',
                        minLength: { value: 8, message: 'Min. 8 caractères.' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label-field">Confirmation</label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input-field pl-9 pr-9 text-sm"
                      {...registerForm.register('confirmPassword', { required: 'Requis.' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-navy"
                  {...registerForm.register('acceptTerms', {
                    required: 'Vous devez accepter les conditions.',
                  })}
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-slate-600 leading-relaxed cursor-pointer"
                >
                  J&apos;accepte les{' '}
                  <a href="#" className="text-navy underline hover:text-gold">
                    conditions d&apos;utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-navy underline hover:text-gold">
                    politique de confidentialité
                  </a>
                  . Je confirme que les informations fournies sont exactes et traçables.
                </label>
              </div>
              {registerForm.formState.errors.acceptTerms && (
                <p className="text-red-500 text-xs">
                  {registerForm.formState.errors.acceptTerms.message}
                </p>
              )}

              {/* Notification preferences */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-700 mb-3">
                  {lang === 'fr'
                    ? 'Préférences de notifications email'
                    : 'Email notification preferences'}
                </p>
                <div className="space-y-2.5">
                  {[
                    {
                      name: 'notifDossierUpdates' as const,
                      label: lang === 'fr' ? 'Mises à jour de mes dossiers' : 'My file updates',
                    },
                    {
                      name: 'notifPipelineAlerts' as const,
                      label:
                        lang === 'fr' ? 'Alertes pipeline & statuts' : 'Pipeline & status alerts',
                    },
                    {
                      name: 'notifDocumentsPending' as const,
                      label:
                        lang === 'fr'
                          ? 'Documents en attente de dépôt'
                          : 'Documents pending upload',
                    },
                  ].map(({ name, label }) => (
                    <div key={name} className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id={name}
                        className="w-4 h-4 rounded border-slate-300 accent-navy"
                        {...registerForm.register(name)}
                      />
                      <label htmlFor={name} className="text-xs text-slate-600 cursor-pointer">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-navy text-white font-bold py-3.5 rounded-xl hover:bg-navy-light active:scale-[0.99] transition-all duration-150 disabled:opacity-60"
                style={{ minHeight: '52px' }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Créer mon compte'}
              </button>

              {/* Auth error displayed below submit button */}
              {authError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm leading-snug">{authError}</p>
                </div>
              )}
            </form>
          )}

          {/* Back to site */}
          <div className="mt-6 text-center">
            <Link
              href="/home-page"
              className="text-xs text-slate-500 hover:text-navy transition-colors"
            >
              ← Retour au site institutionnel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
