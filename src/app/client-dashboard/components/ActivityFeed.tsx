'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  FileUp,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  type: string;
  icon: React.ElementType;
  color: string;
  title: string;
  desc: string;
  dossier: string;
  time: string;
}

function formatRelativeTime(dateStr: string, lang: 'fr' | 'en'): string {
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

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  STATUS_CHANGE: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
  NOTE_ADDED: { icon: MessageSquare, color: 'bg-purple-100 text-purple-600' },
  DOCUMENT_UPLOAD: { icon: FileUp, color: 'bg-blue-100 text-blue-600' },
  DOCUMENT_DOWNLOAD: { icon: FileUp, color: 'bg-blue-100 text-blue-600' },
  COMPLIANCE_FLAG: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
  COMPLIANCE_BLOCK: { icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  DEFAULT: { icon: Clock, color: 'bg-slate-100 text-slate-500' },
};

export default function ActivityFeed() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const supabase = createClient();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch audit logs for this user's cases
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('id, action, target, metadata, created_at')
        .eq('actor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (logs && logs.length > 0) {
        const mapped: ActivityItem[] = logs.map((log: any) => {
          const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.DEFAULT;
          const detail = log.metadata?.detail || '';
          const title =
            lang === 'fr'
              ? log.action === 'STATUS_CHANGE'
                ? 'Statut mis à jour'
                : log.action === 'NOTE_ADDED'
                  ? 'Note interne ajoutée'
                  : log.action === 'DOCUMENT_UPLOAD'
                    ? 'Document téléchargé'
                    : log.action === 'DOCUMENT_DOWNLOAD'
                      ? 'Document téléchargé'
                      : log.action === 'COMPLIANCE_FLAG'
                        ? 'Alerte compliance'
                        : log.action
              : log.action === 'STATUS_CHANGE'
                ? 'Status updated'
                : log.action === 'NOTE_ADDED'
                  ? 'Internal note added'
                  : log.action === 'DOCUMENT_UPLOAD'
                    ? 'Document uploaded'
                    : log.action === 'DOCUMENT_DOWNLOAD'
                      ? 'Document downloaded'
                      : log.action === 'COMPLIANCE_FLAG'
                        ? 'Compliance alert'
                        : log.action;

          return {
            id: log.id,
            type: log.action,
            icon: cfg.icon,
            color: cfg.color,
            title,
            desc: detail || log.target || '-',
            dossier: log.target || '-',
            time: formatRelativeTime(log.created_at, lang as 'fr' | 'en'),
          };
        });
        setActivities(mapped);
      } else {
        // Fallback: fetch from notifications table
        const { data: notifs } = await supabase
          .from('notifications')
          .select('id, type, title, message, created_at, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(7);

        if (notifs && notifs.length > 0) {
          const mapped: ActivityItem[] = notifs.map((n: any) => ({
            id: n.id,
            type: n.type,
            icon: CheckCircle2,
            color: 'bg-emerald-100 text-emerald-600',
            title: n.title || (lang === 'fr' ? 'Notification' : 'Notification'),
            desc: n.message || '',
            dossier: n.metadata?.case_ref || '-',
            time: formatRelativeTime(n.created_at, lang as 'fr' | 'en'),
          }));
          setActivities(mapped);
        } else {
          setActivities([]);
        }
      }
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user, lang]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div className="card-surface flex flex-col h-full" style={{ minHeight: '420px' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-display text-base font-bold text-navy">
            {lang === 'fr' ? 'Activité récente' : 'Recent activity'}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {lang === 'fr' ? 'Journal des événements' : 'Event log'}
          </p>
        </div>
        <button
          onClick={fetchActivity}
          className="text-xs text-navy hover:text-gold font-semibold flex items-center gap-1 transition-colors"
        >
          {lang === 'fr' ? 'Actualiser' : 'Refresh'} <ArrowRight size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-5">
            <Clock size={28} className="text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-medium">
              {lang === 'fr' ? 'Aucune activité récente' : 'No recent activity'}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {lang === 'fr' ? 'Vos actions apparaîtront ici' : 'Your actions will appear here'}
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${activity.color}`}
              >
                <activity.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-navy leading-snug">{activity.title}</p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                    {activity.time}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug mt-0.5 truncate">
                  {activity.desc}
                </p>
                {activity.dossier && activity.dossier !== '-' && (
                  <span className="inline-flex items-center mt-1 px-1.5 py-0.5 bg-navy/5 text-navy text-[10px] font-mono-data font-semibold rounded">
                    {activity.dossier}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
