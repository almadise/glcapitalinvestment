'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AdminLayout from './components/AdminLayout';
import Link from 'next/link';
import {
  Inbox,
  ClipboardList,
  Users,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Shield,
  Activity,
  FileText,
} from 'lucide-react';
import { useRealtimeAllCases } from '@/hooks/useRealtimeDashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface Stats {
  submissions: number;
  cases: number;
  users: number;
  pendingCases: number;
  complianceFlags: number;
  eligibleCases: number;
  rejectedCases: number;
  avgProcessingDays: number;
}

interface ServiceBreakdown {
  service: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  submissions: number;
  flags: number;
}

interface ComplianceScorecard {
  period: string;
  total: number;
  flagged: number;
  eligible: number;
  rejected: number;
  score: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    submissions: 0, cases: 0, users: 0, pendingCases: 0,
    complianceFlags: 0, eligibleCases: 0, rejectedCases: 0, avgProcessingDays: 0,
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [scorecard, setScorecard] = useState<ComplianceScorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingReport, setExportingReport] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const [sub, cases, users, pending, flagged, eligible, rejected, allCases] = await Promise.all([
      supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
      supabase.from('case_files').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'RECU'),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).not('risk_tags', 'is', null),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'ELIGIBLE'),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'REJETE'),
      supabase.from('case_files').select('type, created_at, updated_at, status'),
    ]);

    // Service breakdown
    const typeCounts: Record<string, number> = {};
    (allCases.data || []).forEach((c: any) => {
      const t = c.type || 'Autre';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    setServiceBreakdown(Object.entries(typeCounts).map(([service, count]) => ({ service, count })));

    // Avg processing days
    const processed = (allCases.data || []).filter((c: any) => c.updated_at && c.created_at);
    const avgDays = processed.length > 0
      ? Math.round(processed.reduce((acc: number, c: any) => {
          const diff = (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return acc + diff;
        }, 0) / processed.length)
      : 0;

    // Monthly trend (last 6 months)
    const now = new Date();
    const months: MonthlyTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
      months.push({ month: key, submissions: 0, flags: 0 });
    }
    (allCases.data || []).forEach((c: any) => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
      const m = months.find(m => m.month === key);
      if (m) {
        m.submissions++;
        if (c.risk_tags && c.risk_tags.length > 0) m.flags++;
      }
    });
    setMonthlyTrend(months);

    // 90-day compliance scorecard
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recent = (allCases.data || []).filter((c: any) => new Date(c.created_at) >= ninetyDaysAgo);
    const recentFlagged = recent.filter((c: any) => c.risk_tags && c.risk_tags.length > 0).length;
    const recentEligible = recent.filter((c: any) => c.status === 'ELIGIBLE').length;
    const recentRejected = recent.filter((c: any) => c.status === 'REJETE').length;
    const score = recent.length > 0 ? Math.round(((recent.length - recentFlagged) / recent.length) * 100) : 100;
    setScorecard({
      period: lang === 'fr' ? '90 derniers jours' : 'Last 90 days',
      total: recent.length,
      flagged: recentFlagged,
      eligible: recentEligible,
      rejected: recentRejected,
      score,
    });

    setStats({
      submissions: sub.count || 0,
      cases: cases.count || 0,
      users: users.count || 0,
      pendingCases: pending.count || 0,
      complianceFlags: flagged.count || 0,
      eligibleCases: eligible.count || 0,
      rejectedCases: rejected.count || 0,
      avgProcessingDays: avgDays,
    });
    setLoading(false);
  }, [user, lang]);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  useRealtimeAllCases({ enabled: !!user, lang, onAnyUpdate: () => refreshStats() });

  const handleExportReport = async () => {
    setExportingReport(true);
    try {
      const supabase = createClient();
      const { data: cases } = await supabase.from('case_files').select('*').order('created_at', { ascending: false });
      const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      let csv = 'ID,Titre,Type,Statut,Client,Tags Risque,Créé le\n';
      (cases || []).forEach((c: any) => {
        csv += `"${c.id}","${c.title || ''}","${c.type || ''}","${c.status || ''}","${c.client_email || ''}","${(c.risk_tags || []).join('; ')}","${new Date(c.created_at).toLocaleDateString('fr-FR')}"\n`;
      });
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gl_capital_rapport_conformite_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingReport(false);
    }
  };

  const t = {
    welcome: lang === 'fr' ? 'Tableau de bord Administrateur' : 'Admin Dashboard',
    subtitle: lang === 'fr' ? 'Vue d\'ensemble complète du portail GL Capital' : 'Complete overview of the GL Capital portal',
    quickActions: lang === 'fr' ? 'Accès rapide' : 'Quick Access',
    kpiTrends: lang === 'fr' ? 'Tendances KPI — 6 mois' : 'KPI Trends — 6 months',
    scorecard90: lang === 'fr' ? 'Scorecard conformité — 90 jours' : '90-Day Compliance Scorecard',
    exportReport: lang === 'fr' ? 'Exporter rapport' : 'Export Report',
    serviceBreakdown: lang === 'fr' ? 'Soumissions par service' : 'Submissions by Service',
    avgProcessing: lang === 'fr' ? 'Délai moyen traitement' : 'Avg Processing Time',
    complianceScore: lang === 'fr' ? 'Score conformité' : 'Compliance Score',
    daysUnit: lang === 'fr' ? 'jours' : 'days',
  };

  const kpis = [
    { label: lang === 'fr' ? 'Soumissions contact' : 'Contact Submissions', value: stats.submissions, icon: Inbox, color: 'text-gold', bg: 'bg-gold/10', href: '/admin/contact-submissions' },
    { label: lang === 'fr' ? 'Dossiers actifs' : 'Active Cases', value: stats.cases, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'Utilisateurs' : 'Users', value: stats.users, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/users' },
    { label: lang === 'fr' ? 'Dossiers en attente' : 'Pending Cases', value: stats.pendingCases, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'Flags conformité' : 'Compliance Flags', value: stats.complianceFlags, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', href: '/admin/analytics' },
    { label: lang === 'fr' ? 'Dossiers éligibles' : 'Eligible Cases', value: stats.eligibleCases, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'Dossiers rejetés' : 'Rejected Cases', value: stats.rejectedCases, icon: Shield, color: 'text-slate-600', bg: 'bg-slate-100', href: '/admin/case-management' },
    { label: t.avgProcessing, value: `${stats.avgProcessingDays}j`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/admin/analytics' },
  ];

  const quickLinks = [
    { label: lang === 'fr' ? 'Voir les soumissions' : 'View Submissions', href: '/admin/contact-submissions', icon: Inbox, desc: lang === 'fr' ? 'Gérer les demandes de contact' : 'Manage contact requests' },
    { label: lang === 'fr' ? 'Gestion dossiers' : 'Case Management', href: '/admin/case-management', icon: ClipboardList, desc: lang === 'fr' ? 'Suivre et mettre à jour les dossiers' : 'Track and update cases' },
    { label: lang === 'fr' ? 'Gérer les utilisateurs' : 'Manage Users', href: '/admin/users', icon: Users, desc: lang === 'fr' ? 'Modifier les rôles et accès' : 'Edit roles and access' },
    { label: lang === 'fr' ? 'Analytique avancée' : 'Advanced Analytics', href: '/admin/analytics', icon: BarChart3, desc: lang === 'fr' ? 'Statistiques et graphiques' : 'Statistics and charts' },
  ];

  const scorecardColor = scorecard
    ? scorecard.score >= 80 ? 'text-emerald-600' : scorecard.score >= 60 ? 'text-amber-600' : 'text-red-600' :'text-slate-400';

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">{t.welcome}</h1>
          <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
        </div>
        <button
          onClick={handleExportReport}
          disabled={exportingReport}
          aria-label={t.exportReport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
        >
          {exportingReport ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {t.exportReport}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8" role="region" aria-label={lang === 'fr' ? 'Indicateurs clés' : 'Key performance indicators'}>
            {kpis.map((kpi) => (
              <Link key={kpi.label} href={kpi.href} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-gold/40 hover:shadow-md transition-all group" aria-label={`${kpi.label}: ${kpi.value}`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-2 sm:mb-3`}>
                  <kpi.icon size={18} className={kpi.color} aria-hidden="true" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-navy">{kpi.value}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{kpi.label}</div>
              </Link>
            ))}
          </div>

          {/* KPI Trends Chart + Compliance Scorecard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Trend chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5" role="region" aria-label={t.kpiTrends}>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-gold" aria-hidden="true" />
                <h2 className="font-semibold text-navy text-sm">{t.kpiTrends}</h2>
              </div>
              {monthlyTrend.every(m => m.submissions === 0) ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0a1941' }} />
                    <Line type="monotone" dataKey="submissions" stroke="#c9a84c" strokeWidth={2} dot={{ fill: '#c9a84c', r: 4 }} name={lang === 'fr' ? 'Soumissions' : 'Submissions'} />
                    <Line type="monotone" dataKey="flags" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name={lang === 'fr' ? 'Flags conformité' : 'Compliance Flags'} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gold" aria-hidden="true" /><span className="text-xs text-slate-500">{lang === 'fr' ? 'Soumissions' : 'Submissions'}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" /><span className="text-xs text-slate-500">{lang === 'fr' ? 'Flags conformité' : 'Compliance Flags'}</span></div>
              </div>
            </div>

            {/* 90-day Compliance Scorecard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5" role="region" aria-label={t.scorecard90}>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-gold" aria-hidden="true" />
                <h2 className="font-semibold text-navy text-sm">{t.scorecard90}</h2>
              </div>
              {scorecard ? (
                <>
                  <div className="text-center mb-4">
                    <div className={`text-5xl font-bold ${scorecardColor}`} aria-label={`${t.complianceScore}: ${scorecard.score}%`}>{scorecard.score}%</div>
                    <div className="text-xs text-slate-400 mt-1">{scorecard.period}</div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4" role="progressbar" aria-valuenow={scorecard.score} aria-valuemin={0} aria-valuemax={100} aria-label={t.complianceScore}>
                    <div className={`h-2 rounded-full transition-all ${scorecard.score >= 80 ? 'bg-emerald-500' : scorecard.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${scorecard.score}%` }} />
                  </div>
                  <dl className="space-y-2">
                    {[
                      { label: lang === 'fr' ? 'Total dossiers' : 'Total cases', value: scorecard.total, color: 'text-navy' },
                      { label: lang === 'fr' ? 'Flags conformité' : 'Compliance flags', value: scorecard.flagged, color: 'text-red-600' },
                      { label: lang === 'fr' ? 'Éligibles' : 'Eligible', value: scorecard.eligible, color: 'text-emerald-600' },
                      { label: lang === 'fr' ? 'Rejetés' : 'Rejected', value: scorecard.rejected, color: 'text-slate-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <dt className="text-xs text-slate-500">{item.label}</dt>
                        <dd className={`text-sm font-bold ${item.color}`}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                  {lang === 'fr' ? 'Aucune donnée' : 'No data'}
                </div>
              )}
            </div>
          </div>

          {/* Service Breakdown */}
          {serviceBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6" role="region" aria-label={t.serviceBreakdown}>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-gold" aria-hidden="true" />
                <h2 className="font-semibold text-navy text-sm">{t.serviceBreakdown}</h2>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={serviceBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="service" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0a1941' }} />
                  <Bar dataKey="count" fill="#0b1f3a" radius={[4, 4, 0, 0]} name={lang === 'fr' ? 'Dossiers' : 'Cases'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Links */}
          <div className="mb-4">
            <h2 className="font-semibold text-navy text-base mb-3">{t.quickActions}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link key={link.label} href={link.href} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 sm:gap-4 hover:border-gold/40 hover:shadow-md transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-navy/5 flex items-center justify-center flex-shrink-0">
                    <link.icon size={17} className="text-navy" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy text-sm">{link.label}</div>
                    <div className="text-xs text-slate-500 truncate">{link.desc}</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-gold transition-colors flex-shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
