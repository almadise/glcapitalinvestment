'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import BackOfficeLayout from '@/components/BackOfficeLayout';
import {
  Users,
  FolderOpen,
  AlertTriangle,
  Mail,
  Shield,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  UserCheck,
  UserX,
  Zap,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';

interface MetricsData {
  activeUsers: number;
  totalUsers: number;
  caseFilesTotal: number;
  caseFilesThisWeek: number;
  caseFilesByStatus: Record<string, number>;
  errorRate: number;
  errorCount24h: number;
  errorCountTotal: number;
  emailDelivered: number;
  emailFailed: number;
  emailPending: number;
  roleBreakdown: Record<string, number>;
  lastRefreshed: Date;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  analyst: { label: 'Analyste', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  compliance: {
    label: 'Compliance',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  gestionnaire_contenu: {
    label: 'Contenu',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
  },
  client: { label: 'Client', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  RECU: { label: 'Reçu', color: 'bg-slate-400' },
  A_COMPLETER: { label: 'À compléter', color: 'bg-amber-400' },
  EN_ANALYSE: { label: 'En analyse', color: 'bg-blue-400' },
  EN_REVUE_COMPLIANCE: { label: 'Compliance', color: 'bg-purple-400' },
  ELIGIBLE: { label: 'Éligible', color: 'bg-emerald-400' },
  SOUMIS_PARTENAIRE: { label: 'Soumis partenaire', color: 'bg-cyan-400' },
  RETOUR_PARTENAIRE: { label: 'Retour partenaire', color: 'bg-orange-400' },
  EN_NEGOCIATION: { label: 'Négociation', color: 'bg-indigo-400' },
  CLOTURE: { label: 'Clôturé', color: 'bg-green-500' },
  REJETE: { label: 'Rejeté', color: 'bg-red-400' },
};

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendLabel,
  accent,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accent: string;
  loading: boolean;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend && trendLabel && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={12} />
            {trendLabel}
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <div>
            <p className="text-2xl font-bold text-navy-950 tabular-nums">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
          {sub && (
            <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">{sub}</p>
          )}
        </>
      )}
    </div>
  );
}

