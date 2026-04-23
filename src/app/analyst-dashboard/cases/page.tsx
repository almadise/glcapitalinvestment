'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AnalystLayout from '../components/AnalystLayout';
import { ClipboardList, RefreshCw, Loader2, AlertCircle, MessageSquare, Send, X, ArrowRight, Tag, History, Plus, AlertTriangle, Edit2, Check, Clock, User, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import UploadWidget from '@/components/UploadWidget';
import { logAuditAction } from '@/lib/auditLogger';
import AdvancedFilters, { FilterState } from '@/components/AdvancedFilters';
import { notifyStatusChange } from '@/lib/notificationHelper';
import { caseFileLabel } from '@/lib/caseFileLabel';

type CaseStatus =
  | 'RECU' | 'A_COMPLETER' | 'EN_ANALYSE' | 'EN_REVUE_COMPLIANCE' | 'ELIGIBLE' | 'SOUMIS_PARTENAIRE' | 'RETOUR_PARTENAIRE' | 'EN_NEGOCIATION' | 'CLOTURE' | 'REJETE';

interface CaseFile {
  id: string;
  user_id: string;
  type: string;
  status: CaseStatus;
  ref?: string | null;
  project_name?: string | null;
  description: string | null;
  project_description?: string | null;
  created_at: string;
  updated_at: string | null;
  client_email?: string;
  client_name?: string;
  risk_tags?: string[];
  rejection_reason?: string;
  closure_reason?: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_by_email?: string;
  changed_by_name?: string;
  created_at: string;
}

interface InternalNote {
  id: string;
  content: string;
  author_email?: string;
  author_name?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
}

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string; border: string }> = {
  RECU: { label: 'Reçu', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  A_COMPLETER: { label: 'À compléter', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' },
  EN_ANALYSE: { label: 'En analyse', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
  EN_REVUE_COMPLIANCE: { label: 'En revue conformité', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
  ELIGIBLE: { label: 'Éligible', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  SOUMIS_PARTENAIRE: { label: 'Soumis partenaire', color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  RETOUR_PARTENAIRE: { label: 'Retour partenaire', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300' },
  EN_NEGOCIATION: { label: 'En négociation', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300' },
  CLOTURE: { label: 'Clôturé', color: 'text-teal-700', bg: 'bg-teal-100', border: 'border-teal-300' },
  REJETE: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
};

const ALL_STATUSES: CaseStatus[] = [
  'RECU', 'A_COMPLETER', 'EN_ANALYSE', 'EN_REVUE_COMPLIANCE',
  'ELIGIBLE', 'SOUMIS_PARTENAIRE', 'RETOUR_PARTENAIRE',
  'EN_NEGOCIATION', 'CLOTURE', 'REJETE',
];

// Analyst can move to these statuses
const ANALYST_ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  RECU: ['A_COMPLETER', 'EN_ANALYSE'],
  A_COMPLETER: ['EN_ANALYSE', 'REJETE'],
  EN_ANALYSE: ['EN_REVUE_COMPLIANCE', 'A_COMPLETER', 'REJETE'],
  EN_REVUE_COMPLIANCE: ['ELIGIBLE', 'A_COMPLETER', 'REJETE'],
  ELIGIBLE: ['EN_ANALYSE'],
  SOUMIS_PARTENAIRE: ['RETOUR_PARTENAIRE', 'EN_NEGOCIATION'],
  RETOUR_PARTENAIRE: ['EN_NEGOCIATION', 'EN_ANALYSE'],
  EN_NEGOCIATION: ['CLOTURE', 'REJETE'],
  CLOTURE: [],
  REJETE: [],
};

const RISK_TAG_OPTIONS = [
  'Pays à risque élevé', 'Pays sous sanctions', 'Secteur sensible',
  'Secteur non éligible', 'Sanctions OFAC', 'Sanctions UE',
  'Incohérence documentaire', 'Incohérence financière', 'PEP détecté', 'Structure opaque',
];

function StatusBadge({ status }: { status: CaseStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

export default function AnalystCasesPage() {
  const { user } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'notes' | 'history' | 'tags' | 'documents'>('notes');

  const [newStatus, setNewStatus] = useState<CaseStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);

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
      setError(err.message || 'Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const fetchCaseDetails = async (caseId: string) => {
    setDetailLoading(true);
    try {
      const [historyRes, notesRes] = await Promise.all([
        supabase.from('case_status_history').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
        supabase.from('case_internal_notes').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
      ]);
      setStatusHistory(historyRes.data || []);
      // Assign version numbers (oldest = v1)
      const notes = (notesRes.data || []).reverse().map((n: InternalNote, i: number) => ({ ...n, version: i + 1 })).reverse();
      setInternalNotes(notes);
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
    setRejectionReason('');
    setClosureReason('');
    setNoteContent('');
    setEditingNoteId(null);
    setSelectedTags(c.risk_tags || []);
    setActiveTab('notes');
    fetchCaseDetails(c.id);
  };

  const handleStatusUpdate = async () => {
    if (!selectedCase || !newStatus || newStatus === selectedCase.status) return;
    if ((newStatus === 'REJETE') && !rejectionReason.trim()) {
      toast.error('Le motif de rejet est obligatoire');
      return;
    }
    if ((newStatus === 'CLOTURE') && !closureReason.trim()) {
      toast.error('Le motif de clôture est obligatoire');
      return;
    }
    setUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'REJETE') updateData.rejection_reason = rejectionReason.trim();
      if (newStatus === 'CLOTURE') updateData.closure_reason = closureReason.trim();

      const { error: updateErr } = await supabase.from('case_files').update(updateData).eq('id', selectedCase.id);
      if (updateErr) throw updateErr;

      await supabase.from('case_status_history').insert({
        case_id: selectedCase.id,
        old_status: selectedCase.status,
        new_status: newStatus,
        changed_by: user?.id,
        changed_by_email: user?.email,
        note: statusNote.trim() || null,
      });

      // Audit log
      if (user?.id) {
        await logAuditAction({
          action: 'STATUS_CHANGE',
          entityType: 'case_file',
          entityId: selectedCase.id,
          caseId: selectedCase.id,
          actorId: user.id,
          actorEmail: user.email || undefined,
          reason: statusNote.trim() || (newStatus === 'REJETE' ? rejectionReason.trim() : newStatus === 'CLOTURE' ? closureReason.trim() : undefined),
          metadata: { old_status: selectedCase.status, new_status: newStatus },
        });
      }

      // Create in-app notification for client
      if (selectedCase.user_id) {
        await notifyStatusChange({
          userId: selectedCase.user_id,
          caseId: selectedCase.id,
          caseTitle: caseFileLabel(selectedCase),
          newStatus,
          oldStatus: selectedCase.status,
          note: statusNote.trim() || (newStatus === 'REJETE' ? rejectionReason.trim() : null),
        });
      }

      // Trigger transactional email notification
      if (selectedCase.client_email) {
        fetch('/api/send-status-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: selectedCase.client_email,
            clientName: selectedCase.client_name || selectedCase.client_email,
            caseTitle: caseFileLabel(selectedCase),
            caseId: selectedCase.id,
            newStatus,
            oldStatus: selectedCase.status,
            note: statusNote.trim() || null,
            lang: 'fr',
            changedByEmail: user?.email,
            notificationType: 'status_change',
          }),
        }).catch(() => {});
      }

      const updatedCase = { ...selectedCase, status: newStatus as CaseStatus, rejection_reason: updateData.rejection_reason, closure_reason: updateData.closure_reason };
      setSelectedCase(updatedCase);
      setCases((prev) => prev.map((c) => c.id === selectedCase.id ? updatedCase : c));
      setNewStatus('');
      setStatusNote('');
      setRejectionReason('');
      setClosureReason('');
      toast.success('Statut mis à jour avec succès');
      await fetchCaseDetails(selectedCase.id);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !noteContent.trim()) return;
    setAddingNote(true);
    try {
      const { error: noteErr } = await supabase.from('case_internal_notes').insert({
        case_id: selectedCase.id,
        author_id: user?.id,
        author_email: user?.email,
        content: noteContent.trim(),
      });
      if (noteErr) throw noteErr;

      // Audit log
      if (user?.id) {
        await logAuditAction({
          action: 'NOTE_CREATED',
          entityType: 'case_internal_note',
          caseId: selectedCase.id,
          actorId: user.id,
          actorEmail: user.email || undefined,
          metadata: { case_title: caseFileLabel(selectedCase) },
        });
      }

      setNoteContent('');
      toast.success('Note ajoutée');
      await fetchCaseDetails(selectedCase.id);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout de la note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleStartEditNote = (note: InternalNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleSaveNoteEdit = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    setSavingNoteEdit(true);
    try {
      const { error } = await supabase.from('case_internal_notes').update({
        content: editingNoteContent.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', noteId);
      if (error) throw error;

      // Audit log
      if (user?.id && selectedCase) {
        await logAuditAction({
          action: 'NOTE_EDITED',
          entityType: 'case_internal_note',
          entityId: noteId,
          caseId: selectedCase.id,
          actorId: user.id,
          actorEmail: user.email || undefined,
          metadata: { case_title: caseFileLabel(selectedCase) },
        });
      }

      setEditingNoteId(null);
      setEditingNoteContent('');
      toast.success('Note modifiée');
      if (selectedCase) await fetchCaseDetails(selectedCase.id);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification');
    } finally {
      setSavingNoteEdit(false);
    }
  };

  const handleSaveTags = async () => {
    if (!selectedCase) return;
    setSavingTags(true);
    try {
      const { error } = await supabase.from('case_files').update({ risk_tags: selectedTags }).eq('id', selectedCase.id);
      if (error) throw error;
      setSelectedCase({ ...selectedCase, risk_tags: selectedTags });
      setCases((prev) => prev.map((c) => c.id === selectedCase.id ? { ...c, risk_tags: selectedTags } : c));
      toast.success('Tags risque sauvegardés');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde des tags');
    } finally {
      setSavingTags(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const filtered = cases.filter((c) => {
    const q = filters.search.toLowerCase();
    const matchSearch =
      !filters.search ||
      caseFileLabel(c).toLowerCase().includes(q) ||
      (c.ref || '').toLowerCase().includes(q) ||
      c.client_email?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
    const matchStatus = filters.status === 'ALL' || c.status === filters.status;
    const matchTags = filters.riskTags.length === 0 || filters.riskTags.every((t) => c.risk_tags?.includes(t));
    const matchDateFrom = !filters.dateFrom || new Date(c.created_at) >= new Date(filters.dateFrom);
    const matchDateTo = !filters.dateTo || new Date(c.created_at) <= new Date(filters.dateTo + 'T23:59:59');
    return matchSearch && matchStatus && matchTags && matchDateFrom && matchDateTo;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const allowedTransitions = selectedCase ? ANALYST_ALLOWED_TRANSITIONS[selectedCase.status] : [];

  return (
    <AnalystLayout>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={20} className="text-blue-600" />
            <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">Dossiers à traiter</h1>
          </div>
          <p className="text-slate-500 text-sm">Traitement, messages, notes internes et gestion des statuts</p>
        </div>
        <button onClick={fetchCases} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <AdvancedFilters
        filters={filters}
        onChange={setFilters}
        statusOptions={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))}
        riskTagOptions={RISK_TAG_OPTIONS}
        dashboard="analyst"
        resultCount={filtered.length}
        totalCount={cases.length}
        accentColor="blue"
      />

      {/* Cases list */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={28} className="animate-spin text-gold" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700"><AlertCircle size={18} />{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Mobile: stacked cards */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Aucun dossier trouvé</div>
            ) : filtered.map((c) => (
              <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-navy text-sm truncate">{caseFileLabel(c)}</div>
                    <div className="text-xs text-slate-400 font-mono">{c.id.slice(0, 8)}…</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">{c.client_email || '-'}</div>
                  <button onClick={() => openCase(c)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                    Ouvrir <ArrowRight size={12} />
                  </button>
                </div>
                {c.risk_tags && c.risk_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.risk_tags.slice(0, 2).map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                        <AlertTriangle size={9} />{t.split(' ').slice(0, 2).join(' ')}
                      </span>
                    ))}
                    {c.risk_tags.length > 2 && <span className="text-xs text-slate-400">+{c.risk_tags.length - 2}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Dossier</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">Tags risque</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucun dossier trouvé</td></tr>
                ) : filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy text-sm">{caseFileLabel(c)}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.client_email || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {c.risk_tags && c.risk_tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.risk_tags.slice(0, 2).map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                              <AlertTriangle size={9} />{t.split(' ').slice(0, 2).join(' ')}
                            </span>
                          ))}
                          {c.risk_tags.length > 2 && <span className="text-xs text-slate-400">+{c.risk_tags.length - 2}</span>}
                        </div>
                      ) : <span className="text-slate-300 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openCase(c)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                        Ouvrir <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedCase(null)} />
          <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="font-bold text-navy text-sm sm:text-base truncate">{caseFileLabel(selectedCase)}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <StatusBadge status={selectedCase.status} />
                  <span className="text-xs text-slate-400 font-mono">{selectedCase.id.slice(0, 8)}…</span>
                </div>
              </div>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-navy p-1.5 rounded-lg hover:bg-slate-200 flex-shrink-0"><X size={18} /></button>
            </div>

            {/* Status Update */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-white">
              <h3 className="font-semibold text-navy text-sm mb-3">Changer le statut</h3>
              {allowedTransitions.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune transition disponible depuis ce statut.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {allowedTransitions.map((s) => (
                      <button key={s} onClick={() => setNewStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${newStatus === s ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].border} ring-2 ring-offset-1 ring-blue-400` : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                  {newStatus && (
                    <div className="space-y-2">
                      <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Note de décision (optionnel)..." rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                      {newStatus === 'REJETE' && (
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Motif de rejet (obligatoire)..." rows={2} className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none bg-red-50" />
                      )}
                      {newStatus === 'CLOTURE' && (
                        <textarea value={closureReason} onChange={(e) => setClosureReason(e.target.value)} placeholder="Motif de clôture (obligatoire)..." rows={2} className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none bg-teal-50" />
                      )}
                      <button onClick={handleStatusUpdate} disabled={updatingStatus} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Confirmer le changement
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white overflow-x-auto">
              {(['notes', 'documents', 'history', 'tags'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-navy'}`}>
                  {tab === 'notes' ? (
                    <span className="flex items-center gap-1.5"><MessageSquare size={13} /> Notes {internalNotes.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">{internalNotes.length}</span>}</span>
                  ) : tab === 'documents' ? (
                    <span className="flex items-center gap-1.5"><Paperclip size={13} /> Documents</span>
                  ) : tab === 'history' ? (
                    <span className="flex items-center gap-1.5"><History size={13} /> Historique {statusHistory.length > 0 && <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">{statusHistory.length}</span>}</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><Tag size={13} /> Tags {selectedTags.length > 0 && <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">{selectedTags.length}</span>}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {detailLoading ? (
                <div className="flex items-center justify-center h-20"><Loader2 size={20} className="animate-spin text-gold" /></div>
              ) : activeTab === 'documents' ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                    <strong>Documents du dossier :</strong> Téléversez des pièces justificatives, KYC, contrats ou tout document lié à ce dossier.
                  </div>
                  <UploadWidget
                    caseId={selectedCase.id}
                    onUploadComplete={() => {}}
                  />
                </div>
              ) : activeTab === 'notes' ? (
                <div className="space-y-4">
                  {/* Add note */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5"><Plus size={11} /> Nouvelle note interne</label>
                    <div className="flex gap-2">
                      <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Ajouter une note interne (non visible client)..." rows={3} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none bg-white" />
                      <button onClick={handleAddNote} disabled={addingNote || !noteContent.trim()} className="self-end px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {addingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400"><MessageSquare size={11} /> Notes internes - non visibles par le client</div>
                  {internalNotes.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">Aucune note interne</p>
                  ) : internalNotes.map((note) => (
                    <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">v{note.version}</span>
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-700"><User size={10} /> {note.author_email || 'Anonyme'}</span>
                          <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={10} /> {formatDate(note.created_at)}</span>
                          {note.updated_at && note.updated_at !== note.created_at && <span className="text-xs text-slate-400 italic">(modifiée)</span>}
                        </div>
                        {note.author_email === user?.email && editingNoteId !== note.id && (
                          <button onClick={() => handleStartEditNote(note)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"><Edit2 size={12} /></button>
                        )}
                      </div>
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} rows={3} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none bg-white" />
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleSaveNoteEdit(note.id)} disabled={savingNoteEdit || !editingNoteContent.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                              {savingNoteEdit ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Sauvegarder
                            </button>
                            <button onClick={handleCancelEditNote} className="px-3 py-1.5 text-slate-600 hover:text-navy text-xs font-medium">Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : activeTab === 'history' ? (
                <div className="space-y-3">
                  {statusHistory.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">Aucun historique</p>
                  ) : statusHistory.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <History size={13} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {h.old_status && <StatusBadge status={h.old_status as CaseStatus} />}
                          {h.old_status && <ArrowRight size={12} className="text-slate-400" />}
                          <StatusBadge status={h.new_status as CaseStatus} />
                        </div>
                        {h.note && (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 mt-1.5">
                            <p className="text-xs text-slate-600 italic">"{h.note}"</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-medium"><User size={10} /> {h.changed_by_email || 'Système'}</span>
                          <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={10} /> {formatDate(h.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                    <strong>Tags risque :</strong> Ces tags sont internes et non visibles par le client.
                  </div>
                  <p className="text-xs text-slate-500">Sélectionnez les tags de risque applicables à ce dossier :</p>
                  <div className="flex flex-wrap gap-2">
                    {RISK_TAG_OPTIONS.map((tag) => (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedTags.includes(tag) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <Tag size={11} />{tag}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Tags sélectionnés ({selectedTags.length}) :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                            <AlertTriangle size={10} />{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={handleSaveTags} disabled={savingTags} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 disabled:opacity-50 transition-colors">
                    {savingTags ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
                    Sauvegarder les tags
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AnalystLayout>
  );
}
