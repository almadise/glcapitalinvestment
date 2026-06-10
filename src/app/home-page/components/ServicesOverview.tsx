'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ServicesOverview() {
  const { t } = useLanguage();

  return (
    <section className="py-20" style={{ background: '#F7F8FA' }}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 text-center">
        <p
          className="text-xs font-mono tracking-widest uppercase mb-4"
          style={{ color: '#4A5C7A' }}
        >
          {t('Services', 'Services')}
        </p>
        <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#1E2D4A' }}>
          {t('Solutions de financement ', 'Institutional ')}
          <span className="text-gradient-gold">
            {t('institutionnel', 'funding solutions')}
          </span>
        </h2>
        <p className="max-w-xl mx-auto mb-6 text-sm leading-relaxed" style={{ color: '#4A5C7A' }}>
          {t(
            'GL Capital structure vos dossiers pour soumission aux institutions agréées : projet en euros, prêts USD, instruments bancaires et programmes PPP.',
            'GL Capital structures your files for submission to licensed institutions: euro projects, USD loans, banking instruments, and PPP programmes.'
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Link
            href="/services/financement-projet"
            className="text-xs font-medium px-4 py-2 rounded-full transition-colors"
            style={{ color: '#1E2D4A', border: '1px solid #D8E0EC', background: '#FFFFFF' }}
          >
            {t('Financement projet', 'Project finance')}
          </Link>
          <Link
            href="/services/prets"
            className="text-xs font-medium px-4 py-2 rounded-full transition-colors"
            style={{ color: '#1E2D4A', border: '1px solid #D8E0EC', background: '#FFFFFF' }}
          >
            {t('Prêts', 'Loans')}
          </Link>
          <Link
            href="/services/placement-prive"
            className="text-xs font-medium px-4 py-2 rounded-full transition-colors"
            style={{ color: '#1E2D4A', border: '1px solid #D8E0EC', background: '#FFFFFF' }}
          >
            {t('Placement privé', 'Private placement')}
          </Link>
        </div>
        <Link
          href="/services-page"
          className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm"
          style={{ background: '#B8912A', color: '#FFFFFF' }}
        >
          {t('Voir tous les services', 'View all services')}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </section>
  );
}
