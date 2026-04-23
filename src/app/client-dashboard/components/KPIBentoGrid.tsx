'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  FolderOpen,
  TrendingUp,
  FileWarning,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface KPIData {
  dossiersEnCours: number;
  dossiersTotal: number;
  documentsEnAttente: number;
  completudeMoyenne: number;
  eligible: number;
}

export default function KPIBentoGrid() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: cases } = await supabase
        .from('case_files')
        .select('id, status, completeness')
        .eq('user_id', user.id);

      const allCases = cases || [];
      const active = allCases.filter((c) => !['CLOTURE', 'REJETE'].includes(c.status));
      const toComplete = allCases.filter((c) => c.status === 'A_COMPLETER');
      const eligible = allCases.filter((c) => c.status === 'ELIGIBLE');
      const avgCompleteness = active.length > 0
        ? Math.round(active.reduce((sum, c) => sum + (c.completeness || 0), 0) / active.length)
        : 0;

      setKpi({
        dossiersEnCours: active.length,
        dossiersTotal: allCases.length,
        documentsEnAttente: toComplete.length,
        completudeMoyenne: avgCompleteness,
        eligible: eligible.length,
      });
    } catch {
      setKpi(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchKPIs();

    if (!user) return;
    const channel = supabase
      .channel('kpi_case_files')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'case_files',
        filter: `user_id=eq.${user.id}`,
      }, fetchKPIs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchKPIs]);

  const val = (n: number | undefined) => (loading ? '-' : String(n ?? 0));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      {/* Hero card: Dossiers en cours */}
      <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2 bg-gradient-navy rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <FolderOpen size={20} className="text-gold" />
            </div>
            <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-gold text-xs font-semibold">{lang === 'fr' ? 'En cours' : 'Active'}</span>
            </div>
          </div>
          <div className="font-mono-data text-5xl font-bold text-white mb-2">
            {val(kpi?.dossiersEnCours)}
          </div>
          <div className="text-slate-300 text-sm font-medium mb-1">
            {lang === 'fr' ? 'Dossiers actifs' : 'Active files'}
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight size={14} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold">
              {loading ? '-' : lang === 'fr'
                ? `${kpi?.dossiersTotal ?? 0} soumis au total`
                : `${kpi?.dossiersTotal ?? 0} total submitted`}
            </span>
          </div>
        </div>
      </div>

      {/* Éligibles */}
      <div className="kpi-card">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <ArrowUpRight size={14} className="text-emerald-500" />
        </div>
        <div className="font-mono-data text-2xl font-bold text-navy mb-1">{val(kpi?.eligible)}</div>
        <div className="text-slate-500 text-xs font-medium mb-1">
          {lang === 'fr' ? 'Dossiers éligibles' : 'Eligible dossiers'}
        </div>
        <div className="text-emerald-600 text-xs font-semibold">
          {lang === 'fr' ? 'Prêts pour soumission' : 'Ready for submission'}
        </div>
      </div>

      {/* Documents en attente */}
      <div className={`kpi-card ${(kpi?.documentsEnAttente ?? 0) > 0 ? 'border-red-200 bg-red-50/50' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${(kpi?.documentsEnAttente ?? 0) > 0 ? 'bg-red-100 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <FileWarning size={16} className={(kpi?.documentsEnAttente ?? 0) > 0 ? 'text-red-600' : 'text-amber-600'} />
          </div>
          {(kpi?.documentsEnAttente ?? 0) > 0 ? <AlertTriangle size={14} className="text-red-500" /> : null}
        </div>
        <div className={`font-mono-data text-2xl font-bold mb-1 ${(kpi?.documentsEnAttente ?? 0) > 0 ? 'text-red-700' : 'text-navy'}`}>
          {val(kpi?.documentsEnAttente)}
        </div>
        <div className="text-slate-600 text-xs font-medium mb-1">
          {lang === 'fr' ? 'Dossiers à compléter' : 'Dossiers to complete'}
        </div>
        <div className={(kpi?.documentsEnAttente ?? 0) > 0 ? 'text-red-600 text-xs font-semibold' : 'text-emerald-600 text-xs font-semibold'}>
          {loading ? '-' : (kpi?.documentsEnAttente ?? 0) > 0
            ? (lang === 'fr' ? 'Documents requis' : 'Documents required')
            : (lang === 'fr' ? 'À jour' : 'Up to date')}
        </div>
      </div>

      {/* Complétude moyenne */}
      <div className="kpi-card">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-amber-600" />
          </div>
          {(kpi?.completudeMoyenne ?? 0) >= 70
            ? <ArrowUpRight size={14} className="text-emerald-500" />
            : <ArrowDownRight size={14} className="text-amber-500" />}
        </div>
        <div className="font-mono-data text-2xl font-bold text-navy mb-1">
          {loading ? '-' : `${kpi?.completudeMoyenne ?? 0}%`}
        </div>
        <div className="text-slate-500 text-xs font-medium mb-1">
          {lang === 'fr' ? 'Complétude moyenne' : 'Avg. completeness'}
        </div>
        <div className="text-amber-600 text-xs font-semibold">
          {lang === 'fr' ? 'Dossiers actifs' : 'Active dossiers'}
        </div>
        <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${kpi?.completudeMoyenne ?? 0}%` }} />
        </div>
      </div>

      {/* Total dossiers */}
      <div className="kpi-card">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Clock size={16} className="text-blue-600" />
          </div>
          <ArrowUpRight size={14} className="text-emerald-500" />
        </div>
        <div className="font-mono-data text-2xl font-bold text-navy mb-1">
          {loading ? '-' : `${kpi?.dossiersTotal ?? 0}`}
        </div>
        <div className="text-slate-500 text-xs font-medium mb-1">
          {lang === 'fr' ? 'Total dossiers soumis' : 'Total dossiers submitted'}
        </div>
        <div className="text-blue-600 text-xs font-semibold">
          {lang === 'fr' ? 'Tous statuts' : 'All statuses'}
        </div>
      </div>
    </div>
  );
}