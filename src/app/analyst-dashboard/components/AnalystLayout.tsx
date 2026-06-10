'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import RoleGuard from '@/components/RoleGuard';
import { Toaster } from 'sonner';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileSearch,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  labelFr: string;
  labelEn: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    id: 'nav-overview',
    icon: LayoutDashboard,
    labelFr: "Vue d'ensemble",
    labelEn: 'Overview',
    href: '/analyst-dashboard',
  },
  {
    id: 'nav-cases',
    icon: ClipboardList,
    labelFr: 'Dossiers à traiter',
    labelEn: 'Cases to Process',
    href: '/analyst-dashboard/cases',
  },
  {
    id: 'nav-analytics',
    icon: BarChart3,
    labelFr: 'Analytique',
    labelEn: 'Analytics',
    href: '/admin/analytics',
  },
  {
    id: 'nav-reports',
    icon: FileSearch,
    labelFr: 'Rapports',
    labelEn: 'Reports',
    href: '/analyst-dashboard/reports',
  },
];

function AnalystSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}) {
  const { signOut } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (_) {
      /* empty */
    }
    router.push('/sign-up-login-screen');
  };

  const renderItem = (item: NavItem, isMobile = false) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const label = lang === 'fr' ? item.labelFr : item.labelEn;
    return (
      <Link
        key={isMobile ? `m-${item.id}` : item.id}
        href={item.href}
        onClick={isMobile ? onCloseMobile : undefined}
        className={`relative group ${isActive ? 'sidebar-item-active' : 'sidebar-item'}`}
        title={collapsed && !isMobile ? label : undefined}
      >
        <item.icon size={18} className="flex-shrink-0" />
        {(!collapsed || isMobile) && <span className="flex-1 text-sm">{label}</span>}
        {collapsed && !isMobile && (
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg border border-white/10">
            {label}
          </div>
        )}
      </Link>
    );
  };

  const sidebarContent = (isMobile = false) => (
    <>
      <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
        {(!collapsed || isMobile) && (
          <p className="section-label mb-1.5 px-2">{lang === 'fr' ? 'Analyse' : 'Analysis'}</p>
        )}
        <div className="space-y-0.5">{navItems.map((item) => renderItem(item, isMobile))}</div>
      </nav>
      <div className="border-t border-white/5 p-2 space-y-0.5 flex-shrink-0">
        <Link
          href="/home-page"
          onClick={isMobile ? onCloseMobile : undefined}
          className="sidebar-item group relative"
          title={
            collapsed && !isMobile
              ? lang === 'fr'
                ? 'Retour au site public'
                : 'Back to public site'
              : undefined
          }
        >
          <Home size={18} className="flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="text-sm">
              {lang === 'fr' ? 'Retour au site public' : 'Back to public site'}
            </span>
          )}
          {collapsed && !isMobile && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {lang === 'fr' ? 'Retour au site public' : 'Back to public site'}
            </div>
          )}
        </Link>
        <button onClick={handleSignOut} className="sidebar-item group relative w-full text-left">
          <LogOut size={18} className="flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="text-sm">{lang === 'fr' ? 'Déconnexion' : 'Sign out'}</span>
          )}
        </button>
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150 mt-2 text-xs font-medium"
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>{lang === 'fr' ? 'Réduire' : 'Collapse'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-navy-dark border-r border-white/5 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div
          className={`flex items-center h-16 border-b border-white/5 px-3 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <AppLogo size={32} />
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-display text-white font-bold text-sm block leading-tight whitespace-nowrap">
                GL Capital
              </span>
              <span className="text-gold text-[9px] font-medium tracking-widest uppercase whitespace-nowrap">
                {lang === 'fr' ? 'Analyste' : 'Analyst'}
              </span>
            </div>
          )}
        </div>
        {sidebarContent(false)}
      </aside>
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64 bg-navy-dark border-r border-white/5 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-16 border-b border-white/5 px-4">
          <div className="flex items-center gap-3">
            <AppLogo size={28} />
            <span className="font-display text-white font-bold text-sm">GL Capital</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
        {sidebarContent(true)}
      </aside>
    </>
  );
}

export default function AnalystLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { lang, toggleLang } = useLanguage();

  return (
    <RoleGuard allowedRoles={['analyst', 'admin']}>
      <div className="min-h-screen bg-slate-50 flex">
        <Toaster richColors position="top-right" />
        <AnalystSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}
        >
          <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 sticky top-0 z-20">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-500 hover:text-navy p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span className="font-semibold text-navy text-sm">
                {lang === 'fr' ? 'Espace Analyste' : 'Analyst Portal'}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <TrendingUp size={11} /> {lang === 'fr' ? 'Analyste' : 'Analyst'}
              </span>
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
              >
                {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
              </button>
              <span className="text-sm text-slate-500 hidden md:block">{user?.email}</span>
            </div>
          </header>
          <main className="flex-1 px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 max-w-screen-2xl w-full mx-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
