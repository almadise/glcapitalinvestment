import type { Metadata } from 'next';
import Script from 'next/script';
import PublicNavbar from './components/PublicNavbar';
import HomePageMain from './components/HomePageMain';
import PublicFooter from './components/PublicFooter';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital8049.builtwithrocket.new';

export const metadata: Metadata = {
  title: 'GL Capital Investment SA - Conseil en Financement Institutionnel',
  description:
    'GL Capital fournit des services de structuration et de documentation pour accompagner les demandes de financement institutionnel. Plateforme sécurisée pour entreprises et porteurs de projets.',
  keywords: 'financement institutionnel, structuration dossier, instruments bancaires, SBLC, BG, KYC, AML, conseil financier, financement projet',
  alternates: { canonical: `${baseUrl}/home-page` },
  openGraph: {
    title: 'GL Capital Investment SA - Financement Institutionnel',
    description: 'Plateforme institutionnelle sécurisée pour la structuration et le suivi de dossiers de financement.',
    url: `${baseUrl}/home-page`,
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/assets/images/gl-capital-financial-district.png', width: 1200, height: 630, alt: 'GL Capital Investment SA - Siège social' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GL Capital Investment SA - Financement Institutionnel',
    description: 'Structuration et présentation de dossiers de financement institutionnel.',
    images: ['/assets/images/gl-capital-financial-district.png'],
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: 'GL Capital Investment SA',
  description: 'Plateforme de structuration et de présentation de dossiers de financement institutionnel. Services KYC/AML, instruments bancaires, financement de projets.',
  url: baseUrl,
  logo: `${baseUrl}/assets/images/logo-1776395060575.png`,
  image: `${baseUrl}/assets/images/gl-capital-financial-district.png`,
  areaServed: [
    { '@type': 'Place', name: 'Europe de l\'Ouest' },
    { '@type': 'Place', name: 'Amérique du Nord' },
    { '@type': 'Place', name: 'Asie' },
    { '@type': 'Place', name: 'Moyen-Orient' },
  ],
  serviceType: [
    'Structuration de dossiers de financement',
    'Instruments bancaires (SBLC/BG)',
    'Conseil en financement de projets',
    'Vérification KYC/AML',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Services GL Capital',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Financement de Projets',
          description: 'Structuration et présentation de dossiers de financement de projets d\'infrastructure et d\'investissement.',
          url: `${baseUrl}/services/financement-projet`,
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Instruments Bancaires',
          description: 'Structuration documentaire pour SBLC, BG et autres instruments de garantie bancaire.',
          url: `${baseUrl}/services/instruments-bancaires`,
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Conseil & Structuration',
          description: 'Accompagnement stratégique pour la structuration financière et la présentation de dossiers.',
          url: `${baseUrl}/services/conseil-structuration`,
        },
      },
    ],
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    url: `${baseUrl}/contact`,
    availableLanguage: ['French', 'English'],
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GL Capital Investment SA',
  url: baseUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/faq?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-950 overflow-x-hidden">
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <PublicNavbar />
      <HomePageMain />
      <PublicFooter />
    </div>
  );
}