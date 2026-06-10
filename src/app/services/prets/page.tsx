'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Landmark, Shield } from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceHero, ServiceDetailSections } from '@/components/services/ServiceDetailSections';
import { loansContent } from '@/lib/content/glCapitalRedactionnel';
import { loanRegulatoryNote } from '@/lib/content/complianceDisclaimers';
import RegulatoryDisclaimerBar from '@/components/services/RegulatoryDisclaimerBar';
import { useLanguage } from '@/context/LanguageContext';

const relatedLinks = [
  {
    href: '/services/financement-projet',
    icon: FileText,
    titleFr: 'Financement de projet',
    titleEn: 'Project finance',
    descFr:
      "Structuration du dossier, critères d'éligibilité (2 M€ à 4 Md€) et mise en relation institutionnelle.",
    descEn:
      'Dossier structuring, eligibility criteria (EUR 2M to EUR 4B), and institutional introduction.',
  },
  {
    href: '/services/instruments-bancaires',
    icon: Shield,
    titleFr: 'Instruments bancaires',
    titleEn: 'Banking instruments',
    descFr: 'SBLC, garanties bancaires et prêt sans recours adossé à un instrument.',
    descEn: 'SBLC, bank guarantees, and non-recourse loans secured by an instrument.',
  },
  {
    href: '/contact',
    icon: Landmark,
    titleFr: 'Soumettre un dossier',
    titleEn: 'Submit a file',
    descFr: 'Contactez-nous avec votre résumé exécutif pour lancer la procédure.',
    descEn: 'Contact us with your executive summary to start the procedure.',
  },
] as const;

export default function PretsPage() {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{ fr: 'Prêts', en: 'Loans' }}
        subtitle={loansContent.heroSubtitle}
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
        sections={loansContent.sections}
        ctaLabel={{
          fr: 'Soumettre un dossier de prêt',
          en: 'Submit a loan file',
        }}
      />
      <RegulatoryDisclaimerBar additionalNote={loanRegulatoryNote} />
      <PublicFooter />
    </div>
  );
}
