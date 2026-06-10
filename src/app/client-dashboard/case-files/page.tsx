'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  FileText,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useRealtimeCaseUpdates } from '@/hooks/useRealtimeAlerts';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/PermissionGate';
import { caseFileDescription, caseFileLabel, caseFileType } from '@/lib/caseFileLabel';

type CaseFileStatus = 'RECU' | 'EN_ANALYSE' | 'ELIGIBLE' | 'REJETE' | 'A_COMPLETER';
type CaseFileType = 'Project' | 'SBLC-BG' | 'Other';

interface CaseFile {
  id: string;
  user_id: string;
  type?: string | null;
  status: CaseFileStatus;
  ref?: string | null;
  project_name?: string | null;
  title?: string | null;
  project_description?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

const statusConfig: Record<
  CaseFileStatus,
  { label: string; labelEn: string; color: string; icon: React.ElementType }
> = {
  RECU: {
    label: 'Reçu',
    labelEn: 'Received',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock,
  },
  EN_ANALYSE: {
    label: 'En analyse',
    labelEn: 'Under review',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Loader2,
  },
  ELIGIBLE: {
    label: 'Éligible',
    labelEn: 'Eligible',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  REJETE: {
    label: 'Rejeté',
    labelEn: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  A_COMPLETER: {
    label: 'À compléter',
    labelEn: 'To complete',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: AlertCircle,
  },
};

function CaseFilesContent() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const supabase = createClient();
  const { can } = usePermissions();

  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Project' as CaseFileType,
    title: '',
    description: '',
  });

  // Real-time case updates
  useRealtimeCaseUpdates({
    enabled: !!user,
    userId: user?.id,
    lang,
    onUpdate: () => fetchCaseFiles(),
  });

  useEffect(() => {
    if (user) fetchCaseFiles();
  }, [user]);

  const fetchCaseFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('case_files').select('*').order('created_at', { ascending: false });
      // Clients only see their own files; admins/analysts/compliance see all
      if (!can('case_files:view_all')) {
        query = query.eq('user_id', user?.id);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setCaseFiles((data || []) as CaseFile[]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des dossiers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('case_files')
        .insert({
          user_id: user.id,
          type: formData.type,
          project_name: formData.title.trim(),
          title: formData.title.trim(),
          project_description: formData.description.trim() || null,
          description: formData.description.trim() || null,
          status: 'RECU',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send dossier confirmation email (non-blocking)
      if (insertData && user.email) {
        fetch('/api/send-dossier-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: user.email,
            clientName: user.user_metadata?.full_name || user.email,
            caseTitle: formData.title.trim(),
            caseId: insertData.id,
            lang,
          }),
        }).catch(() => {});
      }

      setSubmitSuccess(true);
      setFormData({ type: 'Project', title: '', description: '' });
      setShowForm(false);
      await fetchCaseFiles();
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Permission gate: must be able to view case files */}
      <PermissionGate require={['case_files:view_own', 'case_files:view_all']}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy">
              {lang === 'fr' ? 'Mes dossiers' : 'My case files'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {lang === 'fr'
                ? 'Suivez le statut de vos dossiers de financement'
                : 'Track the status of your financing files'}
            </p>
          </div>
          {/* Only users with create permission see the "New file" button */}
          {can('case_files:create') && (
            <button
              onClick={() => {
                setShowForm(true);
                setSubmitError(null);
                setSubmitSuccess(false);
              }}
              className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors"
            >
              <Plus size={16} />
              {lang === 'fr' ? 'Nouveau dossier' : 'New file'}
            </button>
          )}
        </div>

        {/* Success banner */}
        {submitSuccess && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-700 text-sm font-medium">
              {lang === 'fr'
                ? 'Dossier soumis avec succès - statut : REÇU'
                : 'File submitted successfully - status: RECEIVED'}
            </p>
          </div>
        )}

        {/* New file form - gated by create permission */}
        {showForm && can('case_files:create') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-base font-bold text-navy mb-4">
              {lang === 'fr' ? 'Nouvelle soumission de dossier' : 'New file submission'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">
                  {lang === 'fr' ? 'Type de dossier' : 'File type'}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, type: e.target.value as CaseFileType }))
                  }
                  className="input-field"
                  required
                >
                  <option value="Project">Project</option>
                  <option value="SBLC-BG">SBLC-BG</option>
                  <option value="Other">{lang === 'fr' ? 'Autre' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="label-field">
                  {lang === 'fr' ? 'Titre du dossier' : 'File title'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder={
                    lang === 'fr'
                      ? 'Ex: Financement infrastructure portuaire'
                      : 'E.g. Port infrastructure financing'
                  }
                  className="input-field"
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <label className="label-field">
                  {lang === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder={
                    lang === 'fr'
                      ? 'Décrivez brièvement votre projet...'
                      : 'Briefly describe your project...'
                  }
                  className="input-field min-h-[100px] resize-y"
                  maxLength={1000}
                />
              </div>

              {submitError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                  {lang === 'fr' ? 'Soumettre le dossier' : 'Submit file'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Case files list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-navy" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : caseFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
              {lang === 'fr' ? 'Aucun dossier pour le moment' : 'No case files yet'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {lang === 'fr'
                ? 'Cliquez sur "Nouveau dossier" pour soumettre votre premier dossier.'
                : 'Click "New file" to submit your first case.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {caseFiles.map((cf) => {
              const cfg = statusConfig[cf.status as CaseFileStatus] || statusConfig['RECU'];
              const StatusIcon = cfg.icon;
              const isACompleter = cf.status === 'A_COMPLETER';
              return (
                <div
                  key={cf.id}
                  className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group ${isACompleter ? 'border-orange-300 bg-orange-50/30' : 'border-slate-200 hover:border-navy/30'}`}
                  onClick={() => router.push(`/client-dashboard/case-files/${cf.id}`)}
                >
                  {isACompleter && (
                    <div className="flex items-center gap-2 mb-3 bg-orange-100 border border-orange-200 rounded-xl px-3 py-2">
                      <AlertCircle size={14} className="text-orange-600 flex-shrink-0" />
                      <p className="text-orange-700 text-xs font-semibold">
                        {lang === 'fr'
                          ? '⚠️ Documents complémentaires requis - Cliquez pour voir les détails'
                          : '⚠️ Additional documents required - Click to view details'}
                      </p>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText size={18} className="text-navy" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-navy text-sm leading-tight truncate">
                          {caseFileLabel(cf)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {caseFileType(cf)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(cf.created_at)}
                          </span>
                        </div>
                        {caseFileDescription(cf) && (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                            {caseFileDescription(cf)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.color}`}
                      >
                        <StatusIcon size={11} />
                        {lang === 'fr' ? cfg.label : cfg.labelEn}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-slate-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PermissionGate>
    </div>
  );
}

export default function CaseFilesPage() {
  return (
    <DashboardLayout>
      <CaseFilesContent />
    </DashboardLayout>
  );
}
