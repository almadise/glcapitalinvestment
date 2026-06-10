'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { useLanguage } from '@/context/LanguageContext';
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  MessageSquare,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  FileText,
  Home,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userOrg?: string;
}

export default function PortalLayout({
  children,
  userName = 'Amadou Diallo',
  userOrg = 'West Africa Energy Holdings',
}: PortalLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { lang } = useLanguage();

  const portalNavItems = [
    {
      href: '/client-portal-dashboard',
      icon: LayoutDashboard,
      labelFr: 'Tableau de bord',
      labelEn: 'Dashboard',
      badge: null,
    },
    {
      href: '/client-portal-dashboard#dossiers',
      icon: FolderOpen,
      labelFr: 'Mes dossiers',
      labelEn: 'My Dossiers',
      badge: '3',
    },
    {
      href: '/dossier-submission-wizard',
      icon: Upload,
      labelFr: 'Soumettre un dossier',
      labelEn: 'Submit Dossier',
      badge: null,
    },
    {
      href: '/client-portal-dashboard#messages',
      icon: MessageSquare,
      labelFr: 'Messages',
      labelEn: 'Messages',
      badge: '2',
    },
    {
      href: '/client-portal-dashboard#documents',
      icon: FileText,
      labelFr: 'Documents',
      labelEn: 'Documents',
      badge: null,
    },
    {
      href: '/client-portal-dashboard#compliance',
      icon: Shield,
      labelFr: 'Conformité',
      labelEn: 'Compliance',
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-navy-900 border-r border-navy-700 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-navy-700 ${collapsed ? 'justify-center' : ''}`}
        >
          <AppLogo size={32} />
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-none">GL Capital</p>
              <p className="text-gold-500 text-[9px] font-mono tracking-widest uppercase mt-0.5">
                {lang === 'fr' ? 'Portail Client' : 'Client Portal'}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {portalNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const label = lang === 'fr' ? item.labelFr : item.labelEn;
            return (
              <Link
                key={`portal-nav-${item.labelFr}`}
                href={item.href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-bold bg-gold-500 text-navy-900 px-1.5 py-0.5 rounded-full tabular-nums">
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

        {/* User info */}
        <div className={`border-t border-navy-700 p-3 space-y-2`}>
          {/* Return to public site */}
          <Link
            href="/home-page"
            title={
              collapsed
                ? lang === 'fr'
                  ? 'Retour au site public'
                  : 'Back to public site'
                : undefined
            }
            className={`flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white/80 rounded-lg hover:bg-white/5 transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Home size={16} />
            {!collapsed && (
              <span>{lang === 'fr' ? 'Retour au site public' : 'Back to public site'}</span>
            )}
          </Link>

          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-navy-800">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-gold-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{userName}</p>
                <p className="text-white/40 text-[10px] truncate">{userOrg}</p>
              </div>
            </div>
          )}
          <Link
            href="/sign-up-login-screen"
            className={`flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white/80 rounded-lg hover:bg-white/5 transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={16} />
            {!collapsed && <span>{lang === 'fr' ? 'Déconnexion' : 'Sign Out'}</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-navy-700 border border-navy-600 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
          aria-label={
            collapsed
              ? lang === 'fr'
                ? 'Développer'
                : 'Expand'
              : lang === 'fr'
                ? 'Réduire'
                : 'Collapse'
          }
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/home-page"
              className="text-xs text-gray-400 hover:text-gray-600 font-mono transition-colors flex items-center gap-1"
            >
              <Home size={12} />
              {lang === 'fr' ? '← Site public' : '← Public Site'}
            </Link>
            <span className="text-gray-200">|</span>
            <p className="text-xs text-gray-500 font-mono">
              {lang === 'fr' ? 'Portail Client' : 'Client Portal'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-navy-900 transition-colors rounded-lg hover:bg-gray-100">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold-500 rounded-full" />
            </button>
            <Link href="/sign-up-login-screen">
              <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center cursor-pointer hover:bg-navy-700 transition-colors">
                <User size={14} className="text-white" />
              </div>
            </Link>
          </div>
        </header>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
