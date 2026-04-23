'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard, FolderOpen, Users, Shield, Settings, LogOut, ChevronLeft, ChevronRight, Bell, AlertTriangle, BookOpen, Network, ClipboardList, Home, MessageSquare, BarChart3, Mail,
} from 'lucide-react';

const adminNavItems = [
  { href: '/back-office-admin-panel', icon: LayoutDashboard, labelFr: 'Tableau de bord', labelEn: 'Dashboard', badge: null, roles: ['admin', 'analyst', 'compliance', 'gestionnaire_contenu'] },
  { href: '/back-office-admin-panel#dossiers', icon: FolderOpen, labelFr: 'Dossiers', labelEn: 'Files', badge: '14', roles: ['admin', 'analyst', 'compliance'] },
  { href: '/back-office-admin-panel#compliance', icon: Shield, labelFr: 'Conformité', labelEn: 'Compliance', badge: '5', roles: ['admin', 'compliance'] },
  { href: '/back-office-admin-panel#partners', icon: Network, labelFr: 'Partenaires', labelEn: 'Partners', badge: null, roles: ['admin', 'compliance'] },
  { href: '/back-office-admin-panel/users', icon: Users, labelFr: 'Utilisateurs', labelEn: 'Users', badge: null, roles: ['admin'] },
  { href: '/back-office-admin-panel#content', icon: BookOpen, labelFr: 'Contenu', labelEn: 'Content', badge: null, roles: ['admin', 'gestionnaire_contenu'] },
  { href: '/back-office-admin-panel#notes', icon: MessageSquare, labelFr: 'Notes internes', labelEn: 'Internal Notes', badge: null, roles: ['admin', 'analyst', 'compliance'] },
  { href: '/back-office-admin-panel/audit-logs', icon: ClipboardList, labelFr: 'Journal d\'audit', labelEn: 'Audit Log', badge: null, roles: ['admin', 'compliance'] },
  { href: '/back-office-admin-panel/metrics', icon: BarChart3, labelFr: 'Métriques', labelEn: 'Metrics', badge: null, roles: ['admin'] },
  { href: '/back-office-admin-panel/email-preview', icon: Mail, labelFr: 'Aperçu emails & Supabase', labelEn: 'Email preview & Supabase', badge: null, roles: ['admin'] },
  { href: '/notifications', icon: Bell, labelFr: 'Notifications', labelEn: 'Notifications', badge: null, roles: ['admin', 'analyst', 'compliance', 'gestionnaire_contenu'] },
  { href: '/back-office-admin-panel#settings', icon: Settings, labelFr: 'Paramètres', labelEn: 'Settings', badge: null, roles: ['admin'] },
];

interface BackOfficeLayoutProps {
  children: React.ReactNode;
  role?: 'admin' | 'analyst' | 'compliance' | 'gestionnaire_contenu';
  userName?: string;
}

export default function BackOfficeLayout({
  children,
  role = 'admin',
  userName = 'Sophie Mercier',
}: BackOfficeLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { lang } = useLanguage();

  const filteredNav = adminNavItems.filter((item) => item.roles.includes(role));

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400',
    compliance: 'bg-purple-500/20 text-purple-400',
    analyst: 'bg-blue-500/20 text-blue-400',
    gestionnaire_contenu: 'bg-green-500/20 text-green-400',
  };

  const roleLabels: Record<string, { fr: string; en: string }> = {
    admin: { fr: 'Administrateur', en: 'Administrator' },
    compliance: { fr: 'Responsable Conformité', en: 'Compliance Officer' },
    analyst: { fr: 'Analyste', en: 'Analyst' },
    gestionnaire_contenu: { fr: 'Gestionnaire Contenu', en: 'Content Manager' },
  };

  const roleLabel = lang === 'fr' ? (roleLabels[role]?.fr ?? role) : (roleLabels[role]?.en ?? role);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-navy-950 border-r border-navy-800 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-navy-800 ${collapsed ? 'justify-center' : ''}`}>
          <AppLogo size={32} />
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-none">GL Capital</p>
              <p className="text-gold-500 text-[9px] font-mono tracking-widest uppercase mt-0.5">
                Back Office
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-navy-800">
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${roleColors[role]}`}>
              {roleLabel}
            </span>
          </div>
        )}

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/back-office-admin-panel' && pathname.startsWith(`${item.href}/`));
            const label = lang === 'fr' ? item.labelFr : item.labelEn;
            return (
              <Link
                key={`bo-nav-${item.labelFr}`}
                href={item.href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative ${
                  isActive
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20' :'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30 px-1.5 py-0.5 rounded-full tabular-nums">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-gold-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-navy-800 p-3 space-y-2">
          {/* Return to public site */}
          <Link
            href="/home-page"
            title={collapsed ? (lang === 'fr' ? 'Retour au site public' : 'Back to public site') : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Home size={15} />
            {!collapsed && <span>{lang === 'fr' ? 'Retour au site public' : 'Back to public site'}</span>}
          </Link>

          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-navy-900">
              <div className="w-7 h-7 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-gold-400 text-[10px] font-bold">
                  {userName.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{userName}</p>
                <p className="text-white/40 text-[10px] truncate">{roleLabel}</p>
              </div>
            </div>
          )}
          <Link
            href="/sign-up-login-screen"
            className={`flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={15} />
            {!collapsed && <span>{lang === 'fr' ? 'Déconnexion' : 'Sign Out'}</span>}
          </Link>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-navy-800 border border-navy-700 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home-page" className="text-xs text-gray-400 hover:text-gray-600 font-mono transition-colors flex items-center gap-1">
              <Home size={12} />
              {lang === 'fr' ? '← Site public' : '← Public Site'}
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-xs text-gray-500">Back Office</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-navy-900 transition-colors rounded-lg hover:bg-gray-100">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button className="relative p-2 text-gray-500 hover:text-navy-900 transition-colors rounded-lg hover:bg-gray-100">
              <AlertTriangle size={17} />
              <span className="absolute -top-0.5 -right-0.5 text-[9px] bg-amber-500 text-white font-bold px-1 rounded-full">3</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {userName.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}