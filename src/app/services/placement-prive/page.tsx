'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Landmark, Layers, Shield } from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceHero, ServiceDetailSections } from '@/components/services/ServiceDetailSections';
import { privatePlacementContent } from '@/lib/content/glCapitalRedactionnel';
import { pppRegulatoryNote } from '@/lib/content/complianceDisclaimers';
import RegulatoryDisclaimerBar from '@/components/services/RegulatoryDisclaimerBar';
import { useLanguage } from '@/context/LanguageContext';

const relatedLinks = [
  {
    href: '/services-page',
    icon: Layers,
    titleFr: 'Opportunités périodiques',
    titleEn: 'Periodic opportunities',
    descFr:
      'Small Cap à partir de 100 K ; Large Cap cash 100 M à 5 Md ; instruments 125 M à 5 Md USD/EUR.',
    descEn:
      'Small Cap from 100K; Large Cap cash 100M to 5B; instruments 125M to 5B USD/EUR.',
  },
  {
    href: '/services/instruments-bancaires',
    icon: Shield,
    titleFr: 'Instruments bancaires',
    titleEn: 'Banking instruments',
    descFr: 'SBLC, BG, MT-760, MT-799 : documentation et instruments éligibles aux PPP.',
    descEn: 'SBLC, BG, MT-760, MT-799: documentation and instruments eligible for PPP.',
  },
  {
    href: '/contact',
    icon: Landmark,
    titleFr: 'Préqualification',
    titleEn: 'Pre-qualification',
    descFr: 'CIS, preuve de fonds et résumé exécutif pour lancer l\'étude de recevabilité.',
    descEn: 'CIS, proof of funds, and executive summary to start eligibility review.',
  },
] as const;

export default function PlacementPrivePage() {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{
          fr: 'Programmes de',
          en: 'Private',
        }}
        titleAccent={{
          fr: 'placement privé',
          en: 'Placement Programs',
        }}
        subtitle={privatePlacementContent.heroSubtitle}
        backgroundImage="/assets/images/services-hero-bg.png"
      />

      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy mb-5">
            {t('Pages associées', 'Related pages')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-gold/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center">
                  <link.icon size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-navy text-sm mb-1">
                    {lang === 'fr' ? link.titleFr : link.titleEn}
                  </p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {lang === 'fr' ? link.descFr : link.descEn}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-gold text-xs font-semibold mt-auto">
                  {t('Voir', 'View')}
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ServiceDetailSections
        sections={privatePlacementContent.sections}
        ctaLabel={{
          fr: 'Demander une préqualification',
          en: 'Request pre-qualification',
        }}
      />
      <RegulatoryDisclaimerBar additionalNote={pppRegulatoryNote} />
      <PublicFooter />
    </div>
  );
}
