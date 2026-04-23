'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopbar from './DashboardTopbar';
import KPIBentoGrid from './KPIBentoGrid';
import DossierTable from './DossierTable';
import ActivityFeed from './ActivityFeed';
import DossierCharts from './DossierCharts';
import NotificationSettings from './NotificationSettings';
import { Toaster } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, AlertCircle, LayoutDashboard, FolderOpen, Bell, ShieldOff, Flag, FileWarning } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import WalkthroughModal from './WalkthroughModal';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ACTIVE_CASE_STATUSES,
  CASE_STATUS_ORDER,
  getCaseProgressPercent,
  getCaseStatusMeta,
  getNextMilestoneLabel,
  type CaseStatus,
} from '@/lib/caseStatus';

type OverviewSummary = {
  totalCases: number;
  activeCases: number;
  aCompleterCases: number;
  pendingDocuments: number;
  currentStatus: CaseStatus | null;
  lastActivityAt: string | null;
};

const EMPTY_OVERVIEW: OverviewSummary = {
  totalCases: 0,
  activeCases: 0,
  aCompleterCases: 0,
  pendingDocuments: 0,
  currentStatus: null,
  lastActivityAt: null,
};

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'dossiers' | 'notifications'>('overview');
  const { lang } = useLanguage();
  const { user, userRole, loading: authLoading } = useAuth();
  const { can } = usePermissions();
  const router = useRouter();
  const supabase = createClient();
  const [overviewSummary, setOverviewSummary] = useState<OverviewSummary>(EMPTY_OVERVIEW);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Dynamic last-updated timestamp
    const now = new Date();
    setLastUpdated(
      now.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit', month: 'long', year: 'numeric',
      }) + ' à ' + now.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    );
  }, [lang]);

  const fetchOverviewSummary = useCallback(async () => {
    if (!user) return;
    try {
      const [{ data: cases }, { count: pendingDocuments }] = await Promise.all([
        supabase
          .from('case_files')
          .select('status, updated_at, created_at')
          .eq('user_id', user.id),
        supabase
          .from('dossier_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('scan_passed', false),
      ]);

      const allCases = (cases ?? []) as Array<{ status: CaseStatus; updated_at: string | null; created_at: string | null }>;
      const activeCases = allCases.filter((item) => ACTIVE_CASE_STATUSES.includes(item.status));
      const aCompleterCases = allCases.filter((item) => item.status === 'A_COMPLETER');

      const statusSet = new Set(activeCases.map((item) => item.status));
      const currentStatus =
        [...CASE_STATUS_ORDER].reverse().find((status) => statusSet.has(status)) ??
        allCases
          .slice()
          .sort(
            (a, b) =>
              new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
              new Date(a.updated_at ?? a.created_at ?? 0).getTime()
          )[0]?.status ??
        null;

      const lastActivityAt = allCases
        .map((item) => item.updated_at ?? item.created_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] ?? null;

      setOverviewSummary({
        totalCases: allCases.length,
        activeCases: activeCases.length,
        aCompleterCases: aCompleterCases.length,
        pendingDocuments: pendingDocuments || 0,
        currentStatus,
        lastActivityAt,
      });
    } catch {
      setOverviewSummary(EMPTY_OVERVIEW);
    }
  }, [user]);

  useEffect(() => {
    fetchOverviewSummary();
    if (!user) return;

    const channel = supabase
      .channel('overview_summary_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_files', filter: `user_id=eq.${user.id}` }, fetchOverviewSummary)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dossier_documents', filter: `user_id=eq.${user.id}` }, fetchOverviewSummary)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOverviewSummary]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-up-login-screen');
      return;
    }
    if (!authLoading && user && userRole !== null) {
      if (userRole === 'admin') {
        router.replace('/admin');
      } else if (userRole === 'compliance') {
        router.replace('/compliance-dashboard');
      } else if (userRole === 'analyst') {
        router.replace('/analyst-dashboard');
      } else if (userRole === 'gestionnaire_contenu') {
        router.replace('/content-dashboard');
      }
    }
  }, [authLoading, user, userRole, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;

  // Permission check: allow fallback for authenticated users when role lookup fails.
  // This avoids false "Access Denied" states when profiles/user_profiles are temporarily mismatched.
  const canViewClientDashboard = can('dashboard:view_client') || (Boolean(user) && userRole === null);
  if (!canViewClientDashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <ShieldOff size={26} className="text-red-400" />
          </div>
          <h2 className="font-display text-lg font-bold text-navy mb-2">
            {lang === 'fr' ? 'Accès non autorisé' : 'Access Denied'}
          </h2>
          <p className="text-slate-500 text-sm mb-5">
            {lang === 'fr' ?'Votre rôle ne vous permet pas d\'accéder à l\'espace client.' :'Your role does not allow access to the client dashboard.'}
          </p>
          <Link
            href="/sign-up-login-screen"
            className="px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors"
          >
            {lang === 'fr' ? 'Retour à la connexion' : 'Back to login'}
          </Link>
        </div>
      </div>
    );
  }

  const canViewCaseFiles = can('case_files:view_own') || can('case_files:view_all') || userRole === null;
  const canViewNotifications = can('notifications:view_own') || can('notifications:view_all') || userRole === null;
  const statusMeta = overviewSummary.currentStatus ? getCaseStatusMeta(overviewSummary.currentStatus, lang) : null;
  const progress = overviewSummary.currentStatus ? getCaseProgressPercent(overviewSummary.currentStatus) : 0;
  const nextMilestone = overviewSummary.currentStatus ? getNextMilestoneLabel(overviewSummary.currentStatus, lang) : null;
  const actionsRequired = [
    overviewSummary.aCompleterCases > 0
      ? {
          key: 'missing-docs',
          title: lang === 'fr' ? 'Documents manquants à compléter' : 'Missing documents to complete',
          count: overviewSummary.aCompleterCases,
          href: '/client-dashboard/case-files',
          cta: lang === 'fr' ? 'Compléter maintenant' : 'Complete now',
          urgency: lang === 'fr' ? 'Urgent' : 'Urgent',
        }
      : null,
    overviewSummary.pendingDocuments > 0
      ? {
          key: 'pending-review',
          title: lang === 'fr' ? 'Documents en attente de validation' : 'Documents pending validation',
          count: overviewSummary.pendingDocuments,
          href: '/client-dashboard/documents',
          cta: lang === 'fr' ? 'Vérifier les documents' : 'Review documents',
          urgency: lang === 'fr' ? 'Cette semaine' : 'This week',
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    count: number;
    href: string;
    cta: string;
    urgency: string;
  }>;

  const tabs = [
    { id: 'overview' as const, label: lang === 'fr' ? 'Vue d\'ensemble' : 'Overview', icon: LayoutDashboard },
    ...(canViewCaseFiles
      ? [{ id: 'dossiers' as const, label: lang === 'fr' ? 'Mes dossiers' : 'My files', icon: FolderOpen }]
      : []),
    ...(canViewNotifications
      ? [{ id: 'notifications' as const, label: lang === 'fr' ? 'Notifications' : 'Notifications', icon: Bell }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster richColors position="top-right" />
      <WalkthroughModal />

      <DashboardSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        <DashboardTopbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 py-4 sm:py-6 max-w-screen-2xl w-full mx-auto overflow-x-hidden">
          {/* A_COMPLETER global banner - only for users who can view their own case files */}
          {overviewSummary.aCompleterCases > 0 && canViewCaseFiles && (
            <div className="flex items-start gap-4 bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 mb-5 shadow-sm">
              <div className="flex-shrink-0 w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={18} className="text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-orange-800 text-sm">
                  {lang === 'fr' ? '⚠️ Action requise - Documents manquants' : '⚠️ Action required - Missing documents'}
                </p>
                <p className="text-orange-700 text-xs mt-0.5 leading-relaxed">
                  {lang === 'fr' ?'Un ou plusieurs de vos dossiers nécessitent des documents complémentaires.' :'One or more of your case files require additional documents.'}
                </p>
              </div>
              <Link
                href="/client-dashboard/case-files"
                className="flex-shrink-0 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-orange-600 transition-colors whitespace-nowrap"
              >
                {lang === 'fr' ? 'Voir mes dossiers' : 'View my files'}
              </Link>
            </div>
          )}

          {children ? children : (
            <>
              {/* Page header */}
              <div className="mb-4 sm:mb-5">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">
                  {lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {lang === 'fr' ? `Vue d'ensemble de vos dossiers - Mis à jour le ${lastUpdated}`
                    : `Overview of your files - Updated ${lastUpdated}`}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-navy shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'overview' && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div className="xl:col-span-2 card-surface p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {lang === 'fr' ? 'Statut global du dossier' : 'Global dossier status'}
                          </p>
                          <h3 className="font-display text-lg sm:text-xl font-bold text-navy mt-1">
                            {statusMeta
                              ? statusMeta.label
                              : lang === 'fr'
                                ? 'Aucun dossier actif'
                                : 'No active dossier'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1.5">
                            {nextMilestone
                              ? (lang === 'fr' ? `Prochain jalon: ${nextMilestone}` : `Next milestone: ${nextMilestone}`)
                              : (lang === 'fr' ? 'Soumettez un dossier pour démarrer votre parcours.' : 'Submit a dossier to start your journey.')}
                          </p>
                        </div>
                        {statusMeta ? (
                          <span className={`status-badge border whitespace-nowrap ${statusMeta.badgeClass}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                            {statusMeta.label}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">
                            {lang === 'fr' ? 'Progression estimée' : 'Estimated progress'}
                          </span>
                          <span className="text-xs font-semibold text-navy font-mono-data">{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#0F2557] via-[#C9A84C] to-emerald-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                          <p className="text-[11px] text-slate-500">{lang === 'fr' ? 'Dossiers actifs' : 'Active dossiers'}</p>
                          <p className="text-lg font-semibold text-navy font-mono-data">{overviewSummary.activeCases}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                          <p className="text-[11px] text-slate-500">{lang === 'fr' ? 'Total dossiers' : 'Total dossiers'}</p>
                          <p className="text-lg font-semibold text-navy font-mono-data">{overviewSummary.totalCases}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 px-3 py-2.5 col-span-2 sm:col-span-1">
                          <p className="text-[11px] text-slate-500">{lang === 'fr' ? 'Dernière activité' : 'Last activity'}</p>
                          <p className="text-xs font-semibold text-navy mt-1">
                            {overviewSummary.lastActivityAt
                              ? new Date(overviewSummary.lastActivityAt).toLocaleString(
                                  lang === 'fr' ? 'fr-FR' : 'en-US',
                                  { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
                                )
                              : (lang === 'fr' ? 'Aucune activité' : 'No activity yet')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="card-surface p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Flag size={15} className="text-gold" />
                        <h3 className="font-display text-base font-bold text-navy">
                          {lang === 'fr' ? 'Actions requises' : 'Required actions'}
                        </h3>
                      </div>
                      {actionsRequired.length === 0 ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                          <p className="text-sm font-semibold text-emerald-700">
                            {lang === 'fr' ? 'Aucune action urgente' : 'No urgent action'}
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            {lang === 'fr' ? 'Votre dossier est à jour pour le moment.' : 'Your dossier is currently up to date.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {actionsRequired.map((action) => (
                            <Link
                              key={action.key}
                              href={action.href}
                              className="block rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3 hover:bg-amber-50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-amber-900 leading-snug">{action.title}</p>
                                  <p className="text-[11px] text-amber-700 mt-1">
                                    {action.count} {lang === 'fr' ? 'dossier(s) concerné(s)' : 'dossier(s) impacted'}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-amber-800 border border-amber-200 whitespace-nowrap">
                                  {action.urgency}
                                </span>
                              </div>
                              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                                <FileWarning size={13} />
                                {action.cta}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <KPIBentoGrid />
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
                    <div className="xl:col-span-2">
                      <DossierCharts />
                    </div>
                    <div className="xl:col-span-1">
                      <ActivityFeed />
                    </div>
                  </div>
                  {can('notifications:manage_settings') && (
                    <div className="mt-4 sm:mt-6 max-w-md">
                      <NotificationSettings />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'dossiers' && canViewCaseFiles && (
                <div className="mt-2">
                  <DossierTable />
                </div>
              )}

              {activeTab === 'notifications' && canViewNotifications && (
                <div className="mt-2 max-w-3xl">
                  {can('notifications:manage_settings') && <NotificationSettings />}
                  <div className="mt-4">
                    <Link
                      href="/client-dashboard/notifications"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors"
                    >
                      <Bell size={15} />
                      {lang === 'fr' ? 'Voir toutes les notifications' : 'View all notifications'}
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}