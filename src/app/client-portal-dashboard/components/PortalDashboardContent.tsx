'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Toaster, toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import StatusBadge, { DossierStatus } from '@/components/ui/StatusBadge';
import { FolderOpen, FileText, MessageSquare, Plus, Clock, Eye, RefreshCw, Shield, Download, File, CheckCircle2, AlertCircle } from 'lucide-react';

interface Dossier {
  id: string; ref: string; type: string; project_name: string;
  amount: string; status: DossierStatus; completeness: number;
  last_update: string; unread_messages: number;
}

interface DossierDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  doc_type: string;
  scan_status: string;
  scan_passed: boolean;
  uploaded_at: string;
}

export default function PortalDashboardContent() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'dossiers' | 'documents'>('overview');
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [documents, setDocuments] = useState<DossierDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Track previous dossier statuses for change detection
  const prevDossierStatuses = useRef<Record<string, DossierStatus>>({});
  // Track previous document scan states
  const prevDocScans = useRef<Record<string, boolean>>({});

  const fetchDossiers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_files')
        .select('id, ref, type, project_name, amount, status, completeness, updated_at, unread_messages')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Dossiers fetch error:', error.message);
        setDossiers([]);
      } else {
        const newDossiers = (data || []) as Dossier[];

        // Detect status changes and fire toasts
        newDossiers.forEach((d) => {
          const prev = prevDossierStatuses.current[d.id];
          if (prev && prev !== d.status) {
            const statusLabels: Record<string, string> = {
              RECU: t('Reçu', 'Received'),
              A_COMPLETER: t('À compléter', 'To Complete'),
              EN_ANALYSE: t('En analyse', 'Under Analysis'),
              EN_REVUE_COMPLIANCE: t('En revue compliance', 'Compliance Review'),
              ELIGIBLE: t('Éligible', 'Eligible'),
              SOUMIS_PARTENAIRE: t('Soumis au partenaire', 'Submitted to Partner'),
              RETOUR_PARTENAIRE: t('Retour partenaire', 'Partner Feedback'),
              EN_NEGOCIATION: t('En négociation', 'In Negotiation'),
              CLOTURE: t('Clôturé', 'Closed'),
              REJETE: t('Rejeté', 'Rejected'),
            };
            const newLabel = statusLabels[d.status] || d.status;
            if (['ELIGIBLE', 'SOUMIS_PARTENAIRE', 'EN_NEGOCIATION'].includes(d.status)) {
              toast.success(t(
                `Dossier ${d.ref} — Statut mis à jour : ${newLabel}`,
                `Dossier ${d.ref} — Status updated: ${newLabel}`
              ), { duration: 6000 });
            } else if (d.status === 'REJETE') {
              toast.error(t(
                `Dossier ${d.ref} — Dossier rejeté. Contactez votre conseiller.`,
                `Dossier ${d.ref} — Dossier rejected. Please contact your advisor.`
              ), { duration: 8000 });
            } else if (d.status === 'A_COMPLETER') {
              toast.warning(t(
                `Dossier ${d.ref} — Documents supplémentaires requis.`,
                `Dossier ${d.ref} — Additional documents required.`
              ), { duration: 7000 });
            } else {
              toast.info(t(
                `Dossier ${d.ref} — Nouveau statut : ${newLabel}`,
                `Dossier ${d.ref} — New status: ${newLabel}`
              ), { duration: 5000 });
            }
          }
          prevDossierStatuses.current[d.id] = d.status;
        });

        setDossiers(newDossiers);
      }
    } catch {
      setDossiers([]);
    }
    setLoading(false);
  };

  const fetchDocuments = async () => {
    if (!user) return;
    setDocsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dossier_documents')
        .select('id, file_name, file_path, file_size, mime_type, doc_type, scan_status, scan_passed, uploaded_at')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Documents fetch error:', error.message);
        setDocuments([]);
      } else {
        const newDocs = (data || []) as DossierDocument[];

        // Detect scan completion and fire toasts
        newDocs.forEach((doc) => {
          const prevScan = prevDocScans.current[doc.id];
          if (prevScan === false && doc.scan_passed === true) {
            toast.success(t(
              `Document vérifié : ${doc.file_name}`,
              `Document scan complete: ${doc.file_name}`
            ), { duration: 5000 });
          }
          prevDocScans.current[doc.id] = doc.scan_passed;
        });

        setDocuments(newDocs);
      }
    } catch {
      setDocuments([]);
    }
    setDocsLoading(false);
  };

  const handleDownload = async (doc: DossierDocument) => {
    setDownloadingId(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from('dossier-documents')
        .createSignedUrl(doc.file_path, 60);

      if (error) throw error;

      // Log download to compliance audit trail
      await supabase.from('compliance_logs').insert({
        actor_id: user?.id,
        actor_email: user?.email,
        action: 'DOCUMENT_DOWNLOAD',
        target_ref: `USER-${user?.id?.slice(0, 8)}`,
        detail: `Client downloaded: ${doc.file_name}`,
        severity: 'info',
      });

      // Open signed URL in new tab
      window.open(data.signedUrl, '_blank');
      toast.success(t(`Téléchargement de ${doc.file_name}`, `Downloading ${doc.file_name}`));
    } catch (err: any) {
      toast.error(err.message || t('Échec du téléchargement', 'Download failed'));
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    fetchDossiers();
    fetchDocuments();

    if (!user) return;
    const channel = supabase
      .channel('portal_dossiers')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dossiers',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchDossiers(); })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'dossier_documents',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchDocuments(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const openDossiers = dossiers.filter((d) => !['CLOTURE', 'REJETE'].includes(d.status));
  const pendingDocs = dossiers.filter((d) => d.status === 'A_COMPLETER').length;
  const totalUnread = dossiers.reduce((sum, d) => sum + (d.unread_messages || 0), 0);

  return (
    <div className="max-w-screen-2xl mx-auto">
      <Toaster position="bottom-right" richColors />

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t('Tableau de bord client', 'Client Dashboard')}</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <span className="font-mono">{profile?.organization || user?.email || t('Client', 'Client')}</span>
            <span className="text-gray-300">·</span>
            <button onClick={() => { fetchDossiers(); fetchDocuments(); }} className="flex items-center gap-1 text-gray-400 hover:text-navy-700 transition-colors">
              <RefreshCw size={11} />
              <span className="text-xs">{t('Actualiser', 'Refresh')}</span>
            </button>
          </p>
        </div>
        <Link
          href="/dossier-submission-wizard"
          className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95"
        >
          <Plus size={16} />{t('Nouveau dossier', 'New Dossier')}
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-navy-900/8 flex items-center justify-center"><FolderOpen size={18} className="text-navy-700" /></div>
            <span className="text-xs text-gray-400 font-mono">{t('Actifs', 'Active')}</span>
          </div>
          <div className="text-3xl font-bold text-navy-900 tabular-nums mb-1">{loading ? '—' : openDossiers.length}</div>
          <p className="text-sm font-medium text-gray-600">{t('Dossiers ouverts', 'Open Dossiers')}</p>
          <p className="text-xs text-gray-400 mt-1">{loading ? t('Chargement...', 'Loading...') : t(`${dossiers.length} soumis au total`, `${dossiers.length} total submitted`)}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center"><FileText size={18} className="text-amber-600" /></div>
            <span className="text-xs text-amber-500 font-mono">{pendingDocs > 0 ? t('Action requise', 'Action needed') : t('À jour', 'Up to date')}</span>
          </div>
          <div className="text-3xl font-bold text-amber-700 tabular-nums mb-1">{loading ? '—' : pendingDocs}</div>
          <p className="text-sm font-medium text-amber-700">{t('Dossiers à compléter', 'Dossiers to Complete')}</p>
          <p className="text-xs text-amber-500 mt-1">{t('Documents supplémentaires requis', 'Awaiting additional documents')}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center"><MessageSquare size={18} className="text-blue-600" /></div>
            <span className="text-xs text-blue-500 font-mono">{t('Non lus', 'Unread')}</span>
          </div>
          <div className="text-3xl font-bold text-blue-700 tabular-nums mb-1">{loading ? '—' : totalUnread}</div>
          <p className="text-sm font-medium text-blue-700">{t('Nouveaux messages', 'New Messages')}</p>
          <p className="text-xs text-blue-500 mt-1">{t('De l\'analyste et de l\'équipe compliance', 'From analyst + compliance team')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['overview', 'dossiers', 'documents'] as const).map((tab) => (
          <button
            key={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${activeTab === tab ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'overview' ? t('Aperçu', 'Overview') : tab === 'dossiers' ? t('Dossiers', 'Dossiers') : t('Documents', 'Documents')}
            {tab === 'documents' && documents.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-navy-900 text-white px-1.5 py-0.5 rounded-full">{documents.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900">{t('Dossiers actifs', 'Active Dossiers')}</h2>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-navy-900/20 border-t-navy-900 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{t('Chargement de vos dossiers...', 'Loading your dossiers...')}</p>
            </div>
          ) : dossiers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={28} className="text-gray-300" />
              </div>
              <h3 className="text-navy-900 font-semibold mb-2">{t('Aucun dossier', 'No dossiers yet')}</h3>
              <p className="text-gray-400 text-sm mb-6">{t('Soumettez votre premier dossier de financement pour commencer.', 'Submit your first financing dossier to get started.')}</p>
              <Link href="/dossier-submission-wizard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-700 text-white text-sm font-semibold rounded-xl transition-all duration-200">
                <Plus size={16} />{t('Soumettre un dossier', 'Submit a Dossier')}
              </Link>
            </div>
          ) : (
            dossiers.map((d) => (
              <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">{d.ref}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{d.type}</span>
                    </div>
                    <h3 className="text-navy-900 font-semibold text-sm">{d.project_name || t('Projet sans nom', 'Unnamed Project')}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    {(d.unread_messages || 0) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">{d.unread_messages}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-navy-900 font-bold text-sm tabular-nums">{d.amount || '—'}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {d.last_update ? new Date(d.last_update).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${(d.completeness || 0) >= 90 ? 'bg-emerald-500' : (d.completeness || 0) >= 70 ? 'bg-gold-500' : 'bg-amber-500'}`}
                      style={{ width: `${d.completeness || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-8 text-right">{d.completeness || 0}%</span>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-navy-700 hover:text-navy-900 font-medium"
                  >
                    <Eye size={12} />{t('Voir', 'View')}
                  </button>
                </div>
              </div>
            ))
          )}

          <Link
            href="/dossier-submission-wizard"
            className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:text-navy-700 hover:border-navy-300 transition-all duration-200"
          >
            <Plus size={16} />{t('Soumettre un nouveau dossier de financement', 'Submit a new financing dossier')}
          </Link>
        </div>
      )}

      {activeTab === 'dossiers' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900">{t('Tous les dossiers', 'All Dossiers')}</h2>
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-navy-900/20 border-t-navy-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : dossiers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm">{t('Aucun dossier soumis.', 'No dossiers submitted yet.')}</p>
            </div>
          ) : (
            dossiers.map((d) => (
              <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-gray-400 block mb-1">{d.ref}</span>
                    <h3 className="text-navy-900 font-semibold text-sm">{d.project_name || t('Projet sans nom', 'Unnamed Project')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{d.type} · {d.amount}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-900">{t('Mes documents', 'My Documents')}</h2>
            <Link href="/dossier-submission-wizard" className="flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-700 text-white text-xs font-semibold rounded-xl transition-all duration-200">
              <Plus size={13} />{t('Téléverser', 'Upload New')}
            </Link>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <Shield size={13} className="text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-700 text-xs">{t('Tous les documents sont chiffrés. Les téléchargements utilisent des URLs signées à durée limitée (60 secondes).', 'All documents are encrypted in secure storage. Downloads use time-limited signed URLs (60 seconds).')}</p>
          </div>

          {docsLoading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-navy-900/20 border-t-navy-900 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{t('Chargement des documents...', 'Loading documents...')}</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-gray-300" />
              </div>
              <h3 className="text-navy-900 font-semibold mb-2">{t('Aucun document', 'No documents yet')}</h3>
              <p className="text-gray-400 text-sm mb-4">{t('Téléversez des documents dans l\'assistant de soumission.', 'Upload documents in your dossier submission wizard.')}</p>
              <Link href="/dossier-submission-wizard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-700 text-white text-sm font-semibold rounded-xl transition-all duration-200">
                <Plus size={16} />{t('Aller à l\'assistant', 'Go to Dossier Wizard')}
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card">
              <div className="divide-y divide-gray-50">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-navy-900/8 flex items-center justify-center flex-shrink-0">
                      <File size={16} className="text-navy-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-800 truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{doc.doc_type}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{formatFileSize(doc.file_size)}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.scan_passed ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 font-medium">{t('Vérifié', 'Verified')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle size={11} className="text-amber-500" />
                          <span className="text-[10px] text-amber-600 font-medium">{t('En attente', 'Pending')}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id || !doc.scan_passed}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy-700 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                        title={!doc.scan_passed ? t('Fichier en attente de vérification', 'File pending scan verification') : t('Télécharger', 'Download file')}
                      >
                        {downloadingId === doc.id ? (
                          <div className="w-3 h-3 border border-navy-700/30 border-t-navy-700 rounded-full animate-spin" />
                        ) : (
                          <Download size={12} />
                        )}
                        {t('Télécharger', 'Download')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}