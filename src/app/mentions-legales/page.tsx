'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Globe } from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';

const content = {
  fr: {
    title: 'Mentions légales',
    subtitle: 'Informations légales et réglementaires',
    sections: [
      {
        id: 'editeur',
        title: '1. Éditeur du site',
        body: `Le présent site est édité par :

**GL Capital Investment SA**
Raison sociale : GL Capital Investment SA
Numéro d'immatriculation : [Numéro RCS à compléter]
Adresse du siège social : General Luxury SA — ARNOUVILLE, France
Email : contact@glcapital.com
Téléphone : +33 984 046951`,
      },
      {
        id: 'hebergeur',title: '2. Hébergeur',
        body: `Le site est hébergé par :

**Vercel Inc.**
340 Pine Street, Suite 701
San Francisco, CA 94104
États-Unis
Site web : https://vercel.com`,
      },
      {
        id: 'directeur',title: '3. Directeur de la publication',
        body: `Le directeur de la publication est :

**GL Capital Investment SA**
Représentée par ses dirigeants légaux.`,
      },
      {
        id: 'propriete',title: '4. Propriété intellectuelle',body: `L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, sons, logiciels, etc.) constitue une œuvre protégée par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de GL Capital Investment SA.

**Tous droits réservés © 2026 GL Capital Investment SA.**`,
      },
      {
        id: 'disclaimer',
        title: '5. Avertissement — Disclaimer',
        body: `**GL Capital Investment SA n'est pas une banque**, ne collecte pas de dépôts, ne propose pas d'offre au public de titres financiers et ne fournit pas de conseil en investissement au sens de la réglementation financière applicable.

GL Capital Investment SA est une plateforme de structuration et de présentation de dossiers de financement. Elle agit exclusivement en qualité d'intermédiaire dans la mise en relation entre porteurs de projets et institutions financières dûment agréées.**Toute transaction financière est exécutée exclusivement par des institutions dûment agréées** par les autorités compétentes (AMF, ACPR, ou équivalents étrangers). GL Capital Investment SA ne garantit pas l'obtention d'un financement et ne saurait être tenue responsable des décisions prises par les partenaires financiers.

Les informations présentées sur ce site ont un caractère purement informatif et ne constituent pas une offre de services financiers réglementés.`,
      },
      {
        id: 'donnees',title: '6. Protection des données personnelles',
        body: `Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés modifiée, GL Capital Investment SA s'engage à protéger les données personnelles de ses utilisateurs.

**Base légale du traitement :** Exécution d'un contrat ou de mesures précontractuelles prises à la demande de la personne concernée (article 6.1.b du RGPD).

**Durée de conservation :** Les données personnelles sont conservées pendant une durée de **5 ans** à compter de la fin de la relation contractuelle, conformément aux obligations légales applicables.

**Droits des personnes concernées :**
Conformément au RGPD, vous disposez des droits suivants :
- Droit d'accès à vos données personnelles
- Droit de rectification
- Droit à l'effacement (« droit à l'oubli »)
- Droit à la limitation du traitement
- Droit à la portabilité des données
- Droit d'opposition

Pour exercer ces droits ou pour toute question relative à la protection de vos données, vous pouvez contacter notre délégué à la protection des données à l'adresse suivante :

**compliance@glcapital.com**`,
      },
    ],
  },
  en: {
    title: 'Legal Notice',
    subtitle: 'Legal and regulatory information',
    sections: [
      {
        id: 'editeur',
        title: '1. Website Publisher',
        body: `This website is published by:

**GL Capital Investment SA**
Company name: GL Capital Investment SA
Registration number: [RCS number to be completed]
Registered office: General Luxury SA — ARNOUVILLE, France
Email: contact@glcapital.com
Phone: +33 984 046951`,
      },
      {
        id: 'hebergeur',
        title: '2. Hosting Provider',
        body: `This website is hosted by:

**Vercel Inc.**
340 Pine Street, Suite 701
San Francisco, CA 94104
United States
Website: https://vercel.com`,
      },
      {
        id: 'directeur',
        title: '3. Publication Director',
        body: `The publication director is:

**GL Capital Investment SA**
Represented by its legal officers.`,
      },
      {
        id: 'propriete',
        title: '4. Intellectual Property',
        body: `All content on this website (texts, images, graphics, logo, icons, sounds, software, etc.) constitutes a work protected by French and international intellectual property laws.

Any reproduction, representation, modification, publication, or adaptation of all or part of the website's elements, by any means or process, is prohibited without prior written authorization from GL Capital Investment SA.

**All rights reserved © 2026 GL Capital Investment SA.**`,
      },
      {
        id: 'disclaimer',title: '5. Disclaimer',
        body: `**GL Capital Investment SA is not a bank**, does not collect deposits, does not make public offerings of financial securities, and does not provide investment advice within the meaning of applicable financial regulations.

GL Capital Investment SA is a platform for structuring and presenting financing files. It acts exclusively as an intermediary in connecting project holders with duly authorized financial institutions.

**All financial transactions are executed exclusively by duly authorized institutions** by competent authorities (AMF, ACPR, or foreign equivalents). GL Capital Investment SA does not guarantee the obtaining of financing and cannot be held responsible for decisions made by financial partners.

The information presented on this website is purely informational and does not constitute an offer of regulated financial services.`,
      },
      {
        id: 'donnees',title: '6. Personal Data Protection',
        body: `In accordance with the General Data Protection Regulation (GDPR — EU Regulation 2016/679) and the amended French Data Protection Act, GL Capital Investment SA is committed to protecting the personal data of its users.

**Legal basis for processing:** Performance of a contract or pre-contractual measures taken at the request of the data subject (Article 6.1.b of the GDPR).

**Retention period:** Personal data is retained for a period of **5 years** from the end of the contractual relationship, in accordance with applicable legal obligations.

**Rights of data subjects:**
In accordance with the GDPR, you have the following rights:
- Right of access to your personal data
- Right of rectification
- Right to erasure ("right to be forgotten")
- Right to restriction of processing
- Right to data portability
- Right to object

To exercise these rights or for any questions regarding the protection of your data, you may contact our data protection officer at:

**compliance@glcapital.com**`,
      },
    ],
  },
};

