'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ServicesSection() {
  const { t } = useLanguage();

  const services = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M10 12h4"></path><path d="M10 8h4"></path><path d="M14 21v-3a2 2 0 0 0-4 0v3"></path><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path></svg>
      ),
      badge: '€5M+',
      titleFr: 'Financement de projets',
      titleEn: 'Project Financing',
      descFr: "Structuration de projets d'infrastructure, d'énergie, d'immobilier et industriels. Nous préparons votre dossier pour soumission à des institutions financières agréées.",
      descEn: "Structuring for infrastructure, energy, real estate, and industrial projects. We prepare your dossier for submission to licensed financial institutions.",
      tagsFr: ['Infrastructure', 'Énergie', 'Immobilier', 'Industriel'],
      tagsEn: ['Infrastructure', 'Energy', 'Real Estate', 'Industrial'],
      href: '/services-page#project-financing',
      delay: '0s',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
      ),
      badge: '€1M+',
      titleFr: 'Instruments bancaires',
      titleEn: 'Banking Instruments',
      descFr: 'Conseil et documentation pour SBLC, garanties bancaires et instruments connexes. Cadre clair, sans collecte de codes bancaires confidentiels.',
      descEn: 'Advisory and documentation for SBLC, bank guarantees, and related instruments. Clear framework, with no collection of confidential banking codes.',
      tagsFr: ['SBLC', 'BG', 'Trade Finance', 'Documentaire'],
      tagsEn: ['SBLC', 'BG', 'Trade Finance', 'Documentary'],
      href: '/services-page#banking-instruments',
      delay: '0.15s',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
      ),
      badge: 'Custom',
      titleFr: 'Conseil & structuration',
      titleEn: 'Advisory & Structuring',
      descFr: 'Évaluation de bancabilité, revue documentaire, pré-screening conformité et structuration de dossier avant soumission.',
      descEn: 'Bankability assessment, document review, compliance pre-screening, and dossier structuring ahead of submission.',
      tagsFr: ['KYC/AML', 'Bancabilité', 'Documentation', 'Due Diligence'],
      tagsEn: ['KYC/AML', 'Bankability', 'Documentation', 'Due Diligence'],
      href: '/services-page#advisory',
      delay: '0.3s',
    },
  ];

  return (
    <section className="py-24" style={{ background: '#F7F8FA' }} id="services">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono tracking-widest uppercase mb-4" style={{ color: '#4A5C7A' }}>{t('Nos Services', 'Our Services')}</p>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: '#1E2D4A' }}>
            {t('Des services adaptés à chaque', 'Services tailored to each')}{' '}
            <span className="text-gradient-gold">{t('besoin de financement', 'financing need')}</span>
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: '#4A5C7A' }}>
            {t(
              "Des projets d'infrastructure aux instruments bancaires, GL Capital transforme votre demande en dossier exploitable par les institutions.",
              "From infrastructure projects to banking instruments, GL Capital turns your request into an institution-ready dossier."
            )}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <div
              key={service?.titleFr}
              className="group relative rounded-2xl p-8 transition-all duration-300 hover:shadow-card-hover cursor-pointer shadow-card"
              style={{ background: '#FFFFFF', border: '1px solid #D8E0EC', animationDelay: service?.delay }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors" style={{ background: '#F5EDD0', border: '1px solid #D8E0EC' }}>
                {service?.icon}
              </div>
              <span className="absolute top-6 right-6 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: '#B8912A', border: '1px solid #D8E0EC', background: '#F5EDD0' }}>
                {service?.badge}
              </span>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#1E2D4A' }}>{t(service?.titleFr, service?.titleEn)}</h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: '#4A5C7A' }}>{t(service?.descFr, service?.descEn)}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {t(service?.tagsFr?.join('|'), service?.tagsEn?.join('|'))?.split('|')?.map((tag) => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: '#4A5C7A', border: '1px solid #D8E0EC', background: '#E8EDF5' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={service?.href}
                className="flex items-center gap-2 text-sm font-semibold transition-colors group/link"
                style={{ color: '#B8912A' }}
              >
                {t('En savoir plus', 'Learn more')}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/link:translate-x-1 transition-transform" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </Link>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-10 p-5 rounded-xl text-center" style={{ background: '#E8EDF5', border: '1px solid #D8E0EC' }}>
          <p className="text-xs leading-relaxed max-w-3xl mx-auto" style={{ color: '#4A5C7A' }}>
            <strong style={{ color: '#1E2D4A' }}>{t('Important :', 'Important:')}</strong>{' '}
            {t(
              "GL Capital n'exécute pas de transactions financières, ne détient pas de licences bancaires ou d'investissement, et n'accepte pas de dépôts d'investisseurs. Toute transaction financière, le cas échéant, est exécutée exclusivement par des institutions financières dûment agréées.",
              "GL Capital does not execute financial transactions, does not hold banking or investment licenses, and does not accept investor deposits. Any financial transaction, if applicable, is executed exclusively by duly licensed financial institutions."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}