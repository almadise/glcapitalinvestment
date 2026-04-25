'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { insertCaseFileWithSchemaFallback } from '@/lib/supabase/caseFiles';
import {
  Building2,
  FileText,
  DollarSign,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Info,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { trackDossierEvent } from '@/lib/analytics/trackEvent';

interface IdentityForm {
  orgName: string;
  orgCountry: string;
  registryNumber: string;
  orgType: string;
  uboName: string;
  uboNationality: string;
  uboOwnership: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

interface ProjectForm {
  projectName: string;
  sector: string;
  projectCountry: string;
  totalBudget: string;
  currency: string;
  requestType: string;
  projectDescription: string;
}

interface FinancingForm {
  debtAmount: string;
  equityAmount: string;
  maturity: string;
  guaranteeType: string;
  fundSource: string;
  additionalNotes: string;
}

const STEPS = [
  { num: 1, icon: Building2 },
  { num: 2, icon: FileText },
  { num: 3, icon: DollarSign },
  { num: 4, icon: CheckCircle2 },
];

const ORG_TYPES = ['SA', 'SARL', 'SAS', 'LLC', 'LTD', 'GmbH', 'SPA', 'Autre'];
const SECTORS = [
  'Énergie & Utilities',
  'Infrastructure & Transport',
  'Immobilier & Construction',
  'Agro-industrie',
  'Mines & Ressources naturelles',
  'Technologie & Télécoms',
  'Santé & Pharmaceutique',
  'Finance & Services',
  'Autre',
];
const COUNTRIES = [
  { code: 'SN', label: 'Sénégal' },
  { code: 'CI', label: "Côte d\'Ivoire" },
  { code: 'NG', label: 'Nigeria' },
  { code: 'MA', label: 'Maroc' },
  { code: 'CM', label: 'Cameroun' },
  { code: 'GH', label: 'Ghana' },
  { code: 'KE', label: 'Kenya' },
  { code: 'ZA', label: 'Afrique du Sud' },
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'AE', label: 'Émirats arabes unis' },
  { code: 'SG', label: 'Singapour' },
  { code: 'OTHER', label: 'Autre' },
];
const REQUEST_TYPES = [
  'Project Finance',
  'Financement de dette',
  'Financement mezzanine',
  'Instrument bancaire (SBLC/BG)',
  'Conseil en structuration',
  'Autre',
];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'XOF', 'MAD', 'NGN'];
const GUARANTEE_TYPES = ['Garantie bancaire', 'Hypothèque', 'Nantissement', 'SBLC', 'Caution solidaire', 'Aucune'];
const FUND_SOURCES = [
  'Fonds propres',
  'Revenus opérationnels',
  'Investisseurs privés',
  'Fonds institutionnels',
  'Autre',
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <AlertCircle size={11} />
      {message}
    </p>
  );
}

