'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ServicesHero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/assets/images/services-hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Gradient overlay - keep dark for image hero */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(135deg, rgba(30,45,74,0.90) 0%, rgba(30,45,74,0.82) 50%, rgba(42,61,92,0.75) 100%)' }}
      />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.05]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(184,145,42,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(184,145,42,0.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 text-center">
        <p className="text-xs font-mono tracking-widest uppercase mb-4" style={{ color: '#D4B055' }}>GL Capital Services</p>
        <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          {t('Solutions de financement', 'Financing Solutions')}<br />
          <span className="text-gradient-gold">{t('Adaptées aux montages complexes', 'Designed for complex deal structures')}</span>
        </h1>
        <p className="text-white/75 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          {t(
            'Trois lignes de services couvrent la finance de projet, les instruments bancaires et le conseil en structuration. Chaque mission suit un cadre de conformité strict.',
            'Three service lines cover project finance, banking instruments, and structuring advisory. Every engagement follows a strict compliance framework.'
          )}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="#project-financing" className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm" style={{ background: '#B8912A', color: '#FFFFFF' }}>
            {t('Financement de projet', 'Project Financing')} <ArrowRight size={14} />
          </Link>
          <Link href="#banking-instruments" className="px-6 py-3 text-white font-semibold rounded-xl border border-white/25 transition-all duration-200 text-sm backdrop-blur-sm hover:bg-white/10">
            {t('Instruments bancaires', 'Banking Instruments')}
          </Link>
          <Link href="#advisory" className="px-6 py-3 text-white/80 hover:text-white font-medium transition-colors text-sm">
            {t('Conseil & Structuration', 'Advisory & Structuring')}
          </Link>
        </div>
      </div>
    </section>
  );
}