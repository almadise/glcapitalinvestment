'use client';

import React from 'react';
import type { Bilingual } from '@/lib/content/glCapitalRedactionnel';
import { siteRegulatoryDisclaimer } from '@/lib/content/complianceDisclaimers';
import { useLanguage } from '@/context/LanguageContext';

type RegulatoryDisclaimerBarProps = {
  additionalNote?: Bilingual;
};

export default function RegulatoryDisclaimerBar({ additionalNote }: RegulatoryDisclaimerBarProps) {
  const { lang } = useLanguage();
  const base = lang === 'fr' ? siteRegulatoryDisclaimer.fr : siteRegulatoryDisclaimer.en;
  const extra = additionalNote ? (lang === 'fr' ? additionalNote.fr : additionalNote.en) : null;

  return (
    <section className="py-8 bg-slate-50 border-t border-slate-100">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
        <p className="text-xs text-slate-500 leading-relaxed max-w-4xl mx-auto text-center">
          {base}
          {extra ? ` ${extra}` : ''}
        </p>
      </div>
    </section>
  );
}
