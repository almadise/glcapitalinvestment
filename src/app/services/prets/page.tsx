'use client';

import React from 'react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceHero, ServiceDetailSections } from '@/components/services/ServiceDetailSections';
import { loansContent } from '@/lib/content/glCapitalRedactionnel';
export default function PretsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{ fr: 'Prêts', en: 'Loans' }}
        subtitle={loansContent.heroSubtitle}
        backgroundImage="/assets/images/services-hero-bg.png"
      />
      <ServiceDetailSections sections={loansContent.sections} />
      <PublicFooter />
    </div>
  );
}
