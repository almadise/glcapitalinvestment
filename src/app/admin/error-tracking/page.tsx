'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { AlertTriangle, RefreshCw, Loader2, Search, ChevronDown, Clock, User, Globe, Code2, AlertCircle, Info } from 'lucide-react';

interface ErrorLog {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  url?: string;
  user_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

const LEVEL_CONFIG = {
  error: { label: 'Error', color: 'text-red-700', bg: 'bg-red-100 border-red-200', dot: 'bg-red-500', icon: AlertTriangle },
  warn: { label: 'Warning', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', dot: 'bg-amber-400', icon: AlertCircle },
  info: { label: 'Info', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', dot: 'bg-blue-400', icon: Info },
};

const PAGE_SIZE = 25;

export default function ErrorTrackingDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();

  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'error' | 'warn' | 'info'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ errors: 0, warnings: 0, infos: 0 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('error_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (levelFilter !== 'ALL') query = query.eq('level', levelFilter);
      if (search.trim()) query = query.ilike('message', `%${search.trim()}%`);

      const { data, count, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setLogs(data || []);
      setTotal(count || 0);
    } catch (err: any) {
      setError(err.message || 'Error loading logs');
    } finally {
      setLoading(false);
    }
  }, [page, levelFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const [errRes, warnRes, infoRes] = await Promise.all([
        supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('level', 'error'),
        supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('level', 'warn'),
        supabase.from('error_logs').select('id', { count: 'exact', head: true }).eq('level', 'info'),
      ]);
      setStats({ errors: errRes.count || 0, warnings: warnRes.count || 0, infos: infoRes.count || 0 });
    } catch {}
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-navy flex items-center gap-2">
              <Code2 size={20} className="text-gold" />
              {lang === 'fr' ? 'Suivi des erreurs' : 'Error Tracking'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {lang === 'fr' ? 'Stack traces, erreurs API et logs de production.' : 'Stack traces, API failures, and production logs.'}
            </p>
          </div>
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} />
            {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: lang === 'fr' ? 'Erreurs' : 'Errors', value: stats.errors, color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
            { label: lang === 'fr' ? 'Avertissements' : 'Warnings', value: stats.warnings, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
            { label: lang === 'fr' ? 'Informations' : 'Info', value: stats.infos, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Info },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={s.color} />
                <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={lang === 'fr' ? 'Rechercher dans les messages…' : 'Search messages…'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['ALL', 'error', 'warn', 'info'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => { setLevelFilter(lvl); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  levelFilter === lvl ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {lvl === 'ALL' ? (lang === 'fr' ? 'Tous' : 'All') : lvl === 'error' ? (lang === 'fr' ? 'Erreurs' : 'Errors') : lvl === 'warn' ? (lang === 'fr' ? 'Warnings' : 'Warnings') : 'Info'}
              </button>
            ))}
          </div>
        </div>

        {/* Logs table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-navy" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Code2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{lang === 'fr' ? 'Aucun log trouvé.' : 'No logs found.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const cfg = LEVEL_CONFIG[log.level];
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left"
                  >
                    <div className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${cfg.dot} mt-2`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {formatDate(log.created_at)}
                        </span>
                        {log.url && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[200px]">
                            <Globe size={10} />
                            {log.url}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 font-medium truncate">{log.message}</p>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`flex-shrink-0 text-slate-400 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                      {log.stack && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">Stack Trace</p>
                          <pre className="bg-slate-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto leading-relaxed whitespace-pre-wrap font-mono">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">Metadata</p>
                          <pre className="bg-slate-50 border border-slate-200 text-slate-700 text-xs p-3 rounded-lg overflow-x-auto font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {log.user_id && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <User size={11} />
                            <span className="font-mono truncate">{log.user_id}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="font-mono text-slate-400">{log.id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              {lang === 'fr' ? `${total} logs au total` : `${total} total logs`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                {lang === 'fr' ? 'Précédent' : 'Previous'}
              </button>
              <span className="text-xs text-slate-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                {lang === 'fr' ? 'Suivant' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
