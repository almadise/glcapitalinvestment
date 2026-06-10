'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, ChevronDown, Shield, Building2, BarChart3 } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/context/LanguageContext';

const serviceItems = [
  {
    href: '/services/financement-projet',
    icon: Building2,
    labelFr: 'Financement de projet',
    labelEn: 'Project Finance',
    descFr: 'Programme mondial, 2 M€ à 4 Md€',
    descEn: 'Global programme, €2M to €4B',
  },
  {
    href: '/services/instruments-bancaires',
    icon: Shield,
    labelFr: 'Instruments bancaires',
    labelEn: 'Bank Instruments',
    descFr: 'Achat, location, monétisation, SBLC',
    descEn: 'Purchase, lease, monetization, SBLC',
  },
  {
    href: '/services/prets',
    icon: Building2,
    labelFr: 'Prêts',
    labelEn: 'Loans',
    descFr: 'Prêts commerciaux et de projet',
    descEn: 'Commercial and project loans',
  },
  {
    href: '/services/placement-prive',
    icon: Shield,
    labelFr: 'Placement privé',
    labelEn: 'Private Placement',
    descFr: 'Programmes PPP, fonds éligibles',
    descEn: 'PPP programs, eligible funds',
  },
  {
    href: '/services/conseil-crypto',
    icon: BarChart3,
    labelFr: 'Conseil crypto-actifs',
    labelEn: 'Crypto Advisory',
    descFr: 'OTC, prêt-emprunt, conservation',
    descEn: 'OTC, lending, custody',
  },
  {
    href: '/services/conseil-structuration',
    icon: BarChart3,
    labelFr: 'Conseil & structuration',
    labelEn: 'Advisory & Structuring',
    descFr: 'Bankabilité, documentation, conformité',
    descEn: 'Bankability, documentation, compliance',
  },
];

const navLinks = [
  { href: '/home-page', labelFr: 'Accueil', labelEn: 'Home' },
  { href: '/qui-sommes-nous', labelFr: 'Qui sommes-nous', labelEn: 'About Us' },
  { href: '/services-page', labelFr: 'Services', labelEn: 'Services', hasDropdown: true },
  { href: '/contact', labelFr: 'Contact', labelEn: 'Contact' },
  { href: '/faq', labelFr: 'FAQ', labelEn: 'FAQ' },
];

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-navy-900/95 backdrop-blur-md shadow-navy py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home-page" className="flex items-center gap-3 group">
          <AppLogo size={36} />
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg tracking-tight leading-none">
              GL Capital
            </span>
            <span className="text-gold-500 text-[10px] font-mono tracking-widest uppercase leading-none mt-0.5">
              Investment SA
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) =>
            link.hasDropdown ? (
              <div key="nav-services" ref={dropdownRef} className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    servicesOpen
                      ? 'text-gold-400 bg-white/10'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t(link.labelFr, link.labelEn)}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {servicesOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-navy-900 border border-navy-700 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
                    <div className="p-2">
                      {serviceItems.map((item) => (
                        <Link
                          key={`dropdown-${item.href}`}
                          href={item.href}
                          onClick={() => setServicesOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-navy-700 transition-colors duration-150 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gold-500/20 transition-colors">
                            <item.icon size={16} className="text-gold-500" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">
                              {t(item.labelFr, item.labelEn)}
                            </p>
                            <p className="text-white/50 text-xs mt-0.5">
                              {t(item.descFr, item.descEn)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-navy-700 px-4 py-3 bg-navy-950/50">
                      <Link
                        href="/services-page"
                        onClick={() => setServicesOpen(false)}
                        className="text-gold-400 text-xs font-medium hover:text-gold-300 transition-colors"
                      >
                        {t('Voir tous les services →', 'View all services →')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={`nav-${link.href}`}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {t(link.labelFr, link.labelEn)}
              </Link>
            )
          )}
        </div>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageToggle
            className="flex items-center gap-1 rounded-lg border border-white/20 p-0.5"
            buttonClassName="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
          />
          <Link
            href="/sign-up-login-screen"
            className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            {t('Connexion', 'Sign In')}
          </Link>
          <Link
            href="/client-portal-dashboard"
            className="px-5 py-2 text-sm font-semibold bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-lg transition-all duration-200 active:scale-95"
          >
            {t('Portail Client', 'Client Portal')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-navy-900/98 backdrop-blur-md border-t border-navy-700 px-6 py-4 space-y-1 animate-slide-up">
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.href}`}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {t(link.labelFr, link.labelEn)}
            </Link>
          ))}
          <div className="pl-4 space-y-1">
            {serviceItems.map((item) => (
              <Link
                key={`mobile-service-${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gold-400 hover:text-gold-300 rounded-lg transition-colors"
              >
                <item.icon size={14} />
                {t(item.labelFr, item.labelEn)}
              </Link>
            ))}
          </div>
          <div className="pt-3 border-t border-navy-700 flex gap-3">
            <LanguageToggle
              className="flex items-center gap-1 rounded-lg border border-white/20 p-0.5"
              buttonClassName="px-3 py-2 text-xs font-medium rounded-md transition-all"
            />
            <Link
              href="/sign-up-login-screen"
              className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-white/80 border border-white/20 rounded-lg"
            >
              {t('Connexion', 'Sign In')}
            </Link>
            <Link
              href="/client-portal-dashboard"
              className="flex-1 text-center px-4 py-2.5 text-sm font-semibold bg-gold-500 text-navy-900 rounded-lg"
            >
              {t('Portail', 'Portal')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
