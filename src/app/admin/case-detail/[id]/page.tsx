/* eslint-disable react/no-unescaped-entities */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/components/AdminLayout';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  MessageSquare,
  History,
  Paperclip,
  Eye,
  Download,
  Tag,
  User,
  Calendar,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import DocumentViewerModal from '@/components/DocumentViewerModal';
import Icon from '@/components/ui/AppIcon';
import { caseFileDescription, caseFileLabel } from '@/lib/caseFileLabel';

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

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  user_id?: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_by_email?: string;
  created_at: string;
}

interface InternalNote {
  id: string;
  content: string;
  author_email?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
}

const STATUS_CONFIG: Record<
  CaseStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  RECU: { label: 'Reçu', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  A_COMPLETER: {
    label: 'À compléter',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
  },
  EN_ANALYSE: {
    label: 'En analyse',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
  },
  EN_REVUE_COMPLIANCE: {
    label: 'En revue conformité',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
  },
  ELIGIBLE: {
    label: 'Éligible',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
  },
  SOUMIS_PARTENAIRE: {
    label: 'Soumis partenaire',
    color: 'text-indigo-700',
    bg: 'bg-indigo-100',
    border: 'border-indigo-300',
  },
  RETOUR_PARTENAIRE: {
    label: 'Retour partenaire',
    color: 'text-violet-700',
    bg: 'bg-violet-100',
    border: 'border-violet-300',
  },
  EN_NEGOCIATION: {
    label: 'En négociation',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
  },
  CLOTURE: {
    label: 'Clôturé',
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    border: 'border-teal-300',
  },
  REJETE: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
};

