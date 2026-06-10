'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  ChevronRight,
  Loader2,
  RefreshCw,
  CalendarDays,
  Flag,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { caseFileDescription, caseFileLabel, caseFileType } from '@/lib/caseFileLabel';
import { getCaseStatusLabel, type CaseStatus } from '@/lib/caseStatus';

type DossierStatus = CaseStatus;

interface CaseFile {
  id: string;
  ref: string | null;
  status: DossierStatus;
  type: string;
  created_at: string;
  updated_at: string | null;
  description: string | null;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_by_email?: string;
  created_at: string;
}

const PHASES: Array<{
  key: 'SOUMIS' | 'PRE_ANALYSE' | 'CONFORMITE' | 'STRUCTURATION' | 'PRESENTATION' | 'DECISION';
  statuses: DossierStatus[];
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = [
  {
    key: 'SOUMIS',
    statuses: ['RECU'],
    labelFr: 'Soumis',
    labelEn: 'Submitted',
    descFr: 'Votre dossier a ete recu et enregistre dans notre systeme.',
    descEn: 'Your dossier has been received and registered in our system.',
    icon: CheckCircle2,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  {
    key: 'PRE_ANALYSE',
    statuses: ['A_COMPLETER'],
    labelFr: 'Pre-analyse',
    labelEn: 'Pre-analysis',
    descFr: 'Verification des pieces et informations essentielles avant instruction complete.',
    descEn: 'Checking essential documents and information before full review.',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    key: 'CONFORMITE',
    statuses: ['EN_ANALYSE', 'EN_REVUE_COMPLIANCE'],
    labelFr: 'Conformite',
    labelEn: 'Compliance',
    descFr: 'Analyse risque et conformite KYC/AML en cours.',
    descEn: 'Risk and KYC/AML compliance analysis is in progress.',
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    key: 'STRUCTURATION',
    statuses: ['ELIGIBLE'],
    labelFr: 'Structuration',
    labelEn: 'Structuring',
    descFr: 'Le dossier est qualifie et prepare pour presentation institutionnelle.',
    descEn: 'The dossier is qualified and prepared for institutional presentation.',
    icon: Flag,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    key: 'PRESENTATION',
    statuses: ['SOUMIS_PARTENAIRE', 'RETOUR_PARTENAIRE'],
    labelFr: 'Presentation',
    labelEn: 'Presentation',
    descFr: 'Dossier presente aux partenaires et retours en cours de traitement.',
    descEn: 'Dossier submitted to partners, feedback is being processed.',
    icon: FileText,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    key: 'DECISION',
    statuses: ['EN_NEGOCIATION', 'CLOTURE', 'REJETE'],
    labelFr: 'Decision',
    labelEn: 'Decision',
    descFr: 'Negociation finale puis cloture ou reorientation du dossier.',
    descEn: 'Final negotiation then closure or dossier reorientation.',
    icon: CheckCircle2,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
];

const REQUIRED_DOCS_BY_STATUS: Record<string, { fr: string[]; en: string[] }> = {
  A_COMPLETER: {
    fr: [
      "Pièce d'identité valide (passeport ou CNI)",
      'Justificatif de domicile récent (moins de 3 mois)',
      'Statuts de la société (si applicable)',
      'Business plan ou note de présentation du projet',
      'Relevés bancaires des 3 derniers mois',
    ],
    en: [
      'Valid ID document (passport or national ID)',
      'Recent proof of address (less than 3 months)',
      'Company articles of association (if applicable)',
      'Business plan or project presentation note',
      'Bank statements for the last 3 months',
    ],
  },
  RECU: {
    fr: ["Aucune action requise - votre dossier est en cours d'examen initial."],
    en: ['No action required - your file is under initial review.'],
  },
  ELIGIBLE: {
    fr: ['Aucune action requise - votre dossier est éligible.'],
    en: ['No action required - your file is eligible.'],
  },
  CLOTURE: {
    fr: ['Dossier clôturé - aucune action requise.'],
    en: ['File closed - no action required.'],
  },
};

const VALID_STATUSES: DossierStatus[] = [
  'RECU',
  'A_COMPLETER',
  'EN_ANALYSE',
  'EN_REVUE_COMPLIANCE',
  'ELIGIBLE',
  'SOUMIS_PARTENAIRE',
  'RETOUR_PARTENAIRE',
  'EN_NEGOCIATION',
  'CLOTURE',
  'REJETE',
];

function isCaseStatus(value: string): value is DossierStatus {
  return VALID_STATUSES.includes(value as DossierStatus);
}

function getPhaseIndex(status: DossierStatus): number {
  return PHASES.findIndex((phase) => phase.statuses.includes(status));
}

function getNextStepAction(
  status: DossierStatus,
  lang: 'fr' | 'en'
): {
  title: string;
  description: string;
  cta: string;
  href: string;
  severity: 'urgent' | 'neutral';
} {
  if (status === 'A_COMPLETER') {
    return {
      title:
        lang === 'fr'
          ? 'Action prioritaire : completer vos documents'
          : 'Priority action: complete your documents',
      description:
        lang === 'fr'
          ? 'Des pieces sont manquantes. Leur depot permet de relancer immediatement le traitement.'
          : 'Some documents are missing. Uploading them immediately resumes processing.',
      cta: lang === 'fr' ? 'Deposer mes documents' : 'Upload my documents',
      href: '/client-dashboard/documents',
      severity: 'urgent',
    };
  }

  if (status === 'RECU') {
    return {
      title:
        lang === 'fr'
          ? 'Prochaine etape : verification initiale'
          : 'Next step: initial verification',
      description:
        lang === 'fr'
          ? 'Aucune action immediate requise. Vous serez notifie si des pieces sont necessaires.'
          : 'No immediate action required. You will be notified if additional documents are needed.',
      cta: lang === 'fr' ? 'Voir mes notifications' : 'View my notifications',
      href: '/client-dashboard/notifications',
      severity: 'neutral',
    };
  }

  if (status === 'REJETE') {
    return {
      title:
        lang === 'fr'
          ? 'Dossier rejete : reorientation possible'
          : 'Dossier rejected: reorientation possible',
      description:
        lang === 'fr'
          ? 'Vous pouvez soumettre un nouveau dossier avec les ajustements recommandes.'
          : 'You can submit a new dossier with the recommended adjustments.',
      cta: lang === 'fr' ? 'Creer un nouveau dossier' : 'Create a new dossier',
      href: '/client-dashboard/new-case-file',
      severity: 'neutral',
    };
  }

  if (status === 'CLOTURE') {
    return {
      title: lang === 'fr' ? 'Dossier finalise' : 'Dossier completed',
      description:
        lang === 'fr'
          ? 'Le traitement est termine. Consultez vos documents ou soumettez un nouveau dossier.'
          : 'Processing is complete. Review your documents or submit a new dossier.',
      cta: lang === 'fr' ? 'Voir mes dossiers' : 'View my dossiers',
      href: '/client-dashboard/case-files',
      severity: 'neutral',
    };
  }

  return {
    title: lang === 'fr' ? 'Prochaine etape : suivi en cours' : 'Next step: ongoing follow-up',
    description:
      lang === 'fr'
        ? 'Votre dossier progresse. Consultez les messages pour les mises a jour de votre charge.'
        : 'Your dossier is progressing. Check messages for updates from your manager.',
    cta: lang === 'fr' ? 'Voir mes messages' : 'View my messages',
    href: '/client-dashboard/messages',
    severity: 'neutral',
  };
}

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DossierTimelinePage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCases = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('case_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const mapped: CaseFile[] = (data || []).map((row: any) => ({
      id: row.id,
      ref: row.ref ?? null,
      status: row.status as DossierStatus,
      type: caseFileType(row),
      created_at: row.created_at,
      updated_at: row.updated_at,
      description: caseFileDescription(row),
    }));
    setCases(mapped);
    if (mapped.length > 0 && !selectedCase) {
      setSelectedCase(mapped[0]);
    }
    setLoading(false);
  }, [user, selectedCase]);

  const fetchHistory = useCallback(async (caseId: string) => {
    setHistoryLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('case_status_history')
      .select('id, old_status, new_status, note, changed_by_email, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });
    setHistory((data as StatusHistoryEntry[]) || []);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    if (selectedCase) fetchHistory(selectedCase.id);
  }, [selectedCase, fetchHistory]);

  const currentStatus = selectedCase?.status ?? null;
  const currentStepIndex = currentStatus ? getPhaseIndex(currentStatus) : -1;
  const requiredDocs = currentStatus
    ? REQUIRED_DOCS_BY_STATUS[currentStatus] || REQUIRED_DOCS_BY_STATUS['RECU']
    : null;
  const nextStepAction = currentStatus
    ? getNextStepAction(currentStatus, lang as 'fr' | 'en')
    : null;

  /* Compute global status summary across all cases */
  const urgentCases = cases.filter((c) => c.status === 'A_COMPLETER');
  const activeCases = cases.filter((c) => !['CLOTURE', 'REJETE'].includes(c.status));

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">
          {lang === 'fr' ? 'Suivi de mon dossier' : 'My File Status'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {lang === 'fr'
            ? "Consultez l'avancement et les actions requises pour votre dossier."
            : 'Track progress and required actions for your file.'}
        </p>
      </div>

      {/* Global status banner */}
      {!loading && cases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-navy" />
            </div>
            <div>
              <p className="text-xl font-bold text-navy">{cases.length}</p>
              <p className="text-xs text-slate-500">
                {lang === 'fr' ? 'Dossier(s) total' : 'Total file(s)'}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-800">{activeCases.length}</p>
              <p className="text-xs text-blue-600">
                {lang === 'fr' ? 'En cours de traitement' : 'In progress'}
              </p>
            </div>
          </div>
          <div
            className={`rounded-xl border p-4 flex items-center gap-3 ${urgentCases.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-emerald-200 bg-emerald-50'}`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${urgentCases.length > 0 ? 'bg-orange-100' : 'bg-emerald-100'}`}
            >
              {urgentCases.length > 0 ? (
                <AlertTriangle size={16} className="text-orange-600" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-600" />
              )}
            </div>
            <div>
              <p
                className={`text-xl font-bold ${urgentCases.length > 0 ? 'text-orange-800' : 'text-emerald-800'}`}
              >
                {urgentCases.length}
              </p>
              <p
                className={`text-xs ${urgentCases.length > 0 ? 'text-orange-600' : 'text-emerald-600'}`}
              >
                {lang === 'fr' ? 'Action(s) requise(s)' : 'Action(s) required'}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">
            {lang === 'fr' ? 'Aucun dossier trouvé.' : 'No files found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case selector */}
          <div className="lg:col-span-1 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">
                {lang === 'fr' ? 'Mes dossiers' : 'My files'}
              </h2>
              <button
                onClick={fetchCases}
                className="text-slate-400 hover:text-navy transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {cases.map((c) => {
              const step = PHASES.find((phase) => phase.statuses.includes(c.status));
              const isSelected = selectedCase?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                    isSelected
                      ? 'border-gold bg-gold/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{caseFileLabel(c)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.type}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${step?.color ?? 'text-slate-600'} ${step?.bg ?? 'bg-slate-50'} ${step?.border ?? 'border-slate-200'}`}
                    >
                      {step
                        ? lang === 'fr'
                          ? step.labelFr
                          : step.labelEn
                        : getCaseStatusLabel(c.status, lang as 'fr' | 'en')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                    <CalendarDays size={11} />
                    <span>{formatDate(c.updated_at || c.created_at, lang)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Timeline + details */}
          {selectedCase && (
            <div className="lg:col-span-2 space-y-5">
              {/* Status Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-5">
                  {lang === 'fr' ? 'Progression du dossier' : 'File Progress'}
                </h2>
                <div className="relative">
                  {/* Connector line */}
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />
                  <div className="space-y-0">
                    {PHASES.map((step, idx) => {
                      const isCompleted = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                          {/* Icon */}
                          <div
                            className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500'
                                : isCurrent
                                  ? `${step.bg} ${step.border} border-2`
                                  : 'bg-white border-slate-200'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={18} className="text-white" />
                            ) : isCurrent ? (
                              <Icon size={18} className={step.color} />
                            ) : (
                              <Circle size={18} className="text-slate-300" />
                            )}
                          </div>
                          {/* Content */}
                          <div
                            className={`flex-1 pt-1.5 pb-2 px-4 rounded-xl transition-all ${
                              isCurrent ? `${step.bg} border ${step.border}` : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p
                                className={`text-sm font-semibold ${
                                  isCompleted
                                    ? 'text-emerald-700'
                                    : isCurrent
                                      ? step.color
                                      : 'text-slate-400'
                                }`}
                              >
                                {lang === 'fr' ? step.labelFr : step.labelEn}
                              </p>
                              {isCurrent && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.bg} ${step.color} border ${step.border}`}
                                >
                                  {lang === 'fr' ? 'Statut actuel' : 'Current status'}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs mt-1 ${isCurrent ? step.color + '/80' : 'text-slate-400'}`}
                            >
                              {lang === 'fr' ? step.descFr : step.descEn}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Last update */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={13} />
                  <span>
                    {lang === 'fr' ? 'Dernière mise à jour : ' : 'Last update: '}
                    <span className="font-medium text-slate-600">
                      {formatDate(selectedCase.updated_at || selectedCase.created_at, lang)}
                    </span>
                  </span>
                </div>
              </div>

              {nextStepAction && (
                <div
                  className={`rounded-xl border p-5 ${
                    nextStepAction.severity === 'urgent'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Flag
                      size={16}
                      className={
                        nextStepAction.severity === 'urgent' ? 'text-orange-600' : 'text-blue-600'
                      }
                    />
                    <h3
                      className={`text-sm font-semibold ${
                        nextStepAction.severity === 'urgent' ? 'text-orange-700' : 'text-blue-700'
                      }`}
                    >
                      {nextStepAction.title}
                    </h3>
                  </div>
                  <p
                    className={`text-sm ${
                      nextStepAction.severity === 'urgent' ? 'text-orange-800' : 'text-blue-800'
                    }`}
                  >
                    {nextStepAction.description}
                  </p>
                  <Link
                    href={nextStepAction.href}
                    className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-lg transition-colors ${
                      nextStepAction.severity === 'urgent'
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {nextStepAction.severity === 'urgent' ? (
                      <Upload size={13} />
                    ) : (
                      <ChevronRight size={13} />
                    )}
                    {nextStepAction.cta}
                  </Link>
                </div>
              )}

              {/* Required Actions / Documents */}
              {requiredDocs && (
                <div
                  className={`rounded-xl border p-5 ${
                    currentStatus === 'A_COMPLETER'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {currentStatus === 'A_COMPLETER' ? (
                      <Upload size={16} className="text-orange-600" />
                    ) : (
                      <Flag size={16} className="text-slate-500" />
                    )}
                    <h3
                      className={`text-sm font-semibold ${currentStatus === 'A_COMPLETER' ? 'text-orange-700' : 'text-slate-700'}`}
                    >
                      {currentStatus === 'A_COMPLETER'
                        ? lang === 'fr'
                          ? 'Documents requis'
                          : 'Required documents'
                        : lang === 'fr'
                          ? 'Informations'
                          : 'Information'}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {(lang === 'fr' ? requiredDocs.fr : requiredDocs.en).map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight
                          size={14}
                          className={`mt-0.5 flex-shrink-0 ${currentStatus === 'A_COMPLETER' ? 'text-orange-500' : 'text-slate-400'}`}
                        />
                        <span
                          className={
                            currentStatus === 'A_COMPLETER' ? 'text-orange-800' : 'text-slate-600'
                          }
                        >
                          {doc}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {currentStatus === 'A_COMPLETER' && (
                    <Link
                      href="/client-dashboard/documents"
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Upload size={13} />
                      {lang === 'fr' ? 'Déposer mes documents' : 'Upload my documents'}
                    </Link>
                  )}
                </div>
              )}

              {/* Status History */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">
                  {lang === 'fr' ? 'Historique des mises à jour' : 'Update history'}
                </h2>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-16">
                    <Loader2 size={20} className="animate-spin text-gold" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {lang === 'fr' ? 'Aucun historique disponible.' : 'No history available.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => {
                      const label = isCaseStatus(entry.new_status)
                        ? getCaseStatusLabel(entry.new_status, lang as 'fr' | 'en')
                        : entry.new_status;
                      return (
                        <div key={entry.id} className="flex items-start gap-3 text-xs">
                          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold mt-1.5" />
                          <div className="flex-1">
                            <p className="text-slate-700 font-medium">{label}</p>
                            {entry.note && (
                              <p className="text-slate-500 mt-0.5 italic">{entry.note}</p>
                            )}
                            <p className="text-slate-400 mt-0.5">
                              {formatDate(entry.created_at, lang)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
