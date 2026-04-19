'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ComplianceLayout from './components/ComplianceLayout';
import Link from 'next/link';
import {
  Inbox,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useRealtimeAllCases } from '@/hooks/useRealtimeDashboard';

interface Stats {
  submissions: number;
  totalCases: number;
  eligibleCases: number;
  pendingReview: number;
}

export default function ComplianceDashboardPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState<Stats>({ submissions: 0, totalCases: 0, eligibleCases: 0, pendingReview: 0 });
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [sub, total, eligible, pending] = await Promise.all([
      supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
      supabase.from('case_files').select('id', { count: 'exact', head: true }),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'ELIGIBLE'),
      supabase.from('case_files').select('id', { count: 'exact', head: true }).eq('status', 'EN_ANALYSE'),
    ]);
    setStats({
      submissions: sub.count || 0,
      totalCases: total.count || 0,
      eligibleCases: eligible.count || 0,
      pendingReview: pending.count || 0,
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
    { label: lang === 'fr' ? 'Soumissions à examiner' : 'Submissions to Review', value: stats.submissions, icon: Inbox, color: 'text-gold', bg: 'bg-gold/10', href: '/admin/contact-submissions' },
    { label: lang === 'fr' ? 'Total dossiers' : 'Total Cases', value: stats.totalCases, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'Dossiers éligibles' : 'Eligible Cases', value: stats.eligibleCases, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/case-management' },
    { label: lang === 'fr' ? 'En cours d\'analyse' : 'Under Review', value: stats.pendingReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/case-management' },
  ];

  const quickLinks = [
    { label: lang === 'fr' ? 'Soumissions contact' : 'Contact Submissions', href: '/admin/contact-submissions', icon: Inbox, desc: lang === 'fr' ? 'Examiner les nouvelles demandes' : 'Review new requests' },
    { label: lang === 'fr' ? 'Dossiers clients' : 'Client Cases', href: '/admin/case-management', icon: ClipboardList, desc: lang === 'fr' ? 'Valider et suivre les dossiers' : 'Validate and track cases' },
  ];

  return (
    <ComplianceLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-emerald-600" />
          <h1 className="font-display text-2xl font-bold text-navy">{t.welcome}</h1>
        </div>
        <p className="text-slate-500 text-sm">{t.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-emerald-200 hover:shadow-md transition-all group">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-2 sm:mb-3`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-navy">{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{kpi.label}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Compliance notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 flex items-start gap-3 mb-5 sm:mb-6">
        <AlertTriangle size={17} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-emerald-800 text-sm">
            {lang === 'fr' ? 'Accès limité au rôle Conformité' : 'Compliance Role Access'}
          </div>
          <div className="text-emerald-700 text-xs mt-0.5">
            {lang === 'fr' ?'Vous pouvez consulter et valider les soumissions et dossiers. La gestion des utilisateurs est réservée aux administrateurs.' :'You can review and validate submissions and cases. User management is reserved for administrators.'}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold text-navy text-base mb-3">{t.quickActions}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 sm:gap-4 hover:border-emerald-200 hover:shadow-md transition-all group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <link.icon size={17} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy text-sm">{link.label}</div>
                <div className="text-xs text-slate-500 truncate">{link.desc}</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </ComplianceLayout>
  );
}
