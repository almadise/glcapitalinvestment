'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Download,
  File,
  Eye,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Suspense } from 'react';
import DocumentViewerModal from '@/components/DocumentViewerModal';

interface DocumentRecord {
  id: string;
  case_id: string | null;
  user_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

type CaseStatus =
  | 'RECU'
  | 'A_COMPLETER'
  | 'EN_ANALYSE'
  | 'EN_REVUE_COMPLIANCE'
  | 'ELIGIBLE'
  | 'SOUMIS_PARTENAIRE'
  | 'RETOUR_PARTENAIRE'
  | 'EN_NEGOCIATION'
  | 'CLOTURE'
  | 'REJETE';

type DocumentWorkflowState = 'A_FOURNIR' | 'EN_REVUE' | 'A_CORRIGER' | 'VALIDE';

type EnrichedDocument = DocumentRecord & {
  caseStatus: CaseStatus | null;
  caseRef: string | null;
  workflowState: DocumentWorkflowState;
};

const REVIEW_CASE_STATUSES: CaseStatus[] = ['RECU', 'EN_ANALYSE', 'EN_REVUE_COMPLIANCE'];
const VALIDATED_CASE_STATUSES: CaseStatus[] = ['ELIGIBLE', 'SOUMIS_PARTENAIRE', 'RETOUR_PARTENAIRE', 'EN_NEGOCIATION', 'CLOTURE'];

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const WORKFLOW_META: Record<
  DocumentWorkflowState,
  {
    fr: string;
    en: string;
    className: string;
    hintFr: string;
    hintEn: string;
    ctaFr: string;
    ctaEn: string;
    href: string;
  }
> = {
  A_FOURNIR: {
    fr: 'A fournir',
    en: 'To provide',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    hintFr: 'Document charge hors dossier actif.',
    hintEn: 'Document uploaded outside an active dossier.',
    ctaFr: 'Associer au dossier',
    ctaEn: 'Link to dossier',
    href: '/client-dashboard/case-files',
  },
  EN_REVUE: {
    fr: 'En revue',
    en: 'In review',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    hintFr: 'Votre equipe verifie actuellement ce document.',
    hintEn: 'Your team is currently reviewing this document.',
    ctaFr: 'Suivre le dossier',
    ctaEn: 'Track dossier',
    href: '/client-dashboard/dossier-timeline',
  },
  A_CORRIGER: {
    fr: 'Correction demandee',
    en: 'Correction requested',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    hintFr: 'Une mise a jour est requise pour continuer.',
    hintEn: 'An update is required to continue.',
    ctaFr: 'Deposer une nouvelle version',
    ctaEn: 'Upload new version',
    href: '/client-dashboard/documents',
  },
  VALIDE: {
    fr: 'Valide',
    en: 'Validated',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    hintFr: 'Document conforme pour la suite du traitement.',
    hintEn: 'Document compliant for further processing.',
    ctaFr: 'Voir les telechargements',
    ctaEn: 'View downloads',
    href: '/client-dashboard/downloads',
  },
};

function getWorkflowState(caseStatus: CaseStatus | null): DocumentWorkflowState {
  if (!caseStatus) return 'A_FOURNIR';
  if (caseStatus === 'A_COMPLETER' || caseStatus === 'REJETE') return 'A_CORRIGER';
  if (REVIEW_CASE_STATUSES.includes(caseStatus)) return 'EN_REVUE';
  if (VALIDATED_CASE_STATUSES.includes(caseStatus)) return 'VALIDE';
  return 'EN_REVUE';
}

function DocumentsContent() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<EnrichedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stateFilter, setStateFilter] = useState<DocumentWorkflowState | 'ALL'>('ALL');

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<DocumentRecord | null>(null);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user, caseId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
      if (caseId) query = query.eq('case_id', caseId);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      const baseDocs: DocumentRecord[] = data || [];
      const caseIds = Array.from(new Set(baseDocs.map((doc) => doc.case_id).filter(Boolean))) as string[];

      const caseInfo = new Map<string, { status: CaseStatus; ref: string | null }>();
      if (caseIds.length > 0) {
        const { data: caseRows, error: caseError } = await supabase
          .from('case_files')
          .select('id, status, ref')
          .in('id', caseIds);

        if (caseError) throw caseError;
        (caseRows || []).forEach((row: any) => {
          caseInfo.set(row.id, { status: row.status as CaseStatus, ref: row.ref ?? null });
        });
      }

      const enriched: EnrichedDocument[] = baseDocs.map((doc) => {
        const relatedCase = doc.case_id ? caseInfo.get(doc.case_id) : null;
        const workflowState = getWorkflowState(relatedCase?.status ?? null);
        return {
          ...doc,
          caseStatus: relatedCase?.status ?? null,
          caseRef: relatedCase?.ref ?? null,
          workflowState,
        };
      });

      setDocuments(enriched);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploadError(null);
    setUploadSuccess(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(lang === 'fr' ? 'Type de fichier non autorisé. Formats acceptés : PDF, DOCX, XLSX.' : 'File type not allowed. Accepted formats: PDF, DOCX, XLSX.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(lang === 'fr' ? 'Fichier trop volumineux. Taille maximale : 10 Mo.' : 'File too large. Maximum size: 10MB.');
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = caseId
        ? `${user.id}/${caseId}/${safeName}`
        : `${user.id}/general/${safeName}`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { upsert: false });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
      const fileUrl = urlData?.publicUrl || storagePath;

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        case_id: caseId || null,
        file_name: file.name,
        file_url: fileUrl,
      });

      if (dbError) throw dbError;

      setUploadSuccess(lang === 'fr' ? `"${file.name}" téléversé avec succès.` : `"${file.name}" uploaded successfully.`);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors du téléversement.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (doc: DocumentRecord) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce document ?' : 'Delete this document?')) return;
    try {
      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression.');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const formatSize = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE';
  const filteredDocuments =
    stateFilter === 'ALL' ? documents : documents.filter((doc) => doc.workflowState === stateFilter);
  const workflowCount = {
    A_CORRIGER: documents.filter((d) => d.workflowState === 'A_CORRIGER').length,
    EN_REVUE: documents.filter((d) => d.workflowState === 'EN_REVUE').length,
    VALIDE: documents.filter((d) => d.workflowState === 'VALIDE').length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy">
          {lang === 'fr' ? 'Documents' : 'Documents'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {caseId
            ? (lang === 'fr' ? 'Documents liés à ce dossier' : 'Documents linked to this case file')
            : (lang === 'fr' ? 'Tous vos documents téléversés' : 'All your uploaded documents')}
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${
          dragOver ? 'border-navy bg-navy/5' : 'border-slate-200 hover:border-navy/40 hover:bg-slate-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.doc,.xls"
          className="hidden"
          onChange={handleInputChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-navy" />
            <p className="text-navy font-medium text-sm">
              {lang === 'fr' ? 'Téléversement en cours...' : 'Uploading...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center">
              <Upload size={22} className="text-navy" />
            </div>
            <div>
              <p className="font-semibold text-navy text-sm">
                {lang === 'fr' ? 'Glissez un fichier ici ou cliquez pour parcourir' : 'Drag a file here or click to browse'}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {lang === 'fr' ? 'PDF, DOCX, XLSX - max 10 Mo' : 'PDF, DOCX, XLSX - max 10MB'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback messages */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{uploadSuccess}</p>
        </div>
      )}
      {uploadError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{uploadError}</p>
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium text-sm">
            {lang === 'fr' ? 'Aucun document téléversé' : 'No documents uploaded yet'}
          </p>
        </div>
      ) : (
        <>
          {workflowCount.A_CORRIGER > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
              <p className="text-sm font-semibold text-amber-800">
                {lang === 'fr'
                  ? 'Des documents necessitent une correction prioritaire.'
                  : 'Some documents require priority correction.'}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {lang === 'fr'
                  ? 'Deposez une nouvelle version pour relancer le traitement de votre dossier.'
                  : 'Upload a new version to resume dossier processing.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] text-amber-700">{lang === 'fr' ? 'Corrections demandées' : 'Corrections requested'}</p>
              <p className="text-lg font-semibold text-amber-800 font-mono-data">{workflowCount.A_CORRIGER}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[11px] text-blue-700">{lang === 'fr' ? 'En revue' : 'In review'}</p>
              <p className="text-lg font-semibold text-blue-800 font-mono-data">{workflowCount.EN_REVUE}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[11px] text-emerald-700">{lang === 'fr' ? 'Validés' : 'Validated'}</p>
              <p className="text-lg font-semibold text-emerald-800 font-mono-data">{workflowCount.VALIDE}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-slate-500">{lang === 'fr' ? 'Filtrer par statut:' : 'Filter by status:'}</span>
            <button
              onClick={() => setStateFilter('ALL')}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 ${
                stateFilter === 'ALL' ? 'bg-navy text-white border-navy' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {lang === 'fr' ? 'Tous' : 'All'}
            </button>
            {(['A_CORRIGER', 'EN_REVUE', 'VALIDE', 'A_FOURNIR'] as DocumentWorkflowState[]).map((state) => (
              <button
                key={state}
                onClick={() => setStateFilter(state)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 ${
                  stateFilter === state ? 'bg-navy text-white border-navy' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {lang === 'fr' ? WORKFLOW_META[state].fr : WORKFLOW_META[state].en}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredDocuments.map((doc) => {
              const workflowMeta = WORKFLOW_META[doc.workflowState];
              const workflowLabel = lang === 'fr' ? workflowMeta.fr : workflowMeta.en;
              const workflowHint = lang === 'fr' ? workflowMeta.hintFr : workflowMeta.hintEn;
              const workflowCta = lang === 'fr' ? workflowMeta.ctaFr : workflowMeta.ctaEn;
              return (
            <div
              key={doc.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center flex-shrink-0">
                <File size={16} className="text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy truncate">{doc.file_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatSize(doc.file_name)} · {formatDate(doc.uploaded_at)}
                </p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${workflowMeta.className}`}>
                    {workflowLabel}
                  </span>
                  {doc.caseRef ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                      {doc.caseRef}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{workflowHint}</p>
              </div>
              <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-start flex-shrink-0 pt-1 sm:pt-0">
                <Link
                  href={workflowMeta.href}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors mr-auto sm:mr-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                  title={workflowCta}
                >
                  {workflowCta}
                </Link>
                <button
                  onClick={() => { setViewerDoc(doc); setViewerOpen(true); }}
                  className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                  title={lang === 'fr' ? 'Aperçu' : 'Preview'}
                >
                  <Eye size={15} />
                </button>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                  title={lang === 'fr' ? 'Télécharger' : 'Download'}
                >
                  <Download size={15} />
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                  title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
              );
            })}
          </div>
          {filteredDocuments.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">
                {lang === 'fr' ? 'Aucun document pour ce filtre.' : 'No documents for this filter.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Document viewer modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={viewerOpen}
          onClose={() => { setViewerOpen(false); setViewerDoc(null); }}
          fileUrl={viewerDoc.file_url}
          fileName={viewerDoc.file_name}
          uploadedAt={viewerDoc.uploaded_at}
        />
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      }>
        <DocumentsContent />
      </Suspense>
    </DashboardLayout>
  );
}
