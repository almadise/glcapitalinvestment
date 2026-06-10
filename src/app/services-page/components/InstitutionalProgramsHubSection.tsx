'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Banknote, Layers } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function InstitutionalProgramsHubSection() {
  const { t } = useLanguage();

  const programs = [
    {
      href: '/services/placement-prive',
      icon: Layers,
      titleFr: 'Placement privé (PPP)',
      titleEn: 'Private placement (PPP)',
      badgeFr: '100 M USD/EUR+',
      badgeEn: 'USD/EUR 100M+',
      descFr:
        'Cash hold, blocage MT-799, MT-760, MT-542, Euroclear. Tickets institutionnels, fonds libres et non bloqués.',
      descEn:
        'Cash hold, MT-799 block, MT-760, MT-542, Euroclear. Institutional tickets, unrestricted unblocked funds.',
    },
    {
      href: '/services/prets',
      icon: Banknote,
      titleFr: 'Prêts commerciaux',
      titleEn: 'Commercial loans',
      badgeFr: '5 à 5,5 Md USD',
      badgeEn: 'USD 5M to 5.5B',
      descFr:
        'Prêt direct, résumé exécutif obligatoire, caution d\'assurance. Prêteurs USA, Vietnam et Dubaï.',
      descEn:
        'Direct loan, executive summary required, insurance surety bond. US, Vietnam, and Dubai lenders.',
    },
  ] as const;

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-100" id="institutional-programs">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-mono tracking-widest uppercase mb-3 text-gold">
            {t('Programmes institutionnels', 'Institutional programmes')}
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-navy">
            {t('Placement privé et prêts commerciaux', 'Private placement and commercial loans')}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            {t(
              "En complément du financement de projet en euros et des instruments bancaires, GL Capital traite des dossiers PPP et des demandes de prêt commercial selon des procédures distinctes.",
              'Alongside euro project finance and banking instruments, GL Capital handles PPP files and commercial loan requests under separate procedures.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {programs.map((program) => (
            <Link
              key={program.href}
              href={program.href}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 hover:border-gold/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-11 h-11 rounded-lg bg-navy/5 flex items-center justify-center">
                  <program.icon size={20} className="text-gold" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full text-gold border border-gold/20 bg-gold/5">
                  {t(program.badgeFr, program.badgeEn)}
                </span>
              </div>
              <h3 className="font-semibold text-navy mb-2">
                {t(program.titleFr, program.titleEn)}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                {t(program.descFr, program.descEn)}
              </p>
              <span className="inline-flex items-center gap-1 text-gold text-xs font-semibold">
                {t('Voir la procédure', 'View procedure')}
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>

        <div
          className="rounded-xl p-5 max-w-3xl"
          style={{ background: '#FFFFFF', border: '1px solid #E8EDF5' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-navy">
            {t('Instruments éligibles (PPP)', 'Eligible instruments (PPP)')}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            {t(
              'Cash, certificats de dépôt, SBLC, garanties bancaires et MTN, lorsqu\'ils sont intégralement adossés à des fonds réels. Les instruments loués ne sont pas acceptés.',
              'Cash, certificates of deposit, SBLC, bank guarantees, and MTN, when fully backed by real funds. Leased instruments are not accepted.'
            )}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t(
              'Le détail des schémas MT-760 et MT-542 est sur la page',
              'MT-760 and MT-542 structures are detailed on the'
            )}{' '}
            <Link href="/services/placement-prive" className="text-gold font-semibold hover:underline">
              {t('Placement privé', 'Private Placement')}
            </Link>
            .{' '}
            {t(
              'Le programme projet en euros (2 M€ à 4 Md€) est sur',
              'The euro project programme (EUR 2M to 4B) is on'
            )}{' '}
            <Link
              href="/services/financement-projet"
              className="text-gold font-semibold hover:underline"
            >
              {t('Financement de projet', 'Project Finance')}
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
