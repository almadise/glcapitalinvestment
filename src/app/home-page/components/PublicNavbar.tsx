'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const { lang, toggleLang, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileOpen) {
      setMobileOpen(false);
      mobileToggleRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const serviceLinks = [
    { href: '/services/financement-projet', labelFr: 'Financement de Projet', labelEn: 'Project Financing' },
    { href: '/services/instruments-bancaires', labelFr: 'Instruments Bancaires', labelEn: 'Banking Instruments' },
    { href: '/services-page#advisory', labelFr: 'Conseil & Structuration', labelEn: 'Advisory & Structuring' },
  ];

  const navLinks = [
    { href: '/home-page', labelFr: 'Accueil', labelEn: 'Home' },
    { href: '/qui-sommes-nous', labelFr: 'Qui sommes-nous', labelEn: 'About Us' },
    { href: '/services-page', labelFr: 'Services', labelEn: 'Services', hasDropdown: true },
    { href: '/contact', labelFr: 'Contact', labelEn: 'Contact' },
    { href: '/faq', labelFr: 'FAQ', labelEn: 'FAQ' },
  ];

  return (
    <>
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold focus:text-navy focus:font-bold focus:rounded-lg focus:shadow-lg"
      >
        {t('Aller au contenu principal', 'Skip to main content')}
      </a>

      <nav
        aria-label={t('Navigation principale', 'Main navigation')}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-navy-900/95 backdrop-blur-md shadow-xl' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home-page" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 rounded-lg">
            <div className="inline-flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 46 }}>
              <img
                alt="GL Capital Investment SA - Logo"
                width={36}
                height={46}
                className="object-contain w-full h-full"
                src="/assets/images/logo-1776271225960.png"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg tracking-tight leading-none">GL Capital</span>
              <span className="text-gold text-[10px] font-mono tracking-widest uppercase leading-none mt-0.5">Investment SA</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1" role="list">
            {navLinks.map((item) =>
              item.hasDropdown ? (
                <div key={item.href} className="relative" ref={servicesDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setServicesOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-navy-900"
                    aria-expanded={servicesOpen}
                    aria-haspopup="menu"
                  >
                    {lang === 'fr' ? item.labelFr : item.labelEn}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </button>

                  {servicesOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 rounded-xl border border-white/15 bg-navy-900/95 backdrop-blur-md shadow-xl p-2 z-50">
                      <Link
                        href={item.href}
                        onClick={() => setServicesOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm font-semibold text-gold hover:bg-white/10 transition-colors"
                      >
                        {t('Tous les services', 'All services')}
                      </Link>
                      <div className="my-1 h-px bg-white/10" />
                      {serviceLinks.map((service) => (
                        <Link
                          key={service.href}
                          href={service.href}
                          onClick={() => setServicesOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {lang === 'fr' ? service.labelFr : service.labelEn}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  role="listitem"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-navy-900"
                >
                  {lang === 'fr' ? item.labelFr : item.labelEn}
                </Link>
              )
            )}
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/40 transition-all"
              title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
              aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>
            <Link
              href="/sign-up-login-screen"
              className="px-4 py-2 text-sm font-medium text-white hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-navy-900 rounded-lg"
            >
              {t('Connexion', 'Sign In')}
            </Link>
            <Link
              href="/client-portal-dashboard"
              className="px-5 py-2 text-sm font-semibold bg-gold hover:bg-gold/90 text-navy-900 rounded-lg transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
            >
              {t('Portail Client', 'Client Portal')}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            ref={mobileToggleRef}
            className="lg:hidden p-2 text-white hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg"
            aria-label={mobileOpen ? t('Fermer le menu', 'Close menu') : t('Ouvrir le menu', 'Open menu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h16"></path></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className={`lg:hidden bg-navy-900 border-t border-white/10 px-6 py-4 space-y-1 ${mobileOpen ? 'block' : 'hidden'}`}
          aria-hidden={!mobileOpen}
        >
          {navLinks.map((item) =>
            item.hasDropdown ? (
              <div key={item.href} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setMobileServicesOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-white hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-expanded={mobileServicesOpen}
                >
                  <span>{lang === 'fr' ? item.labelFr : item.labelEn}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${mobileServicesOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
                {mobileServicesOpen && (
                  <div className="pl-3 space-y-1">
                    <Link
                      href={item.href}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileServicesOpen(false);
                      }}
                      className="block px-3 py-2 text-sm font-semibold text-gold hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {t('Tous les services', 'All services')}
                    </Link>
                    {serviceLinks.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        onClick={() => {
                          setMobileOpen(false);
                          setMobileServicesOpen(false);
                        }}
                        className="block px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {lang === 'fr' ? service.labelFr : service.labelEn}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-white hover:text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {lang === 'fr' ? item.labelFr : item.labelEn}
              </Link>
            )
          )}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {/* Mobile language toggle */}
            <button
              onClick={() => { toggleLang(); setMobileOpen(false); }}
              className="block text-center px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-lg transition-colors hover:bg-white/10"
            >
              {lang === 'fr' ? '🇬🇧 Switch to English' : '🇫🇷 Passer en français'}
            </button>
            <Link
              href="/sign-up-login-screen"
              onClick={() => setMobileOpen(false)}
              className="block text-center px-4 py-2.5 text-sm font-medium text-white border border-white/30 rounded-lg transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {t('Connexion', 'Sign In')}
            </Link>
            <Link
              href="/client-portal-dashboard"
              onClick={() => setMobileOpen(false)}
              className="block text-center px-4 py-3 text-sm font-semibold bg-gold text-navy-900 rounded-lg hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t('Portail Client', 'Client Portal')}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}