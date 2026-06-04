'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Bilingual, ContentSection } from '@/lib/content/glCapitalRedactionnel';
import { ServiceHeroBackground } from '@/components/services/ServiceHeroBackground';
import { useLanguage } from '@/context/LanguageContext';

function pick(lang: 'fr' | 'en', item: Bilingual) {
  return lang === 'fr' ? item.fr : item.en;
}

type ServiceDetailSectionsProps = {
  sections: ContentSection[];
  ctaHref?: string;
  ctaLabel?: Bilingual;
  showBottomCta?: boolean;
};

export function ServiceDetailSections({
  sections,
  ctaHref = '/contact',
  ctaLabel = {
    fr: 'Nous contacter',
    en: 'Contact us',
  },
  showBottomCta = true,
}: ServiceDetailSectionsProps) {
  const { lang } = useLanguage();

  return (
    <>
      {sections.map((section, index) => (
        <section
          key={section.id}
          className={`py-16 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-navy mb-6">
              {pick(lang, section.title)}
            </h2>
            {section.paragraphs?.map((p, i) => (
              <p
                key={`${section.id}-p-${i}`}
                className="text-slate-600 text-base leading-relaxed mb-4 max-w-4xl"
              >
                {pick(lang, p)}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
                {section.bullets.map((b, i) => (
                  <li
                    key={`${section.id}-b-${i}`}
                    className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed"
                  >
                    <span className="text-gold mt-1 flex-shrink-0">•</span>
                    <span>{pick(lang, b)}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.note && (
              <p className="text-slate-500 text-sm mt-6 max-w-4xl border-l-2 border-gold/40 pl-4">
                {pick(lang, section.note)}
              </p>
            )}
          </div>
        </section>
      ))}

      {showBottomCta && (
        <section className="py-16 bg-white">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 text-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-lg shadow-gold/20"
            >
              {pick(lang, ctaLabel)}
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

type ServiceHeroProps = {
  titleLines: Bilingual;
  titleAccent?: Bilingual;
  subtitle: Bilingual;
  secondarySubtitle?: Bilingual;
  backgroundImage?: string;
};

export function ServiceHero({
  titleLines,
  titleAccent,
  subtitle,
  secondarySubtitle,
  backgroundImage = '/assets/images/financial-hero-v2.png',
}: ServiceHeroProps) {
  const { lang } = useLanguage();

  return (
    <section className="pt-28 pb-16 relative overflow-hidden">
      <ServiceHeroBackground backgroundImage={backgroundImage} />
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 relative z-10">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-gold text-xs font-semibold tracking-widest uppercase">
            {lang === 'fr' ? 'Services' : 'Services'}
          </span>
        </div>
        <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
          {pick(lang, titleLines)}
          {titleAccent && (
            <>
              <br />
              <span className="text-gradient-gold">{pick(lang, titleAccent)}</span>
            </>
          )}
        </h1>
        <p className="text-slate-300 text-lg lg:text-xl leading-relaxed max-w-3xl border-l-2 border-gold/40 pl-5">
          {pick(lang, subtitle)}
        </p>
        {secondarySubtitle && (
          <p className="text-slate-400 text-sm mt-4 max-w-3xl">
            {pick(lang, secondarySubtitle)}
          </p>
        )}
      </div>
    </section>
  );
}