export default function MetricsPage() {
  const { user, userRole } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [
        usersRes,
        activeUsersRes,
        caseFilesRes,
        caseFilesWeekRes,
        dossierStatusRes,
        errorTotalRes,
        error24hRes,
        emailDeliveredRes,
        emailFailedRes,
        emailPendingRes,
        roleRes,
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('case_files').select('id', { count: 'exact', head: true }),
        supabase
          .from('case_files')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekAgo),
        supabase.from('case_files').select('status'),
        supabase.from('error_logs').select('id', { count: 'exact', head: true }),
        supabase
          .from('error_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dayAgo),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', true),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('archived', true),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false)
          .eq('archived', false),
        supabase.from('user_profiles').select('role'),
      ]);

      // Role breakdown
      const roleBreakdown: Record<string, number> = {};
      (roleRes.data || []).forEach((u: { role: string }) => {
        const r = u.role || 'client';
        roleBreakdown[r] = (roleBreakdown[r] || 0) + 1;
      });

      // Case files by status
      const caseFilesByStatus: Record<string, number> = {};
      (dossierStatusRes.data || []).forEach((d: { status: string }) => {
        const s = d.status || 'RECU';
        caseFilesByStatus[s] = (caseFilesByStatus[s] || 0) + 1;
      });

      const totalErrors = errorTotalRes.count || 0;
      const totalCases = caseFilesRes.count || 0;
      const errorRate =
        totalCases > 0 ? Math.round((totalErrors / Math.max(totalCases, 1)) * 100) : 0;

      setMetrics({
        activeUsers: activeUsersRes.count || 0,
        totalUsers: usersRes.count || 0,
        caseFilesTotal: totalCases,
        caseFilesThisWeek: caseFilesWeekRes.count || 0,
        caseFilesByStatus,
        errorRate: Math.min(errorRate, 100),
        errorCount24h: error24hRes.count || 0,
        errorCountTotal: totalErrors,
        emailDelivered: emailDeliveredRes.count || 0,
        emailFailed: emailFailedRes.count || 0,
        emailPending: emailPendingRes.count || 0,
        roleBreakdown,
        lastRefreshed: new Date(),
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des métriques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  // Realtime subscription on error_logs
  useEffect(() => {
    const channel = supabase
      .channel('metrics-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'error_logs' }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_files' }, () => {
        fetchMetrics();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  const totalEmailActivity =
    (metrics?.emailDelivered || 0) + (metrics?.emailFailed || 0) + (metrics?.emailPending || 0);
  const emailDeliveryRate =
    totalEmailActivity > 0
      ? Math.round(((metrics?.emailDelivered || 0) / totalEmailActivity) * 100)
      : 0;

  const totalRoleUsers = Object.values(metrics?.roleBreakdown || {}).reduce((a, b) => a + b, 0);

  return (
    <BackOfficeLayout
      role={(userRole as any) || 'admin'}
      userName={user?.email?.split('@')[0] || 'Admin'}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-navy flex items-center gap-2">
              <BarChart3 size={20} className="text-gold" />
              {lang === 'fr' ? 'Métriques système' : 'System Metrics'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {lang === 'fr'
                ? 'KPIs en temps réel - utilisateurs actifs, dossiers, erreurs, emails et répartition des rôles.'
                : 'Real-time KPIs - active users, case files, errors, emails, and role breakdown.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                autoRefresh
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <Zap size={12} />
              {autoRefresh
                ? lang === 'fr'
                  ? 'Auto-refresh ON'
                  : 'Auto-refresh ON'
                : lang === 'fr'
                  ? 'Auto-refresh OFF'
                  : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {lang === 'fr' ? 'Actualiser' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Last refreshed */}
        {metrics && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Activity size={10} />
            {lang === 'fr' ? 'Dernière mise à jour :' : 'Last updated:'}{' '}
            {metrics.lastRefreshed.toLocaleTimeString('fr-FR')}
            {autoRefresh && (
              <span className="ml-1 text-emerald-500">
                ·{' '}
                {lang === 'fr' ? 'Actualisation auto toutes les 30s' : 'Auto-refreshing every 30s'}
              </span>
            )}
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm text-red-700">
            <AlertTriangle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* KPI Grid - top row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Users}
            label={lang === 'fr' ? 'Utilisateurs actifs' : 'Active users'}
            value={loading ? '-' : (metrics?.activeUsers ?? 0)}
            sub={
              loading
                ? undefined
                : `${metrics?.totalUsers ?? 0} ${lang === 'fr' ? 'comptes au total' : 'total accounts'}`
            }
            trend="neutral"
            trendLabel={
              loading
                ? undefined
                : `${metrics?.totalUsers ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0}% actifs`
            }
            accent="bg-navy-900"
            loading={loading}
          />
          <KPICard
            icon={FolderOpen}
            label={lang === 'fr' ? 'Dossiers soumis' : 'Case file submissions'}
            value={loading ? '-' : (metrics?.caseFilesTotal ?? 0)}
            sub={
              loading
                ? undefined
                : `+${metrics?.caseFilesThisWeek ?? 0} ${lang === 'fr' ? 'cette semaine' : 'this week'}`
            }
            trend={metrics && metrics.caseFilesThisWeek > 0 ? 'up' : 'neutral'}
            trendLabel={loading ? undefined : `+${metrics?.caseFilesThisWeek ?? 0} / 7j`}
            accent="bg-blue-600"
            loading={loading}
          />
          <KPICard
            icon={AlertTriangle}
            label={lang === 'fr' ? "Taux d'erreur" : 'Error rate'}
            value={loading ? '-' : `${metrics?.errorRate ?? 0}%`}
            sub={
              loading
                ? undefined
                : `${metrics?.errorCount24h ?? 0} ${lang === 'fr' ? 'erreurs (24h)' : 'errors (24h)'} · ${metrics?.errorCountTotal ?? 0} total`
            }
            trend={metrics && metrics.errorCount24h > 5 ? 'down' : 'neutral'}
            trendLabel={loading ? undefined : `${metrics?.errorCount24h ?? 0} / 24h`}
            accent={metrics && metrics.errorCount24h > 5 ? 'bg-red-500' : 'bg-amber-500'}
            loading={loading}
          />
          <KPICard
            icon={Mail}
            label={lang === 'fr' ? 'Livraison email' : 'Email delivery'}
            value={loading ? '-' : `${emailDeliveryRate}%`}
            sub={
              loading
                ? undefined
                : `${metrics?.emailDelivered ?? 0} lus · ${metrics?.emailFailed ?? 0} archivés · ${metrics?.emailPending ?? 0} non lus`
            }
            trend={emailDeliveryRate >= 90 ? 'up' : emailDeliveryRate < 70 ? 'down' : 'neutral'}
            trendLabel={loading ? undefined : `${emailDeliveryRate}% taux`}
            accent={
              emailDeliveryRate >= 90
                ? 'bg-emerald-600'
                : emailDeliveryRate < 70
                  ? 'bg-red-500'
                  : 'bg-amber-500'
            }
            loading={loading}
          />
        </div>

        {/* Bottom row - Case status breakdown + Role breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Case files by status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <FolderOpen size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">
                  {lang === 'fr' ? 'Dossiers par statut' : 'Case files by status'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'fr'
                    ? 'Répartition des dossiers actifs'
                    : 'Active dossier distribution'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : Object.keys(metrics?.caseFilesByStatus || {}).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <FolderOpen size={28} className="mb-2 opacity-40" />
                <p className="text-sm">
                  {lang === 'fr' ? 'Aucun dossier trouvé' : 'No dossiers found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(metrics?.caseFilesByStatus || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => {
                    const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-300' };
                    const total = Object.values(metrics?.caseFilesByStatus || {}).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.color}`} />
                        <span className="text-xs text-slate-600 flex-1 truncate">{cfg.label}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cfg.color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-navy tabular-nums w-6 text-right">
                            {count}
                          </span>
                          <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Role breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
                <Shield size={15} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">
                  {lang === 'fr' ? 'Répartition des rôles' : 'Role breakdown'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'fr' ? 'Utilisateurs par rôle système' : 'Users per system role'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : totalRoleUsers === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Users size={28} className="mb-2 opacity-40" />
                <p className="text-sm">
                  {lang === 'fr' ? 'Aucun utilisateur trouvé' : 'No users found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(metrics?.roleBreakdown || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([role, count]) => {
                    const cfg = ROLE_CONFIG[role] || {
                      label: role,
                      color: 'text-slate-700',
                      bg: 'bg-slate-50 border-slate-200',
                    };
                    const pct = totalRoleUsers > 0 ? Math.round((count / totalRoleUsers) * 100) : 0;
                    return (
                      <div
                        key={role}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${cfg.bg}`}
                      >
                        <span className={`text-xs font-semibold flex-1 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16 h-1.5 bg-white/60 rounded-full overflow-hidden border border-white/40">
                            <div
                              className={`h-full rounded-full ${cfg.color.replace('text-', 'bg-').replace('-700', '-400').replace('-600', '-400')}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold tabular-nums ${cfg.color}`}>
                            {count}
                          </span>
                          <span className={`text-[10px] opacity-60 ${cfg.color}`}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <UserCheck size={12} className="text-emerald-500" />
                    {lang === 'fr' ? 'Actifs :' : 'Active:'} {metrics?.activeUsers ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UserX size={12} className="text-slate-400" />
                    {lang === 'fr' ? 'Inactifs :' : 'Inactive:'}{' '}
                    {(metrics?.totalUsers ?? 0) - (metrics?.activeUsers ?? 0)}
                  </span>
                  <span className="font-semibold text-navy">
                    {lang === 'fr' ? 'Total :' : 'Total:'} {metrics?.totalUsers ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email delivery detail */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Mail size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">
                {lang === 'fr' ? 'Statut des notifications email' : 'Email notification status'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'fr'
                  ? 'Basé sur les notifications système (lues / archivées / non lues)'
                  : 'Based on system notifications (read / archived / unread)'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <CheckCircle2 size={18} className="text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-emerald-700 tabular-nums">
                  {metrics?.emailDelivered ?? 0}
                </p>
                <p className="text-[11px] text-emerald-600">{lang === 'fr' ? 'Lues' : 'Read'}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <Clock size={18} className="text-slate-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-700 tabular-nums">
                  {metrics?.emailPending ?? 0}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'fr' ? 'Non lues' : 'Unread'}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <XCircle size={18} className="text-amber-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-amber-700 tabular-nums">
                  {metrics?.emailFailed ?? 0}
                </p>
                <p className="text-[11px] text-amber-600">
                  {lang === 'fr' ? 'Archivées' : 'Archived'}
                </p>
              </div>
            </div>
          )}

          {!loading && totalEmailActivity > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>{lang === 'fr' ? 'Taux de lecture' : 'Read rate'}</span>
                <span className="font-semibold text-emerald-600">{emailDeliveryRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${emailDeliveryRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </BackOfficeLayout>
  );
}
