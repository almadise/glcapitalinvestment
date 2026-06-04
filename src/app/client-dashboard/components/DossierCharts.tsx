'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface WeeklyData {
  week: string;
  soumis: number;
  enAnalyse: number;
  clotures: number;
}

interface PipelineItem {
  status: string;
  count: number;
  color: string;
}

const STATUS_COLORS: Record<string, string> = {
  RECU: '#94a3b8',
  A_COMPLETER: '#f59e0b',
  EN_ANALYSE: '#3b82f6',
  EN_REVUE_COMPLIANCE: '#8b5cf6',
  ELIGIBLE: '#10b981',
  SOUMIS_PARTENAIRE: '#C9A84C',
  RETOUR_PARTENAIRE: '#f97316',
  EN_NEGOCIATION: '#14b8a6',
  CLOTURE: '#0F2557',
  REJETE: '#ef4444',
};

const STATUS_LABELS_FR: Record<string, string> = {
  RECU: 'Reçu', A_COMPLETER: 'À compléter', EN_ANALYSE: 'En analyse',
  EN_REVUE_COMPLIANCE: 'En revue', ELIGIBLE: 'Éligible',
  SOUMIS_PARTENAIRE: 'Soumis', RETOUR_PARTENAIRE: 'Retour', EN_NEGOCIATION: 'Négociation',
  CLOTURE: 'Clôturé', REJETE: 'Rejeté',
};

const STATUS_LABELS_EN: Record<string, string> = {
  RECU: 'Received', A_COMPLETER: 'To complete', EN_ANALYSE: 'In analysis',
  EN_REVUE_COMPLIANCE: 'In review', ELIGIBLE: 'Eligible',
  SOUMIS_PARTENAIRE: 'Submitted', RETOUR_PARTENAIRE: 'Feedback', EN_NEGOCIATION: 'Negotiation',
  CLOTURE: 'Closed', REJETE: 'Rejected',
};

const CustomTooltipArea = ({ active, payload, label, lang }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; lang: 'fr' | 'en' }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-navy mb-2">{label}</p>
      {payload.map((p) => (
        <div key={`tooltip-${p.name}`} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-bold text-navy font-mono-data">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltipBar = ({ active, payload, label, lang }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; lang: 'fr' | 'en' }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-navy mb-1">{label}</p>
      <p className="font-bold text-navy font-mono-data">{payload[0].value} {lang === 'fr' ? 'dossier(s)' : 'file(s)'}</p>
    </div>
  );
};

export default function DossierCharts() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: cases } = await supabase
        .from('case_files')
        .select('id, status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      const allCases = cases || [];

      // Build pipeline distribution from real data
      const statusCounts: Record<string, number> = {};
      allCases.forEach((c) => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });

      const labels = lang === 'fr' ? STATUS_LABELS_FR : STATUS_LABELS_EN;
      const pipeline: PipelineItem[] = Object.entries(statusCounts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          status: labels[status] || status,
          count,
          color: STATUS_COLORS[status] || '#94a3b8',
        }));
      setPipelineData(pipeline);

      // Build weekly activity from real data (last 12 weeks)
      const now = new Date();
      const weeks: WeeklyData[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7 - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekLabel = `W${String(52 - i).padStart(2, '0')}`;
        const soumis = allCases.filter((c) => {
          const d = new Date(c.created_at);
          return d >= weekStart && d < weekEnd;
        }).length;
        const enAnalyse = allCases.filter((c) => {
          const d = new Date(c.updated_at || c.created_at);
          return d >= weekStart && d < weekEnd && c.status === 'EN_ANALYSE';
        }).length;
        const clotures = allCases.filter((c) => {
          const d = new Date(c.updated_at || c.created_at);
          return d >= weekStart && d < weekEnd && c.status === 'CLOTURE';
        }).length;

        weeks.push({ week: weekLabel, soumis, enAnalyse, clotures });
      }
      setWeeklyData(weeks);
    } catch {
      setWeeklyData([]);
      setPipelineData([]);
    } finally {
      setLoading(false);
    }
  }, [user, lang]);

  useEffect(() => {
    fetchChartData();
    if (!user) return;
    const channel = supabase
      .channel('charts_dossiers')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'case_files',
        filter: `user_id=eq.${user.id}`,
      }, fetchChartData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchChartData]);

  const areaLegend = lang === 'fr'
    ? [{ label: 'Soumis', color: '#0F2557' }, { label: 'En analyse', color: '#C9A84C' }, { label: 'Clôturés', color: '#10b981' }]
    : [{ label: 'Submitted', color: '#0F2557' }, { label: 'In analysis', color: '#C9A84C' }, { label: 'Closed', color: '#10b981' }];

  return (
    <div className="space-y-5">
      {/* Area chart */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-base font-bold text-navy">
              {lang === 'fr' ? 'Activité des dossiers' : 'File activity'}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {lang === 'fr' ? 'Soumissions, analyses et clôtures - 12 semaines' : 'Submissions, analyses and closures - 12 weeks'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {areaLegend.map((l) => (
              <div key={`legend-${l.label}`} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-slate-500 font-medium">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradSoumis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F2557" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F2557" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAnalyse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradClotures" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipArea lang={lang} />} />
              <Area type="monotone" dataKey="soumis" name={lang === 'fr' ? 'Soumis' : 'Submitted'} stroke="#0F2557" strokeWidth={2} fill="url(#gradSoumis)" />
              <Area type="monotone" dataKey="enAnalyse" name={lang === 'fr' ? 'En analyse' : 'In analysis'} stroke="#C9A84C" strokeWidth={2} fill="url(#gradAnalyse)" />
              <Area type="monotone" dataKey="clotures" name={lang === 'fr' ? 'Clôturés' : 'Closed'} stroke="#10b981" strokeWidth={2} fill="url(#gradClotures)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart: pipeline distribution */}
      <div className="card-surface p-5">
        <div className="mb-5">
          <h3 className="font-display text-base font-bold text-navy">
            {lang === 'fr' ? 'Distribution du pipeline' : 'Pipeline distribution'}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {lang === 'fr' ? 'Nombre de dossiers par statut actuel' : 'Number of files by current status'}
          </p>
        </div>
        {loading ? (
          <div className="h-[170px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        ) : pipelineData.length === 0 ? (
          <div className="h-[170px] flex items-center justify-center">
            <p className="text-slate-400 text-sm">{lang === 'fr' ? 'Aucun dossier' : 'No files yet'}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={pipelineData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipBar lang={lang} />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pipelineData.map((entry) => (
                  <Cell key={`cell-pipeline-${entry.status}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}