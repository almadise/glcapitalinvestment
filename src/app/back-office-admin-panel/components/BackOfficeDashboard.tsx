'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import StatusBadge, { DossierStatus } from '@/components/ui/StatusBadge';
import {
  FolderOpen,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  MessageSquare,
  FileText,
  ChevronDown,
  RefreshCw,
  X,
  Edit3,
  Lock,
  Network,
  ClipboardList,
  File,
  Bell,
  History,
  ChevronRight,
} from 'lucide-react';
import AdminNotificationHub from './AdminNotificationHub';
import { caseFileLabel } from '@/lib/caseFileLabel';

interface CaseFile {
  id: string;
  ref: string;
  projectName: string;
  org: string;
  country: string;
  type: string;
  amount: string;
  status: DossierStatus;
  completeness: number;
  analyst: string;
  complianceOfficer: string;
  submittedAt: string;
  lastUpdate: string;
  riskTags: string[];
  unreadMessages: number;
  complianceScore: number;
  statusReason: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by_email: string | null;
  note: string | null;
  reason_code: string | null;
  created_at: string;
}

interface ComplianceLog {
  id: string;
  actor_email: string;
  action: string;
  target_ref: string;
  detail: string;
  ip_address: string;
  severity: string;
  created_at: string;
}

interface DossierDocument {
  id: string;
  dossier_id: string | null;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  doc_type: string;
  scan_status: string;
  scan_passed: boolean;
  uploaded_at: string;
}

interface KPIData {
  totalActive: number;
  complianceQueue: number;
  riskAlerts: number;
  eligible: number;
  totalCases: number;
  rejectedThisMonth: number;
}

const statusOptions: DossierStatus[] = [
  'RECU',
  'A_COMPLETER',
  'EN_ANALYSE',
  'EN_REVUE_COMPLIANCE',
  'ELIGIBLE',
  'SOUMIS_PARTENAIRE',
  'RETOUR_PARTENAIRE',
  'EN_NEGOCIATION',
  'CLOTURE',
  'REJETE',
];

// Compliance stage gating: which statuses require compliance officer role
const COMPLIANCE_GATED_STATUSES: DossierStatus[] = ['EN_REVUE_COMPLIANCE', 'ELIGIBLE', 'REJETE'];

const STATUS_LABELS: Record<string, string> = {
  RECU: 'Reçu',
  A_COMPLETER: 'À compléter',
  EN_ANALYSE: 'En analyse',
  EN_REVUE_COMPLIANCE: 'En revue compliance',
  ELIGIBLE: 'Éligible',
  SOUMIS_PARTENAIRE: 'Soumis partenaire',
  RETOUR_PARTENAIRE: 'Retour partenaire',
  EN_NEGOCIATION: 'En négociation',
  CLOTURE: 'Clôturé',
  REJETE: 'Rejeté',
};

