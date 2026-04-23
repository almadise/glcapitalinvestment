'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  ChevronUp,
  ChevronDown,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type DossierStatus =
  | 'RECU' | 'A_COMPLETER' | 'EN_ANALYSE' | 'EN_REVUE_COMPLIANCE' | 'ELIGIBLE' |'SOUMIS_PARTENAIRE' | 'RETOUR_PARTENAIRE' | 'EN_NEGOCIATION' | 'CLOTURE' | 'REJETE';

type Dossier = {
  id: string;
  ref: string;
  organisation: string;
  type: string;
  statut: DossierStatus;
  montant: string;
  completude: number;
  analyste: string;
  dateCreation: string;
  derniereMaj: string;
};

const getStatusConfig = (lang: 'fr' | 'en'): Record<DossierStatus, { label: string; classes: string }> => ({
  RECU: { label: lang === 'fr' ? 'Reçu' : 'Received', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  A_COMPLETER: { label: lang === 'fr' ? 'À compléter' : 'To complete', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  EN_ANALYSE: { label: lang === 'fr' ? 'En analyse' : 'In analysis', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  EN_REVUE_COMPLIANCE: { label: lang === 'fr' ? 'En revue' : 'In review', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  ELIGIBLE: { label: lang === 'fr' ? 'Éligible' : 'Eligible', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  SOUMIS_PARTENAIRE: { label: lang === 'fr' ? 'Soumis' : 'Submitted', classes: 'bg-gold/10 text-gold-dark border-gold/30' },
  RETOUR_PARTENAIRE: { label: lang === 'fr' ? 'Retour partenaire' : 'Partner feedback', classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  EN_NEGOCIATION: { label: lang === 'fr' ? 'En négociation' : 'In negotiation', classes: 'bg-teal-100 text-teal-700 border-teal-200' },
  CLOTURE: { label: lang === 'fr' ? 'Clôturé' : 'Closed', classes: 'bg-navy/10 text-navy border-navy/20' },
  REJETE: { label: lang === 'fr' ? 'Rejeté' : 'Rejected', classes: 'bg-red-100 text-red-700 border-red-200' },
});

type SortKey = keyof Dossier;

export default function DossierTable() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DossierStatus | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('derniereMaj');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const perPage = 7;
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();

  const statusConfig = getStatusConfig(lang);

  const fetchDossiers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Query case_files table with correct columns
      const { data, error } = await supabase
        .from('case_files')
        .select(`
          id, ref, type, status, amount, completeness, created_at, updated_at,
          org_id, assigned_analyst_id,
          analyst:user_profiles!case_files_assigned_analyst_id_fkey(full_name)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('DossierTable fetch error:', error.message);
        setDossiers([]);
      } else {
        const mapped: Dossier[] = (data || []).map((d: any) => ({
          id: d.id,
          ref: d.ref,
          organisation: d.org_id || user.email || '-',
          type: d.type || 'Project Finance',
          statut: d.status as DossierStatus,
          montant: d.amount || '-',
          completude: d.completeness || 0,
          analyste: d.analyst?.full_name || t('Non assigné', 'Unassigned'),
          dateCreation: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
          derniereMaj: d.updated_at ? new Date(d.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
        }));
        setDossiers(mapped);
      }
    } catch (err: any) {
      console.error('DossierTable error:', err.message);
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  }, [user, lang]);

  useEffect(() => {
    fetchDossiers();

    if (!user) return;
    const channel = supabase
      .channel('dossier_table_realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'case_files',
        filter: `user_id=eq.${user.id}`,
      }, fetchDossiers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchDossiers]);

  const filtered = dossiers.filter((d) => {
    const matchSearch =
      d.ref.toLowerCase().includes(search.toLowerCase()) ||
      d.organisation.toLowerCase().includes(search.toLowerCase()) ||
      d.analyste.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || d.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] as string;
    const bv = b[sortKey] as string;
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleExport = async (dossier: Dossier) => {
    setExportingId(dossier.id);
    await new Promise((r) => setTimeout(r, 800));
    try {
      // CSV export avoids heavyweight PDF runtime deps that can break client bundle compilation.
      const rows = [
        [lang === 'fr' ? 'Référence' : 'Reference', dossier.ref],
        [lang === 'fr' ? 'Organisation' : 'Organisation', dossier.organisation],
        [lang === 'fr' ? 'Type' : 'Type', dossier.type],
        [lang === 'fr' ? 'Statut' : 'Status', statusConfig[dossier.statut]?.label || dossier.statut],
        [lang === 'fr' ? 'Montant' : 'Amount', dossier.montant],
        [lang === 'fr' ? 'Complétude' : 'Completeness', `${dossier.completude}%`],
        [lang === 'fr' ? 'Analyste' : 'Analyst', dossier.analyste],
        [lang === 'fr' ? 'Créé le' : 'Created', dossier.dateCreation],
        [lang === 'fr' ? 'Mis à jour' : 'Updated', dossier.derniereMaj],
      ];
      const csv = rows
        .map(([k, v]) => `"${String(k).replace(/"/g, '""')}","${String(v).replace(/"/g, '""')}"`)
        .join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GL_Capital_${dossier.ref}_Recapitulatif.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(lang === 'fr' ? `Export CSV - ${dossier.ref}` : `CSV exported - ${dossier.ref}`);
    } catch {
      toast.error(lang === 'fr' ? "Erreur lors de l'export du fichier." : 'Error while exporting file.');
    }
    setExportingId(null);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="text-slate-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-navy" /> : <ChevronDown size={12} className="text-navy" />;
  };

  const tableHeaders = [
    { key: 'ref' as SortKey, label: t('Référence', 'Reference') },
    { key: 'organisation' as SortKey, label: t('Organisation', 'Organisation') },
    { key: 'type' as SortKey, label: t('Type', 'Type') },
    { key: 'statut' as SortKey, label: t('Statut', 'Status') },
    { key: 'montant' as SortKey, label: t('Montant', 'Amount') },
    { key: 'completude' as SortKey, label: t('Complétude', 'Completeness') },
    { key: 'analyste' as SortKey, label: t('Analyste', 'Analyst') },
    { key: 'dateCreation' as SortKey, label: t('Créé le', 'Created') },
    { key: 'derniereMaj' as SortKey, label: t('Mis à jour', 'Updated') },
  ];

  return (
    <div className="card-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-navy">
            {lang === 'fr' ? 'Mes dossiers' : 'My files'}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {loading
              ? (lang === 'fr' ? 'Chargement...' : 'Loading...')
              : lang === 'fr'
                ? `${filtered.length} dossier(s) - ${dossiers.length} au total`
                : `${filtered.length} file(s) - ${dossiers.length} total`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={fetchDossiers} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors" title={lang === 'fr' ? 'Actualiser' : 'Refresh'}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 min-w-[200px]">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={lang === 'fr' ? 'Référence, société…' : 'Reference, company…'}
              className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-2">
            <Filter size={12} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as DossierStatus | 'ALL'); setPage(1); }}
              className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'fr' ? 'Tous statuts' : 'All statuses'}</option>
              {Object.entries(statusConfig).map(([k, v]) => (
                <option key={`filter-status-${k}`} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {tableHeaders.map((col) => (
                  <th
                    key={`th-${col.key}`}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-navy select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {lang === 'fr' ? 'Actions' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <FileText size={22} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-600">
                          {lang === 'fr' ? 'Aucun dossier trouvé' : 'No files found'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {lang === 'fr' ? 'Modifiez vos filtres ou soumettez un nouveau dossier.' :'Adjust your filters or submit a new file.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((dossier) => (
                  <tr key={dossier.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono-data text-xs font-semibold text-navy bg-navy/5 px-2 py-1 rounded-md">{dossier.ref}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700">{dossier.organisation}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{dossier.type}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`status-badge border ${statusConfig[dossier.statut]?.classes || ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {statusConfig[dossier.statut]?.label || dossier.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono-data text-xs font-semibold text-navy">{dossier.montant}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`h-full rounded-full transition-all ${dossier.completude >= 80 ? 'bg-emerald-500' : dossier.completude >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${dossier.completude}%` }}
                          />
                        </div>
                        <span className="font-mono-data text-xs text-slate-600">{dossier.completude}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-600">{dossier.analyste}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono-data text-xs text-slate-500">{dossier.dateCreation}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono-data text-xs text-slate-500">{dossier.derniereMaj}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title={lang === 'fr' ? 'Voir le dossier' : 'View file'} className="p-1.5 rounded-lg hover:bg-navy/10 text-slate-500 hover:text-navy transition-colors">
                          <Eye size={14} />
                        </button>
                        <button
                          title={lang === 'fr' ? 'Exporter (CSV)' : 'Export (CSV)'}
                          onClick={() => handleExport(dossier)}
                          disabled={exportingId === dossier.id}
                          className="p-1.5 rounded-lg hover:bg-gold/10 text-slate-500 hover:text-gold-dark transition-colors disabled:opacity-50"
                        >
                          {exportingId === dossier.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                        <button title={lang === 'fr' ? "Plus d'options" : 'More options'} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {loading ? '-' : lang === 'fr'
            ? `Affichage ${Math.min((page - 1) * perPage + 1, sorted.length)}–${Math.min(page * perPage, sorted.length)} sur ${sorted.length}`
            : `Showing ${Math.min((page - 1) * perPage + 1, sorted.length)}–${Math.min(page * perPage, sorted.length)} of ${sorted.length}`}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} className="text-slate-600" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={`page-${p}`} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-navy text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={14} className="text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}