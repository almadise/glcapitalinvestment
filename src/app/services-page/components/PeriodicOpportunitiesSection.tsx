'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function PeriodicOpportunitiesSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-3"
            style={{ color: '#B8912A' }}
          >
            {t('Accès périodique', 'Periodic access')}
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#1E2D4A' }}>
            {t('Opportunités périodiques (Small Cap)', 'Periodic opportunities (Small Cap)')}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {t(
              'Certaines plateformes partenaires ouvrent ponctuellement des fenêtres de placement de taille réduite. Ces fenêtres ne sont pas permanentes, sont limitées dans le temps et peuvent se fermer sans préavis.',
              'Some partner platforms may occasionally open small-size placement windows. These windows are not permanent, are time-limited, and may close without prior notice.'
            )}
          </p>
          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            {t(
              'GL Capital ne publie pas ces fenêtres comme une offre publique continue. Chaque demande est traitée au cas par cas après pré-qualification.',
              'GL Capital does not publish these windows as a continuous public offer. Each request is handled case by case after pre-qualification.'
            )}
          </p>

          <div
            className="rounded-xl p-5"
            style={{ background: '#F7F8FA', border: '1px solid #E8EDF5' }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: '#1E2D4A' }}
            >
              {t('Pré-qualification minimale', 'Minimum pre-qualification')}
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                {t(
                  '• CIS (Client Information Sheet) signé',
                  '• Signed CIS (Client Information Sheet)'
                )}
              </li>
              <li>
                {t(
                  '• Preuve de fonds récente et vérifiable',
                  '• Recent and verifiable proof of funds'
                )}
              </li>
              <li>
                {t(
                  '• Résumé exécutif du projet ou objectif d’investissement',
                  '• Executive summary of the project or investment objective'
                )}
              </li>
            </ul>
          </div>

          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            {t(
              'Important : aucune disponibilité continue ni rendement n’est garanti. Le traitement dépend de la conformité, de l’éligibilité et des conditions de plateforme au moment de la soumission.',
              'Important: no continuous availability or return is guaranteed. Processing depends on compliance, eligibility, and platform conditions at submission time.'
            )}
          </p>

          <div
            className="rounded-xl p-5 mt-5"
            style={{ background: '#F7F8FA', border: '1px solid #E8EDF5' }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: '#1E2D4A' }}
            >
              {t('Politique de tickets institutionnels', 'Institutional ticketing policy')}
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                {t(
                  '• Small Cap : à partir de 100 000 USD/EUR.',
                  '• Small Cap: from USD/EUR 100,000.'
                )}
              </li>
              <li>
                {t(
                  '• Large Cap (cash) : 100 M à 5 Md USD/EUR.',
                  '• Large Cap (cash): USD/EUR 100M to 5B.'
                )}
              </li>
              <li>
                {t(
                  '• Programmes avec instruments (MT-760, MT-542, Euroclear) : 125 M à 5 Md USD/EUR.',
                  '• Instrument programmes (MT-760, MT-542, Euroclear): USD/EUR 125M to 5B.'
                )}
              </li>
              <li>
                {t(
                  '• Prérequis de recevabilité : bénéficiaire effectif identifié, fonds libres et transférables, compliance package complet.',
                  '• Eligibility prerequisites: identified beneficial owner, unrestricted transferable funds, complete compliance package.'
                )}
              </li>
            </ul>
          </div>

          <p className="text-sm text-slate-600 mt-6 leading-relaxed">
            {t(
              'Le cadre complet des programmes PPP (cash hold, MT-799, MT-760, MT-542, Euroclear) est détaillé sur la page',
              'The full PPP framework (cash hold, MT-799, MT-760, MT-542, Euroclear) is detailed on the'
            )}{' '}
            <Link href="/services/placement-prive" className="text-gold font-semibold hover:underline">
              {t('Placement privé', 'Private Placement')}
            </Link>
            .{' '}
            {t(
              'Pour un prêt commercial en USD, voir la page',
              'For a commercial loan in USD, see the'
            )}{' '}
            <Link href="/services/prets" className="text-gold font-semibold hover:underline">
              {t('Prêts', 'Loans')}
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
