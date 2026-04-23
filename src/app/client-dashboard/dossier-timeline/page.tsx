'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  ChevronRight,
  Loader2,
  RefreshCw,
  CalendarDays,
  Info,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { caseFileLabel } from '@/lib/caseFileLabel';


type DossierStatus = 'RECU' | 'A_COMPLETER' | 'EN_ANALYSE' | 'EN_REVUE_COMPLIANCE' | 'ELIGIBLE' | 'SOUMIS_PARTENAIRE' | 'RETOUR_PARTENAIRE' | 'EN_NEGOCIATION' | 'CLOTURE' | 'REJETE';

interface CaseFile {
  id: string;
  ref: string | null;
  project_name: string | null;
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

const CLIENT_VISIBLE_STATUSES: { key: DossierStatus; labelFr: string; labelEn: string; descFr: string; descEn: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  {
    key: 'RECU',
    labelFr: 'Dossier reçu',
    labelEn: 'File received',
    descFr: 'Votre dossier a été reçu et enregistré dans notre système.',
    descEn: 'Your file has been received and registered in our system.',
    icon: CheckCircle2,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  {
    key: 'A_COMPLETER',
    labelFr: 'À compléter',
    labelEn: 'To complete',
    descFr: 'Des documents ou informations complémentaires sont requis pour poursuivre l\'analyse.',
    descEn: 'Additional documents or information are required to proceed with the analysis.',
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    key: 'ELIGIBLE',
    labelFr: 'Éligible',
    labelEn: 'Eligible',
    descFr: 'Votre dossier a été validé et déclaré éligible au financement.',
    descEn: 'Your file has been validated and declared eligible for financing.',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    key: 'CLOTURE',
    labelFr: 'Clôturé',
    labelEn: 'Closed',
    descFr: 'Le traitement de votre dossier est terminé.',
    descEn: 'The processing of your file is complete.',
    icon: CheckCircle2,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
];

const REQUIRED_DOCS_BY_STATUS: Record<string, { fr: string[]; en: string[] }> = {
  A_COMPLETER: {
    fr: [
      'Pièce d\'identité valide (passeport ou CNI)',
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
    fr: ['Aucune action requise - votre dossier est en cours d\'examen initial.'],
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

const INTERNAL_STATUSES: DossierStatus[] = ['EN_ANALYSE', 'EN_REVUE_COMPLIANCE', 'SOUMIS_PARTENAIRE', 'RETOUR_PARTENAIRE', 'EN_NEGOCIATION'];

function getClientStatus(status: DossierStatus): DossierStatus {
  if (INTERNAL_STATUSES.includes(status)) return 'ELIGIBLE';
  return status;
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
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lang] = useState<'fr' | 'en'>('fr');

  const fetchCases = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('case_files')
      .select('id, ref, project_name, status, type, created_at, updated_at, project_description')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const mapped: CaseFile[] = (data || []).map((row: any) => ({
      id: row.id,
      ref: row.ref ?? null,
      project_name: row.project_name ?? null,
      status: row.status as DossierStatus,
      type: row.type,
      created_at: row.created_at,
      updated_at: row.updated_at,
      description: row.project_description ?? null,
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

  const clientStatus = selectedCase ? getClientStatus(selectedCase.status as DossierStatus) : null;
  const currentStepIndex = CLIENT_VISIBLE_STATUSES.findIndex((s) => s.key === clientStatus);
  const requiredDocs = clientStatus ? (REQUIRED_DOCS_BY_STATUS[clientStatus] || REQUIRED_DOCS_BY_STATUS['RECU']) : null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">
          {lang === 'fr' ? 'Suivi de mon dossier' : 'My File Status'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {lang === 'fr' ? 'Consultez l\'avancement et les actions requises pour votre dossier.' : 'Track progress and required actions for your file.'}
        </p>
      </div>

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
              <button onClick={fetchCases} className="text-slate-400 hover:text-navy transition-colors p-1 rounded-lg hover:bg-slate-100">
                <RefreshCw size={14} />
              </button>
            </div>
            {cases.map((c) => {
              const cs = getClientStatus(c.status as DossierStatus);
              const step = CLIENT_VISIBLE_STATUSES.find((s) => s.key === cs);
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${step?.color} ${step?.bg} ${step?.border}`}>
                      {step ? (lang === 'fr' ? step.labelFr : step.labelEn) : cs}
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
                    {CLIENT_VISIBLE_STATUSES.map((step, idx) => {
                      const isCompleted = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const isPending = idx > currentStepIndex;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                          {/* Icon */}
                          <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500'
                              : isCurrent
                              ? `${step.bg} ${step.border} border-2`
                              : 'bg-white border-slate-200'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 size={18} className="text-white" />
                            ) : isCurrent ? (
                              <Icon size={18} className={step.color} />
                            ) : (
                              <Circle size={18} className="text-slate-300" />
                            )}
                          </div>
                          {/* Content */}
                          <div className={`flex-1 pt-1.5 pb-2 px-4 rounded-xl transition-all ${
                            isCurrent ? `${step.bg} border ${step.border}` : ''
                          }`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className={`text-sm font-semibold ${
                                isCompleted ? 'text-emerald-700' : isCurrent ? step.color : 'text-slate-400'
                              }`}>
                                {lang === 'fr' ? step.labelFr : step.labelEn}
                              </p>
                              {isCurrent && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.bg} ${step.color} border ${step.border}`}>
                                  {lang === 'fr' ? 'Statut actuel' : 'Current status'}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${isCurrent ? step.color + '/80' : 'text-slate-400'}`}>
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

              {/* Required Actions / Documents */}
              {requiredDocs && (
                <div className={`rounded-xl border p-5 ${
                  clientStatus === 'A_COMPLETER' ?'bg-orange-50 border-orange-200' :'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {clientStatus === 'A_COMPLETER' ? (
                      <Upload size={16} className="text-orange-600" />
                    ) : (
                      <Info size={16} className="text-slate-500" />
                    )}
                    <h3 className={`text-sm font-semibold ${clientStatus === 'A_COMPLETER' ? 'text-orange-700' : 'text-slate-700'}`}>
                      {clientStatus === 'A_COMPLETER'
                        ? (lang === 'fr' ? 'Documents requis' : 'Required documents')
                        : (lang === 'fr' ? 'Informations' : 'Information')}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {(lang === 'fr' ? requiredDocs.fr : requiredDocs.en).map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight size={14} className={`mt-0.5 flex-shrink-0 ${clientStatus === 'A_COMPLETER' ? 'text-orange-500' : 'text-slate-400'}`} />
                        <span className={clientStatus === 'A_COMPLETER' ? 'text-orange-800' : 'text-slate-600'}>{doc}</span>
                      </li>
                    ))}
                  </ul>
                  {clientStatus === 'A_COMPLETER' && (
                    <a
                      href="/client-dashboard/documents"
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Upload size={13} />
                      {lang === 'fr' ? 'Déposer mes documents' : 'Upload my documents'}
                    </a>
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
                      const newStep = CLIENT_VISIBLE_STATUSES.find((s) => s.key === entry.new_status);
                      const label = newStep
                        ? (lang === 'fr' ? newStep.labelFr : newStep.labelEn)
                        : entry.new_status;
                      return (
                        <div key={entry.id} className="flex items-start gap-3 text-xs">
                          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold mt-1.5" />
                          <div className="flex-1">
                            <p className="text-slate-700 font-medium">{label}</p>
                            {entry.note && (
                              <p className="text-slate-500 mt-0.5 italic">{entry.note}</p>
                            )}
                            <p className="text-slate-400 mt-0.5">{formatDate(entry.created_at, lang)}</p>
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
