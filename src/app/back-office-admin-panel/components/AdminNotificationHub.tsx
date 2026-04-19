'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, FolderOpen, Shield, Mail, Clock, CheckCircle2, AlertTriangle, X, Eye, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';


interface AdminNotification {
  id: string;
  type: 'new_submission' | 'compliance_flag' | 'email_failure' | 'verification_timeout';
  title: string;
  description: string;
  ref?: string;
  dossierId?: string;
  createdAt: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
}

interface Props {
  onClose?: () => void;
}

export default function AdminNotificationHub({ onClose }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new_submission' | 'compliance_flag' | 'email_failure' | 'verification_timeout'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const buildNotificationsFromLogs = (logs: any[], cases: any[]): AdminNotification[] => {
    const notifs: AdminNotification[] = [];

    cases
      .filter((d) => d.status === 'RECU')
      .forEach((d) => {
        notifs.push({
          id: `sub-${d.id}`,
          type: 'new_submission',
          title: t('Nouveau dossier soumis', 'New Dossier Submission'),
          description: `${d.org?.name || 'Unknown'} — ${d.ref}`,
          ref: d.ref,
          dossierId: d.id,
          createdAt: d.created_at,
          read: false,
          severity: 'info',
        });
      });

    logs
      .filter((l) => l.action === 'COMPLIANCE_FLAG' || l.action === 'COMPLIANCE_BLOCK' || l.metadata?.severity === 'critical' || l.metadata?.severity === 'sensitive')
      .slice(0, 10)
      .forEach((l) => {
        notifs.push({
          id: `flag-${l.id}`,
          type: 'compliance_flag',
          title: l.action === 'COMPLIANCE_BLOCK' ? t('Blocage Compliance', 'Compliance Block Triggered') : t('Alerte Compliance', 'Compliance Flag Raised'),
          description: l.metadata?.detail || `${l.action} — ${l.target}`,
          ref: l.target,
          createdAt: l.created_at,
          read: false,
          severity: l.action === 'COMPLIANCE_BLOCK' ? 'critical' : 'warning',
        });
      });

    logs
      .filter((l) => l.action === 'EMAIL_FAILURE' || l.action === 'EMAIL_ERROR')
      .slice(0, 5)
      .forEach((l) => {
        notifs.push({
          id: `email-${l.id}`,
          type: 'email_failure',
          title: t('Échec envoi email', 'Email Delivery Failure'),
          description: l.metadata?.detail || `Email failed — ${l.target}`,
          ref: l.target,
          createdAt: l.created_at,
          read: false,
          severity: 'warning',
        });
      });

    const now = Date.now();
    cases
      .filter((d) => {
        if (!['RECU', 'A_COMPLETER'].includes(d.status)) return false;
        const created = d.created_at ? new Date(d.created_at).getTime() : 0;
        return created > 0 && now - created > 72 * 60 * 60 * 1000;
      })
      .slice(0, 5)
      .forEach((d) => {
        notifs.push({
          id: `timeout-${d.id}`,
          type: 'verification_timeout',
          title: t('Délai de vérification dépassé', 'Verification Timeout'),
          description: t(`Dossier ${d.ref} en attente depuis plus de 72h`, `Dossier ${d.ref} pending for over 72 hours`),
          ref: d.ref,
          dossierId: d.id,
          createdAt: d.created_at,
          read: false,
          severity: 'warning',
        });
      });

    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [logsRes, casesRes] = await Promise.all([
        supabase.from('audit_logs').select('id, action, target, metadata, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('case_files').select('id, ref, status, created_at, updated_at').order('updated_at', { ascending: false }),
      ]);

      const notifs = buildNotificationsFromLogs(logsRes.data || [], casesRes.data || []);
      setNotifications(notifs);
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('admin_notifications_hub')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_files' }, () => {
        fetchNotifications();
        toast.info(t('Nouveau dossier reçu', 'New dossier submission received'));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        const log = payload.new as any;
        if (log.metadata?.severity === 'critical') {
          toast.error(`${t('Blocage Compliance', 'Compliance BLOCK')}: ${log.metadata?.detail || log.target}`, { duration: 8000 });
        } else if (log.metadata?.severity === 'sensitive' || log.action === 'COMPLIANCE_FLAG') {
          toast.warning(`${t('Alerte Compliance', 'Compliance Flag')}: ${log.metadata?.detail || log.target}`, { duration: 6000 });
        }
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Action handlers wired to Supabase ────────────────────────────────────

  const handleReviewDossier = (notif: AdminNotification) => {
    if (notif.dossierId) {
      router.push(`/admin/case-detail/${notif.dossierId}`);
      onClose?.();
    }
  };

  const handleAcknowledgeFlag = async (notif: AdminNotification) => {
    if (!user) return;
    setActionLoading(notif.id);
    try {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'COMPLIANCE_FLAG_ACKNOWLEDGED',
        target: notif.ref || '',
        metadata: {
          actor_email: user.email,
          detail: `Compliance flag acknowledged by ${user.email}`,
          severity: 'info',
          original_notif_id: notif.id,
        },
      });
      toast.success(t(`Alerte acquittée — ${notif.ref}`, `Flag acknowledged — ${notif.ref}`));
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || t('Erreur lors de l\'acquittement', 'Error acknowledging flag'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryEmail = async (notif: AdminNotification) => {
    if (!user) return;
    setActionLoading(notif.id);
    try {
      // Log the retry attempt in audit_logs
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'EMAIL_RETRY',
        target: notif.ref || '',
        metadata: {
          actor_email: user.email,
          detail: `Email retry triggered by ${user.email} for ${notif.ref}`,
          severity: 'info',
        },
      });
      toast.success(t(`Renvoi email déclenché — ${notif.ref}`, `Email retry triggered — ${notif.ref}`));
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || t('Erreur lors du renvoi', 'Error retrying email'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReminder = async (notif: AdminNotification) => {
    if (!user || !notif.dossierId) return;
    setActionLoading(notif.id);
    try {
      // Update case status to A_COMPLETER to trigger reminder flow
      const { error: updateErr } = await supabase
        .from('case_files')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', notif.dossierId);

      if (updateErr) throw updateErr;

      // Log reminder in audit_logs
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'REMINDER_SENT',
        target: notif.ref || '',
        metadata: {
          actor_email: user.email,
          detail: `Reminder sent for dossier ${notif.ref} (verification timeout)`,
          severity: 'info',
        },
      });

      // Insert client notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        case_id: notif.dossierId,
        type: 'ACTION_REQUIRED',
        title: t('Rappel — Documents manquants', 'Reminder — Missing documents'),
        message: t(
          `Votre dossier ${notif.ref} nécessite des documents complémentaires. Merci de compléter votre dossier.`,
          `Your dossier ${notif.ref} requires additional documents. Please complete your file.`
        ),
        metadata: { case_ref: notif.ref, triggered_by: user.email },
      });

      toast.success(t(`Rappel envoyé — ${notif.ref}`, `Reminder sent — ${notif.ref}`));
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || t('Erreur lors de l\'envoi du rappel', 'Error sending reminder'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscalate = async (notif: AdminNotification) => {
    if (!user || !notif.dossierId) return;
    setActionLoading(notif.id);
    try {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'CASE_ESCALATED',
        target: notif.ref || '',
        metadata: {
          actor_email: user.email,
          detail: `Dossier ${notif.ref} escalated due to verification timeout`,
          severity: 'sensitive',
        },
      });
      toast.success(t(`Dossier escaladé — ${notif.ref}`, `Case escalated — ${notif.ref}`));
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || t('Erreur lors de l\'escalade', 'Error escalating case'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    toast.success(t('Toutes les notifications acquittées', 'All notifications acknowledged'));
    setNotifications([]);
  };

  const filteredNotifications = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  const typeConfig = {
    new_submission: { icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: t('Soumission', 'Submission') },
    compliance_flag: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: t('Compliance', 'Compliance') },
    email_failure: { icon: Mail, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: t('Email', 'Email') },
    verification_timeout: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: t('Délai', 'Timeout') },
  };

  const unreadCount = notifications.length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden w-full max-w-lg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-navy">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={18} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">{t('Centre de notifications', 'Notification Hub')}</h2>
            <p className="text-white/40 text-[10px]">{unreadCount} {t('éléments en attente', 'pending items')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
            <RefreshCw size={14} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
        {([
          { key: 'all', label: t('Tout', 'All'), count: notifications.length },
          { key: 'new_submission', label: t('Soumissions', 'Submissions'), count: notifications.filter((n) => n.type === 'new_submission').length },
          { key: 'compliance_flag', label: t('Compliance', 'Compliance'), count: notifications.filter((n) => n.type === 'compliance_flag').length },
          { key: 'email_failure', label: t('Email', 'Email'), count: notifications.filter((n) => n.type === 'email_failure').length },
          { key: 'verification_timeout', label: t('Délais', 'Timeouts'), count: notifications.filter((n) => n.type === 'verification_timeout').length },
        ] as const).map((tab) => (
          <button
            key={`notif-tab-${tab.key}`}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 px-3 py-2.5 text-[11px] font-medium transition-colors border-b-2 ${
              filter === tab.key
                ? 'text-navy border-navy bg-white' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? 'bg-navy text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="overflow-y-auto max-h-96">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-xs">{t('Chargement...', 'Loading notifications...')}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={28} className="text-emerald-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm font-medium">{t('Tout est en ordre', 'All clear')}</p>
            <p className="text-gray-300 text-xs mt-1">{t('Aucune notification en attente', 'No pending notifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredNotifications.map((notif) => {
              const config = typeConfig[notif.type];
              const NotifIcon = config.icon;
              const isActing = actionLoading === notif.id;
              return (
                <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${notif.severity === 'critical' ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <NotifIcon size={14} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-navy truncate">{notif.title}</p>
                        {notif.severity === 'critical' && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{t('CRITIQUE', 'CRITICAL')}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{notif.description}</p>
                      {notif.ref && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{notif.ref}</span>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1.5">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons — wired to Supabase */}
                  <div className="flex items-center gap-2 mt-3 pl-11">
                    {notif.type === 'new_submission' && notif.dossierId && (
                      <button
                        onClick={() => handleReviewDossier(notif)}
                        disabled={isActing}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-navy border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={10} className="animate-spin" /> : <Eye size={10} />}
                        {t('Examiner', 'Review')}
                      </button>
                    )}
                    {notif.type === 'compliance_flag' && (
                      <>
                        <button
                          onClick={() => handleReviewDossier(notif)}
                          disabled={isActing}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-red-700 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={10} className="animate-spin" /> : <AlertTriangle size={10} />}
                          {t('Examiner', 'Review')}
                        </button>
                        <button
                          onClick={() => handleAcknowledgeFlag(notif)}
                          disabled={isActing}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                          {t('Acquitter', 'Acknowledge')}
                        </button>
                      </>
                    )}
                    {notif.type === 'email_failure' && (
                      <button
                        onClick={() => handleRetryEmail(notif)}
                        disabled={isActing}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                        {t('Renvoyer', 'Retry')}
                      </button>
                    )}
                    {notif.type === 'verification_timeout' && notif.dossierId && (
                      <>
                        <button
                          onClick={() => handleSendReminder(notif)}
                          disabled={isActing}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-orange-700 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={10} className="animate-spin" /> : <Mail size={10} />}
                          {t('Relancer', 'Remind')}
                        </button>
                        <button
                          onClick={() => handleEscalate(notif)}
                          disabled={isActing}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={10} className="animate-spin" /> : <ArrowRight size={10} />}
                          {t('Escalader', 'Escalate')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">{t('Temps réel · Mise à jour automatique', 'Real-time · Auto-refreshes on new events')}</p>
        <button
          onClick={handleMarkAllRead}
          className="text-[10px] font-semibold text-navy hover:text-navy/80 transition-colors"
        >
          {t('Tout acquitter', 'Mark all read')}
        </button>
      </div>
    </div>
  );
}
