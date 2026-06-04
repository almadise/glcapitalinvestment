'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Home, Mail, ServerCrash, RefreshCw } from 'lucide-react';
import { captureError } from '@/lib/logger';
import { OFFICIAL_PUBLIC_EMAIL } from '@/lib/companyContact';
import { useLanguage } from '@/context/LanguageContext';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ServerError({ error, reset }: ErrorProps) {
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    // Log 500 errors to Supabase error_logs table for real-time monitoring
    captureError(error, {
      digest: error?.digest,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      source: 'error-boundary',
    });
  }, [error]);

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
          {/* 500 visual */}
          <div className="relative mb-8">
            <div className="text-[120px] sm:text-[160px] font-bold text-navy/5 leading-none select-none">
              500
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center">
                <ServerCrash size={32} className="text-red-500" />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-700 text-xs font-semibold tracking-wide uppercase">{t('Erreur 500', 'Error 500')}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy mb-3">{t('Erreur serveur', 'Server Error')}</h1>
          <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-sm mx-auto">
            {t(
              "Une erreur interne s'est produite. Notre équipe technique a été notifiée et travaille à la résolution.",
              'An internal error occurred. Our technical team has been notified and is working on a resolution.'
            )}
          </p>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
            <p className="text-amber-800 text-xs leading-relaxed">
              {t(
                `Si le problème persiste, contactez notre équipe à ${OFFICIAL_PUBLIC_EMAIL} en mentionnant l'heure et l'action effectuée.`,
                `If the problem persists, contact our team at ${OFFICIAL_PUBLIC_EMAIL} mentioning the time and action performed.`
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
            >
              <RefreshCw size={15} />
              {t('Réessayer', 'Try Again')}
            </button>
            <Link
              href="/home-page"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Home size={15} />
              {t("Retour à l'accueil", 'Back to Home')}
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Mail size={15} />
              {t('Contacter le support', 'Contact Support')}
            </Link>
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
