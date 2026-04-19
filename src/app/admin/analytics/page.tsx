'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Users, FolderOpen, Inbox, Loader2, RefreshCw, AlertCircle,
  Download, FileText, Tag, AlertTriangle, Clock, CheckCircle2, Activity,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,  } from 'recharts';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { toast } from 'sonner';
import { logAuditAction } from '@/lib/auditLogger';

interface AnalyticsData {
  totalSubmissions: number;
  totalCases: number;
  totalUsers: number;
  casesByStatus: { status: string; count: number; rawStatus: string }[];
  submissionsByMonth: { month: string; count: number }[];
  casesByType: { type: string; count: number }[];
  complianceFlagsByMonth: { month: string; flagged: number; clean: number }[];
  avgProcessingByStatus: { status: string; avgDays: number }[];
  pipelineTrend: { month: string; received: number; eligible: number; rejected: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  RECU: '#3b82f6',
  A_COMPLETER: '#f97316',
  EN_ANALYSE: '#f59e0b',
  EN_REVUE_COMPLIANCE: '#6366f1',
  ELIGIBLE: '#10b981',
  SOUMIS_PARTENAIRE: '#0ea5e9',
  RETOUR_PARTENAIRE: '#8b5cf6',
  EN_NEGOCIATION: '#a855f7',
  CLOTURE: '#14b8a6',
  REJETE: '#ef4444',
};

const TYPE_COLORS = ['#c9a84c', '#0a1941', '#3b82f6', '#10b981', '#f59e0b'];

export default function AdminAnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const t = {
    title: lang === 'fr' ? 'Analytique avancée' : 'Advanced Analytics',
    subtitle: lang === 'fr' ? 'Pipeline dossiers, conformité et métriques de performance' : 'Dossier pipeline, compliance and performance metrics',
    refresh: lang === 'fr' ? 'Actualiser' : 'Refresh',
    totalSubmissions: lang === 'fr' ? 'Soumissions totales' : 'Total Submissions',
    totalCases: lang === 'fr' ? 'Dossiers totaux' : 'Total Cases',
    totalUsers: lang === 'fr' ? 'Utilisateurs' : 'Users',
    casesByStatus: lang === 'fr' ? 'Distribution par statut' : 'Status Distribution',
    submissionsByMonth: lang === 'fr' ? 'Soumissions par mois' : 'Submissions by Month',
    casesByType: lang === 'fr' ? 'Dossiers par type de service' : 'Cases by Service Type',
    pipelineTrend: lang === 'fr' ? 'Tendance pipeline — 6 mois' : 'Pipeline Trend — 6 months',
    complianceBreakdown: lang === 'fr' ? 'Répartition flags conformité' : 'Compliance Flag Breakdown',
    avgProcessing: lang === 'fr' ? 'Délai moyen par statut (jours)' : 'Avg Processing Time by Status (days)',
    noData: lang === 'fr' ? 'Aucune donnée disponible' : 'No data available',
    statusLabels: {
      RECU: lang === 'fr' ? 'Reçu' : 'Received',
      A_COMPLETER: lang === 'fr' ? 'À compléter' : 'To Complete',
      EN_ANALYSE: lang === 'fr' ? 'En analyse' : 'Under Review',
      EN_REVUE_COMPLIANCE: lang === 'fr' ? 'Revue conformité' : 'Compliance Review',
      ELIGIBLE: lang === 'fr' ? 'Éligible' : 'Eligible',
      SOUMIS_PARTENAIRE: lang === 'fr' ? 'Soumis partenaire' : 'Submitted Partner',
      RETOUR_PARTENAIRE: lang === 'fr' ? 'Retour partenaire' : 'Partner Feedback',
      EN_NEGOCIATION: lang === 'fr' ? 'En négociation' : 'In Negotiation',
      CLOTURE: lang === 'fr' ? 'Clôturé' : 'Closed',
      REJETE: lang === 'fr' ? 'Rejeté' : 'Rejected',
    } as Record<string, string>,
  };

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const [submissionsRes, casesRes, usersRes, caseStatusRes, caseTypeRes, allCasesRes] = await Promise.all([
        supabase.from('contact_submissions').select('id, created_at', { count: 'exact' }),
        supabase.from('case_files').select('id, status, type, created_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('case_files').select('status'),
        supabase.from('case_files').select('type'),
        supabase.from('case_files').select('status, type, created_at, updated_at, risk_tags'),
      ]);

      const statusCounts: Record<string, number> = {};
      (caseStatusRes.data || []).forEach((c: any) => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });
      const casesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: t.statusLabels[status] || status,
        count,
        rawStatus: status,
      }));

      const typeCounts: Record<string, number> = {};
      (caseTypeRes.data || []).forEach((c: any) => {
        typeCounts[c.type || 'Autre'] = (typeCounts[c.type || 'Autre'] || 0) + 1;
      });
      const casesByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

      // Monthly submissions
      const monthCounts: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
        monthCounts[key] = 0;
      }
      (submissionsRes.data || []).forEach((s: any) => {
        const d = new Date(s.created_at);
        const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
        if (key in monthCounts) monthCounts[key]++;
      });
      const submissionsByMonth = Object.entries(monthCounts).map(([month, count]) => ({ month, count }));

      // Pipeline trend (received, eligible, rejected per month)
      const pipelineMonths: Record<string, { received: number; eligible: number; rejected: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
        pipelineMonths[key] = { received: 0, eligible: 0, rejected: 0 };
      }
      (allCasesRes.data || []).forEach((c: any) => {
        const d = new Date(c.created_at);
        const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
        if (key in pipelineMonths) {
          pipelineMonths[key].received++;
          if (c.status === 'ELIGIBLE') pipelineMonths[key].eligible++;
          if (c.status === 'REJETE') pipelineMonths[key].rejected++;
        }
      });
      const pipelineTrend = Object.entries(pipelineMonths).map(([month, v]) => ({ month, ...v }));

      // Compliance flags by month
      const flagMonths: Record<string, { flagged: number; clean: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
        flagMonths[key] = { flagged: 0, clean: 0 };
      }
      (allCasesRes.data || []).forEach((c: any) => {
        const d = new Date(c.created_at);
        const key = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
        if (key in flagMonths) {
          if (c.risk_tags && c.risk_tags.length > 0) flagMonths[key].flagged++;
          else flagMonths[key].clean++;
        }
      });
      const complianceFlagsByMonth = Object.entries(flagMonths).map(([month, v]) => ({ month, ...v }));

      // Avg processing time by status
      const statusDays: Record<string, number[]> = {};
      (allCasesRes.data || []).filter((c: any) => c.updated_at).forEach((c: any) => {
        const days = (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (!statusDays[c.status]) statusDays[c.status] = [];
        statusDays[c.status].push(days);
      });
      const avgProcessingByStatus = Object.entries(statusDays).map(([status, days]) => ({
        status: t.statusLabels[status] || status,
        avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
      }));

      setData({
        totalSubmissions: submissionsRes.count || 0,
        totalCases: casesRes.count || 0,
        totalUsers: usersRes.count || 0,
        casesByStatus,
        submissionsByMonth,
        casesByType,
        complianceFlagsByMonth,
        avgProcessingByStatus,
        pipelineTrend,
      });
    } catch (err: any) {
      setError(err?.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [user, lang]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/sign-up-login-screen');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [fetchAnalytics, user]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleExportCSV = async (type: 'dossiers' | 'history' | 'notes' | 'risk_tags') => {
    setExporting(type);
    try {
      const supabase = createClient();
      let csvContent = '';
      let filename = '';

      if (type === 'dossiers') {
        const { data: cases } = await supabase.from('case_files').select('*').order('created_at', { ascending: false });
        csvContent = 'ID,Titre,Type,Statut,Client Email,Tags Risque,Motif Rejet,Motif Clôture,Créé le,Mis à jour\n';
        (cases || []).forEach((c: any) => {
          csvContent += `"${c.id}","${c.title || ''}","${c.type || ''}","${c.status || ''}","${c.client_email || ''}","${(c.risk_tags || []).join('; ')}","${(c.rejection_reason || '').replace(/"/g, '""')}","${(c.closure_reason || '').replace(/"/g, '""')}","${formatDate(c.created_at)}","${c.updated_at ? formatDate(c.updated_at) : ''}"\n`;
        });
        filename = 'dossiers_historique';
      } else if (type === 'history') {
        const { data: history } = await supabase.from('case_status_history').select('*').order('created_at', { ascending: false });
        csvContent = 'ID,Dossier ID,Ancien Statut,Nouveau Statut,Modifié par,Note,Date\n';
        (history || []).forEach((h: any) => {
          csvContent += `"${h.id}","${h.case_id}","${h.old_status || ''}","${h.new_status}","${h.changed_by_email || ''}","${(h.note || '').replace(/"/g, '""')}","${formatDate(h.created_at)}"\n`;
        });
        filename = 'changements_statut';
      } else if (type === 'notes') {
        const { data: notes } = await supabase.from('case_internal_notes').select('*').order('created_at', { ascending: false });
        csvContent = 'ID,Dossier ID,Auteur,Contenu,Créé le,Modifié le\n';
        (notes || []).forEach((n: any) => {
          csvContent += `"${n.id}","${n.case_id}","${n.author_email || ''}","${n.content.replace(/"/g, '""')}","${formatDate(n.created_at)}","${n.updated_at ? formatDate(n.updated_at) : ''}"\n`;
        });
        filename = 'notes_internes';
      } else if (type === 'risk_tags') {
        const { data: cases } = await supabase.from('case_files').select('id, title, status, risk_tags, client_email, created_at').not('risk_tags', 'is', null);
        csvContent = 'Dossier ID,Titre,Statut,Client,Tags Risque,Date\n';
        (cases || []).filter((c: any) => c.risk_tags && c.risk_tags.length > 0).forEach((c: any) => {
          csvContent += `"${c.id}","${c.title || ''}","${c.status}","${c.client_email || ''}","${(c.risk_tags || []).join('; ')}","${formatDate(c.created_at)}"\n`;
        });
        filename = 'tags_risque';
      }

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gl_capital_${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      if (user?.id) {
        await logAuditAction({
          action: 'EXPORT_CSV',
          entityType: 'analytics_export',
          actorId: user.id,
          actorEmail: user.email || undefined,
          reason: `Export CSV: ${type}`,
          metadata: { export_type: type, filename },
        });
      }
      toast.success('Export CSV téléchargé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'export');
    } finally {
      setExporting(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" aria-label={lang === 'fr' ? 'Chargement...' : 'Loading...'} />
      </div>
    );
  }
  if (!user) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-navy text-xl font-bold font-display">{t.title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{t.subtitle}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            aria-label={t.refresh}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-navy bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all self-start"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{t.refresh}</span>
          </button>
        </div>

        {/* Export Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5" role="region" aria-label="Exports audit et conformité">
          <div className="flex items-center gap-2 mb-4">
            <Download size={16} className="text-gold" aria-hidden="true" />
            <h2 className="font-semibold text-navy text-sm">Exports Audit & Conformité</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Admin uniquement</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'dossiers' as const, label: 'Historique dossiers', desc: 'Tous les dossiers avec statuts et tags', icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
              { key: 'history' as const, label: 'Changements de statut', desc: 'Qui a changé quoi, quand et pourquoi', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
              { key: 'notes' as const, label: 'Notes internes', desc: 'Toutes les notes avec auteur et horodatage', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
              { key: 'risk_tags' as const, label: 'Journal tags risque', desc: 'Dossiers avec tags pays/secteur/sanctions', icon: Tag, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((item) => (
              <div key={item.key} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all">
                <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                  <item.icon size={16} className={item.color} aria-hidden="true" />
                </div>
                <div className="font-semibold text-navy text-xs mb-1">{item.label}</div>
                <div className="text-slate-400 text-xs mb-3">{item.desc}</div>
                <button
                  onClick={() => handleExportCSV(item.key)}
                  disabled={exporting === item.key}
                  aria-label={`Exporter ${item.label} en CSV`}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {exporting === item.key ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Download size={11} aria-hidden="true" />}
                  CSV
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm" role="alert">
            <AlertCircle size={16} className="flex-shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-gold" aria-label={lang === 'fr' ? 'Chargement...' : 'Loading...'} />
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label={lang === 'fr' ? 'Indicateurs clés' : 'Key metrics'}>
              {[
                { label: t.totalSubmissions, value: data.totalSubmissions, icon: Inbox, color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
                { label: t.totalCases, value: data.totalCases, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                { label: t.totalUsers, value: data.totalUsers, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${kpi.bg}`}>
                      <kpi.icon size={18} className={kpi.color} aria-hidden="true" />
                    </div>
                    <TrendingUp size={16} className="text-emerald-500" aria-hidden="true" />
                  </div>
                  <div className="text-3xl font-bold text-navy mb-1">{kpi.value}</div>
                  <div className="text-slate-500 text-sm">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Pipeline Trend */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5" role="region" aria-label={t.pipelineTrend}>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-gold" aria-hidden="true" />
                <h2 className="text-navy font-semibold">{t.pipelineTrend}</h2>
              </div>
              {data.pipelineTrend.every(d => d.received === 0) ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">{t.noData}</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.pipelineTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0a1941' }} />
                    <Area type="monotone" dataKey="received" stroke="#c9a84c" fill="rgba(201,168,76,0.1)" strokeWidth={2} name={lang === 'fr' ? 'Reçus' : 'Received'} />
                    <Area type="monotone" dataKey="eligible" stroke="#10b981" fill="rgba(16,185,129,0.1)" strokeWidth={2} name={lang === 'fr' ? 'Éligibles' : 'Eligible'} />
                    <Area type="monotone" dataKey="rejected" stroke="#ef4444" fill="rgba(239,68,68,0.1)" strokeWidth={2} name={lang === 'fr' ? 'Rejetés' : 'Rejected'} />
                    <Legend formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Flag Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5" role="region" aria-label={t.complianceBreakdown}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className="text-red-500" aria-hidden="true" />
                  <h2 className="text-navy font-semibold">{t.complianceBreakdown}</h2>
                </div>
                {data.complianceFlagsByMonth.every(d => d.flagged === 0 && d.clean === 0) ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">{t.noData}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.complianceFlagsByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0a1941' }} />
                      <Bar dataKey="flagged" fill="#ef4444" radius={[4, 4, 0, 0]} name={lang === 'fr' ? 'Flaggés' : 'Flagged'} stackId="a" />
                      <Bar dataKey="clean" fill="#10b981" radius={[4, 4, 0, 0]} name={lang === 'fr' ? 'Conformes' : 'Clean'} stackId="a" />
                      <Legend formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Status Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5" role="region" aria-label={t.casesByStatus}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={16} className="text-emerald-500" aria-hidden="true" />
                  <h2 className="text-navy font-semibold">{t.casesByStatus}</h2>
                </div>
                {data.casesByStatus.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">{t.noData}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.casesByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="status" paddingAngle={3}>
                        {data.casesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.rawStatus] || TYPE_COLORS[index % TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0a1941' }} />
                      <Legend formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Avg Processing Time */}
            {data.avgProcessingByStatus.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5" role="region" aria-label={t.avgProcessing}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-indigo-500" aria-hidden="true" />
                  <h2 className="text-navy font-semibold">{t.avgProcessing}</h2>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.avgProcessingByStatus} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="status" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0a1941' }} formatter={(v) => [`${v} ${lang === 'fr' ? 'jours' : 'days'}`, lang === 'fr' ? 'Délai moyen' : 'Avg time']} />
                    <Bar dataKey="avgDays" fill="#6366f1" radius={[0, 4, 4, 0]} name={lang === 'fr' ? 'Jours' : 'Days'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Cases by type */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5" role="region" aria-label={t.casesByType}>
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen size={16} className="text-blue-500" aria-hidden="true" />
                <h2 className="text-navy font-semibold">{t.casesByType}</h2>
              </div>
              {data.casesByType.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">{t.noData}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {data.casesByType.map((item, idx) => (
                    <div key={item.type} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[idx % TYPE_COLORS.length] }} aria-hidden="true" />
                      <div>
                        <div className="text-2xl font-bold text-navy">{item.count}</div>
                        <div className="text-slate-500 text-sm">{item.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
