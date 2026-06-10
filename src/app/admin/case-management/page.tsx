'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  ChevronRight,
  X,
  Calendar,
  Tag,
  Bell,
  CheckSquare,
  Square,
  Download,
  FileQuestion,
} from 'lucide-react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import Icon from '@/components/ui/AppIcon';
import AdvancedFilters, { FilterState } from '@/components/AdvancedFilters';
import { caseFileLabel } from '@/lib/caseFileLabel';

type CaseFileStatus = 'RECU' | 'EN_ANALYSE' | 'ELIGIBLE' | 'REJETE' | 'A_COMPLETER';

interface CaseFile {
  id: string;
  user_id: string;
  type: string;
  status: CaseFileStatus;
  ref?: string | null;
  project_name?: string | null;
  description: string | null;
  project_description?: string | null;
  created_at: string;
  updated_at: string | null;
  client_email?: string;
  client_name?: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

interface InternalNote {
  id: string;
  content: string;
  created_at: string;
}

const statusConfig: Record<
  CaseFileStatus,
  { labelFr: string; labelEn: string; color: string; bg: string; icon: React.ElementType }
> = {
  RECU: {
    labelFr: 'Reçu',
    labelEn: 'Received',
    color: 'text-blue-700',
    bg: 'bg-blue-100 border-blue-200',
    icon: Clock,
  },
  EN_ANALYSE: {
    labelFr: 'En analyse',
    labelEn: 'Under Review',
    color: 'text-amber-700',
    bg: 'bg-amber-100 border-amber-200',
    icon: Loader2,
  },
  ELIGIBLE: {
    labelFr: 'Éligible',
    labelEn: 'Eligible',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100 border-emerald-200',
    icon: CheckCircle2,
  },
  REJETE: {
    labelFr: 'Rejeté',
    labelEn: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-100 border-red-200',
    icon: XCircle,
  },
  A_COMPLETER: {
    labelFr: 'À compléter',
    labelEn: 'To Complete',
    color: 'text-orange-700',
    bg: 'bg-orange-100 border-orange-200',
    icon: FileQuestion,
  },
};

const STATUS_FLOW: CaseFileStatus[] = ['RECU', 'EN_ANALYSE', 'ELIGIBLE', 'REJETE', 'A_COMPLETER'];

function StatusBadge({ status, lang }: { status: CaseFileStatus; lang: string }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}
    >
      <Icon size={11} />
      {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
    </span>
  );
}

