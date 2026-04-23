'use client';
import React, { useState, useEffect } from 'react';
import PublicNavbar from '../home-page/components/PublicNavbar';
import PublicFooter from '../home-page/components/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Cookie, Lock, Eye, UserCheck, Mail } from 'lucide-react';


const COOKIE_CONSENT_KEY = 'gl-capital-cookie-consent';

function CookieBanner({ onAccept, onDecline, lang }: { onAccept: () => void; onDecline: () => void; lang: 'fr' | 'en' }) {
  const t = {
    title: { fr: 'Nous utilisons des cookies', en: 'We use cookies' },
    text: {
      fr: 'GL Capital utilise uniquement des cookies essentiels (authentification de session, préférence de langue). Aucun cookie publicitaire. Aucune donnée vendue à des tiers.',
      en: 'GL Capital uses only essential cookies (session authentication, language preference). No advertising cookies. No data sold to third parties.',
    },
    accept: { fr: 'Accepter', en: 'Accept' },
    decline: { fr: 'Refuser', en: 'Decline' },
    learnMore: { fr: 'En savoir plus', en: 'Learn more' },
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto bg-navy-dark border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
            <Cookie size={18} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm mb-1">{t.title[lang]}</p>
            <p className="text-slate-400 text-xs leading-relaxed">{t.text[lang]}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            onClick={onAccept}
            className="bg-gold text-navy text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-gold-light transition-colors duration-150"
          >
            {t.accept[lang]}
          </button>
          <button
            onClick={onDecline}
            className="bg-white/10 text-white text-xs font-medium px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors duration-150"
          >
            {t.decline[lang]}
          </button>
          <a href="#what-cookies" className="text-slate-400 hover:text-gold text-xs underline underline-offset-2 transition-colors">
            {t.learnMore[lang]}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CookiesPage() {
  const { lang } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setShowBanner(false);
  };

  const t = {
    badge: { fr: 'Politique institutionnelle', en: 'Institutional Policy' },
    title: { fr: 'Cookies & Confidentialité', en: 'Cookies & Privacy' },
    subtitle: {
      fr: 'GL Capital Investment SA s\'engage à une utilisation transparente et strictement encadrée des cookies, conformément au RGPD et à la directive ePrivacy.',
      en: 'GL Capital Investment SA is committed to a transparent and strictly controlled use of cookies, in compliance with GDPR and the ePrivacy directive.',
    },
    updated: { fr: 'Dernière mise à jour : avril 2026', en: 'Last updated: April 2026' },

    whatTitle: { fr: 'Quels cookies utilisons-nous ?', en: 'What cookies do we use?' },
    whatText: {
      fr: 'GL Capital n\'utilise aucun traceur publicitaire. Seuls des cookies essentiels sont utilisés : authentification de session et préférence de langue. Aucune donnée n\'est vendue à des tiers.',
      en: 'GL Capital does not use advertising trackers. Only essential cookies are used: session authentication and language preference. No data is sold to third parties.',
    },
    cookies: [
      {
        name: 'sb-access-token',
        purpose: { fr: 'Jeton d\'authentification de session sécurisée', en: 'Secure session authentication token' },
        duration: { fr: 'Session', en: 'Session' },
      },
      {
        name: 'sb-refresh-token',
        purpose: { fr: 'Renouvellement automatique de la session', en: 'Automatic session renewal' },
        duration: { fr: '7 jours', en: '7 days' },
      },
      {
        name: 'gl-capital-lang',
        purpose: { fr: 'Mémorisation de la préférence de langue (FR/EN)', en: 'Language preference storage (FR/EN)' },
        duration: { fr: 'Persistant', en: 'Persistent' },
      },
      {
        name: 'gl-capital-cookie-consent',
        purpose: { fr: 'Mémorisation de votre choix de consentement aux cookies', en: 'Storage of your cookie consent choice' },
        duration: { fr: 'Persistant', en: 'Persistent' },
      },
    ],

    whyTitle: { fr: 'Pourquoi utilisons-nous ces cookies ?', en: 'Why do we use these cookies?' },
    whyItems: [
      {
        icon: Lock,
        title: { fr: 'Sécurité & Authentification', en: 'Security & Authentication' },
        text: {
          fr: 'Les cookies de session permettent de maintenir votre connexion sécurisée au portail client et aux espaces professionnels, et de vous protéger contre les accès non autorisés.',
          en: 'Session cookies allow us to maintain your secure connection to the client portal and professional spaces, and to protect you against unauthorized access.',
        },
      },
      {
        icon: Eye,
        title: { fr: 'Préférence de langue', en: 'Language preference' },
        text: {
          fr: 'Un cookie mémorise votre choix de langue (français ou anglais) afin que vous n\'ayez pas à le resélectionner à chaque visite.',
          en: 'A cookie remembers your language choice (French or English) so you don\'t have to reselect it on each visit.',
        },
      },
    ],

    rightsTitle: { fr: 'Vos droits', en: 'Your rights' },
    rightsItems: [
      {
        fr: 'Droit d\'accès à vos données personnelles collectées via les cookies',
        en: 'Right of access to your personal data collected via cookies',
      },
      {
        fr: 'Droit de rectification ou d\'effacement de vos données',
        en: 'Right to rectification or erasure of your data',
      },
      {
        fr: 'Droit de retirer votre consentement à tout moment sans effet rétroactif',
        en: 'Right to withdraw your consent at any time without retroactive effect',
      },
      {
        fr: 'Droit d\'opposition au traitement de vos données',
        en: 'Right to object to the processing of your data',
      },
      {
        fr: 'Droit d\'introduire une réclamation auprès de la CNIL (www.cnil.fr)',
        en: 'Right to lodge a complaint with the CNIL (www.cnil.fr)',
      },
    ],
    rightsText: {
      fr: 'Vous pouvez gérer vos préférences de cookies à tout moment via les paramètres de votre navigateur ou en nous contactant directement.',
      en: 'You can manage your cookie preferences at any time via your browser settings or by contacting us directly.',
    },

    contactTitle: { fr: 'Contact pour les demandes de données', en: 'Contact for data requests' },
    contactText: {
      fr: 'Pour toute demande relative à vos données personnelles ou à l\'exercice de vos droits, contactez notre responsable de la conformité :',
      en: 'For any request regarding your personal data or the exercise of your rights, contact our compliance officer:',
    },
    noSell: {
      fr: 'GL Capital ne vend, ne loue et ne partage aucune donnée personnelle avec des tiers à des fins commerciales.',
      en: 'GL Capital does not sell, rent, or share any personal data with third parties for commercial purposes.',
    },
  };

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-slate-50 pt-20">
        {/* Hero */}
        <section className="bg-navy-dark text-white py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <Cookie size={20} className="text-gold" />
              </div>
              <span className="text-gold text-xs font-semibold tracking-widest uppercase">{t.badge[lang]}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4 leading-tight">{t.title[lang]}</h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-2xl">{t.subtitle[lang]}</p>
            <p className="text-slate-400 text-xs mt-4">{t.updated[lang]}</p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-12 space-y-8">

          {/* What cookies */}
          <div id="what-cookies" className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-emerald-600" />
              </div>
              <h2 className="font-display text-lg font-bold text-navy">{t.whatTitle[lang]}</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-5">{t.whatText[lang]}</p>
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <th className="text-left px-4 py-3 font-semibold text-navy">Cookie</th>
                    <th className="text-left px-4 py-3 font-semibold text-navy">{lang === 'fr' ? 'Finalité' : 'Purpose'}</th>
                    <th className="text-left px-4 py-3 font-semibold text-navy">{lang === 'fr' ? 'Durée' : 'Duration'}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.cookies.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.purpose[lang]}</td>
                      <td className="px-4 py-3 text-slate-500">{c.duration[lang]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Why */}
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <h2 className="font-display text-lg font-bold text-navy mb-5">{t.whyTitle[lang]}</h2>
            <div className="space-y-4">
              {t.whyItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={17} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm mb-1">{item.title[lang]}</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.text[lang]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Your rights */}
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <UserCheck size={18} className="text-purple-600" />
              </div>
              <h2 className="font-display text-lg font-bold text-navy">{t.rightsTitle[lang]}</h2>
            </div>
            <ul className="space-y-2.5 mb-4">
              {t.rightsItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                  {item[lang]}
                </li>
              ))}
            </ul>
            <p className="text-slate-500 text-sm leading-relaxed">{t.rightsText[lang]}</p>
          </div>

          {/* Contact */}
          <div className="bg-navy rounded-2xl p-7 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Mail size={17} className="text-gold" />
              </div>
              <h2 className="font-display text-lg font-bold">{t.contactTitle[lang]}</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">{t.contactText[lang]}</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-gold font-semibold">{lang === 'fr' ? 'Email conformité :' : 'Compliance email:'}</span>{' '}
                <a href="mailto:glcontact@glcapitalinvestment.com" className="text-slate-300 hover:text-gold transition-colors">glcontact@glcapitalinvestment.com</a>
              </p>
              <p><span className="text-gold font-semibold">{lang === 'fr' ? 'Entité :' : 'Entity:'}</span>{' '}
                <span className="text-slate-300">General Luxury SA - GL Capital Investment</span>
              </p>
              <p><span className="text-gold font-semibold">{lang === 'fr' ? 'Adresse :' : 'Address:'}</span>{' '}
                <span className="text-slate-300">ARNOUVILLE, France</span>
              </p>
            </div>
            <div className="mt-5 pt-5 border-t border-white/10">
              <p className="text-slate-300 text-xs leading-relaxed font-medium">{t.noSell[lang]}</p>
            </div>
          </div>

        </section>
      </main>
      <PublicFooter />

      {/* Cookie Banner */}
      {mounted && showBanner && (
        <CookieBanner onAccept={handleAccept} onDecline={handleDecline} lang={lang} />
      )}
    </>
  );
}