export default function NewCaseFileWizard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  const identityForm = useForm<IdentityForm>({ mode: 'onTouched' });
  const projectForm = useForm<ProjectForm>({ mode: 'onTouched' });
  const financingForm = useForm<FinancingForm>({ mode: 'onTouched' });

  const stepLabels = [
    t('Identité', 'Identity'),
    t('Projet', 'Project'),
    t('Financement', 'Financing'),
    t('Révision', 'Review'),
  ];

  const handleNext = async () => {
    let valid = true;
    if (step === 1) valid = await identityForm.trigger();
    if (step === 2) valid = await projectForm.trigger();
    if (step === 3) valid = await financingForm.trigger();
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('Vous devez être connecté.', 'You must be signed in.'));
      return;
    }
    setIsSubmitting(true);
    try {
      const id = identityForm.getValues();
      const pr = projectForm.getValues();
      const fi = financingForm.getValues();

      const ref = `GLC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const additionalNotes = fi.additionalNotes?.trim();
      const amountDisplay = `${pr.currency || 'EUR'} ${pr.totalBudget}`.trim();
      const metadataPayload: Record<string, unknown> = {};
      if (additionalNotes) metadataPayload.additional_notes = additionalNotes;
      if (pr.totalBudget?.trim()) metadataPayload.amount_display = amountDisplay;
      metadataPayload.completeness_percent = 20;

      const { removedColumns } = await insertCaseFileWithSchemaFallback({
        supabase,
        payload: {
        user_id: user.id,
        ref,
        org_name: id.orgName,
        org_country: id.orgCountry,
        registry_number: id.registryNumber,
        org_type: id.orgType,
        ubo_name: id.uboName,
        ubo_nationality: id.uboNationality,
        ubo_ownership: id.uboOwnership,
        contact_name: id.contactName,
        contact_email: id.contactEmail,
        contact_phone: id.contactPhone,
        project_name: pr.projectName,
        sector: pr.sector,
        project_country: pr.projectCountry,
        total_budget: pr.totalBudget,
        currency: pr.currency || 'EUR',
        request_type: pr.requestType,
        project_description: pr.projectDescription,
        debt_amount: fi.debtAmount,
        equity_amount: fi.equityAmount,
        maturity: fi.maturity,
        guarantee_type: fi.guaranteeType,
        fund_source: fi.fundSource,
        metadata: Object.keys(metadataPayload).length > 0 ? metadataPayload : null,
        status: 'RECU',
        type: pr.requestType || 'Project Finance',
        },
      });
      if (removedColumns.length > 0) {
        console.warn('case_files insert fallback removed columns:', removedColumns);
      }

      await supabase.from('compliance_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'STATUS_CHANGE',
        target_ref: ref,
        detail: `New case file initiated by client via dedicated form`,
        severity: 'info',
      });

      setSubmittedRef(ref);
      trackDossierEvent('dossier_created', ref, {
        channel: 'client-dashboard',
        request_type: pr.requestType || 'Project Finance',
      });
      toast.success(t(`Dossier créé - Référence : ${ref}`, `Case file created - Reference: ${ref}`));
    } catch (err: any) {
      toast.error(err.message || t('Échec de la création. Veuillez réessayer.', 'Creation failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submittedRef) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy mb-2">
          {t('Dossier initié avec succès', 'Case File Successfully Initiated')}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          {t(
            'Votre dossier a été enregistré et sera examiné par notre équipe sous 1 à 3 jours ouvrables.',
            'Your case file has been recorded and will be reviewed by our team within 1–3 business days.'
          )}
        </p>

        <div className="bg-navy rounded-2xl p-6 mb-6 text-left">
          <p className="text-white/50 text-xs font-mono uppercase tracking-wider mb-2">
            {t('Numéro de référence', 'Reference Number')}
          </p>
          <p className="text-gold text-3xl font-mono font-bold tracking-wider">{submittedRef}</p>
          <p className="text-white/40 text-xs mt-3">
            {t(
              'Conservez cette référence pour toutes vos communications.',
              'Keep this reference for all your communications.'
            )}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-xs font-semibold mb-1">{t('Prochaines étapes', 'Next steps')}</p>
              <ul className="text-amber-700 text-xs space-y-1">
                <li>• {t('Ajoutez vos documents depuis "Mes dossiers"', 'Add your documents from "My files"')}</li>
                <li>• {t('Notre équipe vous contactera si des informations sont manquantes', 'Our team will contact you if information is missing')}</li>
                <li>• {t('Suivez l\'avancement depuis votre tableau de bord', 'Track progress from your dashboard')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/client-dashboard/case-files"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition-colors text-sm"
          >
            <FileText size={15} />
            {t('Voir mes dossiers', 'View my files')}
          </Link>
          <button
            onClick={() => {
              setSubmittedRef('');
              setStep(1);
              identityForm.reset();
              projectForm.reset();
              financingForm.reset();
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm"
          >
            {t('Nouveau dossier', 'New case file')}
          </button>
        </div>
      </div>
    );
  }

  const identityVals = identityForm.watch();
  const projectVals = projectForm.watch();
  const financingVals = financingForm.watch();

  return (
    <div className="max-w-3xl mx-auto">
      <Toaster richColors position="top-right" />

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/client-dashboard"
          className="p-2 rounded-xl text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">
            {t('Initier un nouveau dossier', 'Initiate a New Case File')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {t(
              'Remplissez les informations requises pour créer votre dossier de financement.',
              'Fill in the required information to create your financing case file.'
            )}
          </p>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => s.num < step && setStep(s.num)}
                className="flex flex-col items-center gap-2 group"
                disabled={s.num >= step}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    s.num < step
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : s.num === step
                      ? 'bg-navy border-navy text-white' :'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {s.num < step ? <CheckCircle2 size={18} /> : <s.icon size={16} />}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    s.num === step ? 'text-navy' : s.num < step ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {stepLabels[i]}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                    s.num < step ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* ── STEP 1: Identity ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">{t('Identité de l\'organisation', 'Organization Identity')}</h2>
                <p className="text-slate-500 text-xs">{t('Entité juridique et propriétaire effectif', 'Legal entity and beneficial owner')}</p>
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                {t('Entité juridique', 'Legal Entity')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Dénomination sociale', 'Legal Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...identityForm.register('orgName', { required: t('Champ requis', 'Required') })}
                    placeholder="West Africa Energy Holdings Ltd"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                  />
                  <FieldError message={identityForm.formState.errors.orgName?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Pays d\'immatriculation', 'Country of Registration')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...identityForm.register('orgCountry', { required: t('Champ requis', 'Required') })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                  >
                    <option value="">{t('Sélectionner...', 'Select...')}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <FieldError message={identityForm.formState.errors.orgCountry?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Numéro de registre', 'Registry Number')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...identityForm.register('registryNumber', { required: t('Champ requis', 'Required') })}
                    placeholder="SN-2019-00847"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-navy transition-colors"
                  />
                  <FieldError message={identityForm.formState.errors.registryNumber?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Forme juridique', 'Legal Form')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...identityForm.register('orgType', { required: t('Champ requis', 'Required') })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                  >
                    <option value="">{t('Sélectionner...', 'Select...')}</option>
                    {ORG_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <FieldError message={identityForm.formState.errors.orgType?.message} />
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 pt-2">
                {t('Propriétaire effectif (UBO)', 'Beneficial Owner (UBO)')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Nom complet UBO', 'UBO Full Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...identityForm.register('uboName', { required: t('Champ requis', 'Required') })}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                  />
                  <FieldError message={identityForm.formState.errors.uboName?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Nationalité UBO', 'UBO Nationality')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...identityForm.register('uboNationality', { required: t('Champ requis', 'Required') })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                  >
                    <option value="">{t('Sélectionner...', 'Select...')}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <FieldError message={identityForm.formState.errors.uboNationality?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('% de détention', '% Ownership')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...identityForm.register('uboOwnership', {
                      required: t('Champ requis', 'Required'),
                      pattern: { value: /^\d{1,3}(\.\d{1,2})?$/, message: t('Pourcentage invalide', 'Invalid percentage') },
                    })}
                    placeholder="51"
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                  />
                  <FieldError message={identityForm.formState.errors.uboOwnership?.message} />
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 pt-2">
                {t('Contact principal', 'Primary Contact')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Nom du contact', 'Contact Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...identityForm.register('contactName', { required: t('Champ requis', 'Required') })}
                    placeholder="Marie Diallo"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                  />
                  <FieldError message={identityForm.formState.errors.contactName?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Email du contact', 'Contact Email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...identityForm.register('contactEmail', {
                      required: t('Champ requis', 'Required'),
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('Email invalide', 'Invalid email') },
                    })}
                    type="email"
                    placeholder="contact@company.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                  />
                  <FieldError message={identityForm.formState.errors.contactEmail?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('Téléphone', 'Phone')}
                  </label>
                  <input
                    {...identityForm.register('contactPhone')}
                    placeholder="+221 77 000 00 00"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Project ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">{t('Détails du projet', 'Project Details')}</h2>
                <p className="text-slate-500 text-xs">{t('Nature et périmètre du projet', 'Nature and scope of the project')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Nom du projet', 'Project Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...projectForm.register('projectName', { required: t('Champ requis', 'Required') })}
                  placeholder={t('Centrale solaire 50 MW - Thiès', 'Solar Plant 50 MW - Thiès')}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
                <FieldError message={projectForm.formState.errors.projectName?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Secteur', 'Sector')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...projectForm.register('sector', { required: t('Champ requis', 'Required') })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner...', 'Select...')}</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError message={projectForm.formState.errors.sector?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Pays du projet', 'Project Country')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...projectForm.register('projectCountry', { required: t('Champ requis', 'Required') })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner...', 'Select...')}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <FieldError message={projectForm.formState.errors.projectCountry?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Budget total', 'Total Budget')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...projectForm.register('totalBudget', { required: t('Champ requis', 'Required') })}
                  placeholder="50 000 000"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
                <FieldError message={projectForm.formState.errors.totalBudget?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Devise', 'Currency')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...projectForm.register('currency', { required: t('Champ requis', 'Required') })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner...', 'Select...')}</option>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <FieldError message={projectForm.formState.errors.currency?.message} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Type de demande', 'Request Type')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...projectForm.register('requestType', { required: t('Champ requis', 'Required') })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner...', 'Select...')}</option>
                  {REQUEST_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <FieldError message={projectForm.formState.errors.requestType?.message} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Description du projet', 'Project Description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...projectForm.register('projectDescription', {
                    required: t('Champ requis', 'Required'),
                    minLength: { value: 50, message: t('Minimum 50 caractères', 'Minimum 50 characters') },
                  })}
                  rows={4}
                  placeholder={t(
                    'Décrivez le projet, ses objectifs, son impact attendu et son stade de développement...',
                    'Describe the project, its objectives, expected impact and development stage...'
                  )}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors resize-none"
                />
                <FieldError message={projectForm.formState.errors.projectDescription?.message} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Financing ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                <DollarSign size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">{t('Plan de financement', 'Financing Plan')}</h2>
                <p className="text-slate-500 text-xs">{t('Structure financière et garanties', 'Financial structure and guarantees')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Montant dette demandé', 'Debt Amount Requested')}
                </label>
                <input
                  {...financingForm.register('debtAmount')}
                  placeholder="35 000 000"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Apport en fonds propres', 'Equity Contribution')}
                </label>
                <input
                  {...financingForm.register('equityAmount')}
                  placeholder="15 000 000"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Maturité souhaitée', 'Desired Maturity')}
                </label>
                <input
                  {...financingForm.register('maturity')}
                  placeholder={t('Ex : 10 ans', 'E.g. 10 years')}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Type de garantie', 'Guarantee Type')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...financingForm.register('guaranteeType', { required: t('Champ requis', 'Required') })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner...', 'Select...')}</option>
                  {GUARANTEE_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <FieldError message={financingForm.formState.errors.guaranteeType?.message} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Origine des fonds', 'Source of Funds')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...financingForm.register('fundSource', { required: t('Champ requis', 'Required') })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner...', 'Select...')}</option>
                  {FUND_SOURCES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <FieldError message={financingForm.formState.errors.fundSource?.message} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('Notes additionnelles', 'Additional Notes')}
                </label>
                <textarea
                  {...financingForm.register('additionalNotes')}
                  rows={3}
                  placeholder={t(
                    'Informations complémentaires sur la structure de financement...',
                    'Additional information about the financing structure...'
                  )}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors resize-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <Shield size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs">
                {t(
                  'Toutes les informations financières sont traitées sous protocoles KYC/AML stricts et restent strictement confidentielles.',
                  'All financial information is processed under strict KYC/AML protocols and remains strictly confidential.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ───────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">{t('Révision & Confirmation', 'Review & Confirm')}</h2>
                <p className="text-slate-500 text-xs">{t('Vérifiez les informations avant de soumettre', 'Verify information before submitting')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Identity summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-navy" />
                    <span className="text-sm font-semibold text-navy">{t('Identité', 'Identity')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-gold hover:text-gold/80 font-medium transition-colors"
                  >
                    {t('Modifier', 'Edit')}
                  </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <ReviewRow label={t('Organisation', 'Organization')} value={identityVals.orgName} />
                  <ReviewRow label={t('Pays', 'Country')} value={identityVals.orgCountry} />
                  <ReviewRow label={t('Registre', 'Registry')} value={identityVals.registryNumber} />
                  <ReviewRow label={t('Forme', 'Form')} value={identityVals.orgType} />
                  <ReviewRow label={t('UBO', 'UBO')} value={identityVals.uboName} />
                  <ReviewRow label={t('Contact', 'Contact')} value={identityVals.contactName} />
                  <ReviewRow label={t('Email', 'Email')} value={identityVals.contactEmail} />
                </div>
              </div>

              {/* Project summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-navy" />
                    <span className="text-sm font-semibold text-navy">{t('Projet', 'Project')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-gold hover:text-gold/80 font-medium transition-colors"
                  >
                    {t('Modifier', 'Edit')}
                  </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <ReviewRow label={t('Nom', 'Name')} value={projectVals.projectName} />
                  <ReviewRow label={t('Secteur', 'Sector')} value={projectVals.sector} />
                  <ReviewRow label={t('Pays', 'Country')} value={projectVals.projectCountry} />
                  <ReviewRow label={t('Budget', 'Budget')} value={`${projectVals.currency} ${projectVals.totalBudget}`} />
                  <ReviewRow label={t('Type', 'Type')} value={projectVals.requestType} />
                </div>
              </div>

              {/* Financing summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-navy" />
                    <span className="text-sm font-semibold text-navy">{t('Financement', 'Financing')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-gold hover:text-gold/80 font-medium transition-colors"
                  >
                    {t('Modifier', 'Edit')}
                  </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <ReviewRow label={t('Dette', 'Debt')} value={financingVals.debtAmount || '-'} />
                  <ReviewRow label={t('Fonds propres', 'Equity')} value={financingVals.equityAmount || '-'} />
                  <ReviewRow label={t('Garantie', 'Guarantee')} value={financingVals.guaranteeType} />
                  <ReviewRow label={t('Origine fonds', 'Fund Source')} value={financingVals.fundSource} />
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 text-xs">
                  {t(
                    'En soumettant ce dossier, vous confirmez que toutes les informations fournies sont exactes et complètes. Votre dossier sera examiné sous 1 à 3 jours ouvrables.',
                    'By submitting this case file, you confirm that all information provided is accurate and complete. Your file will be reviewed within 1–3 business days.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-xl hover:bg-slate-100"
          >
            <ChevronLeft size={16} />
            {t('Précédent', 'Previous')}
          </button>

          <span className="text-xs text-slate-400 font-medium">
            {t(`Étape ${step} sur 4`, `Step ${step} of 4`)}
          </span>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors active:scale-95"
            >
              {t('Suivant', 'Next')}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold text-navy text-sm font-bold rounded-xl hover:bg-gold/90 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" />{t('Création...', 'Creating...')}</>
              ) : (
                <><CheckCircle2 size={15} />{t('Créer le dossier', 'Create Case File')}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 truncate">{value || '-'}</span>
    </div>
  );
}
