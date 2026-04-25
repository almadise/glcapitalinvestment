'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackCTA } from '@/lib/analytics/trackEvent';

export default function ServicesStickyCTA() {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-card-hover p-2.5">
        <div className="flex items-center gap-2">
          <Link
            href="/dossier-submission-wizard"
            onClick={() => trackCTA('sticky_submit_dossier', '/dossier-submission-wizard', '/services-page')}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            {t('Soumettre un dossier', 'Submit dossier')}
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/contact"
            onClick={() => trackCTA('sticky_contact', '/contact', '/services-page')}
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('Parler à un conseiller', 'Talk to advisor')}
          </Link>
        </div>
      </div>
    </div>
  );
}
