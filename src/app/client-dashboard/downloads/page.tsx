'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import PermissionGate from '@/components/PermissionGate';
import { caseFileDescription, caseFileLabel, caseFileType } from '@/lib/caseFileLabel';
import {
  Download,
  FileText,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  RefreshCw,
  FileDown,
  Table2,
} from 'lucide-react';

type CaseFileStatus = 'RECU' | 'EN_ANALYSE' | 'ELIGIBLE' | 'REJETE' | 'A_COMPLETER';

interface CaseFile {
  id: string;
  title: string;
  type: string;
  status: CaseFileStatus;
  created_at: string;
  updated_at: string;
  description: string | null;
}

const STATUS_OPTIONS: { value: CaseFileStatus | 'ALL'; labelFr: string; labelEn: string }[] = [
  { value: 'ALL', labelFr: 'Tous les statuts', labelEn: 'All statuses' },
  { value: 'RECU', labelFr: 'Reçu', labelEn: 'Received' },
  { value: 'EN_ANALYSE', labelFr: 'En analyse', labelEn: 'Under review' },
  { value: 'ELIGIBLE', labelFr: 'Éligible', labelEn: 'Eligible' },
  { value: 'REJETE', labelFr: 'Rejeté', labelEn: 'Rejected' },
  { value: 'A_COMPLETER', labelFr: 'À compléter', labelEn: 'To complete' },
];

const STATUS_BADGE: Record<CaseFileStatus, { color: string; icon: React.ElementType }> = {
  RECU: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
  EN_ANALYSE: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Loader2 },
  ELIGIBLE: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  REJETE: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  A_COMPLETER: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
};

const STATUS_LABELS: Record<CaseFileStatus, { fr: string; en: string }> = {
  RECU: { fr: 'Reçu', en: 'Received' },
  EN_ANALYSE: { fr: 'En analyse', en: 'Under review' },
  ELIGIBLE: { fr: 'Éligible', en: 'Eligible' },
  REJETE: { fr: 'Rejeté', en: 'Rejected' },
  A_COMPLETER: { fr: 'À compléter', en: 'To complete' },
};

