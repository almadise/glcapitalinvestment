'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import HeroSection from './HeroSection';
import TrustBar from './TrustBar';
import ServicesSection from './ServicesSection';
import ProcessSection from './ProcessSection';
import TrustSection from './TrustSection';
import CaseStudiesSection from './CaseStudiesSection';

/** Regroupe le contenu principal et le remonte à chaque changement de langue. */
export default function HomePageMain() {
  const { lang } = useLanguage();

  return (
    <main id="main-content" tabIndex={-1} key={lang}>
      <HeroSection />
      <TrustBar />
      <ServicesSection />
      <ProcessSection />
      <TrustSection />
      <CaseStudiesSection />
    </main>
  );
}
