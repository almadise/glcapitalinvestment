'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import BackOfficeLayout from '@/components/BackOfficeLayout';
import {
  ClipboardList, Search, Filter, Download, RefreshCw, Loader2,
  AlertTriangle, ChevronDown, User, Calendar, Tag, FileText,
  Shield, CheckCircle2, Upload, MessageSquare, Eye, X
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  case_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  reason: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  STATUS_CHANGE: { label: 'Changement statut', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  DOCUMENT_UPLOAD: { label: 'Upload document', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: Upload },
  NOTE_CREATED: { label: 'Note créée', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: MessageSquare },
  NOTE_EDITED: { label: 'Note modifiée', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: MessageSquare },
  EXPORT_CSV: { label: 'Export CSV', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: Download },
  EXPORT_PDF: { label: 'Export PDF', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: FileText },
  CASE_CREATED: { label: 'Dossier créé', color: 'text-gold-700', bg: 'bg-amber-50 border-amber-200', icon: FileText },
  CASE_VIEWED: { label: 'Dossier consulté', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: Eye },
};

const PAGE_SIZE = 30;

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditLogsPage() {
  const { user, userRole } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (actionFilter !== 'ALL') query = query.eq('action', actionFilter);
      if (search.trim()) query = query.ilike('entity_type', `%${search.trim()}%`);
      if (actorSearch.trim()) query = query.ilike('actor_email', `%${actorSearch.trim()}%`);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

      const { data, count, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setLogs(data || []);
      setTotal(count || 0);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, search, actorSearch, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportCSV = () => {
    if (logs.length === 0) { toast.error('Aucune donnée à exporter'); return; }
    let csv = 'ID,Action,Type entité,ID entité,ID dossier,Acteur email,Acteur nom,Raison,Date\n';
    logs.forEach((row) => {
      csv += `"${row.id}","${row.action}","${row.entity_type}","${row.entity_id || ''}","${row.case_id || ''}","${row.actor_email || ''}","${row.actor_name || ''}","${(row.reason || '').replace(/"/g, '""')}","${formatDate(row.created_at)}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(lang === 'fr' ? 'Export CSV téléchargé' : 'CSV export downloaded');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <BackOfficeLayout role={(userRole as any) || 'admin'} userName={user?.email?.split('@')[0] || 'Admin'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-navy flex items-center gap-2">
              <ClipboardList size={20} className="text-gold" />
              {lang === 'fr' ? 'Journal d\'audit' : 'Audit Logs'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {lang === 'fr' ?'Tous les événements système - filtrez par utilisateur, action et plage de dates.' :'All system events - filter by user, action, and date range.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage(0); fetchLogs(); }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} />
              {lang === 'fr' ? 'Actualiser' : 'Refresh'}
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Download size={14} />
              {lang === 'fr' ? 'Exporter CSV' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-5 text-xs text-amber-800">
          <Shield size={14} className="flex-shrink-0 text-amber-600" />
          <span>
            <strong>{lang === 'fr' ? 'Accès restreint :' : 'Restricted access:'}</strong>{' '}
            {lang === 'fr' ?'Ce journal contient des données sensibles. Réservé aux rôles Admin et Compliance.' :'This log contains sensitive data. Reserved for Admin and Compliance roles.'}
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search by entity */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder={lang === 'fr' ? 'Rechercher entité…' : 'Search entity…'}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>

            {/* Search by actor */}
            <div className="relative flex-1 min-w-[180px]">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={actorSearch}
                onChange={(e) => { setActorSearch(e.target.value); setPage(0); }}
                placeholder={lang === 'fr' ? 'Email utilisateur…' : 'User email…'}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>

            {/* Action filter */}
            <div className="relative">
              <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">{lang === 'fr' ? 'Toutes les actions' : 'All actions'}</option>
                {Object.keys(ACTION_CONFIG).map((a) => (
                  <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Date from */}
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-slate-400 flex-shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
              <span className="text-slate-400 text-xs">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>

            {/* Clear filters */}
            {(search || actorSearch || actionFilter !== 'ALL' || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearch(''); setActorSearch(''); setActionFilter('ALL'); setDateFrom(''); setDateTo(''); setPage(0); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <X size={12} />
                {lang === 'fr' ? 'Réinitialiser' : 'Clear'}
              </button>
            )}

            <button
              onClick={() => { setPage(0); fetchLogs(); }}
              className="flex items-center gap-2 px-3 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 transition-colors"
            >
              <Filter size={13} />
              {lang === 'fr' ? 'Filtrer' : 'Filter'}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
          <span className="font-semibold text-navy">{total.toLocaleString()} {lang === 'fr' ? 'événements' : 'events'}</span>
          <span>·</span>
          <span>{lang === 'fr' ? `Page ${page + 1} / ${Math.max(1, totalPages)}` : `Page ${page + 1} of ${Math.max(1, totalPages)}`}</span>
        </div>

        {/* Logs */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-navy" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'fr' ? 'Aucun événement trouvé.' : 'No events found.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">{lang === 'fr' ? 'Action' : 'Action'}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">{lang === 'fr' ? 'Entité' : 'Entity'}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">{lang === 'fr' ? 'Acteur' : 'Actor'}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">{lang === 'fr' ? 'Raison' : 'Reason'}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">{lang === 'fr' ? 'Date' : 'Date'}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: ClipboardList };
                    const ActionIcon = cfg.icon;
                    const isExpanded = expandedId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                              <ActionIcon size={10} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-700">{log.entity_type}</span>
                            {log.entity_id && (
                              <p className="text-slate-400 font-mono text-[10px] mt-0.5">{log.entity_id.slice(0, 8)}…</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700">{log.actor_email || log.actor_name || '-'}</span>
                            {log.actor_name && log.actor_email && (
                              <p className="text-slate-400 text-[10px] mt-0.5">{log.actor_name}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <span className="text-slate-500 truncate block">{log.reason || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
                          <td className="px-4 py-3">
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors"
                                title={lang === 'fr' ? 'Voir métadonnées' : 'View metadata'}
                              >
                                <ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && log.metadata && (
                          <tr>
                            <td colSpan={6} className="px-4 pb-3 bg-slate-50">
                              <pre className="bg-slate-900 text-green-400 text-[10px] p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  {lang === 'fr' ? `${total} événements au total` : `${total} total events`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    {lang === 'fr' ? 'Précédent' : 'Previous'}
                  </button>
                  <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    {lang === 'fr' ? 'Suivant' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BackOfficeLayout>
  );
}