function AdminCaseManagementContent() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [cases, setCases] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'ALL',
    riskTags: [],
    dateFrom: '',
    dateTo: '',
    partnerId: '',
  });
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Bulk select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<CaseFileStatus | ''>('');
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<CaseFileStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  // Internal note state
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Request documents modal state
  const [requestDocsCase, setRequestDocsCase] = useState<CaseFile | null>(null);
  const [requestDocsMessage, setRequestDocsMessage] = useState('');
  const [requestDocsSending, setRequestDocsSending] = useState(false);
  const [requestDocsError, setRequestDocsError] = useState<string | null>(null);
  const [requestDocsSuccess, setRequestDocsSuccess] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('case_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCases(data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const fetchCaseDetails = async (caseId: string) => {
    setDetailLoading(true);
    try {
      const [historyRes, notesRes] = await Promise.all([
        supabase
          .from('case_status_history')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
        supabase
          .from('case_internal_notes')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false }),
      ]);
      setStatusHistory(historyRes.data || []);
      setInternalNotes(notesRes.data || []);
    } catch (err) {
      console.error('Error fetching case details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCase = (c: CaseFile) => {
    setSelectedCase(c);
    setNewStatus('');
    setStatusNote('');
    setUpdateError(null);
    setUpdateSuccess(false);
    setNoteContent('');
    setNoteError(null);
    fetchCaseDetails(c.id);
  };

  const closeCase = () => {
    setSelectedCase(null);
    setStatusHistory([]);
    setInternalNotes([]);
  };

  const handleStatusUpdate = async () => {
    if (!selectedCase || !newStatus || newStatus === selectedCase.status) return;
    setUpdatingStatus(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const oldStatus = selectedCase.status;

      const { error: updateErr } = await supabase
        .from('case_files')
        .update({ status: newStatus })
        .eq('id', selectedCase.id);

      if (updateErr) throw updateErr;

      const { error: historyErr } = await supabase.from('case_status_history').insert({
        case_id: selectedCase.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user?.id,
        note: statusNote.trim() || null,
      });

      if (historyErr) throw historyErr;

      if (sendNotification && selectedCase.client_email) {
        try {
          await fetch('/api/send-status-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientEmail: selectedCase.client_email,
              clientName: selectedCase.client_name || selectedCase.client_email,
              caseTitle: caseFileLabel(selectedCase),
              caseId: selectedCase.id,
              newStatus,
              oldStatus,
              note: statusNote.trim() || null,
              lang,
            }),
          });
        } catch (emailErr) {
          console.warn('Email notification failed (non-blocking):', emailErr);
        }
      }

      const updatedCase = { ...selectedCase, status: newStatus as CaseFileStatus };
      setSelectedCase(updatedCase);
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updatedCase : c)));
      setUpdateSuccess(true);
      setNewStatus('');
      setStatusNote('');
      await fetchCaseDetails(selectedCase.id);
    } catch (err: any) {
      setUpdateError(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !noteContent.trim()) return;
    setAddingNote(true);
    setNoteError(null);

    try {
      const { error: noteErr } = await supabase.from('case_internal_notes').insert({
        case_id: selectedCase.id,
        author_id: user?.id,
        content: noteContent.trim(),
      });

      if (noteErr) throw noteErr;
      setNoteContent('');
      await fetchCaseDetails(selectedCase.id);
    } catch (err: any) {
      setNoteError(err.message || 'Error adding note');
    } finally {
      setAddingNote(false);
    }
  };

  // ── Bulk select handlers ──────────────────────────────────────────────────
  const filteredCases = cases.filter((c) => {
    const q = filters.search.toLowerCase();
    const matchSearch =
      !filters.search ||
      caseFileLabel(c).toLowerCase().includes(q) ||
      (c.ref || '').toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.client_email || '').toLowerCase().includes(q);
    const matchStatus = filters.status === 'ALL' || c.status === filters.status;
    const matchDateFrom = !filters.dateFrom || new Date(c.created_at) >= new Date(filters.dateFrom);
    const matchDateTo =
      !filters.dateTo || new Date(c.created_at) <= new Date(filters.dateTo + 'T23:59:59');
    return matchSearch && matchStatus && matchDateFrom && matchDateTo;
  });

  const allSelected = filteredCases.length > 0 && filteredCases.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCases.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setApplyingBulk(true);
    setBulkSuccess(null);
    try {
      const ids = Array.from(selectedIds);
      const { error: updateErr } = await supabase
        .from('case_files')
        .update({ status: bulkStatus })
        .in('id', ids);
      if (updateErr) throw updateErr;

      // Insert history entries
      const historyRows = ids.map((id) => {
        const c = cases.find((x) => x.id === id);
        return {
          case_id: id,
          old_status: c?.status || null,
          new_status: bulkStatus,
          changed_by: user?.id,
          note: `Bulk status change by ${user?.email}`,
        };
      });
      await supabase.from('case_status_history').insert(historyRows);

      setCases((prev) =>
        prev.map((c) =>
          selectedIds.has(c.id) ? { ...c, status: bulkStatus as CaseFileStatus } : c
        )
      );
      setBulkSuccess(`${ids.length} dossier(s) mis à jour → ${statusConfig[bulkStatus].labelFr}`);
      setSelectedIds(new Set());
      setBulkStatus('');
    } catch (err: any) {
      console.error('Bulk update error:', err);
    } finally {
      setApplyingBulk(false);
    }
  };

  const handleBulkExport = () => {
    const selectedCases = filteredCases.filter((c) => selectedIds.has(c.id));
    const csvHeader = 'ID,Titre,Type,Statut,Client Email,Créé le\n';
    const csvRows = selectedCases
      .map(
        (c) =>
          `"${c.id}","${caseFileLabel(c)}","${c.type}","${c.status}","${c.client_email || ''}","${new Date(c.created_at).toLocaleDateString('fr-FR')}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gl_capital_dossiers_selection_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  const handleRequestDocuments = async () => {
    if (!requestDocsCase || !requestDocsMessage.trim()) return;
    setRequestDocsSending(true);
    setRequestDocsError(null);
    setRequestDocsSuccess(false);

    try {
      const note = requestDocsMessage.trim();

      const { error: updateErr } = await supabase
        .from('case_files')
        .update({ status: 'A_COMPLETER' })
        .eq('id', requestDocsCase.id);
      if (updateErr) throw updateErr;

      const { error: historyErr } = await supabase.from('case_status_history').insert({
        case_id: requestDocsCase.id,
        old_status: requestDocsCase.status,
        new_status: 'A_COMPLETER',
        changed_by: user?.id,
        note,
      });
      if (historyErr) throw historyErr;

      const { error: noteErr } = await supabase.from('case_internal_notes').insert({
        case_id: requestDocsCase.id,
        author_id: user?.id,
        content: `[REQUEST_DOCUMENTS] ${note}`,
      });
      if (noteErr) throw noteErr;

      if (requestDocsCase.client_email) {
        await fetch('/api/send-request-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: requestDocsCase.client_email,
            clientName: requestDocsCase.client_name || requestDocsCase.client_email,
            caseTitle: caseFileLabel(requestDocsCase),
            caseId: requestDocsCase.id,
            adminMessage: note,
            lang,
          }),
        });
      }

      setCases((prev) =>
        prev.map((c) => (c.id === requestDocsCase.id ? { ...c, status: 'A_COMPLETER' } : c))
      );

      if (selectedCase?.id === requestDocsCase.id) {
        setSelectedCase({ ...selectedCase, status: 'A_COMPLETER' });
        await fetchCaseDetails(requestDocsCase.id);
      }

      setRequestDocsSuccess(true);
      setRequestDocsMessage('');
      setTimeout(() => {
        setRequestDocsCase(null);
        setRequestDocsSuccess(false);
      }, 1200);
    } catch (err: any) {
      setRequestDocsError(
        err?.message || t('Erreur lors de la demande', 'Error while sending request')
      );
    } finally {
      setRequestDocsSending(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">
            {t('Gestion des dossiers', 'Case Management')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t(
              'Voir, filtrer et mettre à jour tous les dossiers clients',
              'View, filter and update all client case files'
            )}
          </p>
        </div>
        <button
          onClick={fetchCases}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} />
          {t('Actualiser', 'Refresh')}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUS_FLOW.map((s) => {
          const cfg = statusConfig[s];
          const count = cases.filter((c) => c.status === s).length;
          return (
            <button
              key={s}
              onClick={() =>
                setFilters((f) => ({ ...f, status: filters.status === s ? 'ALL' : s }))
              }
              className={`rounded-xl border p-4 text-left transition-all ${
                filters.status === s
                  ? `${cfg.bg} ${cfg.color} border-current`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">
                {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
              </p>
            </button>
          );
        })}
      </div>

      <AdvancedFilters
        filters={filters}
        onChange={setFilters}
        statusOptions={STATUS_FLOW.map((s) => ({
          value: s,
          label: lang === 'fr' ? statusConfig[s].labelFr : statusConfig[s].labelEn,
        }))}
        riskTagOptions={[]}
        dashboard="admin"
        resultCount={filteredCases.length}
        totalCount={cases.length}
        accentColor="navy"
      />

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 bg-navy text-white px-4 py-3 rounded-xl mb-4 shadow-sm">
          <span className="text-sm font-semibold">
            {selectedIds.size} {t('sélectionné(s)', 'selected')}
          </span>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as CaseFileStatus | '')}
              className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="">{t('Changer le statut…', 'Change status…')}</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s} className="text-navy bg-white">
                  {lang === 'fr' ? statusConfig[s].labelFr : statusConfig[s].labelEn}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus || applyingBulk}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {applyingBulk ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckSquare size={12} />
              )}
              {t('Appliquer', 'Apply')}
            </button>
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition-all"
            >
              <Download size={12} />
              {t('Exporter CSV', 'Export CSV')}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-white/60 hover:text-white text-xs transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {bulkSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
          <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm font-medium">{bulkSuccess}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">
            {t('Aucun dossier trouvé', 'No case files found')}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3.5 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-navy transition-colors"
                    >
                      {allSelected ? (
                        <CheckSquare size={16} className="text-navy" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    {t('Dossier', 'Case')}
                  </th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    {t('Type', 'Type')}
                  </th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    {t('Statut', 'Status')}
                  </th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    {t('Date', 'Date')}
                  </th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => {
                  const isChecked = selectedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 transition-colors ${isChecked ? 'bg-navy/5' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleSelectOne(c.id)}
                          className="text-slate-400 hover:text-navy transition-colors"
                        >
                          {isChecked ? (
                            <CheckSquare size={16} className="text-navy" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-navy line-clamp-1">{caseFileLabel(c)}</p>
                        <p className="text-slate-400 text-xs mt-0.5 font-mono">
                          {c.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Tag size={10} />
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.status} lang={lang} />
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString(
                          lang === 'fr' ? 'fr-FR' : 'en-US',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCase(c)}
                            className="flex items-center gap-1 text-navy text-xs font-semibold hover:text-gold transition-colors"
                          >
                            {t('Gérer', 'Manage')}
                            <ChevronRight size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setRequestDocsCase(c);
                              setRequestDocsMessage('');
                              setRequestDocsError(null);
                              setRequestDocsSuccess(false);
                            }}
                            className="flex items-center gap-1 text-orange-600 text-xs font-semibold hover:text-orange-800 transition-colors border border-orange-200 bg-orange-50 px-2 py-1 rounded-lg"
                            title={t('Demander des documents', 'Request documents')}
                          >
                            <FileQuestion size={12} />
                            {t('Docs', 'Docs')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
            <span>
              {filteredCases.length} {t('dossier(s)', 'case(s)')}
            </span>
            {someSelected && (
              <span className="text-navy font-semibold">
                {selectedIds.size} {t('sélectionné(s)', 'selected')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Detail Panel / Drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={closeCase} />
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-navy">
              <div>
                <h2 className="text-white font-display font-bold text-lg line-clamp-2">
                  {caseFileLabel(selectedCase)}
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-mono">{selectedCase.id}</p>
              </div>
              <button
                onClick={closeCase}
                className="text-slate-400 hover:text-white p-1 rounded-lg ml-4 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 border-b border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                      {t('Statut actuel', 'Current status')}
                    </p>
                    <StatusBadge status={selectedCase.status} lang={lang} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                      {t('Type', 'Type')}
                    </p>
                    <span className="text-sm font-medium text-navy">{selectedCase.type}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                      {t('Créé le', 'Created')}
                    </p>
                    <span className="text-sm text-slate-600">
                      {formatDate(selectedCase.created_at)}
                    </span>
                  </div>
                  {selectedCase.description && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                        {t('Description', 'Description')}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {selectedCase.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                  <Tag size={14} />
                  {t('Mettre à jour le statut', 'Update status')}
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_FLOW.map((s) => {
                      const cfg = statusConfig[s];
                      const isCurrentStatus = s === selectedCase.status;
                      const isSelected = s === newStatus;
                      return (
                        <button
                          key={s}
                          onClick={() => setNewStatus(isSelected ? '' : s)}
                          disabled={isCurrentStatus}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            isCurrentStatus
                              ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                              : isSelected
                                ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-offset-1 ring-current`
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <cfg.icon size={12} />
                          {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
                          {isCurrentStatus && (
                            <span className="ml-auto text-[10px] opacity-60">
                              {t('actuel', 'current')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder={t(
                      'Note optionnelle pour le client...',
                      'Optional note for the client...'
                    )}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy resize-none min-h-[80px]"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendNotification}
                      onChange={(e) => setSendNotification(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <Bell size={13} className="text-slate-400" />
                    {t(
                      'Envoyer une notification email au client',
                      'Send email notification to client'
                    )}
                  </label>
                  {updateError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-xs">{updateError}</p>
                    </div>
                  )}
                  {updateSuccess && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                      <p className="text-emerald-700 text-xs font-medium">
                        {t('Statut mis à jour avec succès', 'Status updated successfully')}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || newStatus === selectedCase.status || updatingStatus}
                    className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingStatus ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {t('Appliquer le changement', 'Apply change')}
                  </button>
                </div>
              </div>

              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                  <MessageSquare size={14} />
                  {t('Notes internes', 'Internal notes')}
                </h3>
                <div className="space-y-3 mb-4">
                  {detailLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={18} className="animate-spin text-slate-400" />
                    </div>
                  ) : internalNotes.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-4">
                      {t('Aucune note interne', 'No internal notes yet')}
                    </p>
                  ) : (
                    internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-amber-50 border border-amber-100 rounded-xl p-3"
                      >
                        <p className="text-slate-700 text-sm leading-relaxed">{note.content}</p>
                        <p className="text-slate-400 text-xs mt-2">{formatDate(note.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={t('Ajouter une note interne...', 'Add an internal note...')}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy resize-none min-h-[80px]"
                  />
                  {noteError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-xs">{noteError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || addingNote}
                    className="flex items-center gap-2 bg-gold text-navy px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingNote ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <MessageSquare size={13} />
                    )}
                    {t('Ajouter la note', 'Add note')}
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                  <Calendar size={14} />
                  {t('Historique des statuts', 'Status history')}
                </h3>
                {detailLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-slate-400" />
                  </div>
                ) : statusHistory.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">
                    {t('Aucun historique', 'No history yet')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {statusHistory.map((entry) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-navy mt-1.5 flex-shrink-0" />
                          <div className="w-px flex-1 bg-slate-200 mt-1" />
                        </div>
                        <div className="pb-3 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.old_status && (
                              <>
                                <StatusBadge
                                  status={entry.old_status as CaseFileStatus}
                                  lang={lang}
                                />
                                <ChevronRight size={12} className="text-slate-400" />
                              </>
                            )}
                            <StatusBadge status={entry.new_status as CaseFileStatus} lang={lang} />
                          </div>
                          {entry.note && (
                            <p className="text-slate-500 text-xs mt-1.5 italic">"{entry.note}"</p>
                          )}
                          <p className="text-slate-400 text-xs mt-1">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Documents Modal */}
      {requestDocsCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRequestDocsCase(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
                  <FileQuestion size={18} className="text-orange-500" />
                  {t('Demander des documents', 'Request documents')}
                </h2>
                <p className="text-slate-500 text-sm mt-1 line-clamp-1">
                  {caseFileLabel(requestDocsCase)}
                </p>
              </div>
              <button
                onClick={() => setRequestDocsCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
              <p className="text-orange-800 text-sm font-medium">
                {t(
                  'Cette action va créer un message dans le fil de discussion, changer le statut du dossier en "À compléter" et envoyer un email au client.',
                  'This action will create a message in the thread, change the case status to "To Complete" and send an email to the client.'
                )}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-navy mb-2">
                {t('Message pour le client', 'Message for the client')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={requestDocsMessage}
                onChange={(e) => setRequestDocsMessage(e.target.value)}
                placeholder={t(
                  'Expliquez quels documents sont manquants ou incomplets...',
                  'Explain which documents are missing or incomplete...'
                )}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none min-h-[120px]"
                maxLength={1000}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {requestDocsMessage.length}/1000
              </p>
            </div>

            {requestDocsError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{requestDocsError}</p>
              </div>
            )}

            {requestDocsSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-700 text-sm font-medium">
                  {t('Demande envoyée avec succès', 'Request sent successfully')}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleRequestDocuments}
                disabled={!requestDocsMessage.trim() || requestDocsSending || requestDocsSuccess}
                className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestDocsSending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {t('Envoyer la demande', 'Send request')}
              </button>
              <button
                onClick={() => setRequestDocsCase(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t('Annuler', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCaseManagementPage() {
  return (
    <AdminLayout>
      <AdminCaseManagementContent />
    </AdminLayout>
  );
}
