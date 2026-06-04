'use client';

import React from 'react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceHero, ServiceDetailSections } from '@/components/services/ServiceDetailSections';
import { privatePlacementContent } from '@/lib/content/glCapitalRedactionnel';
export default function PlacementPrivePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{
          fr: 'Programmes de',
          en: 'Private',
        }}
        titleAccent={{
          fr: 'placement privé',
          en: 'Placement Programs',
        }}
        subtitle={privatePlacementContent.heroSubtitle}
        backgroundImage="/assets/images/services-hero-bg.png"
      />
      <ServiceDetailSections sections={privatePlacementContent.sections} />
      <PublicFooter />
    </div>
  );
}
