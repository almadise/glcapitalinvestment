'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  Bot,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  GitBranch,
  HelpCircle,
  FilePlus,
  Download,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationCount } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';


type Props = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

export default function DashboardSidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }: Props) {
  const { lang, t } = useLanguage();
  const { signOut, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const unreadNotifications = useNotificationCount();
  const supabase = createClient();

  const [aCompleterCount, setACompleterCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      // Count dossiers needing completion
      const { count: ac } = await supabase
        .from('case_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'A_COMPLETER');
      setACompleterCount(ac || 0);

      // Count pending documents (dossier_documents not yet scanned)
      const { count: dc } = await supabase
        .from('dossier_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('scan_passed', false);
      setDocumentCount(dc || 0);
    };
    fetchCounts();

    const channel = supabase
      .channel('sidebar_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_files', filter: `user_id=eq.${user.id}` }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dossier_documents', filter: `user_id=eq.${user.id}` }, fetchCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/sign-up-login-screen');
    } catch {
      router.push('/sign-up-login-screen');
    }
  };

  const navItems = [
    { id: 'nav-dashboard', icon: LayoutDashboard, label: lang === 'fr' ? 'Tableau de bord' : 'Dashboard', badge: undefined as string | undefined, href: '/client-dashboard' },
    { id: 'nav-dossiers', icon: FolderOpen, label: lang === 'fr' ? 'Mes dossiers' : 'My files', badge: aCompleterCount > 0 ? String(aCompleterCount) : undefined, href: '/client-dashboard/case-files' },
    { id: 'nav-new-case', icon: FilePlus, label: lang === 'fr' ? 'Nouveau dossier' : 'New case file', badge: undefined as string | undefined, href: '/client-dashboard/new-case-file' },
    { id: 'nav-timeline', icon: GitBranch, label: lang === 'fr' ? 'Suivi dossier' : 'File status', badge: undefined as string | undefined, href: '/client-dashboard/dossier-timeline' },
    { id: 'nav-documents', icon: FileText, label: lang === 'fr' ? 'Documents' : 'Documents', badge: documentCount > 0 ? String(documentCount) : undefined, href: '/client-dashboard/documents' },
    { id: 'nav-downloads', icon: Download, label: lang === 'fr' ? 'Téléchargements' : 'Downloads', badge: undefined as string | undefined, href: '/client-dashboard/downloads' },
    { id: 'nav-messages', icon: MessageSquare, label: lang === 'fr' ? 'Messages' : 'Messages', badge: undefined as string | undefined, href: '/client-dashboard/messages' },
    { id: 'nav-ai-assistant', icon: Bot, label: lang === 'fr' ? 'Assistant IA' : 'AI Assistant', badge: undefined as string | undefined, href: '/client-dashboard/ai-assistant' },
    { id: 'nav-notifications', icon: Bell, label: lang === 'fr' ? 'Notifications' : 'Notifications', badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined, href: '/client-dashboard/notifications' },
    { id: 'nav-support', icon: HelpCircle, label: lang === 'fr' ? 'Centre d\'aide' : 'Help Center', badge: undefined as string | undefined, href: '/client-dashboard/support' },
  ];

  const renderNavItem = (item: typeof navItems[0], isMobile = false) => {
    const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
    const content = (
      <>
        <item.icon size={18} className="flex-shrink-0" />
        {(!collapsed || isMobile) && (
          <>
            <span className="flex-1 text-sm">{item.label}</span>
            {item.badge && (
              <span className="bg-gold text-navy text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && !isMobile && item.badge && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-gold rounded-full" />
        )}
        {collapsed && !isMobile && (
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg border border-white/10">
            {item.label}
            {item.badge && <span className="ml-1.5 bg-gold text-navy text-[10px] font-bold px-1 rounded">{item.badge}</span>}
          </div>
        )}
      </>
    );

    if (item.href) {
      return (
        <Link
          key={isMobile ? `mobile-item-${item.id}` : item.id}
          href={item.href}
          onClick={isMobile ? onCloseMobile : undefined}
          className={`relative group ${isActive ? 'sidebar-item-active' : 'sidebar-item'}`}
          title={collapsed && !isMobile ? item.label : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        key={isMobile ? `mobile-item-${item.id}` : item.id}
        onClick={isMobile ? onCloseMobile : undefined}
        className={`relative group sidebar-item cursor-default`}
        title={collapsed && !isMobile ? item.label : undefined}
      >
        {content}
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-navy-dark border-r border-white/5 transition-all duration-300 scrollbar-thin ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-white/5 px-3 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <AppLogo size={32} />
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-display text-white font-bold text-sm block leading-tight whitespace-nowrap">GL Capital</span>
              <span className="text-gold text-[9px] font-medium tracking-widest uppercase whitespace-nowrap">Client Portal</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
          {!collapsed && <p className="section-label mb-1.5">{lang === 'fr' ? 'Mon espace' : 'My Space'}</p>}
          <div className="space-y-0.5">
            {navItems.map((item) => renderNavItem(item))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-2 space-y-0.5 flex-shrink-0">
          <Link
            href="/home-page"
            className="sidebar-item group relative"
            title={collapsed ? (lang === 'fr' ? 'Retour au site' : 'Back to website') : undefined}
          >
            <Home size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">{lang === 'fr' ? 'Retour au site' : 'Back to website'}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {lang === 'fr' ? 'Retour au site' : 'Back to website'}
              </div>
            )}
          </Link>

          <div className="sidebar-item group relative cursor-default" title={collapsed ? (lang === 'fr' ? 'Paramètres' : 'Settings') : undefined}>
            <Settings size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">{lang === 'fr' ? 'Paramètres' : 'Settings'}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {lang === 'fr' ? 'Paramètres' : 'Settings'}
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="sidebar-item group relative w-full text-left"
            title={collapsed ? (lang === 'fr' ? 'Déconnexion' : 'Sign out') : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm">{lang === 'fr' ? 'Déconnexion' : 'Sign out'}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {lang === 'fr' ? 'Déconnexion' : 'Sign out'}
              </div>
            )}
          </button>

          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150 mt-2 text-xs font-medium"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>{lang === 'fr' ? 'Réduire' : 'Collapse'}</span></>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64 bg-navy-dark border-r border-white/5 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 border-b border-white/5 px-4">
          <div className="flex items-center gap-3">
            <AppLogo size={28} />
            <span className="font-display text-white font-bold text-sm">GL Capital</span>
          </div>
          <button onClick={onCloseMobile} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
          <div>
            <p className="section-label mb-1.5">{lang === 'fr' ? 'Mon espace' : 'My Space'}</p>
            <div className="space-y-0.5">
              {navItems.map((item) => renderNavItem(item, true))}
            </div>
          </div>
        </nav>
        <div className="border-t border-white/5 p-2 space-y-0.5">
          <Link href="/home-page" onClick={onCloseMobile} className="sidebar-item">
            <Home size={18} />
            <span className="flex-1 text-sm">{lang === 'fr' ? 'Retour au site' : 'Back to website'}</span>
          </Link>
          <button onClick={handleSignOut} className="sidebar-item w-full text-left">
            <LogOut size={18} />
            <span className="flex-1 text-sm">{lang === 'fr' ? 'Déconnexion' : 'Sign out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}