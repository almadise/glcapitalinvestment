'use client';

import React from 'react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceHero, ServiceDetailSections } from '@/components/services/ServiceDetailSections';
import { cryptoAdvisoryContent } from '@/lib/content/glCapitalRedactionnel';
export default function ConseilCryptoPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{
          fr: 'Conseil en transactions',
          en: 'Cryptocurrency Transaction',
        }}
        titleAccent={{
          fr: 'crypto-actifs',
          en: 'Advisory',
        }}
        subtitle={cryptoAdvisoryContent.heroSubtitle}
        backgroundImage="/assets/images/services-hero-bg.png"
      />
      <ServiceDetailSections sections={cryptoAdvisoryContent.sections} />
      <PublicFooter />
    </div>
  );
}
