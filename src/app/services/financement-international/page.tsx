import { getPublicSiteUrl } from '@/lib/companyContact';
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';

const baseUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: 'Financement International - Structuration et accès institutionnel',
  description:
    'GL Capital accompagne la structuration de dossiers de financement international pour projets à partir de 5M EUR : préparation, conformité KYC/AML, et soumission institutionnelle.',
  keywords:
    'financement international, dossier financement, structuration financière, KYC AML, financement projet international',
  alternates: { canonical: `${baseUrl}/services/financement-international` },
  openGraph: {
    title: 'Financement International - GL Capital',
    description:
      'Structuration et préparation de dossiers de financement international pour institutions financières agréées.',
    url: `${baseUrl}/services/financement-international`,
    type: 'article',
  },
};

export default function FinancementInternationalPage() {
  return (
    <div className="min-h-screen bg-surface">
      <PublicNavbar />
      <section className="pt-32 pb-16 bg-gradient-section text-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <p className="text-xs tracking-widest uppercase text-gold-300 mb-3">Service Expert</p>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Financement international
          </h1>
          <p className="text-white/75 max-w-3xl text-lg">
            Nous structurons les dossiers pour des projets transfrontaliers et facilitons leur
            présentation à des institutions financières agréées.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-navy mb-3">Ce que nous livrons</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Diagnostic de bancabilité internationale</li>
              <li>• Structuration documentaire et financière</li>
              <li>• Pré-screening KYC/AML et risque pays</li>
              <li>• Préparation de soumission institutionnelle</li>
            </ul>
          </div>
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-navy mb-3">Paramètres clés</h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Ticket d’entrée:</strong> 5M EUR+
              </p>
              <p>
                <strong>Délai moyen:</strong> 21 à 45 jours
              </p>
              <p>
                <strong>Couverture:</strong> Projets multi-juridictions
              </p>
              <p>
                <strong>Conformité:</strong> KYC/AML + NCNDA
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="card-surface p-6">
            <h2 className="text-lg font-bold text-navy mb-2">Expertise FR/EN</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              FR: Notre équipe aligne votre dossier sur les standards des institutions
              internationales (DFI, banques commerciales, fonds spécialisés), avec une approche
              orientée risque, conformité et lisibilité financière. EN: Our team aligns your file
              with international institution standards (DFIs, commercial banks, specialized funds),
              with a risk-oriented, compliant, and finance-readable approach.
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
