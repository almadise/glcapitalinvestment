'use client';
import React, { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, User, Globe, UserCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useNotificationCount } from '@/hooks/useNotifications';
import Link from 'next/link';

type Props = {
  onOpenMobileSidebar: () => void;
};

export default function DashboardTopbar({ onOpenMobileSidebar }: Props) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { lang, toggleLang } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const unreadCount = useNotificationCount();

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    router.push('/sign-up-login-screen');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 xl:px-8 flex-shrink-0 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-52 lg:w-72">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={lang === 'fr' ? 'Rechercher un dossier…' : 'Search a file…'}
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono-data flex-shrink-0">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 text-slate-500 hover:text-navy transition-colors text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200"
          title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
        >
          <Globe size={13} />
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>

        {/* Client role badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold px-2.5 py-1 rounded-full">
          <UserCircle size={11} />
          Client
        </span>

        {/* Notifications - functional link */}
        <Link
          href="/client-dashboard/notifications"
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          title={lang === 'fr' ? 'Notifications' : 'Notifications'}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-navy leading-tight">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client'}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{user?.email || ''}</div>
            </div>
            <ChevronDown size={13} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-sm font-semibold text-navy">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client'}</div>
                <div className="text-xs text-slate-500">{user?.email || ''}</div>
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Client
                </span>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                {lang === 'fr' ? 'Mon profil' : 'My profile'}
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                {lang === 'fr' ? 'Sécurité & MFA' : 'Security & MFA'}
              </button>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  {lang === 'fr' ? 'Déconnexion' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}