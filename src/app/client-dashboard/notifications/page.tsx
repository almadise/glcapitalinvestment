'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Info,
  AlertTriangle,
  ShieldCheck,
  FileText,
  X,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/PermissionGate';

type NotificationType =
  | 'STATUS_UPDATE'
  | 'ACTION_REQUIRED'
  | 'COMPLIANCE_DECISION'
  | 'DOCUMENT_REQUEST'
  | 'GENERAL';

interface Notification {
  id: string;
  user_id: string;
  case_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

type NotificationPriority = 'URGENT' | 'NORMAL' | 'INFO';

const TYPE_CONFIG: Record<
  NotificationType,
  {
    labelFr: string;
    labelEn: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
  }
> = {
  STATUS_UPDATE: {
    labelFr: 'Mise à jour statut',
    labelEn: 'Status Update',
    icon: Info,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  ACTION_REQUIRED: {
    labelFr: 'Action requise',
    labelEn: 'Action Required',
    icon: AlertTriangle,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  COMPLIANCE_DECISION: {
    labelFr: 'Décision conformité',
    labelEn: 'Compliance Decision',
    icon: ShieldCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  DOCUMENT_REQUEST: {
    labelFr: 'Document requis',
    labelEn: 'Document Request',
    icon: FileText,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  GENERAL: {
    labelFr: 'Général',
    labelEn: 'General',
    icon: Bell,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};

const DATE_FILTERS = [
  { value: 'all', labelFr: 'Toutes les dates', labelEn: 'All dates' },
  { value: 'today', labelFr: "Aujourd\'hui", labelEn: 'Today' },
  { value: 'week', labelFr: '7 derniers jours', labelEn: 'Last 7 days' },
  { value: 'month', labelFr: '30 derniers jours', labelEn: 'Last 30 days' },
];

function formatDate(dateStr: string, lang: 'fr' | 'en'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return lang === 'fr' ? "À l'instant" : 'Just now';
  if (diffMins < 60) return lang === 'fr' ? `Il y a ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24) return lang === 'fr' ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  if (diffDays < 7) return lang === 'fr' ? `Il y a ${diffDays}j` : `${diffDays}d ago`;
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isInDateRange(dateStr: string, filter: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  if (filter === 'today') {
    return date.toDateString() === now.toDateString();
  }
  if (filter === 'week') {
    return now.getTime() - date.getTime() <= 7 * 86400000;
  }
  if (filter === 'month') {
    return now.getTime() - date.getTime() <= 30 * 86400000;
  }
  return true;
}

function getNotificationPriority(notif: Notification): NotificationPriority {
  if (notif.type === 'ACTION_REQUIRED' || notif.type === 'DOCUMENT_REQUEST') return 'URGENT';
  if (notif.type === 'COMPLIANCE_DECISION') return 'NORMAL';
  return 'INFO';
}

function getNotificationAction(notif: Notification, lang: 'fr' | 'en') {
  if (notif.metadata?.action_url && typeof notif.metadata.action_url === 'string') {
    return {
      href: notif.metadata.action_url as string,
      label: lang === 'fr' ? "Ouvrir l'action" : 'Open action',
    };
  }

  if (notif.type === 'ACTION_REQUIRED' || notif.type === 'DOCUMENT_REQUEST') {
    return {
      href: notif.case_id
        ? `/client-dashboard/documents?case_id=${encodeURIComponent(notif.case_id)}`
        : '/client-dashboard/documents',
      label: lang === 'fr' ? 'Traiter maintenant' : 'Handle now',
    };
  }

  if ((notif.type === 'STATUS_UPDATE' || notif.type === 'COMPLIANCE_DECISION') && notif.case_id) {
    return {
      href: `/client-dashboard/case-files/${notif.case_id}`,
      label: lang === 'fr' ? 'Voir le dossier' : 'View dossier',
    };
  }

  if (notif.type === 'GENERAL') {
    return {
      href: '/client-dashboard/messages',
      label: lang === 'fr' ? 'Voir les messages' : 'View messages',
    };
  }

  return {
    href: '/client-dashboard',
    label: lang === 'fr' ? 'Ouvrir le portail' : 'Open portal',
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();
  const { can } = usePermissions();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Admins can view all notifications; clients/others only see their own
      if (!can('notifications:view_all')) {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setNotifications(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [user, can]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-inbox')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          toast.info(lang === 'fr' ? 'Nouvelle notification reçue' : 'New notification received');
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, lang]);

  const markAsRead = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (_) {
      /* empty */
    }
  };

  const markAsUnread = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    try {
      await supabase.from('notifications').update({ is_read: false }).eq('id', id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
    } catch (_) {
      /* empty */
    }
  };

  const deleteNotification = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (_) {
      /* empty */
    }
  };

  const markAllAsRead = async () => {
    if (!user || !can('notifications:manage_own')) return;
    setMarkingAll(true);
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success(
        lang === 'fr'
          ? 'Toutes les notifications marquées comme lues'
          : 'All notifications marked as read'
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteAllRead = async () => {
    if (!user || !can('notifications:manage_own')) return;
    setDeletingAll(true);
    try {
      await supabase.from('notifications').delete().eq('user_id', user.id).eq('is_read', true);
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast.success(lang === 'fr' ? 'Notifications lues supprimées' : 'Read notifications deleted');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingAll(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
    if (readFilter === 'unread' && n.is_read) return false;
    if (readFilter === 'read' && !n.is_read) return false;
    if (!isInDateRange(n.created_at, dateFilter)) return false;
    return true;
  });
  const sortedFiltered = [...filtered].sort((a, b) => {
    const score = (notif: Notification) => {
      const priority = getNotificationPriority(notif);
      const priorityScore = priority === 'URGENT' ? 3 : priority === 'NORMAL' ? 2 : 1;
      const unreadScore = notif.is_read ? 0 : 1;
      return priorityScore * 10 + unreadScore;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const urgentUnreadCount = notifications.filter(
    (n) => !n.is_read && getNotificationPriority(n) === 'URGENT'
  ).length;
  const pendingActionCount = notifications.filter(
    (n) => !n.is_read && (n.type === 'ACTION_REQUIRED' || n.type === 'DOCUMENT_REQUEST')
  ).length;

  return (
    <DashboardLayout>
      <PermissionGate require={['notifications:view_own', 'notifications:view_all']}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-navy flex items-center gap-2">
                <Bell size={22} className="text-gold" />
                {lang === 'fr' ? 'Notifications' : 'Notifications'}
                {unreadCount > 0 && (
                  <span className="bg-gold text-navy text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {lang === 'fr'
                  ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} - ${unreadCount} non lue${unreadCount !== 1 ? 's' : ''}`
                  : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} - ${unreadCount} unread`}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                  {urgentUnreadCount} {lang === 'fr' ? 'urgente(s)' : 'urgent'}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                  {pendingActionCount} {lang === 'fr' ? 'action(s) a traiter' : 'actions to handle'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                className="p-2.5 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                title={lang === 'fr' ? 'Actualiser' : 'Refresh'}
              >
                <RefreshCw size={16} />
              </button>
              {/* Bulk actions only for users with manage_own permission */}
              {can('notifications:manage_own') && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-navy bg-navy/10 hover:bg-navy/20 rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                >
                  {markingAll ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCheck size={13} />
                  )}
                  {lang === 'fr' ? 'Tout marquer lu' : 'Mark all read'}
                </button>
              )}
              {can('notifications:manage_own') && notifications.some((n) => n.is_read) && (
                <button
                  onClick={deleteAllRead}
                  disabled={deletingAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                >
                  {deletingAll ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  {lang === 'fr' ? 'Supprimer lues' : 'Delete read'}
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-2 sm:gap-3">
            {/* Read/Unread filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(['all', 'unread', 'read'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setReadFilter(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 ${readFilter === v ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                >
                  {v === 'all'
                    ? lang === 'fr'
                      ? 'Toutes'
                      : 'All'
                    : v === 'unread'
                      ? lang === 'fr'
                        ? 'Non lues'
                        : 'Unread'
                      : lang === 'fr'
                        ? 'Lues'
                        : 'Read'}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'ALL')}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 cursor-pointer min-w-[150px]"
              >
                <option value="ALL">{lang === 'fr' ? 'Tous les types' : 'All types'}</option>
                {(Object.keys(TYPE_CONFIG) as NotificationType[]).map((t) => (
                  <option key={t} value={t}>
                    {lang === 'fr' ? TYPE_CONFIG[t].labelFr : TYPE_CONFIG[t].labelEn}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Date filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 cursor-pointer min-w-[150px]"
              >
                {DATE_FILTERS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {lang === 'fr' ? d.labelFr : d.labelEn}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Notifications list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-gold" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          ) : sortedFiltered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <BellOff size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {lang === 'fr' ? 'Vous êtes à jour !' : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFiltered.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type];
                const NotifIcon = cfg.icon;
                const priority = getNotificationPriority(notif);
                const action = getNotificationAction(notif, lang as 'fr' | 'en');
                return (
                  <div
                    key={notif.id}
                    className={`bg-white rounded-xl border transition-all ${notif.is_read ? 'border-slate-200 opacity-80' : `border-l-4 ${cfg.border} border-slate-200`}`}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}
                      >
                        <NotifIcon size={16} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-semibold ${notif.is_read ? 'text-slate-600' : 'text-navy'}`}
                              >
                                {notif.title}
                              </span>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                              )}
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                              >
                                {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  priority === 'URGENT'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : priority === 'NORMAL'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {priority === 'URGENT'
                                  ? lang === 'fr'
                                    ? 'Urgent'
                                    : 'Urgent'
                                  : priority === 'NORMAL'
                                    ? lang === 'fr'
                                      ? 'Important'
                                      : 'Important'
                                    : lang === 'fr'
                                      ? 'Information'
                                      : 'Info'}
                              </span>
                              {notif.is_read && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                  {lang === 'fr' ? 'Traitee' : 'Handled'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                            {notif.metadata?.case_title && (
                              <p className="text-xs text-slate-400 mt-1">
                                {lang === 'fr' ? 'Dossier :' : 'File:'}{' '}
                                <span className="font-medium text-slate-500">
                                  {notif.metadata.case_title}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {formatDate(notif.created_at, lang as 'fr' | 'en')}
                            </span>
                          </div>
                        </div>
                        <div className="sm:hidden mt-1">
                          <span className="text-[11px] text-slate-400">
                            {formatDate(notif.created_at, lang as 'fr' | 'en')}
                          </span>
                        </div>
                        <div className="mt-3">
                          <Link
                            href={action.href}
                            onClick={() => {
                              if (!notif.is_read && can('notifications:manage_own')) {
                                void markAsRead(notif.id);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-navy hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                          >
                            {action.label}
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                      {/* Per-notification actions - only for users with manage_own permission */}
                      {can('notifications:manage_own') && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                          {notif.is_read ? (
                            <button
                              onClick={() => markAsUnread(notif.id)}
                              className="p-2 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                              title={lang === 'fr' ? 'Marquer non lue' : 'Mark unread'}
                            >
                              <BellOff size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                              title={lang === 'fr' ? 'Marquer comme lue' : 'Mark as read'}
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                            title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PermissionGate>
    </DashboardLayout>
  );
}
