'use client';
import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Home, ArrowLeft, Mail, Search } from 'lucide-react';
import { OFFICIAL_PUBLIC_EMAIL } from '@/lib/companyContact';
import { useLanguage } from '@/context/LanguageContext';

export default function NotFound() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo size={32} />
          <span className="font-display text-navy font-bold text-base">GL Capital</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setLang('fr')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
          >
            FR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
          >
            EN
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* 404 visual */}
          <div className="relative mb-8">
            <div className="text-[120px] sm:text-[160px] font-bold text-navy/5 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center">
                <Search size={32} className="text-gold" />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-700 text-xs font-semibold tracking-wide uppercase">{t('Erreur 404', 'Error 404')}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy mb-3">{t('Page introuvable', 'Page Not Found')}</h1>
          <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-sm mx-auto">
            {t(
              "La page que vous recherchez n'existe pas ou a été déplacée.",
              'The page you are looking for does not exist or has been moved.'
            )}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/home-page"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
            >
              <Home size={15} />
              {t("Retour à l'accueil", 'Back to Home')}
            </Link>
            <button
              onClick={() => typeof window !== 'undefined' && window.history?.back()}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={15} />
              {t('Page précédente', 'Go Back')}
            </button>
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Mail size={15} />
              {t('Contacter le support', 'Contact Support')}
            </Link>
          </div>

          {/* Useful links */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{t('Liens utiles', 'Useful links')}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { href: '/client-dashboard', label: t('Tableau de bord', 'Dashboard') },
                { href: '/faq', label: 'FAQ' },
                { href: '/contact', label: t('Contact', 'Contact') },
                { href: '/sign-up-login-screen', label: t('Connexion', 'Login') },
              ]?.map((link) => (
                <Link
                  key={link?.href}
                  href={link?.href}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-navy hover:text-white hover:border-navy transition-all"
                >
                  {link?.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 py-4 text-center">
        <p className="text-xs text-slate-400">
          © {new Date()?.getFullYear()} GL Capital Investment SA -{' '}
          <a href={`mailto:${OFFICIAL_PUBLIC_EMAIL}`} className="hover:text-navy transition-colors">{OFFICIAL_PUBLIC_EMAIL}</a>
        </p>
      </footer>
    </div>
  );
}