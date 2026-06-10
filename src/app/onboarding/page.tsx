'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import {
  User,
  Building2,
  Briefcase,
  Globe,
  Phone,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'client', labelFr: 'Client / Porteur de projet', labelEn: 'Client / Project Owner' },
  { value: 'investor', labelFr: 'Investisseur', labelEn: 'Investor' },
  { value: 'intermediary', labelFr: 'Intermédiaire / Courtier', labelEn: 'Intermediary / Broker' },
  { value: 'legal', labelFr: 'Conseil juridique / Notaire', labelEn: 'Legal Counsel / Notary' },
  { value: 'other', labelFr: 'Autre', labelEn: 'Other' },
];

const COUNTRY_OPTIONS = [
  'France',
  'Belgique',
  'Suisse',
  'Luxembourg',
  'Maroc',
  'Sénégal',
  "Côte d'Ivoire",
  'Cameroun',
  'Gabon',
  'Congo',
  'RDC',
  'Tunisie',
  'Algérie',
  'Mauritanie',
  'Royaume-Uni',
  'États-Unis',
  'Canada',
  'Émirats Arabes Unis',
  'Qatar',
  'Autre',
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    organization: '',
    jobTitle: '',
    phone: '',
    country: '',
    roleDetail: '',
    projectType: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-up-login-screen');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.user_metadata?.full_name || '',
      }));
    }
  }, [user]);

  const t = {
    title: { fr: 'Complétez votre profil', en: 'Complete Your Profile' },
    subtitle: {
      fr: 'Quelques informations pour personnaliser votre expérience GL Capital.',
      en: 'A few details to personalize your GL Capital experience.',
    },
    step1Title: { fr: 'Informations personnelles', en: 'Personal Information' },
    step2Title: { fr: 'Votre organisation', en: 'Your Organization' },
    fullName: { fr: 'Nom complet', en: 'Full name' },
    phone: { fr: 'Téléphone (optionnel)', en: 'Phone (optional)' },
    country: { fr: 'Pays', en: 'Country' },
    organization: { fr: 'Organisation / Société', en: 'Organization / Company' },
    jobTitle: { fr: 'Fonction / Poste', en: 'Job Title / Role' },
    roleDetail: { fr: 'Votre rôle dans ce projet', en: 'Your role in this project' },
    projectType: { fr: 'Type de projet (optionnel)', en: 'Project type (optional)' },
    next: { fr: 'Continuer', en: 'Continue' },
    finish: { fr: 'Accéder au tableau de bord', en: 'Access Dashboard' },
    skip: { fr: 'Passer cette étape', en: 'Skip this step' },
    selectCountry: { fr: 'Sélectionnez un pays', en: 'Select a country' },
    selectRole: { fr: 'Sélectionnez votre rôle', en: 'Select your role' },
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: form.fullName.trim() || null,
          organization: form.organization.trim() || null,
          job_title: form.jobTitle.trim() || null,
          phone: form.phone.trim() || null,
          country: form.country || null,
          role_detail: form.roleDetail || null,
          project_type: form.projectType.trim() || null,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;
      router.push('/client-dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/client-dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo size={32} />
          <span className="font-display text-navy font-bold text-base">GL Capital</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setLang('fr')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
          >
            FR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
          >
            EN
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 max-w-lg w-full">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    step > s
                      ? 'bg-emerald-500 text-white'
                      : step === s
                        ? 'bg-navy text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s ? <CheckCircle2 size={14} /> : s}
                </div>
                {s < 2 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <h1 className="font-display text-2xl font-bold text-navy mb-1">{t.title[lang]}</h1>
          <p className="text-slate-500 text-sm mb-7">{t.subtitle[lang]}</p>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3">{t.step1Title[lang]}</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t.fullName[lang]}
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Jean Dupont"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t.phone[lang]}
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t.country[lang]}
                </label>
                <div className="relative">
                  <Globe
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={form.country}
                    onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all appearance-none"
                  >
                    <option value="">{t.selectCountry[lang]}</option>
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
                >
                  {t.next[lang]}
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={handleSkip}
                  className="px-4 py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {t.skip[lang]}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3">{t.step2Title[lang]}</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t.organization[lang]}
                </label>
                <div className="relative">
                  <Building2
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.organization}
                    onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                    placeholder="Example Corp SA"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t.jobTitle[lang]}
                </label>
                <div className="relative">
                  <Briefcase
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    placeholder={lang === 'fr' ? 'Directeur Général' : 'CEO'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t.roleDetail[lang]}
                </label>
                <select
                  value={form.roleDetail}
                  onChange={(e) => setForm((p) => ({ ...p, roleDetail: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all appearance-none"
                >
                  <option value="">{t.selectRole[lang]}</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {lang === 'fr' ? r.labelFr : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t.projectType[lang]}
                </label>
                <input
                  type="text"
                  value={form.projectType}
                  onChange={(e) => setForm((p) => ({ ...p, projectType: e.target.value }))}
                  placeholder={
                    lang === 'fr'
                      ? 'Ex: Infrastructure portuaire, SBLC, Énergie…'
                      : 'E.g. Port infrastructure, SBLC, Energy…'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← {lang === 'fr' ? 'Retour' : 'Back'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {t.finish[lang]}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