function DownloadsContent() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();

  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [filtered, setFiltered] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<CaseFileStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchCaseFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('case_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      const mapped: CaseFile[] = (data || []).map((row: any) => ({
        id: row.id,
        title: caseFileLabel(row),
        type: caseFileType(row),
        status: row.status as CaseFileStatus,
        created_at: row.created_at,
        updated_at: row.updated_at,
        description: caseFileDescription(row),
      }));
      setCaseFiles(mapped);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCaseFiles();
  }, [fetchCaseFiles]);

  // Apply filters
  useEffect(() => {
    let result = [...caseFiles];

    if (statusFilter !== 'ALL') {
      result = result.filter((f) => f.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((f) => new Date(f.created_at) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((f) => new Date(f.created_at) <= to);
    }

    setFiltered(result);
  }, [caseFiles, statusFilter, dateFrom, dateTo]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const getStatusLabel = (status: CaseFileStatus) =>
    lang === 'fr' ? STATUS_LABELS[status]?.fr : STATUS_LABELS[status]?.en;

  const resetFilters = () => {
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  // CSV Export
  const handleCSVExport = () => {
    if (filtered.length === 0) return;
    setExporting('csv');

    const headers = lang === 'fr'
      ? ['ID', 'Titre', 'Type', 'Statut', 'Date de création', 'Dernière mise à jour', 'Description']
      : ['ID', 'Title', 'Type', 'Status', 'Created At', 'Last Updated', 'Description'];

    const rows = filtered.map((f) => [
      f.id,
      `"${(f.title || '').replace(/"/g, '""')}"`,
      f.type,
      getStatusLabel(f.status as CaseFileStatus) || f.status,
      formatDate(f.created_at),
      formatDate(f.updated_at),
      `"${(f.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gl-capital-dossiers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  };

  // PDF Export (print-based)
  const handlePDFExport = () => {
    if (filtered.length === 0) return;
    setExporting('pdf');

    const title = lang === 'fr' ? 'Mes dossiers - GL Capital' : 'My Case Files - GL Capital';
    const generatedOn = lang === 'fr' ? 'Généré le' : 'Generated on';
    const filterLabel = lang === 'fr' ? 'Filtres appliqués' : 'Applied filters';
    const statusLabel = lang === 'fr' ? 'Statut' : 'Status';
    const periodLabel = lang === 'fr' ? 'Période' : 'Period';
    const toLabel = lang === 'fr' ? 'au' : 'to';

    const filterSummary = [
      statusFilter !== 'ALL' ? `${statusLabel}: ${getStatusLabel(statusFilter as CaseFileStatus)}` : '',
      dateFrom || dateTo ? `${periodLabel}: ${dateFrom || '-'} ${toLabel} ${dateTo || '-'}` : '',
    ].filter(Boolean).join(' | ');

    const tableHeaders = lang === 'fr'
      ? ['Titre', 'Type', 'Statut', 'Date de création', 'Dernière mise à jour']
      : ['Title', 'Type', 'Status', 'Created At', 'Last Updated'];

    const rows = filtered.map((f) => `
      <tr>
        <td>${f.title || '-'}</td>
        <td>${f.type}</td>
        <td>${getStatusLabel(f.status as CaseFileStatus) || f.status}</td>
        <td>${formatDate(f.created_at)}</td>
        <td>${formatDate(f.updated_at)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 32px; }
          h1 { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
          .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
          .filters { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 20px; font-size: 11px; color: #475569; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0f172a; color: white; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; }
          td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) td { background: #f8fafc; }
          .count { margin-top: 14px; font-size: 11px; color: #64748b; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">${generatedOn}: ${new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        ${filterSummary ? `<div class="filters"><strong>${filterLabel}:</strong> ${filterSummary}</div>` : ''}
        <table>
          <thead><tr>${tableHeaders.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="count">${filtered.length} ${lang === 'fr' ? 'dossier(s) exporté(s)' : 'case file(s) exported'}</div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        setExporting(null);
      }, 400);
    } else {
      setExporting(null);
    }
  };

  const hasActiveFilters = statusFilter !== 'ALL' || dateFrom !== '' || dateTo !== '';

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PermissionGate require={['case_files:view_own', 'case_files:view_all']}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-navy flex items-center gap-2">
              <FileDown size={22} className="text-gold" />
              {lang === 'fr' ? 'Téléchargements' : 'Downloads'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {lang === 'fr' ?'Exportez vos dossiers et soumissions en PDF ou CSV' :'Export your case files and submissions as PDF or CSV'}
            </p>
          </div>
          <button
            onClick={fetchCaseFiles}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-navy hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {/* Filter Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={15} className="text-slate-500" />
            <span className="text-sm font-semibold text-navy">
              {lang === 'fr' ? 'Filtres' : 'Filters'}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-auto text-xs text-slate-500 hover:text-red-500 transition-colors underline underline-offset-2"
              >
                {lang === 'fr' ? 'Réinitialiser' : 'Reset filters'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {lang === 'fr' ? 'Statut du dossier' : 'Case file status'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CaseFileStatus | 'ALL')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === 'fr' ? opt.labelFr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar size={11} />
                {lang === 'fr' ? 'Date de début' : 'From date'}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar size={11} />
                {lang === 'fr' ? 'Date de fin' : 'To date'}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results summary + export actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <p className="text-sm text-slate-500">
            {loading ? (
              <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" /> {lang === 'fr' ? 'Chargement...' : 'Loading...'}</span>
            ) : (
              <>
                <span className="font-semibold text-navy">{filtered.length}</span>{' '}
                {lang === 'fr'
                  ? `dossier${filtered.length !== 1 ? 's' : ''} trouvé${filtered.length !== 1 ? 's' : ''}`
                  : `case file${filtered.length !== 1 ? 's' : ''} found`}
                {hasActiveFilters && (
                  <span className="ml-1 text-slate-400">
                    {lang === 'fr' ? `(sur ${caseFiles.length} au total)` : `(of ${caseFiles.length} total)`}
                  </span>
                )}
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCSVExport}
              disabled={filtered.length === 0 || exporting !== null}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {exporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <Table2 size={14} />}
              CSV
            </button>
            <button
              onClick={handlePDFExport}
              disabled={filtered.length === 0 || exporting !== null}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-navy text-white rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              PDF
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-navy" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileText size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-navy text-sm mb-1">
              {lang === 'fr' ? 'Aucun dossier trouvé' : 'No case files found'}
            </p>
            <p className="text-slate-400 text-xs max-w-xs">
              {hasActiveFilters
                ? (lang === 'fr' ? 'Essayez de modifier vos filtres.' : 'Try adjusting your filters.')
                : (lang === 'fr' ? 'Vous n\'avez pas encore soumis de dossier.' : 'You haven\'t submitted any case files yet.')}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 text-xs text-navy underline underline-offset-2 hover:text-navy/70 transition-colors"
              >
                {lang === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {lang === 'fr' ? 'Titre' : 'Title'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {lang === 'fr' ? 'Type' : 'Type'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {lang === 'fr' ? 'Statut' : 'Status'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {lang === 'fr' ? 'Créé le' : 'Created'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {lang === 'fr' ? 'Mis à jour' : 'Updated'}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {lang === 'fr' ? 'Export' : 'Export'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((file) => {
                    const badge = STATUS_BADGE[file.status as CaseFileStatus];
                    const StatusIcon = badge?.icon || Clock;
                    return (
                      <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="font-medium text-navy truncate max-w-[200px]" title={file.title}>
                              {file.title}
                            </span>
                          </div>
                          {file.description && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] pl-5" title={file.description}>
                              {file.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{file.type}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            <StatusIcon size={11} />
                            {getStatusLabel(file.status as CaseFileStatus) || file.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(file.created_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(file.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              const row = [
                                file.id,
                                `"${(file.title || '').replace(/"/g, '""')}"`,
                                file.type,
                                getStatusLabel(file.status as CaseFileStatus) || file.status,
                                formatDate(file.created_at),
                                formatDate(file.updated_at),
                                `"${(file.description || '').replace(/"/g, '""')}"`,
                              ];
                              const headers = lang === 'fr'
                                ? ['ID', 'Titre', 'Type', 'Statut', 'Date de création', 'Dernière mise à jour', 'Description']
                                : ['ID', 'Title', 'Type', 'Status', 'Created At', 'Last Updated', 'Description'];
                              const csv = [headers.join(','), row.join(',')].join('\n');
                              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `dossier-${file.id.slice(0, 8)}.csv`;
                              link.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title={lang === 'fr' ? 'Télécharger ce dossier' : 'Download this file'}
                          >
                            <Download size={12} />
                            CSV
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {filtered.length} {lang === 'fr' ? 'résultat(s)' : 'result(s)'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCSVExport}
                  disabled={filtered.length === 0 || exporting !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-navy hover:bg-white rounded-lg transition-colors border border-slate-200 disabled:opacity-40"
                >
                  <Table2 size={12} />
                  {lang === 'fr' ? 'Tout exporter CSV' : 'Export all CSV'}
                </button>
                <button
                  onClick={handlePDFExport}
                  disabled={filtered.length === 0 || exporting !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-40"
                >
                  <Download size={12} />
                  {lang === 'fr' ? 'Tout exporter PDF' : 'Export all PDF'}
                </button>
              </div>
            </div>
          </div>
        )}
      </PermissionGate>
    </div>
  );
}

export default function DownloadsPage() {
  return (
    <DashboardLayout>
      <DownloadsContent />
    </DashboardLayout>
  );
}
