import { getPublicSiteUrl } from '@/lib/companyContact';
import type { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';
import PublicNav from '@/components/PublicNav';
import ServicesHero from './components/ServicesHero';
import PackagesSection from './components/PackagesSection';
import TrustProofSection from './components/TrustProofSection';
import ServicesStickyCTA from './components/ServicesStickyCTA';
import ProjectFinancingSection from './components/ProjectFinancingSection';
import BankingInstrumentsSection from './components/BankingInstrumentsSection';
import AdvisorySection from './components/AdvisorySection';
import ServicesComparisonTable from './components/ServicesComparisonTable';
import ServicesFooterCTA from './components/ServicesFooterCTA';
import PeriodicOpportunitiesSection from './components/PeriodicOpportunitiesSection';
import InstitutionalProgramsHubSection from './components/InstitutionalProgramsHubSection';
import PublicFooter from '../home-page/components/PublicFooter';

const baseUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: 'Services de Structuration Financière – Financement International & Instruments Bancaires',
  description:
    'Hub services GL Capital : financement de projet en euros, prêts commerciaux USD, programmes PPP, instruments SBLC/BG et conseil en structuration. KYC/AML, NCNDA.',
  keywords:
    'financement international, placement privé PPP, prêt commercial, SBLC, BG, MT-760, financement projet, structuration financière, KYC AML',
  alternates: { canonical: `${baseUrl}/services-page` },
  openGraph: {
    title: 'Services GL Capital - Financement & Instruments Bancaires',
    description:
      'Structuration de dossiers, instruments bancaires SBLC/BG, et conseil financier institutionnel.',
    url: `${baseUrl}/services-page`,
    type: 'website',
    images: [
      {
        url: '/assets/images/services-hero-bg.png',
        width: 1200,
        height: 630,
        alt: 'Services GL Capital Investment SA',
      },
    ],
  },
};

const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Services GL Capital Investment SA',
  description: 'Services de structuration financière et de financement institutionnel',
  url: `${baseUrl}/services-page`,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'FinancialProduct',
        name: 'Financement de Projets',
        description:
          "Structuration et présentation de dossiers de financement pour projets d'infrastructure, d'énergie et d'investissement.",
        url: `${baseUrl}/services/financement-projet`,
        provider: { '@type': 'Organization', name: 'GL Capital Investment SA' },
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'FinancialProduct',
        name: 'Instruments Bancaires',
        description:
          'Structuration documentaire pour lettres de crédit standby (SBLC) et garanties bancaires (BG).',
        url: `${baseUrl}/services/instruments-bancaires`,
        provider: { '@type': 'Organization', name: 'GL Capital Investment SA' },
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'FinancialProduct',
        name: 'Conseil & Structuration',
        description:
          "Accompagnement stratégique pour la structuration financière et la présentation de dossiers auprès d'institutions agréées.",
        url: `${baseUrl}/services/conseil-structuration`,
        provider: { '@type': 'Organization', name: 'GL Capital Investment SA' },
      },
    },
    {
      '@type': 'ListItem',
      position: 4,
      item: {
        '@type': 'FinancialProduct',
        name: 'Programmes de placement privé',
        description:
          'Programmes PPP institutionnels : cash hold, MT-799, MT-760, Euroclear. Tickets à partir de 100 M USD/EUR.',
        url: `${baseUrl}/services/placement-prive`,
        provider: { '@type': 'Organization', name: 'GL Capital Investment SA' },
      },
    },
    {
      '@type': 'ListItem',
      position: 5,
      item: {
        '@type': 'FinancialProduct',
        name: 'Prêts commerciaux',
        description:
          'Prêts commerciaux et de projet en USD. Procédure, caution d\'assurance, prêteurs USA, Vietnam et Dubaï.',
        url: `${baseUrl}/services/prets`,
        provider: { '@type': 'Organization', name: 'GL Capital Investment SA' },
      },
    },
  ],
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Script
        id="schema-services"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <PublicNav />
      <ServicesHero />
      <PackagesSection />
      <TrustProofSection />
      <ProjectFinancingSection />
      <BankingInstrumentsSection />
      <AdvisorySection />
      <InstitutionalProgramsHubSection />
      <PeriodicOpportunitiesSection />
      <ServicesComparisonTable />
      <ServicesFooterCTA />
      <ServicesStickyCTA />
      <PublicFooter />
    </div>
  );
}
