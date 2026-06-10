'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ArrowRight,
  Loader2,
  Bell,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import DashboardLayout from '../components/DashboardLayout';

type CaseThread = {
  id: string;
  ref: string | null;
  updated_at: string | null;
};

type ActionNotification = {
  id: string;
  type: 'ACTION_REQUIRED' | 'DOCUMENT_REQUEST' | 'STATUS_UPDATE' | 'GENERAL';
  title: string;
  message: string;
  case_id: string | null;
  created_at: string;
};

export default function ClientMessagesPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [caseThreads, setCaseThreads] = useState<CaseThread[]>([]);
  const [pendingActions, setPendingActions] = useState(0);
  const [actionNotifications, setActionNotifications] = useState<ActionNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: cases }, { count: pending }, { data: notifs }] = await Promise.all([
        supabase
          .from('case_files')
          .select('id, ref, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(6),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .in('type', ['ACTION_REQUIRED', 'DOCUMENT_REQUEST']),
        supabase
          .from('notifications')
          .select('id, type, title, message, case_id, created_at')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .in('type', ['ACTION_REQUIRED', 'DOCUMENT_REQUEST', 'STATUS_UPDATE', 'GENERAL'])
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setCaseThreads((cases || []) as CaseThread[]);
      setPendingActions(pending || 0);
      setActionNotifications((notifs || []) as ActionNotification[]);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-navy/10 flex items-center justify-center mb-4">
            <MessageSquare size={24} className="text-navy" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-navy mb-2">
            {lang === 'fr' ? 'Messagerie dossiers' : 'Case messages'}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {lang === 'fr'
              ? 'Retrouvez ici les échanges liés à vos dossiers. Ouvrez un dossier pour voir son fil de discussion.'
              : 'Find all case-related conversations here. Open a case to view its discussion thread.'}
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-navy" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle size={14} className="text-amber-700" />
                    <p className="text-xs font-semibold text-amber-700">
                      {lang === 'fr' ? 'Actions en attente' : 'Pending actions'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-amber-800 font-mono-data">
                    {pendingActions}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1">
                    {lang === 'fr' ? 'Notifications a traiter' : 'Notifications to handle'}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    <p className="text-xs font-semibold text-emerald-700">
                      {lang === 'fr' ? 'Conversations actives' : 'Active conversations'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-emerald-800 font-mono-data">
                    {caseThreads.length}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    {lang === 'fr' ? 'Dossiers disponibles' : 'Available dossiers'}
                  </p>
                </div>
              </div>

              {caseThreads.length > 0 ? (
                <div className="text-left mb-6 space-y-2">
                  <p className="text-xs text-slate-500 mb-1">
                    {lang === 'fr'
                      ? 'Acces rapide aux dossiers recents'
                      : 'Quick access to recent dossiers'}
                  </p>
                  {caseThreads.map((thread) => (
                    <Link
                      key={thread.id}
                      href={`/client-dashboard/case-files/${thread.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 hover:border-slate-300 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                    >
                      <div>
                        <p className="text-sm font-semibold text-navy">
                          {thread.ref ||
                            (lang === 'fr'
                              ? 'Dossier sans reference'
                              : 'Dossier without reference')}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px] sm:max-w-none">
                          {thread.ref || (lang === 'fr' ? 'Projet en cours' : 'Ongoing project')}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-slate-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left mb-6">
                  <p className="text-sm font-semibold text-slate-700">
                    {lang === 'fr'
                      ? 'Aucune conversation active pour le moment'
                      : 'No active conversation yet'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'fr'
                      ? 'Soumettez un nouveau dossier pour demarrer un fil de discussion avec l equipe.'
                      : 'Submit a new dossier to start a discussion thread with the team.'}
                  </p>
                  <Link
                    href="/client-dashboard/new-case-file"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 rounded-md"
                  >
                    {lang === 'fr' ? 'Creer un dossier' : 'Create a dossier'}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}

              <div className="text-left mb-6">
                <p className="text-xs text-slate-500 mb-2">
                  {lang === 'fr' ? 'Centre de messages unifié' : 'Unified message center'}
                </p>
                {actionNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {actionNotifications.map((n) => (
                      <Link
                        key={n.id}
                        href={
                          n.case_id
                            ? `/client-dashboard/case-files/${n.case_id}`
                            : '/client-dashboard/notifications'
                        }
                        className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-navy truncate">{n.title}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                            {n.type === 'ACTION_REQUIRED' || n.type === 'DOCUMENT_REQUEST'
                              ? lang === 'fr'
                                ? 'Action'
                                : 'Action'
                              : lang === 'fr'
                                ? 'Info'
                                : 'Info'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    {lang === 'fr'
                      ? 'Aucune notification en attente.'
                      : 'No pending notifications.'}
                  </div>
                )}
              </div>
            </>
          )}
          <div className="flex flex-wrap justify-center items-center gap-2">
            <Link
              href="/client-dashboard/notifications"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-navy text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              <Bell size={14} />
              {lang === 'fr' ? 'Voir les notifications' : 'View notifications'}
            </Link>
            <Link
              href="/client-dashboard/case-files"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            >
              {lang === 'fr' ? 'Ouvrir mes dossiers' : 'Open my files'}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