function renderBody(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={i} className="font-bold text-navy mt-3 mb-1">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.includes('**')) {
      const parts = line.split('**');
      return (
        <p key={i} className="text-slate-700 text-sm leading-relaxed mb-1">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-navy">{part}</strong> : part
          )}
        </p>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={i} className="text-slate-700 text-sm leading-relaxed ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === '') return <br key={i} />;
    return (
      <p key={i} className="text-slate-700 text-sm leading-relaxed mb-1">
        {line}
      </p>
    );
  });
}

export default function MentionsLegalesPage() {
  const { lang, setLang } = useLanguage();
  const [activeLang, setActiveLang] = useState<'fr' | 'en'>(lang as 'fr' | 'en');

  const handleLangSwitch = (l: 'fr' | 'en') => {
    setActiveLang(l);
    setLang(l);
  };

  const c = content[activeLang];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        {/* Back link */}
        <Link
          href="/home-page"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          {activeLang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy">{c.title}</h1>
            <p className="text-slate-500 mt-2">{c.subtitle}</p>
          </div>
          {/* Language switcher */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
            <Globe size={14} className="text-slate-400 ml-2" />
            {(['fr', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleLangSwitch(l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeLang === l
                    ? 'bg-navy text-white' :'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Last updated */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-8 text-sm text-amber-800">
          {activeLang === 'fr' ?'Dernière mise à jour : Avril 2026' :'Last updated: April 2026'}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {c.sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >
              <h2 className="font-display text-lg font-bold text-navy mb-4 pb-3 border-b border-slate-100">
                {section.title}
              </h2>
              <div className="space-y-1">{renderBody(section.body)}</div>
            </div>
          ))}
        </div>

        {/* Contact section */}
        <div className="mt-8 bg-navy rounded-2xl p-6 text-center">
          <p className="text-white font-semibold mb-2">
            {activeLang === 'fr' ? 'Des questions ?' : 'Questions?'}
          </p>
          <p className="text-slate-300 text-sm mb-4">
            {activeLang === 'fr' ?'Pour toute question juridique ou relative à la protection des données :' :'For any legal or data protection questions:'}
          </p>
          <a
            href="mailto:compliance@glcapital.com"
            className="inline-block bg-gold text-navy font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            compliance@glcapital.com
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
