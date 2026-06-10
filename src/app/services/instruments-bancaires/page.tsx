/* eslint-disable react/no-unescaped-entities */
'use client';
import React from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  ArrowRight,
  Shield,
  Lock,
  FileSearch,
  Send,
  Layers,
  TrendingUp,
  Building2,
  UserCheck,
} from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceHero } from '@/components/services/ServiceDetailSections';
import { bankInstrumentsExtra } from '@/lib/content/glCapitalRedactionnel';
import { useLanguage } from '@/context/LanguageContext';

export default function InstrumentsBancairesPage() {
  const { lang } = useLanguage();

  const instruments =
    lang === 'fr'
      ? [
          {
            icon: Shield,
            code: 'BG',
            title: 'Bank Guarantee (BG)',
            description:
              "Garantie bancaire de premier rang sécurisant une transaction ou un financement. Émise par la banque de l'émetteur au bénéfice du créancier, elle constitue un engagement irrévocable de paiement.",
          },
          {
            icon: FileSearch,
            code: 'SBLC',
            title: 'SBLC',
            description:
              'Instrument de crédit documentaire émis par la banque du client au bénéfice du prêteur, garantissant le remboursement. La Standby Letter of Credit est largement reconnue dans les transactions financières internationales.',
          },
          {
            icon: Send,
            code: 'MT799',
            title: 'MT799 / POF',
            description:
              "Message SWIFT attestant de la disponibilité et du contrôle effectif des fonds, requis en due diligence. Ce message de preuve de fonds est émis par la banque de l'émetteur avant toute transaction.",
          },
          {
            icon: Lock,
            code: 'MT760',
            title: 'MT760',
            description:
              "Message SWIFT bloquant un instrument bancaire en faveur d'un bénéficiaire désigné. Ce message formalise le nantissement de l'instrument et garantit sa disponibilité exclusive.",
          },
          {
            icon: Layers,
            code: 'CF',
            title: 'Collateral First',
            description:
              "Le client apporte une BG couvrant 3 % du besoin, complétée par une contre-garantie partenaire permettant la levée de fonds. Cette structure optimise l'effet de levier tout en limitant l'exposition initiale.",
          },
          {
            icon: TrendingUp,
            code: 'TFI',
            title: 'International Trade Finance',
            description:
              'Fonds sur compte séquestre : les opérations de titres génèrent le financement sans consommer les fonds bloqués. Ce mécanisme permet de mobiliser des ressources sans immobilisation du capital.',
          },
        ]
      : [
          {
            icon: Shield,
            code: 'BG',
            title: 'Bank Guarantee (BG)',
            description:
              "First-ranking bank guarantee securing a transaction or financing. Issued by the issuer's bank in favour of the creditor, it constitutes an irrevocable payment commitment.",
          },
          {
            icon: FileSearch,
            code: 'SBLC',
            title: 'SBLC',
            description:
              "Documentary credit instrument issued by the client's bank in favour of the lender, guaranteeing repayment. The Standby Letter of Credit is widely recognised in international financial transactions.",
          },
          {
            icon: Send,
            code: 'MT799',
            title: 'MT799 / POF',
            description:
              "SWIFT message attesting the availability and effective control of funds, required in due diligence. This proof of funds message is issued by the issuer's bank before any transaction.",
          },
          {
            icon: Lock,
            code: 'MT760',
            title: 'MT760',
            description:
              'SWIFT message blocking a banking instrument in favour of a designated beneficiary. This message formalises the pledge of the instrument and guarantees its exclusive availability.',
          },
          {
            icon: Layers,
            code: 'CF',
            title: 'Collateral First',
            description:
              'The client provides a BG covering 3% of the need, supplemented by a partner counter-guarantee enabling fund raising. This structure optimises leverage while limiting initial exposure.',
          },
          {
            icon: TrendingUp,
            code: 'TFI',
            title: 'International Trade Finance',
            description:
              'Funds held in escrow: securities operations generate financing without consuming the blocked funds. This mechanism enables resources to be mobilised without tying up capital.',
          },
        ];

  const accessConditions =
    lang === 'fr'
      ? [
          {
            icon: Building2,
            label: 'Établissement bancaire agréé',
            value: 'Banque de premier rang reconnue internationalement',
          },
          {
            icon: UserCheck,
            label: 'KYC / AML complet',
            value: "Vérification d'identité et conformité anti-blanchiment obligatoires",
          },
          {
            icon: Shield,
            label: 'Contrôle effectif des actifs',
            value: 'Preuve de propriété et de disponibilité des instruments fournis',
          },
          {
            icon: FileSearch,
            label: 'Dossier de conformité préalable',
            value: 'Documentation complète soumise avant toute mise en relation',
          },
        ]
      : [
          {
            icon: Building2,
            label: 'Licensed banking institution',
            value: 'Internationally recognised first-tier bank',
          },
          {
            icon: UserCheck,
            label: 'Full KYC / AML',
            value: 'Mandatory identity verification and anti-money laundering compliance',
          },
          {
            icon: Shield,
            label: 'Effective asset control',
            value: 'Proof of ownership and availability of provided instruments',
          },
          {
            icon: FileSearch,
            label: 'Prior compliance file',
            value: 'Complete documentation submitted before any introduction',
          },
        ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{
          fr: 'Instruments bancaires',
          en: 'Banking Instruments',
        }}
        titleAccent={{
          fr: 'et montages de garantie',
          en: 'Guarantee Structures',
        }}
        subtitle={{
          fr: "GL Capital Investment SA propose à ses clients qualifiés des solutions adossées à des instruments bancaires reconnus, utilisés comme leviers de garantie pour l'accès aux lignes de crédit institutionnelles.",
          en: 'GL Capital offers qualified clients financing solutions backed by recognised banking instruments.',
        }}
        backgroundImage="/assets/images/services-hero-bg.png"
        secondarySubtitle={{
          fr: 'Nous intervenons également en qualité de Mandate Wallet pour des groupes vendeurs de crypto-actifs.',
          en: 'We are also a Mandate Wallet for cryptocurrency seller groups.',
        }}
      />
      {/* Instruments Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Instruments' : 'Instruments'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? 'Instruments disponibles' : 'Available Instruments'}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr'
                ? "Chaque instrument est sélectionné selon la nature du financement et le profil de l'émetteur."
                : 'Each instrument is selected according to the nature of the financing and the issuer profile.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instruments?.map((item) => (
              <div
                key={`instrument-${item?.code}`}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={22} className="text-gold" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gold uppercase tracking-widest">
                      {item?.code}
                    </span>
                    <h3 className="font-display text-base font-bold text-navy leading-snug">
                      {item?.title}
                    </h3>
                  </div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{item?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Purchase / lease / monetization */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? 'Prestations sur instruments' : 'Instrument services'}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {(lang === 'fr'
              ? bankInstrumentsExtra.services.fr
              : bankInstrumentsExtra.services.en
            ).map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-6 py-3 shadow-sm"
              >
                <CheckCircle size={14} className="text-gold" />
                <span className="text-navy text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center">
            <p className="text-navy font-semibold text-base leading-relaxed">
              {lang === 'fr'
                ? bankInstrumentsExtra.nonRecourse.fr
                : bankInstrumentsExtra.nonRecourse.en}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-6 text-gold font-semibold text-sm hover:underline"
            >
              {lang === 'fr' ? 'Contact' : 'Contact'}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      {/* Access Conditions */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Prérequis' : 'Prerequisites'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? "Conditions d'accès" : 'Access Conditions'}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr'
                ? "L'accès aux montages de garantie est réservé aux clients répondant aux critères de conformité suivants."
                : 'Access to guarantee structures is reserved for clients meeting the following compliance criteria.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accessConditions?.map((item) => (
              <div
                key={`condition-${item?.label}`}
                className="bg-slate-50 rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={22} className="text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    {item?.label}
                  </p>
                  <p className="text-navy font-semibold text-base leading-snug">{item?.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Confidentiality Banner */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Confidentialité' : 'Confidentiality'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-6">
              {lang === 'fr' ? 'Cadre de confidentialité' : 'Confidentiality Framework'}
            </h2>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-start gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <Shield size={22} className="text-gold" />
                </div>
                <p className="text-navy font-semibold text-base leading-snug">
                  {lang === 'fr' ? (
                    <>
                      Toutes les opérations impliquant des instruments bancaires sont traitées dans
                      le strict respect du <strong>secret bancaire</strong> et des réglementations
                      internationales en vigueur. Les détails des montages, des émetteurs et des
                      bénéficiaires ne sont communiqués qu'aux parties directement impliquées, après
                      validation du dossier de conformité.
                    </>
                  ) : (
                    <>
                      All operations involving banking instruments are processed in strict
                      compliance with <strong>banking secrecy</strong> and applicable international
                      regulations. Details of structures, issuers and beneficiaries are only
                      communicated to directly involved parties, after validation of the compliance
                      file.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {(lang === 'fr'
                ? ['Secret bancaire', 'KYC / AML', 'Conformité internationale']
                : ['Banking secrecy', 'KYC / AML', 'International compliance']
              )?.map((tag) => (
                <div
                  key={`tag-${tag}`}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-5 py-2.5 shadow-sm"
                >
                  <CheckCircle size={14} className="text-gold" />
                  <span className="text-navy text-sm font-medium">{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
            {lang === 'fr' ? 'Évaluez votre éligibilité' : 'Assess your eligibility'}
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-10">
            {lang === 'fr'
              ? 'Nos experts analysent votre profil et vous orientent vers le montage de garantie adapté à votre besoin de financement.'
              : 'Our experts analyse your profile and guide you towards the guarantee structure suited to your financing need.'}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-lg shadow-gold/20"
          >
            {lang === 'fr' ? 'Évaluer mon éligibilité' : 'Assess my eligibility'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
