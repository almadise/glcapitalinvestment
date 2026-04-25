import type { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';
import PublicNav from '@/components/PublicNav';
import HomeFooter from '../home-page/components/HomeFooter';
import CompliancePageContent from './CompliancePageContent';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';

export const metadata: Metadata = {
  title: 'Sécurité & Conformité – KYC/AML, NCNDA, Gouvernance',
  description:
    'Découvrez le cadre de conformité de GL Capital Investment SA : processus KYC/AML, accords de confidentialité NCNDA, gouvernance des données, et protection de vos informations.',
  keywords: 'KYC, AML, NCNDA, conformité financière, gouvernance, sécurité données, confidentialité, GL Capital',
  alternates: { canonical: `${baseUrl}/securite-conformite` },
  openGraph: {
    title: 'Sécurité & Conformité – GL Capital Investment SA',
    description: 'Cadre KYC/AML, NCNDA, gouvernance et confidentialité de GL Capital.',
    url: `${baseUrl}/securite-conformite`,
    type: 'website',
  },
};

const complianceSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Sécurité & Conformité – GL Capital Investment SA',
  description: 'Cadre de conformité KYC/AML, NCNDA, gouvernance et sécurité des données',
  url: `${baseUrl}/securite-conformite`,
  publisher: {
    '@type': 'Organization',
    name: 'GL Capital Investment SA',
    url: baseUrl,
  },
};

export default function SecuriteConformitePage() {
  return (
    <div className="min-h-screen bg-surface">
      <Script
        id="schema-compliance"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(complianceSchema) }}
      />
      <PublicNav />
      <CompliancePageContent />
      <HomeFooter />
    </div>
  );
}
