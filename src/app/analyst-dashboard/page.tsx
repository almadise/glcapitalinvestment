'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AnalystLayout from './components/AnalystLayout';
import Link from 'next/link';
import {
  ClipboardList,
  BarChart3,
  FileSearch,
  TrendingUp,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useRealtimeAllCases } from '@/hooks/useRealtimeDashboard';

interface Stats {
  totalCases: number;
  underReview: number;
  eligible: number;
  rejected: number;
}

export default function AnalystDashboardPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState<Stats>({ totalCases: 0, underReview: 0, eligible: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [total, review, eligible, rejected] = await Promise.all([
      supabase.from('case_files').select('id', { count: 'exact', head: true }),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'EN_ANALYSE'),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'ELIGIBLE'),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'REJETE'),
    ]);
    setStats({
      totalCases: total.count || 0,
      underReview: review.count || 0,
      eligible: eligible.count || 0,
      rejected: rejected.count || 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useRealtimeAllCases({
    enabled: !!user,
    lang,
    onAnyUpdate: () => refreshStats(),
  });

  const kpis = [
    { label: lang === 'fr' ? 'Total dossiers' : 'Total Cases', value: stats.totalCases, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'En cours d\'analyse' : 'Under Review', value: stats.underReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'Éligibles' : 'Eligible', value: stats.eligible, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'Rejetés' : 'Rejected', value: stats.rejected, icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-50', href: '/admin/case-management' },
  ];

  const quickLinks = [
    { label: lang === 'fr' ? 'Dossiers à analyser' : 'Cases to Analyze', href: '/admin/case-management', icon: ClipboardList, desc: lang === 'fr' ? 'Évaluer et mettre à jour les dossiers' : 'Evaluate and update cases' },
    { label: lang === 'fr' ? 'Analytique' : 'Analytics', href: '/admin/analytics', icon: BarChart3, desc: lang === 'fr' ? 'Statistiques et tendances' : 'Statistics and trends' },
    { label: lang === 'fr' ? 'Rapports' : 'Reports', href: '/analyst-dashboard/reports', icon: FileSearch, desc: lang === 'fr' ? 'Générer des rapports d\'analyse' : 'Generate analysis reports' },
  ];

  return (
    <AnalystLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={20} className="text-blue-600" />
          <h1 className="font-display text-2xl font-bold text-navy">
            {t('Bienvenue, Analyste', 'Welcome, Analyst')}
          </h1>
        </div>
        <p className="text-slate-500 text-sm">
          {t('Vue d\'ensemble des dossiers à analyser.', 'Overview of cases pending analysis.')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-2 sm:mb-3`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-navy">{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{kpi.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-4">
        <h2 className="font-semibold text-navy text-base mb-3">
          {t('Actions rapides', 'Quick actions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 sm:gap-4 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <link.icon size={17} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy text-sm">{link.label}</div>
                <div className="text-xs text-slate-500 truncate">{link.desc}</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </AnalystLayout>
  );
}
