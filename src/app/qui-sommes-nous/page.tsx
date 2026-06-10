'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Lock, Filter, Eye, Globe, MapPin, Mail, User } from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';
import {
  ENTITY_GL_CAPITAL,
  OFFICIAL_PUBLIC_EMAIL,
  PARIS_WORLD_OFFICE,
  REGISTERED_ADDRESS_LINES_EN,
  REGISTERED_ADDRESS_LINES_FR,
} from '@/lib/companyContact';

export default function QuiSommesNousPage() {
  const { lang } = useLanguage();

  const values =
    lang === 'fr'
      ? [
          {
            icon: Shield,
            title: 'Conformité',
            description:
              'Toutes nos opérations respectent le cadre réglementaire des juridictions concernées.',
          },
          {
            icon: Lock,
            title: 'Confidentialité',
            description:
              "Le secret bancaire et les accords NCNDA régissent l'ensemble de nos relations partenaires.",
          },
          {
            icon: Filter,
            title: 'Sélectivité',
            description:
              "Nous n'acceptons que les dossiers répondant à nos critères d'éligibilité, dans l'intérêt de toutes les parties.",
          },
          {
            icon: Eye,
            title: 'Transparence',
            description:
              "Les conditions d'accès à nos services sont communiquées clairement à chaque étape du processus.",
          },
        ]
      : [
          {
            icon: Shield,
            title: 'Compliance',
            description:
              'All our operations comply with the regulatory framework of the relevant jurisdictions.',
          },
          {
            icon: Lock,
            title: 'Confidentiality',
            description:
              'Banking secrecy and NCNDA agreements govern all our partner relationships.',
          },
          {
            icon: Filter,
            title: 'Selectivity',
            description:
              'We only accept files meeting our eligibility criteria, in the interest of all parties.',
          },
          {
            icon: Eye,
            title: 'Transparency',
            description:
              'The conditions for accessing our services are clearly communicated at each stage of the process.',
          },
        ];

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <PublicNavbar />
      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: 'url(/assets/images/about-hero-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(135deg, rgba(30,45,74,0.90) 0%, rgba(30,45,74,0.82) 50%, rgba(42,61,92,0.75) 100%)',
          }}
        />
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 relative z-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
            style={{
              background: 'rgba(184,145,42,0.15)',
              border: '1px solid rgba(184,145,42,0.25)',
            }}
          >
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#D4B055' }}
            >
              {lang === 'fr' ? 'À propos' : 'About'}
            </span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
            GL Capital
            <br />
            <span className="text-gradient-gold">Investment SA</span>
          </h1>
          <p
            className="text-white/80 text-lg lg:text-xl leading-relaxed max-w-3xl pl-5"
            style={{ borderLeft: '2px solid rgba(184,145,42,0.4)' }}
          >
            {lang === 'fr'
              ? 'GL Capital est une société de conseil en financement de projets. Notre mission est de connecter les porteurs de projets aux institutions financières agréées, dans le strict respect des réglementations financières internationales.'
              : 'GL Capital is a project financing advisory firm. We connect project holders with licensed financial institutions in strict compliance with international regulations.'}
          </p>
        </div>
      </section>
      {/* Mission */}
      <section className="py-20" style={{ background: '#F7F8FA' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="max-w-3xl mx-auto">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{ background: '#E8EDF5', border: '1px solid #D8E0EC' }}
            >
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: '#1E2D4A' }}
              >
                {lang === 'fr' ? 'Notre mission' : 'Our Mission'}
              </span>
            </div>
            <div
              className="rounded-2xl p-8 shadow-sm"
              style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}
            >
              <p className="text-base lg:text-lg leading-relaxed" style={{ color: '#4A5C7A' }}>
                {lang === 'fr'
                  ? "Nous n'intervenons pas en tant que prêteur direct : nous structurons les dossiers, évaluons l'éligibilité et facilitons l'introduction formelle auprès de nos partenaires institutionnels. Chaque dossier est traité individuellement, avec rigueur et confidentialité."
                  : 'We do not act as a direct lender: we structure files, assess eligibility, and facilitate institutional introductions. Each file is handled individually, with rigour and confidentiality.'}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Values */}
      <section className="py-20" style={{ background: '#FFFFFF' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
              style={{ background: '#E8EDF5', border: '1px solid #D8E0EC' }}
            >
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: '#1E2D4A' }}
              >
                {lang === 'fr' ? 'Nos valeurs' : 'Our Values'}
              </span>
            </div>
            <h2
              className="font-display text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: '#1E2D4A' }}
            >
              {lang === 'fr' ? (
                <>
                  Les principes qui guident <span className="text-gradient-gold">notre action</span>
                </>
              ) : (
                <>
                  The principles that guide <span className="text-gradient-gold">our work</span>
                </>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values?.map((value) => (
              <div
                key={`value-${value?.title}`}
                className="rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start gap-5"
                style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F5EDD0', border: '1px solid #D8E0EC' }}
                >
                  <value.icon size={22} style={{ color: '#B8912A' }} />
                </div>
                <div>
                  <h3
                    className="font-display text-base font-bold mb-2"
                    style={{ color: '#1E2D4A' }}
                  >
                    {value?.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#4A5C7A' }}>
                    {value?.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Network */}
      <section className="py-20 relative overflow-hidden" style={{ background: '#1E2D4A' }}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{ background: '#B8912A' }}
          />
        </div>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{
                background: 'rgba(184,145,42,0.1)',
                border: '1px solid rgba(184,145,42,0.2)',
              }}
            >
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: '#B8912A' }}
              >
                {lang === 'fr' ? 'Réseau' : 'Network'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-6">
              {lang === 'fr' ? 'Un réseau international' : 'An international network'}
            </h2>
            <div
              className="rounded-2xl p-8 backdrop-blur-sm"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-start gap-4 text-left">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                  style={{
                    background: 'rgba(184,145,42,0.2)',
                    border: '1px solid rgba(184,145,42,0.3)',
                  }}
                >
                  <Globe size={18} style={{ color: '#B8912A' }} />
                </div>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  {lang === 'fr'
                    ? "GL Capital opère au sein d'un réseau international d'investisseurs privés, de banques spécialisées, de plateformes financières et de professionnels du droit et de la finance, opérant dans le cadre du secret bancaire."
                    : 'GL Capital operates within an international network of private investors, specialised banks, financial platforms and legal and financial professionals, operating within the framework of banking secrecy.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-20" style={{ background: '#FFFFFF' }}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          {/* Contact details */}
          <div className="max-w-3xl mx-auto mb-16">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{ background: '#E8EDF5', border: '1px solid #D8E0EC' }}
            >
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: '#1E2D4A' }}
              >
                {lang === 'fr' ? 'Coordonnées' : 'Contact Details'}
              </span>
            </div>
            <div
              className="rounded-2xl p-8 shadow-sm"
              style={{ background: '#F7F8FA', border: '1px solid #D8E0EC' }}
            >
              <h3 className="font-display text-xl font-bold mb-1" style={{ color: '#1E2D4A' }}>
                {ENTITY_GL_CAPITAL}
              </h3>
              <p className="text-sm mb-6" style={{ color: '#6B7E9A' }}>
                {PARIS_WORLD_OFFICE}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={16} style={{ color: '#B8912A' }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5" style={{ color: '#1E2D4A' }}>
                      {lang === 'fr'
                        ? 'Siège social (General Luxury SA)'
                        : 'Registered office (General Luxury SA)'}
                    </p>
                    {(lang === 'fr'
                      ? REGISTERED_ADDRESS_LINES_FR
                      : REGISTERED_ADDRESS_LINES_EN
                    ).map((line) => (
                      <p key={line} style={{ color: '#4A5C7A' }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <User size={16} style={{ color: '#B8912A' }} className="flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-0.5" style={{ color: '#1E2D4A' }}>
                        {lang === 'fr' ? 'Contact' : 'Contact'}
                      </p>
                      <p style={{ color: '#4A5C7A' }}>Mr Joseph Yaramis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} style={{ color: '#B8912A' }} className="flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-0.5" style={{ color: '#1E2D4A' }}>
                        Email
                      </p>
                      <a
                        href={`mailto:${OFFICIAL_PUBLIC_EMAIL}`}
                        className="transition-colors"
                        style={{ color: '#4A5C7A' }}
                      >
                        {OFFICIAL_PUBLIC_EMAIL}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2
              className="font-display text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: '#1E2D4A' }}
            >
              {lang === 'fr' ? 'Prêt à soumettre votre dossier ?' : 'Ready to submit a file?'}
            </h2>
            <p className="text-base max-w-xl mx-auto mb-10" style={{ color: '#4A5C7A' }}>
              {lang === 'fr'
                ? "Contactez-nous pour évaluer l'éligibilité de votre projet et entamer la procédure formelle."
                : 'Contact us to assess your project eligibility and begin the formal procedure.'}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 font-bold text-base px-8 py-4 rounded-xl active:scale-95 transition-all duration-200"
              style={{ background: '#B8912A', color: '#FFFFFF' }}
            >
              {lang === 'fr' ? 'Soumettre un dossier' : 'Submit a file'}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
