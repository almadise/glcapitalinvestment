'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/client-dashboard/components/DashboardLayout';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Send,
  User,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { caseFileDescription, caseFileLabel, caseFileType } from '@/lib/caseFileLabel';

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
  type?: string | null;
  status: CaseStatus;
  ref?: string | null;
  project_name?: string | null;
  title?: string | null;
  description: string | null;
  project_description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

interface Message {
  id: string;
  case_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
  is_staff?: boolean;
}

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

const STATUS_CONFIG: Record<
  CaseStatus,
  { labelFr: string; labelEn: string; color: string; bg: string; border: string }
> = {
  RECU: {
    labelFr: 'Reçu',
    labelEn: 'Received',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
  },
  A_COMPLETER: {
    labelFr: 'À compléter',
    labelEn: 'To complete',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
  },
  EN_ANALYSE: {
    labelFr: 'En analyse',
    labelEn: 'Under review',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
  },
  EN_REVUE_COMPLIANCE: {
    labelFr: 'En revue conformité',
    labelEn: 'Compliance review',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
  },
  ELIGIBLE: {
    labelFr: 'Éligible',
    labelEn: 'Eligible',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
  },
  SOUMIS_PARTENAIRE: {
    labelFr: 'Soumis partenaire',
    labelEn: 'Submitted to partner',
    color: 'text-indigo-700',
    bg: 'bg-indigo-100',
    border: 'border-indigo-300',
  },
  RETOUR_PARTENAIRE: {
    labelFr: 'Retour partenaire',
    labelEn: 'Partner feedback',
    color: 'text-violet-700',
    bg: 'bg-violet-100',
    border: 'border-violet-300',
  },
  EN_NEGOCIATION: {
    labelFr: 'En négociation',
    labelEn: 'In negotiation',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
  },
  CLOTURE: {
    labelFr: 'Clôturé',
    labelEn: 'Closed',
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    border: 'border-teal-300',
  },
  REJETE: {
    labelFr: 'Rejeté',
    labelEn: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
  },
};

function StatusBadge({ status, lang }: { status: CaseStatus; lang: string }) {
  const cfg = STATUS_CONFIG[status] || {
    labelFr: status,
    labelEn: status,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
    </span>
  );
}

