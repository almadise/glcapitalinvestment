'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { useRealtimeSubmissionAlerts } from '@/hooks/useRealtimeAlerts';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  Globe,
  DollarSign,
  Calendar,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import AdminLayout from '@/app/admin/components/AdminLayout';

interface ContactSubmission {
  id: string;
  nom_complet: string;
  societe: string;
  email: string;
  telephone: string | null;
  pays: string;
  montant_projet: string;
  message: string;
  created_at: string;
}

type SortField = 'created_at' | 'nom_complet' | 'societe' | 'pays' | 'montant_projet';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

export default function AdminContactSubmissionsPage() {
  const { user, loading: authLoading, userRole } = useAuth();
  const router = useRouter();
  const { lang } = useLanguage();

  // Real-time submission alerts
  useRealtimeSubmissionAlerts({ enabled: !!user, lang });

  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterPays, setFilterPays] = useState('');
  const [filterMontant, setFilterMontant] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const [selectedRow, setSelectedRow] = useState<ContactSubmission | null>(null);
  const [exporting, setExporting] = useState(false);

  const t = {
    title: lang === 'fr' ? 'Soumissions de contact' : 'Contact Submissions',
    subtitle:
      lang === 'fr'
        ? 'Gérez toutes les demandes reçues via le formulaire de contact'
        : 'Manage all requests received via the contact form',
    search: lang === 'fr' ? 'Rechercher (nom, société, email…)' : 'Search (name, company, email…)',
    filterPays: lang === 'fr' ? 'Filtrer par pays' : 'Filter by country',
    filterMontant: lang === 'fr' ? 'Filtrer par montant' : 'Filter by amount',
    allCountries: lang === 'fr' ? 'Tous les pays' : 'All countries',
    allAmounts: lang === 'fr' ? 'Tous les montants' : 'All amounts',
    export: lang === 'fr' ? 'Exporter CSV' : 'Export CSV',
    refresh: lang === 'fr' ? 'Actualiser' : 'Refresh',
    colDate: lang === 'fr' ? 'Date' : 'Date',
    colName: lang === 'fr' ? 'Nom complet' : 'Full name',
    colCompany: lang === 'fr' ? 'Société' : 'Company',
    colEmail: 'Email',
    colPhone: lang === 'fr' ? 'Téléphone' : 'Phone',
    colCountry: lang === 'fr' ? 'Pays' : 'Country',
    colAmount: lang === 'fr' ? 'Montant projet' : 'Project amount',
    colActions: lang === 'fr' ? 'Actions' : 'Actions',
    view: lang === 'fr' ? 'Voir' : 'View',
    noData: lang === 'fr' ? 'Aucune soumission trouvée' : 'No submissions found',
    noDataSub:
      lang === 'fr'
        ? 'Modifiez vos filtres ou attendez de nouvelles soumissions.'
        : 'Adjust your filters or wait for new submissions.',
    total: lang === 'fr' ? 'résultats' : 'results',
    page: lang === 'fr' ? 'Page' : 'Page',
    of: lang === 'fr' ? 'sur' : 'of',
    detailTitle: lang === 'fr' ? 'Détail de la soumission' : 'Submission detail',
    close: lang === 'fr' ? 'Fermer' : 'Close',
    message: lang === 'fr' ? 'Message' : 'Message',
    backDashboard: lang === 'fr' ? 'Tableau de bord' : 'Dashboard',
    unauthorized:
      lang === 'fr'
        ? 'Accès non autorisé. Veuillez vous connecter.'
        : 'Unauthorized. Please sign in.',
  };

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase.from('contact_submissions').select('*', { count: 'exact' });

      if (search.trim()) {
        query = query.or(
          `nom_complet.ilike.%${search.trim()}%,societe.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
        );
      }
      if (filterPays) query = query.eq('pays', filterPays);
      if (filterMontant) query = query.eq('montant_projet', filterMontant);

      query = query.order(sortField, { ascending: sortDir === 'asc' });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error: qErr, count } = await query;
      if (qErr) throw qErr;
      setSubmissions((data as ContactSubmission[]) || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, search, filterPays, filterMontant, sortField, sortDir, page]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/sign-up-login-screen');
      } else if (userRole !== null && userRole !== 'admin' && userRole !== 'compliance') {
        if (userRole === 'analyst') router.replace('/analyst-dashboard');
        else router.replace('/client-dashboard');
      }
    }
  }, [authLoading, user, userRole, router]);

  useEffect(() => {
    if (user) fetchSubmissions();
  }, [fetchSubmissions, user]);

  // Fetch distinct pays & montant for filter dropdowns
  const [paysList, setPaysList] = useState<string[]>([]);
  const [montantList, setMontantList] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('contact_submissions')
      .select('pays')
      .then(({ data }) => {
        const unique = [...new Set((data || []).map((r: any) => r.pays).filter(Boolean))].sort();
        setPaysList(unique);
      });
    supabase
      .from('contact_submissions')
      .select('montant_projet')
      .then(({ data }) => {
        const unique = [
          ...new Set((data || []).map((r: any) => r.montant_projet).filter(Boolean)),
        ].sort();
        setMontantList(unique);
      });
  }, [user, totalCount]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleFilterPays = (v: string) => {
    setFilterPays(v);
    setPage(1);
  };
  const handleFilterMontant = (v: string) => {
    setFilterMontant(v);
    setPage(1);
  };

  const handleExportCSV = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const supabase = createClient();
      let query = supabase.from('contact_submissions').select('*');
      if (search.trim()) {
        query = query.or(
          `nom_complet.ilike.%${search.trim()}%,societe.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
        );
      }
      if (filterPays) query = query.eq('pays', filterPays);
      if (filterMontant) query = query.eq('montant_projet', filterMontant);
      query = query.order(sortField, { ascending: sortDir === 'asc' });

      const { data } = await query;
      if (!data || data.length === 0) return;

      const headers = [
        'ID',
        'Date',
        'Nom complet',
        'Société',
        'Email',
        'Téléphone',
        'Pays',
        'Montant projet',
        'Message',
      ];
      const rows = data.map((r: ContactSubmission) => [
        r.id,
        new Date(r.created_at).toLocaleString('fr-FR'),
        `"${(r.nom_complet || '').replace(/"/g, '""')}"`,
        `"${(r.societe || '').replace(/"/g, '""')}"`,
        r.email,
        r.telephone || '',
        `"${(r.pays || '').replace(/"/g, '""')}"`,
        `"${(r.montant_projet || '').replace(/"/g, '""')}"`,
        `"${(r.message || '').replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contact-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-slate-400 opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-gold" />
    ) : (
      <ChevronDown size={12} className="text-gold" />
    );
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;
  if (userRole !== null && userRole !== 'admin' && userRole !== 'compliance') return null;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-navy text-lg sm:text-xl font-bold font-display">{t.title}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-navy bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{t.refresh}</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting || totalCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-gold hover:bg-gold/90 disabled:opacity-50 text-navy font-semibold rounded-lg text-sm transition-all"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">{t.export}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t.search}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-navy text-sm placeholder-slate-400 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="relative">
            <Globe
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <select
              value={filterPays}
              onChange={(e) => handleFilterPays(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-navy text-sm focus:outline-none focus:border-gold/50 appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="">{t.allCountries}</option>
              {paysList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <DollarSign
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <select
              value={filterMontant}
              onChange={(e) => handleFilterMontant(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-navy text-sm focus:outline-none focus:border-gold/50 appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="">{t.allAmounts}</option>
              {montantList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            {totalCount} {t.total}
          </span>
          {totalPages > 1 && (
            <span>
              {t.page} {page} {t.of} {totalPages}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-gold" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Inbox size={40} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">{t.noData}</p>
              <p className="text-slate-400 text-sm mt-1">{t.noDataSub}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {(
                      [
                        { label: t.colDate, field: 'created_at' as SortField },
                        { label: t.colName, field: 'nom_complet' as SortField },
                        { label: t.colCompany, field: 'societe' as SortField },
                        { label: t.colEmail, field: null },
                        { label: t.colPhone, field: null },
                        { label: t.colCountry, field: 'pays' as SortField },
                        { label: t.colAmount, field: 'montant_projet' as SortField },
                        { label: t.colActions, field: null },
                      ] as { label: string; field: SortField | null }[]
                    ).map((col, i) => (
                      <th
                        key={i}
                        className={`px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.field ? 'cursor-pointer hover:text-navy select-none' : ''}`}
                        onClick={col.field ? () => handleSort(col.field!) : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {col.field && <SortIcon field={col.field} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-3 py-3 text-navy font-medium whitespace-nowrap">
                        {row.nom_complet}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.societe}</td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        <a
                          href={`mailto:${row.email}`}
                          className="text-gold hover:text-gold/80 transition-colors"
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {row.telephone || '-'}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.pays}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold px-2 py-0.5 rounded-full">
                          <DollarSign size={10} />
                          {row.montant_projet}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setSelectedRow(row)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-navy text-xs transition-all"
                        >
                          <Eye size={12} />
                          {t.view}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {totalCount} {t.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs">
                {t.page} {page} {t.of} {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-navy font-bold font-display">{t.detailTitle}</h3>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-navy p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  icon={<Calendar size={11} />}
                  label={t.colDate}
                  value={formatDate(selectedRow.created_at)}
                />
                <DetailField
                  icon={<Globe size={11} />}
                  label={t.colCountry}
                  value={selectedRow.pays}
                />
                <DetailField
                  icon={<Mail size={11} />}
                  label={t.colName}
                  value={selectedRow.nom_complet}
                />
                <DetailField
                  icon={<Building2 size={11} />}
                  label={t.colCompany}
                  value={selectedRow.societe}
                />
                <DetailField
                  icon={<Mail size={11} />}
                  label={t.colEmail}
                  value={selectedRow.email}
                  link={`mailto:${selectedRow.email}`}
                />
                <DetailField
                  icon={<Phone size={11} />}
                  label={t.colPhone}
                  value={selectedRow.telephone || '-'}
                />
                <DetailField
                  icon={<DollarSign size={11} />}
                  label={t.colAmount}
                  value={selectedRow.montant_projet}
                  highlight
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t.message}
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedRow.message}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-navy text-sm transition-all"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function DetailField({
  icon,
  label,
  value,
  link,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  link?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      {link ? (
        <a href={link} className="text-gold hover:text-gold/80 text-sm transition-colors break-all">
          {value}
        </a>
      ) : (
        <p className={`text-sm break-words ${highlight ? 'text-gold font-semibold' : 'text-navy'}`}>
          {value}
        </p>
      )}
    </div>
  );
}