export default function BackOfficeDashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const supabase = createClient();

  const userRole = (profile as any)?.role || '';
  const isComplianceOrAdmin = ['admin', 'compliance_officer'].includes(userRole);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [detailTab, setDetailTab] = useState<
    'overview' | 'compliance' | 'documents' | 'notes' | 'timeline' | 'audit'
  >('overview');
  const [internalNote, setInternalNote] = useState('');
  const [activeMainTab, setActiveMainTab] = useState<
    'dossiers' | 'audit' | 'partners' | 'notifications'
  >('dossiers');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    caseId: string;
    newStatus: DossierStatus;
  } | null>(null);

  const [cases, setCases] = useState<CaseFile[]>([]);
  const [auditLogs, setAuditLogs] = useState<ComplianceLog[]>([]);
  const [dossierDocuments, setDossierDocuments] = useState<DossierDocument[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const [kpi, setKpi] = useState<KPIData>({
    totalActive: 0,
    complianceQueue: 0,
    riskAlerts: 0,
    eligible: 0,
    totalCases: 0,
    rejectedThisMonth: 0,
  });

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_files')
        .select(
          `
          id, ref, type, status, status_reason, amount, project_name,
          country, completeness, compliance_score, risk_tags,
          unread_messages, created_at, updated_at,
          org:organizations(name),
          analyst:user_profiles!case_files_assigned_analyst_id_fkey(full_name),
          compliance:user_profiles!case_files_assigned_compliance_id_fkey(full_name)
        `
        )
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('case_files fetch error:', error.message);
        setCases([]);
      } else {
        const mapped: CaseFile[] = (data || []).map((d: any) => ({
          id: d.id,
          ref: d.ref,
          projectName: caseFileLabel(d),
          org: d.org?.name || 'Unknown',
          country: d.country || '-',
          type: d.type || 'Project Finance',
          amount: d.amount || '-',
          status: d.status as DossierStatus,
          statusReason: d.status_reason || '',
          completeness: d.completeness || 0,
          analyst: d.analyst?.full_name || 'Non assigné',
          complianceOfficer: d.compliance?.full_name || 'Non assigné',
          submittedAt: d.created_at
            ? new Date(d.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '-',
          lastUpdate: d.updated_at
            ? new Date(d.updated_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '-',
          riskTags: d.risk_tags || [],
          unreadMessages: d.unread_messages || 0,
          complianceScore: d.compliance_score || 0,
        }));
        setCases(mapped);

        // Compute KPIs from real data
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setKpi({
          totalActive: mapped.filter((c) => !['CLOTURE', 'REJETE'].includes(c.status)).length,
          complianceQueue: mapped.filter((c) => c.status === 'EN_REVUE_COMPLIANCE').length,
          riskAlerts: mapped.filter((c) =>
            c.riskTags?.some((tag) =>
              ['risk', 'pep', 'sanction'].some((k) => tag.toLowerCase().includes(k))
            )
          ).length,
          eligible: mapped.filter((c) => c.status === 'ELIGIBLE').length,
          totalCases: mapped.length,
          rejectedThisMonth: mapped.filter((c) => {
            if (c.status !== 'REJETE') return false;
            const updated = new Date(c.lastUpdate);
            return updated >= startOfMonth;
          }).length,
        });
      }
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      setCases([]);
    }
    setLoading(false);
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      // Try audit_logs table first (new schema), fallback to compliance_logs
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, actor_id, action, target, ip, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const mapped = data.map((l: any) => ({
          id: l.id,
          actor_email: l.metadata?.actor_email || l.actor_id?.slice(0, 8) || '-',
          action: l.action,
          target_ref: l.target || '-',
          detail: l.metadata?.detail || '',
          ip_address: l.ip || '-',
          severity: l.metadata?.severity || 'info',
          created_at: l.created_at,
        }));
        setAuditLogs(mapped);
      } else {
        // Fallback to compliance_logs
        const { data: clData } = await supabase
          .from('compliance_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        setAuditLogs(clData || []);
      }
    } catch (_) {
      /* empty */
    }
  }, []);

  const fetchStatusHistory = useCallback(async (caseId: string) => {
    try {
      const { data, error } = await supabase
        .from('case_status_history')
        .select('id, old_status, new_status, changed_by_email, note, reason_code, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (!error) setStatusHistory(data || []);
    } catch (_) {
      /* empty */
    }
  }, []);

  useEffect(() => {
    fetchCases();
    fetchAuditLogs();

    const channel = supabase
      .channel('admin_case_files')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_files' }, () => {
        fetchCases();
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          fetchAuditLogs();
          const log = payload.new as any;
          if (log.metadata?.severity === 'critical') {
            toast.error(`Compliance BLOCK - ${log.target}: ${log.metadata?.detail || ''}`, {
              duration: 8000,
            });
            setNotifCount((c) => c + 1);
          }
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_files' }, () => {
        toast.info('Nouveau dossier reçu', { duration: 5000 });
        setNotifCount((c) => c + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCases, fetchAuditLogs]);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      c.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.org.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kpiCards = [
    {
      id: 'kpi-total',
      label: t('Dossiers actifs', 'Active files'),
      value: loading ? '-' : String(kpi.totalActive),
      sub: t('Hors clôturés/rejetés', 'Excl. closed/rejected'),
      icon: FolderOpen,
      color: 'bg-white border-gray-200',
      valueColor: 'text-navy-900',
    },
    {
      id: 'kpi-compliance',
      label: t('File compliance', 'Compliance queue'),
      value: loading ? '-' : String(kpi.complianceQueue),
      sub: t('En attente KYC/AML', 'Pending KYC/AML'),
      icon: Shield,
      color: 'bg-purple-50 border-purple-200',
      valueColor: 'text-purple-700',
    },
    {
      id: 'kpi-alerts',
      label: t('Alertes risque', 'Risk alerts'),
      value: loading ? '-' : String(kpi.riskAlerts),
      sub: t('Flags PEP/sanctions', 'PEP/sanctions flags'),
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      valueColor: 'text-red-600',
    },
    {
      id: 'kpi-eligible',
      label: t('Éligibles', 'Eligible'),
      value: loading ? '-' : String(kpi.eligible),
      sub: t('Prêts pour soumission', 'Ready for submission'),
      icon: CheckCircle2,
      color: 'bg-emerald-50 border-emerald-200',
      valueColor: 'text-emerald-700',
    },
    {
      id: 'kpi-total-all',
      label: t('Total dossiers', 'Total files'),
      value: loading ? '-' : String(kpi.totalCases),
      sub: t('Tous statuts confondus', 'All statuses'),
      icon: TrendingUp,
      color: 'bg-blue-50 border-blue-200',
      valueColor: 'text-blue-700',
    },
    {
      id: 'kpi-rejected',
      label: t('Rejetés ce mois', 'Rejected this month'),
      value: loading ? '-' : String(kpi.rejectedThisMonth),
      sub: t('Motif requis', 'Reason required'),
      icon: Clock,
      color: 'bg-amber-50 border-amber-200',
      valueColor: 'text-amber-700',
    },
  ];

  const handleStatusChange = async (caseId: string, newStatus: DossierStatus) => {
    // Compliance stage gating
    if (COMPLIANCE_GATED_STATUSES.includes(newStatus) && !isComplianceOrAdmin) {
      toast.error('Ce changement de statut requiert le rôle Compliance Officer ou Admin.');
      setStatusDropdownOpen(null);
      return;
    }

    // For CLOTURE and REJETE, require a note
    if (['CLOTURE', 'REJETE'].includes(newStatus)) {
      setPendingStatusChange({ caseId, newStatus });
      setStatusDropdownOpen(null);
      return;
    }

    await applyStatusChange(caseId, newStatus, '');
  };

  const applyStatusChange = async (caseId: string, newStatus: DossierStatus, note: string) => {
    setStatusDropdownOpen(null);
    setPendingStatusChange(null);
    const caseItem = cases.find((c) => c.id === caseId);
    if (!caseItem) return;

    try {
      const { error } = await supabase
        .from('case_files')
        .update({ status: newStatus, status_reason: note, updated_at: new Date().toISOString() })
        .eq('id', caseId);

      if (error) throw error;

      // Insert into case_status_history
      await supabase.from('case_status_history').insert({
        case_id: caseId,
        old_status: caseItem.status,
        new_status: newStatus,
        changed_by: user?.id,
        changed_by_email: user?.email,
        note: note || null,
        reason_code: newStatus,
      });

      // Log to audit_logs
      const auditSeverity = ['REJETE', 'CLOTURE'].includes(newStatus) ? 'sensitive' : 'info';
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        action: 'STATUS_CHANGE',
        target: caseItem.ref,
        ip: null,
        metadata: {
          actor_email: user?.email,
          detail: `${caseItem.status} → ${newStatus}${note ? ` - ${note}` : ''}`,
          severity: auditSeverity,
        },
      });

      // Send Resend status notification (non-blocking)
      fetch('/api/send-status-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: caseItem.org || user?.email || '',
          clientName: caseItem.org || 'Client',
          caseTitle: caseItem.org || caseItem.ref,
          caseId: caseItem.id,
          newStatus,
          oldStatus: caseItem.status,
          note: note || null,
          lang: 'fr',
          changedByEmail: user?.email || 'système',
          internalRecipients: [],
          notificationType: 'status_change',
        }),
      }).catch(() => {});

      // Send audit flag notification for sensitive/critical changes (non-blocking)
      if (auditSeverity === 'sensitive') {
        fetch('/api/send-audit-flag-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseTitle: caseItem.org || caseItem.ref,
            caseRef: caseItem.ref,
            caseId: caseItem.id,
            action: 'STATUS_CHANGE',
            detail: `${caseItem.status} → ${newStatus}${note ? ` - ${note}` : ''}`,
            actorEmail: user?.email || 'système',
            severity: auditSeverity,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      }

      toast.success(`Statut mis à jour : ${STATUS_LABELS[newStatus] || newStatus}`);
      setStatusChangeNote('');
      fetchCases();
      if (selectedCase?.id === caseId) fetchStatusHistory(caseId);
    } catch (err: any) {
      toast.error(err.message || 'Échec de la mise à jour du statut');
    }
  };

  const handleAddNote = async () => {
    if (!internalNote.trim() || !selectedCase || !user) return;
    try {
      await supabase.from('case_internal_notes').insert({
        case_id: selectedCase.id,
        author_id: user.id,
        author_email: user.email,
        content: internalNote.trim(),
      });
      // Also log to audit
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'NOTE_ADDED',
        target: selectedCase.ref,
        metadata: { actor_email: user.email, detail: internalNote.trim(), severity: 'info' },
      });

      // Send internal note notification via Resend (non-blocking)
      fetch('/api/send-internal-note-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseTitle: caseFileLabel(selectedCase),
          caseRef: selectedCase.ref,
          caseId: selectedCase.id,
          authorEmail: user.email || 'système',
          noteContent: internalNote.trim(),
          caseStatus: STATUS_LABELS[selectedCase.status] || selectedCase.status,
          internalRecipients: [],
        }),
      }).catch(() => {});

      toast.success('Note interne ajoutée - non visible par le client');
      setInternalNote('');
      fetchAuditLogs();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ajout de la note");
    }
  };

  const fetchDossierDocuments = async (caseId: string) => {
    try {
      const { data, error } = await supabase
        .from('dossier_documents')
        .select('*')
        .eq('dossier_id', caseId)
        .order('uploaded_at', { ascending: false });
      if (!error) setDossierDocuments(data || []);
    } catch (_) {
      /* empty */
    }
  };

  const handleDocumentDownload = async (doc: DossierDocument) => {
    setDownloadingDocId(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from('dossier-documents')
        .createSignedUrl(doc.file_path, 120);
      if (error) throw error;
      if (user && selectedCase) {
        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'DOCUMENT_DOWNLOAD',
          target: selectedCase.ref,
          metadata: {
            actor_email: user.email,
            detail: `Admin téléchargé : ${doc.file_name}`,
            severity: 'info',
          },
        });
      }
      window.open(data.signedUrl, '_blank');
      toast.success(`Téléchargement : ${doc.file_name}`);
    } catch (err: any) {
      toast.error(err.message || 'Échec du téléchargement');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSelectCase = (c: CaseFile | null) => {
    setSelectedCase(c);
    setDossierDocuments([]);
    setStatusHistory([]);
    if (c) {
      fetchDossierDocuments(c.id);
      fetchStatusHistory(c.id);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <Toaster position="bottom-right" richColors />

      {/* Status change confirmation modal for CLOTURE/REJETE */}
      {pendingStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPendingStatusChange(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-navy-900 mb-2">
              Confirmer : {STATUS_LABELS[pendingStatusChange.newStatus]}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ce statut requiert un motif obligatoire (traçabilité compliance).
            </p>
            <textarea
              value={statusChangeNote}
              onChange={(e) => setStatusChangeNote(e.target.value)}
              rows={3}
              placeholder="Motif de clôture ou de rejet (obligatoire)..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-400 transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setPendingStatusChange(null)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  applyStatusChange(
                    pendingStatusChange.caseId,
                    pendingStatusChange.newStatus,
                    statusChangeNote
                  )
                }
                disabled={!statusChangeNote.trim()}
                className="flex-1 py-2 bg-navy-900 hover:bg-navy-700 text-white text-sm font-semibold disabled:opacity-40 hover:bg-navy-700 transition-all duration-200 active:scale-95"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {t('Back Office - Panneau Admin', 'Back Office - Admin Panel')}
          </h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <button
              onClick={() => {
                fetchCases();
                fetchAuditLogs();
              }}
              className="flex items-center gap-1 text-gray-400 hover:text-navy-700 transition-colors"
            >
              <RefreshCw size={11} />
              <span className="text-xs font-mono">Live · case_files</span>
            </button>
            {kpi.riskAlerts > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-red-500 font-medium">
                  {kpi.riskAlerts} {t('alerte(s) risque', 'risk alert(s)')}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info(t('Export audit log...', 'Exporting audit log...'))}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            {t('Export', 'Export')}
          </button>
        </div>
      </div>

      {/* KPI cards - real data from case_files */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div key={card.id} className={`border rounded-2xl p-5 shadow-card ${card.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                <card.icon size={16} className="text-gray-600" />
              </div>
            </div>
            <div className={`text-2xl font-bold tabular-nums mb-1 ${card.valueColor}`}>
              {card.value}
            </div>
            <p className="text-xs font-semibold text-gray-700 mb-0.5">{card.label}</p>
            <p className="text-[10px] text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['dossiers', 'audit', 'partners', 'notifications'] as const).map((tab) => (
          <button
            key={`bo-tab-${tab}`}
            onClick={() => {
              setActiveMainTab(tab);
              if (tab === 'notifications') setNotifCount(0);
            }}
            className={`px-5 py-2 text-sm font-medium rounded-lg capitalize transition-all duration-200 relative ${activeMainTab === tab ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'dossiers' ? (
              t('Dossiers', 'Case files')
            ) : tab === 'audit' ? (
              t('Journal audit', 'Audit log')
            ) : tab === 'partners' ? (
              t('Partenaires', 'Partners')
            ) : (
              <span className="flex items-center gap-1.5">
                <Bell size={13} />
                {t('Notifications', 'Notifications')}
                {notifCount > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeMainTab === 'dossiers' && (
        <div className={`flex gap-6 ${selectedCase ? '' : ''}`}>
          <div
            className={`${selectedCase ? 'flex-1 min-w-0' : 'w-full'} bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card`}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={t(
                    'Rechercher réf, organisation, pays...',
                    'Search ref, organisation, country...'
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-400 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-400 transition-colors bg-white"
                >
                  <option value="ALL">{t('Tous les statuts', 'All statuses')}</option>
                  {statusOptions.map((s) => (
                    <option key={`filter-${s}`} value={s}>
                      {STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {filteredCases.length} {t('dossier(s)', 'file(s)')}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-navy-900/20 border-t-navy-900 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chargement des dossiers...</p>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="p-12 text-center">
                <FolderOpen size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucun dossier trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Organisation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Score KYC
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Analyste
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Mis à jour
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCases.map((c) => (
                      <tr
                        key={c.id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedCase?.id === c.id ? 'bg-gold-50 border-l-2 border-l-gold-500' : ''}`}
                        onClick={() => handleSelectCase(selectedCase?.id === c.id ? null : c)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-navy-700">
                                {c.ref}
                              </span>
                              {c.unreadMessages > 0 && (
                                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                                  {c.unreadMessages}
                                </span>
                              )}
                            </div>
                            {c.projectName && c.projectName !== c.ref && (
                              <span
                                className="text-[10px] text-gray-500 truncate"
                                title={c.projectName}
                              >
                                {c.projectName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-navy-900 font-medium text-xs">{c.org}</p>
                          <p className="text-gray-400 text-[10px]">{c.country}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{c.type}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-navy-900 tabular-nums">
                          {c.amount}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setStatusDropdownOpen(statusDropdownOpen === c.id ? null : c.id)
                              }
                              className="flex items-center gap-1 group"
                            >
                              <StatusBadge status={c.status} size="sm" />
                              <ChevronDown
                                size={10}
                                className="text-gray-400 group-hover:text-gray-600 transition-colors"
                              />
                            </button>
                            {statusDropdownOpen === c.id && (
                              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                                <div className="p-1 max-h-64 overflow-y-auto">
                                  {statusOptions.map((s) => {
                                    const isGated =
                                      COMPLIANCE_GATED_STATUSES.includes(s) && !isComplianceOrAdmin;
                                    return (
                                      <button
                                        key={`status-opt-${s}`}
                                        onClick={() => !isGated && handleStatusChange(c.id, s)}
                                        disabled={isGated}
                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${isGated ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                                      >
                                        <StatusBadge status={s} size="sm" />
                                        {isGated && <Lock size={9} className="text-gray-400" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.complianceScore >= 80 ? 'bg-emerald-500' : c.complianceScore >= 60 ? 'bg-gold-500' : c.complianceScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${c.complianceScore}%` }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-mono font-semibold ${c.complianceScore >= 80 ? 'text-emerald-600' : c.complianceScore >= 60 ? 'text-gold-600' : c.complianceScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}
                            >
                              {c.complianceScore}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-navy-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-bold text-navy-700">
                                {c.analyst !== 'Non assigné'
                                  ? c.analyst
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                  : '?'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 truncate max-w-[80px]">
                              {c.analyst.split(' ')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {c.lastUpdate}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                handleSelectCase(c);
                                setDetailTab('overview');
                              }}
                              className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Voir le dossier"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => {
                                handleSelectCase(c);
                                setDetailTab('timeline');
                              }}
                              className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Timeline"
                            >
                              <History size={13} />
                            </button>
                            <button
                              onClick={() => toast.info(`Messages pour ${c.ref}`)}
                              className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Messages"
                            >
                              <MessageSquare size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                {t('Affichage de', 'Showing')}{' '}
                <span className="font-semibold text-gray-600">{filteredCases.length}</span>{' '}
                {t('sur', 'of')} <span className="font-semibold text-gray-600">{cases.length}</span>{' '}
                {t('dossiers', 'files')}
              </p>
            </div>
          </div>

          {/* Detail panel */}
          {selectedCase && (
            <div className="w-96 flex-shrink-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between bg-navy-900">
                <div>
                  <span className="font-mono text-xs text-gold-400">{selectedCase.ref}</span>
                  <p
                    className="text-white/90 text-xs mt-0.5 leading-tight truncate"
                    title={selectedCase.projectName}
                  >
                    {selectedCase.projectName}
                  </p>
                  <p className="text-white font-semibold text-sm mt-0.5 leading-tight">
                    {selectedCase.org}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={selectedCase.status} size="sm" />
                  </div>
                </div>
                <button
                  onClick={() => handleSelectCase(null)}
                  className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
                {(
                  ['overview', 'compliance', 'documents', 'notes', 'timeline', 'audit'] as const
                ).map((tab) => (
                  <button
                    key={`detail-tab-${tab}`}
                    onClick={() => setDetailTab(tab)}
                    className={`flex-shrink-0 px-3 py-2.5 text-[11px] font-medium capitalize transition-colors ${detailTab === tab ? 'text-navy-900 border-b-2 border-navy-900 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab === 'timeline' ? (
                      <span className="flex items-center gap-1">
                        <History size={10} />
                        Timeline
                      </span>
                    ) : (
                      tab
                    )}
                    {tab === 'documents' && dossierDocuments.length > 0 && (
                      <span className="ml-1 text-[9px] font-bold bg-navy-900 text-white px-1 py-0.5 rounded-full">
                        {dossierDocuments.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
                {detailTab === 'overview' && (
                  <div className="p-5 space-y-4">
                    <dl className="space-y-3">
                      {[
                        { label: 'Pays', value: selectedCase.country },
                        { label: 'Type', value: selectedCase.type },
                        { label: 'Montant', value: selectedCase.amount, mono: true },
                        { label: 'Soumis le', value: selectedCase.submittedAt },
                        { label: 'Mis à jour', value: selectedCase.lastUpdate },
                        { label: 'Complétude', value: `${selectedCase.completeness}%`, mono: true },
                        { label: 'Analyste', value: selectedCase.analyst },
                        { label: 'Compliance', value: selectedCase.complianceOfficer },
                      ].map((item) => (
                        <div
                          key={`detail-${item.label}`}
                          className="flex items-center justify-between py-1 border-b border-gray-50"
                        >
                          <dt className="text-xs text-gray-500">{item.label}</dt>
                          <dd
                            className={`text-xs font-semibold text-navy-800 ${item.mono ? 'font-mono' : ''}`}
                          >
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {selectedCase.statusReason && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Motif du statut</p>
                        <p className="text-xs text-amber-600">{selectedCase.statusReason}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Tags risque
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedCase.riskTags || []).length === 0 ? (
                          <span className="text-xs text-gray-400">Aucun tag risque</span>
                        ) : (
                          (selectedCase.riskTags || []).map((tag) => (
                            <span
                              key={`risk-${tag}`}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tag.toLowerCase().includes('risk') || tag.toLowerCase().includes('pep') || tag.toLowerCase().includes('sanction') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                            >
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions rapides
                      </p>
                      <button
                        onClick={() => {
                          setDetailTab('documents');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-navy-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <FileText size={13} />
                        Voir les documents ({dossierDocuments.length})
                      </button>
                      {isComplianceOrAdmin && (
                        <button
                          onClick={() => handleStatusChange(selectedCase.id, 'SOUMIS_PARTENAIRE')}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gold-700 border border-gold-200 bg-gold-50 rounded-xl hover:bg-gold-100 transition-colors"
                        >
                          <Network size={13} />
                          Soumettre à institution agréée
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {detailTab === 'timeline' && (
                  <div className="p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <History size={12} />
                      Historique des statuts - {selectedCase.ref}
                    </p>
                    {statusHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <History size={24} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Aucun historique de statut</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
                        <div className="space-y-4">
                          {statusHistory.map((entry, idx) => (
                            <div key={entry.id} className="relative pl-8">
                              <div
                                className={`absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${idx === 0 ? 'bg-navy-900 border-navy-900' : 'bg-white border-gray-300'}`}
                              >
                                {idx === 0 ? (
                                  <div className="w-2 h-2 border border-white rounded-full" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                )}
                              </div>
                              <div
                                className={`p-3 rounded-xl border ${idx === 0 ? 'bg-navy-50 border-navy-200' : 'bg-gray-50 border-gray-200'}`}
                              >
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {entry.old_status && (
                                    <>
                                      <StatusBadge
                                        status={entry.old_status as DossierStatus}
                                        size="sm"
                                      />
                                      <ChevronRight size={10} className="text-gray-400" />
                                    </>
                                  )}
                                  <StatusBadge
                                    status={entry.new_status as DossierStatus}
                                    size="sm"
                                  />
                                </div>
                                {entry.note && (
                                  <p className="text-xs text-gray-600 mt-1 italic">{entry.note}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                                  <span>{entry.changed_by_email || '-'}</span>
                                  <span>·</span>
                                  <span>
                                    {new Date(entry.created_at).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'compliance' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Checklist KYC/AML
                      </p>
                      <span
                        className={`text-xs font-bold font-mono ${selectedCase.complianceScore >= 80 ? 'text-emerald-600' : selectedCase.complianceScore >= 60 ? 'text-gold-600' : selectedCase.complianceScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}
                      >
                        {selectedCase.complianceScore}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          id: 'kyc-1',
                          label: 'Vérification identité',
                          status: selectedCase.complianceScore > 20 ? 'pass' : 'pending',
                          detail: 'Registre + pièces dirigeants',
                        },
                        {
                          id: 'kyc-2',
                          label: 'Identification UBO',
                          status: selectedCase.complianceScore > 40 ? 'pass' : 'pending',
                          detail: 'Seuil 25%+ de détention',
                        },
                        {
                          id: 'kyc-3',
                          label: 'Origine des fonds',
                          status: selectedCase.complianceScore > 55 ? 'pass' : 'fail',
                          detail: "Relevés bancaires ou rapports d'audit",
                        },
                        {
                          id: 'kyc-4',
                          label: 'Screening sanctions',
                          status: selectedCase.complianceScore > 60 ? 'pass' : 'pending',
                          detail: 'OFAC, UE, ONU, HMT',
                        },
                        {
                          id: 'kyc-5',
                          label: 'Vérification PPE',
                          status:
                            selectedCase.complianceScore > 70
                              ? 'pass'
                              : (selectedCase.riskTags || []).includes('PEP Flag')
                                ? 'fail'
                                : 'pending',
                          detail: 'Personnes politiquement exposées',
                        },
                        {
                          id: 'kyc-6',
                          label: 'Risque pays',
                          status: selectedCase.complianceScore > 75 ? 'pass' : 'pending',
                          detail: 'FATF, Basel AML Index',
                        },
                        {
                          id: 'kyc-7',
                          label: 'Traçabilité des fonds',
                          status: selectedCase.complianceScore > 85 ? 'pass' : 'pending',
                          detail: 'Origine bout en bout',
                        },
                      ].map((check) => (
                        <div
                          key={check.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border ${check.status === 'pass' ? 'bg-emerald-50 border-emerald-200' : check.status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
                        >
                          {check.status === 'pass' ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500 flex-shrink-0 mt-0.5"
                            />
                          ) : check.status === 'fail' ? (
                            <AlertTriangle
                              size={14}
                              className="text-red-500 flex-shrink-0 mt-0.5"
                            />
                          ) : (
                            <Clock size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p
                              className={`text-xs font-semibold ${check.status === 'pass' ? 'text-emerald-700' : check.status === 'fail' ? 'text-red-700' : 'text-gray-600'}`}
                            >
                              {check.label}
                            </p>
                            <p className="text-[10px] text-gray-400">{check.detail}</p>
                          </div>
                          <div className="ml-auto flex-shrink-0">
                            <button
                              onClick={() => toast.info(`Mise à jour : ${check.label}`)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Edit3 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {isComplianceOrAdmin && (
                      <div className="pt-2 space-y-2">
                        <button
                          onClick={() => handleStatusChange(selectedCase.id, 'ELIGIBLE')}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors active:scale-95"
                        >
                          Approuver KYC/AML - Marquer Éligible
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedCase.id, 'REJETE')}
                          className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-200 transition-colors active:scale-95"
                        >
                          Rejeter - Non conforme
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'documents' && (
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Documents soumis
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {dossierDocuments.length} fichier(s)
                      </span>
                    </div>
                    <div className="p-2.5 bg-navy-900/5 border border-navy-900/10 rounded-xl flex items-center gap-2">
                      <Shield size={11} className="text-navy-600 flex-shrink-0" />
                      <p className="text-navy-700 text-[10px]">
                        URLs signées 2 minutes. Tous les accès sont journalisés.
                      </p>
                    </div>
                    {dossierDocuments.length === 0 ? (
                      <div className="text-center py-6">
                        <File size={24} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Aucun document pour ce dossier</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dossierDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className={`p-3 rounded-xl border ${doc.scan_passed ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-200'}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-navy-900/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <File size={12} className="text-navy-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-navy-800 truncate">
                                  {doc.file_name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[9px] text-gray-400">{doc.doc_type}</span>
                                  <span className="text-gray-300">·</span>
                                  <span className="text-[9px] text-gray-400">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                  <span className="text-gray-300">·</span>
                                  {doc.scan_passed ? (
                                    <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                      <CheckCircle2 size={9} /> Vérifié
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-amber-600 font-semibold">
                                      En attente scan
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDocumentDownload(doc)}
                                disabled={downloadingDocId === doc.id || !doc.scan_passed}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-navy-700 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors flex-shrink-0"
                              >
                                {downloadingDocId === doc.id ? (
                                  <div className="w-3 h-3 border border-navy-700/30 border-t-navy-700 rounded-full animate-spin" />
                                ) : (
                                  <Download size={10} />
                                )}
                                DL
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'notes' && (
                  <div className="p-5 space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                      <Lock size={12} className="text-amber-600" />
                      <p className="text-amber-700 text-[10px] font-medium">
                        Notes internes - NON visibles par le client
                      </p>
                    </div>
                    <div className="space-y-3">
                      {auditLogs
                        .filter(
                          (l) => l.target_ref === selectedCase.ref && l.action === 'NOTE_ADDED'
                        )
                        .slice(0, 5)
                        .map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-navy-800">
                                {log.actor_email}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(log.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{log.detail}</p>
                          </div>
                        ))}
                      {auditLogs.filter(
                        (l) => l.target_ref === selectedCase.ref && l.action === 'NOTE_ADDED'
                      ).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          Aucune note pour ce dossier
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Ajouter une note interne
                      </label>
                      <textarea
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        rows={3}
                        placeholder="Note interne - non visible par le client..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-navy-400 transition-colors resize-none"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!internalNote.trim()}
                        className="mt-2 w-full py-2.5 bg-navy-900 hover:bg-navy-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all duration-200 active:scale-95"
                      >
                        Ajouter la note
                      </button>
                    </div>
                  </div>
                )}

                {detailTab === 'audit' && (
                  <div className="p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Journal audit - {selectedCase.ref}
                    </p>
                    <div className="space-y-2">
                      {auditLogs
                        .filter((log) => log.target_ref === selectedCase.ref)
                        .map((log) => (
                          <div
                            key={log.id}
                            className={`p-3 rounded-xl border text-xs ${log.severity === 'critical' ? 'bg-red-50 border-red-200' : log.severity === 'sensitive' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}
                          >
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono font-semibold text-navy-800 text-[10px]">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(log.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-1">{log.detail}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                              <span>{log.actor_email}</span>
                              {log.ip_address && (
                                <>
                                  <span>·</span>
                                  <span>IP: {log.ip_address}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      {auditLogs.filter((log) => log.target_ref === selectedCase.ref).length ===
                        0 && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          Aucune entrée d'audit pour ce dossier
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeMainTab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList size={16} className="text-navy-700" />
              <h2 className="font-bold text-navy-900">Journal Audit Immuable</h2>
              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Append-only · Inaltérable
              </span>
            </div>
            <button
              onClick={() => toast.info('Export CSV du journal audit...')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={12} />
              Export CSV
            </button>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">Aucune entrée d'audit</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4 ${log.severity === 'critical' ? 'bg-red-50/50' : log.severity === 'sensitive' ? 'bg-amber-50/30' : ''}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${log.severity === 'critical' ? 'bg-red-500' : log.severity === 'sensitive' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-navy-700 bg-navy-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-navy-800">{log.actor_email}</span>
                      <span className="text-xs text-gray-500">→ {log.target_ref}</span>
                      {log.severity === 'critical' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                          CRITIQUE
                        </span>
                      )}
                      {log.severity === 'sensitive' && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                          SENSIBLE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{log.detail}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                      <span>{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                      {log.ip_address && (
                        <>
                          <span>·</span>
                          <span>IP: {log.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400">
              Les journaux d'audit sont immuables et en ajout seul. Aucun enregistrement ne peut
              être modifié ou supprimé.
            </p>
          </div>
        </div>
      )}

      {activeMainTab === 'notifications' && <AdminNotificationHub />}

      {activeMainTab === 'partners' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Lock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-semibold text-sm mb-1">
                {t(
                  'Confidentialité Partenaires - NCNDA Actif',
                  'Partner Confidentiality - Active NCNDA'
                )}
              </p>
              <p className="text-amber-700 text-xs leading-relaxed">
                {t(
                  'Toutes les informations partenaires sont protégées par des accords NCNDA. Les noms, contacts et critères ne sont JAMAIS divulgués aux clients.',
                  'All partner information is protected by NCNDA agreements. Names, contacts and criteria are NEVER disclosed to clients.'
                )}
              </p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <Network size={32} className="text-navy-200 mx-auto mb-3" />
            <p className="text-navy-900 font-semibold mb-2">
              {t('Répertoire Partenaires', 'Partner Directory')}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {t(
                'Gérez le répertoire complet des partenaires depuis la page dédiée.',
                'Manage the complete partner directory from the dedicated page.'
              )}
            </p>
            <a
              href="/admin/partners"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-700 text-white text-sm font-semibold rounded-xl transition-all duration-200"
            >
              <Network size={14} />
              {t('Accéder au répertoire partenaires', 'Access partner directory')}
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Network size={16} />
              {t('Assignations partenaires', 'Partner assignments')}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {t(
                'Gérez les assignations de dossiers aux partenaires agréés.',
                'Manage case assignments to approved partners.'
              )}
            </p>
            <a
              href="/admin/partner-assignments"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ClipboardList size={14} />
              {t('Voir les assignations', 'View assignments')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