function formatDate(d: string, lang: string) {
  return new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ClientCaseDetailContent() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;
  const supabase = createClient();

  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'messages'>('overview');

  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  const fetchAll = useCallback(async () => {
    if (!caseId || !user) return;
    setLoading(true);
    setError(null);
    try {
      const [caseRes, docsRes] = await Promise.all([
        supabase.from('case_files').select('*').eq('id', caseId).single(),
        supabase
          .from('documents')
          .select('*')
          .eq('case_id', caseId)
          .order('uploaded_at', { ascending: false }),
      ]);
      if (caseRes.error) throw caseRes.error;
      setCaseFile(caseRes.data);
      setDocuments(docsRes.data || []);
    } catch (err: any) {
      setError(err.message || t('Erreur lors du chargement', 'Error loading case'));
    } finally {
      setLoading(false);
    }
  }, [caseId, user]);

  const fetchMessages = useCallback(async () => {
    if (!caseId || !user) return;
    try {
      const { data, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (msgErr) throw msgErr;

      // Enrich with sender info from profiles
      const enriched: Message[] = await Promise.all(
        (data || []).map(async (msg: Message) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, role')
              .eq('id', msg.sender_id)
              .single();
            return {
              ...msg,
              sender_name:
                profile?.full_name || profile?.email || t('Équipe GL Capital', 'GL Capital Team'),
              sender_email: profile?.email,
              is_staff: ['admin', 'compliance', 'analyst'].includes(profile?.role || ''),
            };
          } catch {
            return {
              ...msg,
              sender_name:
                msg.sender_id === user?.id
                  ? t('Moi', 'Me')
                  : t('Équipe GL Capital', 'GL Capital Team'),
              is_staff: msg.sender_id !== user?.id,
            };
          }
        })
      );
      setMessages(enriched);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  }, [caseId, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab, fetchMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!caseId || !user) return;

    const channel = supabase
      .channel(`messages:case:${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `case_id=eq.${caseId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, role')
              .eq('id', newMsg.sender_id)
              .single();
            const enriched: Message = {
              ...newMsg,
              sender_name:
                profile?.full_name || profile?.email || t('Équipe GL Capital', 'GL Capital Team'),
              sender_email: profile?.email,
              is_staff: ['admin', 'compliance', 'analyst'].includes(profile?.role || ''),
            };
            setMessages((prev) => {
              if (prev.find((m) => m.id === enriched.id)) return prev;
              return [...prev, enriched];
            });
          } catch {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !caseId || !user) return;
    setSendingMessage(true);
    setMessageError(null);
    try {
      const { error: insertErr } = await supabase.from('messages').insert({
        case_id: caseId,
        sender_id: user.id,
        body: newMessage.trim(),
      });
      if (insertErr) throw insertErr;
      setNewMessage('');
    } catch (err: any) {
      setMessageError(err.message || t("Erreur lors de l'envoi", 'Error sending message'));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !caseFile) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-red-700 text-sm">
              {error || t('Dossier introuvable', 'Case file not found')}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { key: 'overview' as const, label: t("Vue d'ensemble", 'Overview'), icon: FileText },
    {
      key: 'documents' as const,
      label: `${t('Documents', 'Documents')} (${documents.length})`,
      icon: Paperclip,
    },
    {
      key: 'messages' as const,
      label: `${t('Messages', 'Messages')} (${messages.length})`,
      icon: MessageSquare,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Back */}
        <Link
          href="/client-dashboard/case-files"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          {t('Retour à mes dossiers', 'Back to my files')}
        </Link>

        {/* A_COMPLETER Banner */}
        {caseFile.status === 'A_COMPLETER' && (
          <div className="flex items-start gap-4 bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 mb-5 shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertCircle size={20} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-orange-800 text-base mb-1">
                {t(
                  '⚠️ Action requise - Documents manquants',
                  '⚠️ Action required - Missing documents'
                )}
              </h3>
              <p className="text-orange-700 text-sm leading-relaxed">
                {t(
                  "Votre dossier nécessite des documents complémentaires. Consultez l'onglet Messages pour voir les détails de la demande de notre équipe.",
                  "Your case file requires additional documents. Check the Messages tab to see the details of our team's request."
                )}
              </p>
              <button
                onClick={() => setActiveTab('messages')}
                className="mt-3 inline-flex items-center gap-2 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors"
              >
                <MessageSquare size={14} />
                {t('Voir les messages', 'View messages')}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <StatusBadge status={caseFile.status} lang={lang} />
                <span className="text-xs text-slate-400 font-mono">{caseFile.id.slice(0, 8)}…</span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-navy mb-1">
                {caseFileLabel(caseFile)}
              </h1>
              {caseFileDescription(caseFile) && (
                <p className="text-slate-500 text-sm leading-relaxed">
                  {caseFileDescription(caseFile)}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                {t('Type', 'Type')}
              </p>
              <p className="text-sm font-semibold text-navy">{caseFileType(caseFile)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                {t('Créé le', 'Created')}
              </p>
              <p className="text-sm text-slate-700">{formatDate(caseFile.created_at, lang)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                {t('Mis à jour', 'Updated')}
              </p>
              <p className="text-sm text-slate-700">
                {caseFile.updated_at ? formatDate(caseFile.updated_at, lang) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.key === 'overview'
                  ? t('Vue', 'View')
                  : tab.key === 'documents'
                    ? t('Docs', 'Docs')
                    : t('Msgs', 'Msgs')}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
              <FileText size={16} />
              {t('Informations du dossier', 'Case file information')}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                  {t('Titre', 'Title')}
                </p>
                <p className="text-sm text-slate-700">{caseFileLabel(caseFile)}</p>
              </div>
              {caseFileDescription(caseFile) && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                    {t('Description', 'Description')}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {caseFileDescription(caseFile)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                  {t('Statut actuel', 'Current status')}
                </p>
                <StatusBadge status={caseFile.status} lang={lang} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
              <Paperclip size={16} />
              {t('Documents', 'Documents')} ({documents.length})
            </h2>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Paperclip size={36} className="text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">
                  {t('Aucun document pour ce dossier', 'No documents for this case file')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-navy" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy truncate">{doc.file_name}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(doc.uploaded_at, lang)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs text-navy font-semibold hover:text-gold transition-colors"
                    >
                      {t('Voir', 'View')}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col"
            style={{ minHeight: '500px' }}
          >
            {/* Messages header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-navy flex items-center gap-2">
                <MessageSquare size={16} />
                {t('Fil de discussion', 'Message thread')}
              </h2>
              <button
                onClick={fetchMessages}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-navy transition-colors"
              >
                <RefreshCw size={12} />
                {t('Actualiser', 'Refresh')}
              </button>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '400px' }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare size={36} className="text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm font-medium">
                    {t('Aucun message pour le moment', 'No messages yet')}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {t(
                      "Envoyez un message à l'équipe GL Capital",
                      'Send a message to the GL Capital team'
                    )}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${msg.is_staff ? 'bg-navy text-white' : 'bg-gold text-navy'}`}
                      >
                        {msg.is_staff ? 'GL' : <User size={14} />}
                      </div>
                      {/* Bubble */}
                      <div
                        className={`max-w-xs sm:max-w-sm lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}
                      >
                        <div
                          className={`flex items-center gap-2 text-xs text-slate-400 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <span className="font-medium text-slate-600">
                            {isOwn
                              ? t('Moi', 'Me')
                              : msg.sender_name || t('Équipe GL Capital', 'GL Capital Team')}
                          </span>
                          {msg.is_staff && !isOwn && (
                            <span className="bg-navy/10 text-navy text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                              GL Capital
                            </span>
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-navy text-white rounded-tr-sm'
                              : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                          }`}
                        >
                          {msg.body}
                        </div>
                        <div
                          className={`flex items-center gap-1 text-xs text-slate-400 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Calendar size={10} />
                          {formatDate(msg.created_at, lang)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t border-slate-100 p-4">
              {messageError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                  <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-xs">{messageError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(
                    'Écrivez un message... (Entrée pour envoyer)',
                    'Write a message... (Enter to send)'
                  )}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy resize-none min-h-[80px] max-h-[160px]"
                  maxLength={2000}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-navy text-white rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                >
                  {sendingMessage ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {t('Shift+Entrée pour un saut de ligne', 'Shift+Enter for a new line')}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ClientCaseDetailPage() {
  return <ClientCaseDetailContent />;
}
