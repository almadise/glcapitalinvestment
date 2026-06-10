'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ComplianceLayout from '@/app/compliance-dashboard/components/ComplianceLayout';
import { Download, FileText, Loader2, Filter, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AuditEntry {
  id: string;
  case_id: string;
  old_status: string | null;
  new_status: string;
  changed_by_email: string | null;
  note: string | null;
  created_at: string;
}

interface NoteEntry {
  id: string;
  case_id: string;
  author_email: string | null;
  content: string;
  created_at: string;
}

function AuditExportContent({ layout }: { layout: 'admin' | 'compliance' }) {
  const { user, userRole } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [notesData, setNotesData] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportType, setExportType] = useState<'history' | 'notes'>('history');

  const fetchData = async () => {
    setLoading(true);
    try {
      let historyQuery = supabase
        .from('case_status_history')
        .select('*')
        .order('created_at', { ascending: false });
      let notesQuery = supabase
        .from('case_internal_notes')
        .select('*')
        .order('created_at', { ascending: false });
      if (dateFrom) {
        historyQuery = historyQuery.gte('created_at', dateFrom);
        notesQuery = notesQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        historyQuery = historyQuery.lte('created_at', dateTo + 'T23:59:59');
        notesQuery = notesQuery.lte('created_at', dateTo + 'T23:59:59');
      }
      const [histRes, notesRes] = await Promise.all([historyQuery, notesQuery]);
      setAuditData(histRes.data || []);
      setNotesData(notesRes.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const exportCSV = () => {
    const data = exportType === 'history' ? auditData : notesData;
    if (data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    let csvContent = '';
    if (exportType === 'history') {
      csvContent = 'ID,Dossier ID,Ancien statut,Nouveau statut,Modifié par,Note,Date\n';
      (data as AuditEntry[]).forEach((row) => {
        csvContent += `"${row.id}","${row.case_id}","${row.old_status || ''}","${row.new_status}","${row.changed_by_email || ''}","${(row.note || '').replace(/"/g, '""')}","${formatDate(row.created_at)}"\n`;
      });
    } else {
      csvContent = 'ID,Dossier ID,Auteur,Contenu,Date\n';
      (data as NoteEntry[]).forEach((row) => {
        csvContent += `"${row.id}","${row.case_id}","${row.author_email || ''}","${row.content.replace(/"/g, '""')}","${formatDate(row.created_at)}"\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  const exportPDF = () => {
    const data = exportType === 'history' ? auditData : notesData;
    if (data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Audit GL Capital</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}h1{color:#1a2744;font-size:16px}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#1a2744;color:white;padding:6px 8px;text-align:left;font-size:10px}td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px}tr:nth-child(even){background:#f8fafc}.meta{color:#64748b;font-size:10px;margin-bottom:10px}</style>
    </head><body>
    <h1>GL Capital - Export Audit</h1>
    <div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR')} par ${user?.email} | Rôle: ${userRole}</div>`;

    if (exportType === 'history') {
      html += `<table><thead><tr><th>Dossier ID</th><th>Ancien statut</th><th>Nouveau statut</th><th>Modifié par</th><th>Note</th><th>Date</th></tr></thead><tbody>`;
      (data as AuditEntry[]).forEach((row) => {
        html += `<tr><td>${row.case_id.slice(0, 8)}…</td><td>${row.old_status || '-'}</td><td>${row.new_status}</td><td>${row.changed_by_email || '-'}</td><td>${row.note || '-'}</td><td>${formatDate(row.created_at)}</td></tr>`;
      });
    } else {
      html += `<table><thead><tr><th>Dossier ID</th><th>Auteur</th><th>Contenu</th><th>Date</th></tr></thead><tbody>`;
      (data as NoteEntry[]).forEach((row) => {
        html += `<tr><td>${row.case_id.slice(0, 8)}…</td><td>${row.author_email || '-'}</td><td>${row.content.substring(0, 100)}${row.content.length > 100 ? '…' : ''}</td><td>${formatDate(row.created_at)}</td></tr>`;
      });
    }
    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${exportType}_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export PDF (HTML) téléchargé - ouvrez et imprimez en PDF');
  };

  const displayData = exportType === 'history' ? auditData : notesData;

  const content = (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Download size={20} className="text-gold" />
          <h1 className="font-display text-2xl font-bold text-navy">Exports Audit</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Historique des décisions et notes internes - accès Admin/Compliance uniquement
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 mb-6 text-xs text-red-800">
        <Shield size={14} className="flex-shrink-0" />
        <span>
          <strong>Accès restreint :</strong> Ces exports contiennent des données sensibles. Réservé
          aux rôles Admin et Compliance Officer.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Type de données
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportType('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${exportType === 'history' ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                Historique statuts
              </button>
              <button
                onClick={() => setExportType('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${exportType === 'notes' ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                Notes internes
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
          >
            <Filter size={14} /> Filtrer
          </button>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90"
            >
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Data preview */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-navy">{displayData.length} entrée(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                {exportType === 'history' ? (
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Dossier
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Ancien statut
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Nouveau statut
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Modifié par
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Note
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Dossier
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Auteur
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Contenu
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Aucune donnée
                    </td>
                  </tr>
                ) : exportType === 'history' ? (
                  (auditData as AuditEntry[]).slice(0, 50).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-slate-500">
                        {row.case_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2 text-slate-500">{row.old_status || '-'}</td>
                      <td className="px-4 py-2 font-semibold text-navy">{row.new_status}</td>
                      <td className="px-4 py-2 text-slate-600">{row.changed_by_email || '-'}</td>
                      <td className="px-4 py-2 text-slate-500 max-w-xs truncate">
                        {row.note || '-'}
                      </td>
                      <td className="px-4 py-2 text-slate-400">{formatDate(row.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  (notesData as NoteEntry[]).slice(0, 50).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-slate-500">
                        {row.case_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2 text-slate-600">{row.author_email || '-'}</td>
                      <td className="px-4 py-2 text-slate-700 max-w-xs truncate">{row.content}</td>
                      <td className="px-4 py-2 text-slate-400">{formatDate(row.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {displayData.length > 50 && (
            <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-400 text-center">
              Aperçu limité à 50 entrées. Utilisez l&apos;export CSV/PDF pour toutes les données.
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (layout === 'compliance') {
    return <ComplianceLayout>{content}</ComplianceLayout>;
  }
  return <AdminLayout>{content}</AdminLayout>;
}

export default function AdminAuditExportPage() {
  return <AuditExportContent layout="admin" />;
}
