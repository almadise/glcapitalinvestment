'use client';
import React, { useState, useEffect } from 'react';
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
import { Loader2, AlertCircle, LayoutDashboard, FolderOpen, Bell, ShieldOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import WalkthroughModal from './WalkthroughModal';
import { usePermissions } from '@/hooks/usePermissions';

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'dossiers' | 'notifications'>('overview');
  const { lang } = useLanguage();
  const { user, userRole, loading: authLoading } = useAuth();
  const { can } = usePermissions();
  const router = useRouter();
  const supabase = createClient();
  const [hasACompleter, setHasACompleter] = useState(false);
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

  useEffect(() => {
    if (!user) return;
    const checkACompleter = async () => {
      const { data } = await supabase
        .from('case_files')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'A_COMPLETER')
        .limit(1);
      setHasACompleter((data?.length || 0) > 0);
    };
    checkACompleter();
  }, [user]);

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
          {hasACompleter && canViewCaseFiles && (
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