'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import BackOfficeLayout from '@/components/BackOfficeLayout';
import { Bell, BellOff, Check, CheckCheck, Trash2, Archive, RefreshCw, Loader2, AlertCircle, Info, AlertTriangle, ShieldCheck, FileText, X, ChevronDown, Inbox, ArchiveRestore } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '@/components/PermissionGate';
import { toast } from 'sonner';

type NotificationType = 'STATUS_UPDATE' | 'ACTION_REQUIRED' | 'COMPLIANCE_DECISION' | 'DOCUMENT_REQUEST' | 'GENERAL';
type ViewTab = 'inbox' | 'archived';

interface Notification {
  id: string;
  user_id: string;
  case_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  archived: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

const TYPE_CONFIG: Record<NotificationType, { labelFr: string; labelEn: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  STATUS_UPDATE: { labelFr: 'Mise à jour statut', labelEn: 'Status Update', icon: Info, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  ACTION_REQUIRED: { labelFr: 'Action requise', labelEn: 'Action Required', icon: AlertTriangle, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  COMPLIANCE_DECISION: { labelFr: 'Décision conformité', labelEn: 'Compliance Decision', icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  DOCUMENT_REQUEST: { labelFr: 'Document requis', labelEn: 'Document Request', icon: FileText, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  GENERAL: { labelFr: 'Général', labelEn: 'General', icon: Bell, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

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
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const { user, userRole } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();
  const { can } = usePermissions();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ViewTab>('inbox');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!can('notifications:view_all')) {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      // Add archived field default if not present
      const normalized = (data || []).map((n: any) => ({ ...n, archived: n.archived ?? false }));
      setNotifications(normalized);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [user, can]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-panel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = { ...payload.new as Notification, archived: false };
        setNotifications((prev) => [newNotif, ...prev]);
        toast.info(lang === 'fr' ? 'Nouvelle notification reçue' : 'New notification received');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, lang]);

  const markAsRead = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAsUnread = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    await supabase.from('notifications').update({ is_read: false }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: false } : n));
  };

  const archiveNotification = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    await supabase.from('notifications').update({ archived: true, is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, archived: true, is_read: true } : n));
    toast.success(lang === 'fr' ? 'Archivée' : 'Archived');
  };

  const unarchiveNotification = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    await supabase.from('notifications').update({ archived: false }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, archived: false } : n));
    toast.success(lang === 'fr' ? 'Désarchivée' : 'Unarchived');
  };

  const deleteNotification = async (id: string) => {
    if (!can('notifications:manage_own')) return;
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  // Bulk actions
  const bulkMarkRead = async () => {
    if (!user || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await supabase.from('notifications').update({ is_read: true }).in('id', ids);
      setNotifications((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, is_read: true } : n));
      setSelectedIds(new Set());
      toast.success(lang === 'fr' ? `${ids.length} notifications marquées lues` : `${ids.length} notifications marked read`);
    } finally { setBulkLoading(false); }
  };

  const bulkArchive = async () => {
    if (!user || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await supabase.from('notifications').update({ archived: true, is_read: true }).in('id', ids);
      setNotifications((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, archived: true, is_read: true } : n));
      setSelectedIds(new Set());
      toast.success(lang === 'fr' ? `${ids.length} notifications archivées` : `${ids.length} notifications archived`);
    } finally { setBulkLoading(false); }
  };

  const bulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await supabase.from('notifications').delete().in('id', ids);
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
      toast.success(lang === 'fr' ? `${ids.length} notifications supprimées` : `${ids.length} notifications deleted`);
    } finally { setBulkLoading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((n) => n.id)));
    }
  };

  const filtered = notifications.filter((n) => {
    if (tab === 'inbox' && n.archived) return false;
    if (tab === 'archived' && !n.archived) return false;
    if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
    if (readFilter === 'unread' && n.is_read) return false;
    if (readFilter === 'read' && !n.is_read) return false;
    return true;
  });

  const inboxCount = notifications.filter((n) => !n.archived).length;
  const archivedCount = notifications.filter((n) => n.archived).length;
  const unreadCount = notifications.filter((n) => !n.archived && !n.is_read).length;

  return (
    <BackOfficeLayout role={(userRole as any) || 'admin'} userName={user?.email?.split('@')[0] || 'Admin'}>
      <PermissionGate require={['notifications:view_own', 'notifications:view_all']}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-xl font-bold text-navy flex items-center gap-2">
                <Bell size={20} className="text-gold" />
                {lang === 'fr' ? 'Notifications' : 'Notifications'}
                {unreadCount > 0 && (
                  <span className="bg-gold text-navy text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {lang === 'fr'
                  ? `${inboxCount} dans la boîte de réception · ${archivedCount} archivées`
                  : `${inboxCount} in inbox · ${archivedCount} archived`}
              </p>
            </div>
            <button
              onClick={fetchNotifications}
              className="p-2 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
            <button
              onClick={() => { setTab('inbox'); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'inbox' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
            >
              <Inbox size={14} />
              {lang === 'fr' ? 'Boîte de réception' : 'Inbox'}
              {inboxCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'inbox' ? 'bg-navy text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {inboxCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setTab('archived'); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'archived' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
            >
              <Archive size={14} />
              {lang === 'fr' ? 'Archives' : 'Archived'}
              {archivedCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'archived' ? 'bg-navy text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {archivedCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters + Bulk actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-wrap items-center gap-3">
            {/* Read filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(['all', 'unread', 'read'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setReadFilter(v)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${readFilter === v ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
                >
                  {v === 'all' ? (lang === 'fr' ? 'Toutes' : 'All') : v === 'unread' ? (lang === 'fr' ? 'Non lues' : 'Unread') : (lang === 'fr' ? 'Lues' : 'Read')}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'ALL')}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{lang === 'fr' ? 'Tous les types' : 'All types'}</option>
                {(Object.keys(TYPE_CONFIG) as NotificationType[]).map((t) => (
                  <option key={t} value={t}>{lang === 'fr' ? TYPE_CONFIG[t].labelFr : TYPE_CONFIG[t].labelEn}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Bulk actions — only when items selected */}
            {selectedIds.size > 0 && can('notifications:manage_own') && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-slate-500 font-medium">{selectedIds.size} {lang === 'fr' ? 'sélectionnée(s)' : 'selected'}</span>
                <button
                  onClick={bulkMarkRead}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy bg-navy/10 hover:bg-navy/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                  {lang === 'fr' ? 'Marquer lues' : 'Mark read'}
                </button>
                {tab === 'inbox' && (
                  <button
                    onClick={bulkArchive}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {bulkLoading ? <Loader2 size={11} className="animate-spin" /> : <Archive size={11} />}
                    {lang === 'fr' ? 'Archiver' : 'Archive'}
                  </button>
                )}
                <button
                  onClick={bulkDelete}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  {lang === 'fr' ? 'Supprimer' : 'Delete'}
                </button>
              </div>
            )}
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
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              {tab === 'archived' ? (
                <Archive size={36} className="text-slate-300 mx-auto mb-3" />
              ) : (
                <BellOff size={36} className="text-slate-300 mx-auto mb-3" />
              )}
              <p className="text-slate-500 font-medium">
                {tab === 'archived'
                  ? (lang === 'fr' ? 'Aucune notification archivée' : 'No archived notifications')
                  : (lang === 'fr' ? 'Aucune notification' : 'No notifications')}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {lang === 'fr' ? 'Vous êtes à jour !' : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select all row */}
              {can('notifications:manage_own') && filtered.length > 0 && (
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy/30 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500">
                    {lang === 'fr' ? `Tout sélectionner (${filtered.length})` : `Select all (${filtered.length})`}
                  </span>
                </div>
              )}

              {filtered.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type];
                const NotifIcon = cfg.icon;
                const isSelected = selectedIds.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    className={`bg-white rounded-xl border transition-all ${
                      isSelected ? 'border-navy/30 bg-navy/5' :
                      notif.is_read ? 'border-slate-200 opacity-80' : `border-l-4 ${cfg.border} border-slate-200`
                    }`}
                  >
                    <div className="p-4 flex items-start gap-3">
                      {can('notifications:manage_own') && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(notif.id)}
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-navy focus:ring-navy/30 cursor-pointer flex-shrink-0"
                        />
                      )}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}>
                        <NotifIcon size={16} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-semibold ${notif.is_read ? 'text-slate-600' : 'text-navy'}`}>
                                {notif.title}
                              </span>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                              )}
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                            {notif.metadata?.case_title && (
                              <p className="text-xs text-slate-400 mt-1">
                                {lang === 'fr' ? 'Dossier :' : 'File:'}{' '}
                                <span className="font-medium text-slate-500">{notif.metadata.case_title}</span>
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                            {formatDate(notif.created_at, lang as 'fr' | 'en')}
                          </span>
                        </div>
                      </div>

                      {/* Per-notification actions */}
                      {can('notifications:manage_own') && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                          {notif.is_read ? (
                            <button
                              onClick={() => markAsUnread(notif.id)}
                              className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors"
                              title={lang === 'fr' ? 'Marquer non lue' : 'Mark unread'}
                            >
                              <BellOff size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={lang === 'fr' ? 'Marquer comme lue' : 'Mark as read'}
                            >
                              <Check size={13} />
                            </button>
                          )}
                          {tab === 'inbox' ? (
                            <button
                              onClick={() => archiveNotification(notif.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title={lang === 'fr' ? 'Archiver' : 'Archive'}
                            >
                              <Archive size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => unarchiveNotification(notif.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={lang === 'fr' ? 'Désarchiver' : 'Unarchive'}
                            >
                              <ArchiveRestore size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                          >
                            <X size={13} />
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
    </BackOfficeLayout>
  );
}
