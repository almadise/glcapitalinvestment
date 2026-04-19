'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PublicFooter() {
  const { t } = useLanguage();

  const platformLinks = [
    { labelFr: 'Accueil', labelEn: 'Home', href: '/home-page' },
    { labelFr: 'Qui sommes-nous', labelEn: 'About Us', href: '/qui-sommes-nous' },
    { labelFr: 'Services', labelEn: 'Services', href: '/services' },
    { labelFr: 'Financement de Projet', labelEn: 'Project Financing', href: '/services/financement-projet' },
    { labelFr: 'Instruments Bancaires', labelEn: 'Banking Instruments', href: '/services/instruments-bancaires' },
    { labelFr: 'Conseil & Structuration', labelEn: 'Advisory & Structuring', href: '/services-page#advisory' },
    { labelFr: 'Contact', labelEn: 'Contact', href: '/contact' },
    { labelFr: 'FAQ', labelEn: 'FAQ', href: '/faq' },
    { labelFr: 'Portail Client', labelEn: 'Client Portal', href: '/client-portal-dashboard' },
  ];

  const legalLinks = [
    { labelFr: 'Mentions Légales', labelEn: 'Legal Notice', href: '/mentions-legales' },
    { labelFr: 'Cookies & Confidentialité', labelEn: 'Cookies & Privacy', href: '/cookies' },
    { labelFr: 'FAQ', labelEn: 'FAQ', href: '/faq' },
  ];

  return (
    <footer className="bg-navy-950 border-t border-navy-700/50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 46 }}>
                <img
                  alt="GL Capital Investment SA — Logo"
                  width={36}
                  height={46}
                  className="object-contain w-full h-full"
                  src="/assets/images/logo-1776271225960.png"
                />
              </div>
              <div>
                <p className="text-white font-bold">GL Capital Investment SA</p>
                <p className="text-white/50 text-xs font-mono">{t('Conseil en Financement Institutionnel', 'Institutional Financing Advisory')}</p>
              </div>
            </div>
            <p className="text-white/55 text-sm leading-relaxed mb-4 max-w-sm">
              {t(
                'GL Capital fournit des services de structuration et de documentation pour accompagner les demandes de financement. Toute transaction financière est exécutée exclusivement par des institutions financières dûment agréées.',
                'GL Capital provides structuring and documentation services to support financing applications. Any financial transaction is executed exclusively by duly licensed financial institutions.'
              )}
            </p>
            <div className="text-white/40 text-xs font-mono space-y-1">
              <p>General Luxury SA — 9 Rue Bonnet, 95400 ARNOUVILLE, France</p>
              <p>almadise84@yahoo.fr · +33 984 046951</p>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">{t('Plateforme', 'Platform')}</p>
            <ul className="space-y-2">
              {platformLinks?.map((link) => (
                <li key={link?.href}>
                  <Link href={link?.href} className="text-white/55 hover:text-white/85 text-sm transition-colors">
                    {t(link?.labelFr, link?.labelEn)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">{t('Légal & Conformité', 'Legal & Compliance')}</p>
            <ul className="space-y-2">
              {legalLinks?.map((link) => (
                <li key={link?.href}>
                  <Link href={link?.href} className="text-white/55 hover:text-white/85 text-sm transition-colors">
                    {t(link?.labelFr, link?.labelEn)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-3 bg-navy-800/60 rounded-lg border border-navy-600/40">
              <p className="text-[10px] text-white/45 leading-relaxed">
                {t(
                  "GL Capital n'est pas une banque et ne détient aucune licence bancaire ou d'investissement. Toute transaction est exécutée par des institutions agréées.",
                  "GL Capital is not a bank and holds no banking or investment license. All transactions are executed by licensed institutions."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-navy-700/50 pt-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs text-center lg:text-left">
            {t(
              '© 2026 General Luxury SA. Tous droits réservés. GL Capital ne détient pas de licence bancaire ou d\'investissement. Toutes les transactions sont exécutées par des institutions financières dûment agréées.',
              '© 2026 General Luxury SA. All rights reserved. GL Capital holds no banking or investment license. All transactions are executed by duly licensed financial institutions.'
            )}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/30 font-mono">TLS 1.3</span>
            <span className="text-[10px] text-white/30 font-mono">·</span>
            <span className="text-[10px] text-white/30 font-mono">RGPD</span>
            <span className="text-[10px] text-white/30 font-mono">·</span>
            <span className="text-[10px] text-white/30 font-mono">NCNDA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}