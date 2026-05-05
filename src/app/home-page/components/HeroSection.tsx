'use client';
import React, { useLayoutEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function HeroSection() {
  const heroRef = React.useRef<HTMLElement>(null);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const leftFloatingRef = React.useRef<HTMLDivElement>(null);
  const rightFloatingRef = React.useRef<HTMLDivElement>(null);
  const badgeRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const dividerRef = React.useRef<HTMLDivElement>(null);
  const ctaGroupRef = React.useRef<HTMLDivElement>(null);
  const trustRef = React.useRef<HTMLDivElement>(null);
  const primaryCtaRef = React.useRef<HTMLAnchorElement>(null);
  const primaryCtaIconRef = React.useRef<SVGSVGElement>(null);
  const { t } = useLanguage();
  const pausedHeadline = {
    fr: 'mobilisez des financements internationaux pour vos projets stratégiques.',
    en: 'Secure international financing for your strategic projects.',
  };

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const forceAnimation = params.get('anim') === 'on';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !forceAnimation) return;

    gsap.registerPlugin(ScrollTrigger);

    let onEnter: (() => void) | null = null;
    let onLeave: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const revealTargets = [
        badgeRef.current,
        titleRef.current,
        dividerRef.current,
        ctaGroupRef.current,
        trustRef.current,
      ];
      gsap.set(revealTargets, { opacity: 0, y: 20 });
      gsap.to(revealTargets, {
        opacity: 1,
        y: 0,
        duration: 0.95,
        delay: 0.15,
        ease: 'power3.out',
        stagger: 0.14,
      });

      gsap.fromTo(
        [leftFloatingRef.current, rightFloatingRef.current],
        { opacity: 0, scale: 0.98, y: 6 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.85,
          delay: 0.28,
          ease: 'power2.out',
          stagger: 0.12,
        }
      );

      gsap.to(leftFloatingRef.current, {
        y: -3,
        duration: 7.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(rightFloatingRef.current, {
        y: -2,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(bgRef.current, {
        yPercent: 4,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, heroRef);

    const primaryCta = primaryCtaRef.current;
    const primaryCtaIcon = primaryCtaIconRef.current;
    if (primaryCta && primaryCtaIcon) {
      onEnter = () => {
        gsap.to(primaryCta, {
          boxShadow: '0 6px 14px rgba(184,145,42,0.22)',
          duration: 0.2,
          ease: 'power2.out',
        });
        gsap.to(primaryCtaIcon, { x: 2, duration: 0.2, ease: 'power2.out' });
      };
      onLeave = () => {
        gsap.to(primaryCta, {
          boxShadow: '0 0 0 rgba(184,145,42,0)',
          duration: 0.2,
          ease: 'power2.out',
        });
        gsap.to(primaryCtaIcon, { x: 0, duration: 0.2, ease: 'power2.out' });
      };

      primaryCta.addEventListener('mouseenter', onEnter);
      primaryCta.addEventListener('mouseleave', onLeave);
    }

    return () => {
      if (primaryCta && onEnter) primaryCta.removeEventListener('mouseenter', onEnter);
      if (primaryCta && onLeave) primaryCta.removeEventListener('mouseleave', onLeave);
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const floatingBadges = [
    {
      icon: '✓',
      titleFr: 'KYC Vérifié',
      titleEn: 'KYC Verified',
      subFr: 'Identité confirmée',
      subEn: 'Identity confirmed',
      delay: '0s',
    },
    {
      icon: '🔒',
      titleFr: 'NCNDA Actif',
      titleEn: 'NCNDA Active',
      subFr: 'Partenaire protégé',
      subEn: 'Partner protected',
      delay: '1.5s',
    },
    {
      icon: '🛡',
      titleFr: 'AML Validé',
      titleEn: 'AML Validated',
      subFr: 'Sanctions vérifiées',
      subEn: 'Sanctions checked',
      delay: '3s',
    },
  ];

  const trustBadges = [
    { fr: 'Conformité KYC/AML', en: 'KYC/AML Compliance' },
    { fr: 'NCNDA & Confidentialité', en: 'NCNDA & Confidentiality' },
    { fr: 'Institutions Agréées', en: 'Licensed Institutions' },
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#0D1B2E' }}
    >
      {/* Fallback background image (shown while video loads or if it fails) */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/images/financial-hero-v2.png')" }}
        aria-hidden="true"
      />
      {/* Hero background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/assets/images/financial-hero-v2.png"
        aria-hidden="true"
      >
        <source src="/glcapital.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(6,15,30,0.82) 0%, rgba(30,45,74,0.75) 50%, rgba(6,15,30,0.85) 100%)',
        }}
        aria-hidden="true"
      />
      {/* Subtle geometric pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      {/* Subtle glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(184,145,42,0.10) 0%, transparent 70%)' }}
      />
      {/* Left floating badges */}
      <div
        ref={leftFloatingRef}
        className="absolute left-8 xl:left-16 top-1/3 hidden xl:flex flex-col gap-3"
      >
        {floatingBadges?.map((badge) => (
          <div
            key={badge?.titleFr}
            className="animate-float flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              animationDelay: badge?.delay,
              animationDuration: '5s',
            }}
          >
            <span className="text-lg">{badge?.icon}</span>
            <div>
              <p className="text-white text-xs font-semibold leading-none">
                {t(badge?.titleFr, badge?.titleEn)}
              </p>
              <p className="text-white/60 text-[10px] mt-0.5">{t(badge?.subFr, badge?.subEn)}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Right floating card */}
      <div
        ref={rightFloatingRef}
        className="absolute right-8 xl:right-16 top-1/3 hidden xl:block animate-float"
        style={{ animationDelay: '2s', animationDuration: '6s' }}
      >
        <div
          className="w-56 rounded-xl p-4 shadow-lg"
          style={{
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-wider">
              {t('Dossier', 'Case')}
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#EDD48A' }}>
              GLC-2026-0047
            </span>
          </div>
          <p className="text-white text-xs font-semibold mb-1 truncate">Solar Infrastructure SPV</p>
          <p className="text-white/60 text-[10px] mb-3">West Africa - €42M</p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <div
                className="h-full w-4/5 rounded-full"
                style={{ background: 'linear-gradient(to right, #B8912A, #EDD48A)' }}
              />
            </div>
            <span className="text-[10px] font-mono" style={{ color: '#EDD48A' }}>
              80%
            </span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            {t('Éligible - En cours', 'Eligible - In Progress')}
          </p>
        </div>
      </div>
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24 pb-16 -translate-y-8 sm:-translate-y-10 lg:-translate-y-14">
        {/* Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ border: '1px solid rgba(184,145,42,0.4)', background: 'rgba(184,145,42,0.12)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#EDD48A' }}
            aria-hidden="true"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
          </svg>
          <span
            className="text-[11px] sm:text-xs font-medium tracking-wide uppercase"
            style={{ color: '#EDD48A' }}
          >
            {t('PLATEFORME INSTITUTIONNELLE SÉCURISÉE', 'SECURE INSTITUTIONAL PLATFORM')}
          </span>
        </div>

        {/* Headline */}
        <h1
          ref={titleRef}
          className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-6"
          style={{ color: '#FFFFFF' }}
        >
          <span className="block min-h-[5.25rem] sm:min-h-[5.75rem] lg:min-h-[6.25rem]">
            {t(pausedHeadline.fr, pausedHeadline.en)}
          </span>
        </h1>

        {/* Divider */}
        <div ref={dividerRef} className="flex justify-center mb-8" aria-hidden="true">
          <div
            className="h-0.5 w-48"
            style={{ background: 'linear-gradient(to right, transparent, #EDD48A, transparent)' }}
          />
        </div>

        {/* CTA Buttons */}
        <div
          ref={ctaGroupRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            href="/contact"
            ref={primaryCtaRef}
            className="group flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 active:scale-95 animate-pulse-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: '#B8912A', color: '#FFFFFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#C9A23B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#B8912A')}
          >
            {t('Soumettre un dossier', 'Submit an application')}
            <svg
              ref={primaryCtaIconRef}
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform"
              aria-hidden="true"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
          <Link
            href="/services-page"
            className="flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'rgba(255,255,255,0.10)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {t('Voir le processus', 'See the process')}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
          <Link
            href="/client-dashboard/ai-assistant"
            className="flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'rgba(255,255,255,0.10)',
              color: '#FFFFFF',
              border: '1px solid rgba(237,212,138,0.45)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {t('Assistant IA sécurisé', 'Secure AI Assistant')}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 8V4H8"></path>
              <rect width="16" height="12" x="4" y="8" rx="2"></rect>
              <path d="M2 14h2"></path>
              <path d="M20 14h2"></path>
              <path d="M15 13v2"></path>
              <path d="M9 13v2"></path>
            </svg>
          </Link>
        </div>

        {/* Trust badges */}
        <div
          ref={trustRef}
          className="flex items-center justify-center gap-4 flex-wrap"
          aria-label={t('Certifications et conformité', 'Certifications and compliance')}
        >
          {trustBadges?.map((badge) => (
            <div
              key={badge?.fr}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
              style={{
                border: '1px solid rgba(255,255,255,0.20)',
                background: 'rgba(255,255,255,0.08)',
                color: '#FFFFFF',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#EDD48A' }}
                aria-hidden="true"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
              </svg>
              <span>{t(badge?.fr, badge?.en)}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </div>
    </section>
  );
}