function StatusBadge({ status }: { status: CaseStatus }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CaseDetailPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;
  const supabase = createClient();

  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history' | 'notes'>(
    'overview'
  );

  // Note editing
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Document viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);

  const fetchAll = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const [caseRes, docsRes, historyRes, notesRes] = await Promise.all([
        supabase.from('case_files').select('*').eq('id', caseId).single(),
        supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .order('uploaded_at', { ascending: false }),
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
      if (caseRes.error) throw caseRes.error;
      setCaseFile(caseRes.data);
      setDocuments(docsRes.data || []);
      setStatusHistory(historyRes.data || []);
      const notesWithVersion = (notesRes.data || [])
        .reverse()
        .map((n: InternalNote, i: number) => ({ ...n, version: i + 1 }))
        .reverse();
      setNotes(notesWithVersion);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !caseId) return;
    setAddingNote(true);
    try {
      await supabase.from('case_internal_notes').insert({
        case_id: caseId,
        author_id: user?.id,
        author_email: user?.email,
        content: newNote.trim(),
      });
      setNewNote('');
      await fetchAll();
    } catch (err: any) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editingContent.trim()) return;
    setSavingEdit(true);
    try {
      await supabase
        .from('case_internal_notes')
        .update({ content: editingContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', noteId);
      setEditingNoteId(null);
      await fetchAll();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const openViewer = (doc: Document) => {
    setViewerDoc(doc);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !caseFile) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-red-700 text-sm">{error || 'Dossier introuvable'}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { key: 'overview', label: "Vue d'ensemble", icon: FileText },
    { key: 'documents', label: `Documents (${documents.length})`, icon: Paperclip },
    { key: 'history', label: `Historique (${statusHistory.length})`, icon: History },
    { key: 'notes', label: `Notes (${notes.length})`, icon: MessageSquare },
  ] as const;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back */}
        <Link
          href="/admin/case-management"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          Retour à la gestion des dossiers
        </Link>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <StatusBadge status={caseFile.status} />
                <span className="text-xs text-slate-400 font-mono">{caseFile.id}</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-navy mb-1">
                {caseFileLabel(caseFile)}
              </h1>
              {caseFileDescription(caseFile) && (
                <p className="text-slate-500 text-sm leading-relaxed">
                  {caseFileDescription(caseFile)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                Type
              </p>
              <p className="text-sm font-semibold text-navy">{caseFile.type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                Client
              </p>
              <p className="text-sm text-slate-700">{caseFile.client_email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                Créé le
              </p>
              <p className="text-sm text-slate-700">{formatDate(caseFile.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                Mis à jour
              </p>
              <p className="text-sm text-slate-700">
                {caseFile.updated_at ? formatDate(caseFile.updated_at) : '-'}
              </p>
            </div>
          </div>

          {caseFile.risk_tags && caseFile.risk_tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {caseFile.risk_tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-full"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === key
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Recent documents */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <Paperclip size={14} />
                Documents récents
              </h2>
              {documents.slice(0, 3).length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-4">Aucun document</p>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <FileText size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="flex-1 text-xs text-slate-700 truncate">
                        {doc.file_name}
                      </span>
                      <button
                        onClick={() => openViewer(doc)}
                        className="text-navy hover:text-gold transition-colors"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Last status change */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <History size={14} />
                Dernières mises à jour
              </h2>
              {statusHistory.slice(0, 3).length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-4">Aucun historique</p>
              ) : (
                <div className="space-y-3">
                  {statusHistory.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={entry.new_status as CaseStatus} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejection/closure reason */}
            {(caseFile.rejection_reason || caseFile.closure_reason) && (
              <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-red-700 mb-2">
                  {caseFile.rejection_reason ? 'Motif de rejet' : 'Motif de clôture'}
                </h2>
                <p className="text-red-800 text-sm leading-relaxed">
                  {caseFile.rejection_reason || caseFile.closure_reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Paperclip size={36} className="text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm">Aucun document téléversé pour ce dossier.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{doc.file_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(doc.uploaded_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openViewer(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white rounded-lg text-xs font-semibold hover:bg-navy/90 transition-colors"
                      >
                        <Eye size={12} />
                        Aperçu
                      </button>
                      <a
                        href={doc.file_url}
                        download={doc.file_name}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        <Download size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            {statusHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <History size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun historique de statut.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {statusHistory.map((entry, i) => (
                  <div key={entry.id} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-navy border-2 border-white shadow flex-shrink-0 mt-1" />
                      {i < statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {entry.old_status && (
                          <>
                            <StatusBadge status={entry.old_status as CaseStatus} />
                            <span className="text-slate-400 text-xs">→</span>
                          </>
                        )}
                        <StatusBadge status={entry.new_status as CaseStatus} />
                      </div>
                      {entry.note && (
                        <p className="text-slate-600 text-xs italic mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          "{entry.note}"
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(entry.created_at)}
                        </span>
                        {entry.changed_by_email && (
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {entry.changed_by_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTES ── */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Add note */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-navy mb-3">Ajouter une note</h2>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Saisir une note interne…"
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all resize-y"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50"
              >
                {addingNote ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <MessageSquare size={13} />
                )}
                Ajouter
              </button>
            </div>

            {/* Notes list */}
            {notes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-2xl">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucune note interne.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-navy text-gold px-2 py-0.5 rounded-full">
                          v{note.version}
                        </span>
                        {note.author_email && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User size={10} />
                            {note.author_email}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditingContent(note.content);
                        }}
                        className="text-slate-400 hover:text-navy transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 resize-y"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={savingEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white rounded-lg text-xs font-semibold hover:bg-navy/90 disabled:opacity-50"
                          >
                            {savingEdit ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Check size={11} />
                            )}
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                          >
                            <X size={11} />
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-700 text-sm leading-relaxed">{note.content}</p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(note.created_at)}
                      </span>
                      {note.updated_at && note.updated_at !== note.created_at && (
                        <span className="italic">modifié {formatDate(note.updated_at)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document viewer modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setViewerDoc(null);
          }}
          fileUrl={viewerDoc.file_url}
          fileName={viewerDoc.file_name}
          uploadedAt={viewerDoc.uploaded_at}
        />
      )}
    </AdminLayout>
  );
}
