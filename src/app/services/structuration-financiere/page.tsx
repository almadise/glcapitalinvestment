import { getPublicSiteUrl } from '@/lib/companyContact';
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';

const baseUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: 'Structuration financière - Dossier institutionnel premium',
  description:
    'Structuration financière experte de dossiers institutionnels : modélisation, conformité KYC/AML, documentation et préparation de soumission auprès de partenaires agréés.',
  keywords:
    'structuration financière, modélisation financière, dossier institutionnel, conformité KYC AML, financement structuré',
  alternates: { canonical: `${baseUrl}/services/structuration-financiere` },
  openGraph: {
    title: 'Structuration financière - GL Capital',
    description:
      'Conception et structuration de dossiers premium pour institutions financières agréées.',
    url: `${baseUrl}/services/structuration-financiere`,
    type: 'article',
  },
};

export default function StructurationFinancierePage() {
  return (
    <div className="min-h-screen bg-surface">
      <PublicNavbar />
      <section className="pt-32 pb-16 bg-gradient-section text-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <p className="text-xs tracking-widest uppercase text-gold-300 mb-3">Service Expert</p>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Structuration financière
          </h1>
          <p className="text-white/75 max-w-3xl text-lg">
            Nous transformons des projets complexes en dossiers lisibles, conformes et crédibles
            pour l&apos;analyse institutionnelle.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-navy mb-3">Livrables de structuration</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Executive summary institutionnel FR/EN</li>
              <li>• Note de structuration financière</li>
              <li>• Modèle financier avec hypothèses et scénarios</li>
              <li>• Kit documentaire conformité KYC/AML</li>
              <li>• Argumentaire de présentation partenaire</li>
            </ul>
          </div>
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-navy mb-3">Cadence opérationnelle</h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Diagnostic initial:</strong> 7 à 10 jours
              </p>
              <p>
                <strong>Structuration complète:</strong> 21 à 30 jours
              </p>
              <p>
                <strong>Ticket d’entrée:</strong> à partir de 5M EUR
              </p>
              <p>
                <strong>Qualité:</strong> revue interne croisée (finance + conformité)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="card-surface p-6">
            <h2 className="text-lg font-bold text-navy mb-2">Contenu expert FR/EN</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              FR: Nous structurons pour la décision: cohérence des flux, solidité des hypothèses,
              conformité documentaire, et clarté de lecture pour les comités de crédit.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              EN: We structure for decision-making: cash-flow consistency, robust assumptions,
              documentary compliance, and clear readability for credit committees.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dossier-submission-wizard"
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold"
              >
                Soumettre un dossier
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-navy"
              >
                Parler à un conseiller
              </Link>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
