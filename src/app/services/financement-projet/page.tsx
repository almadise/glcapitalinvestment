/* eslint-disable react/no-unescaped-entities */
'use client';
import React from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  ArrowRight,
  FileText,
  Search,
  Handshake,
  FileSignature,
  Banknote,
  Shield,
  Globe,
  Building2,
  Landmark,
  Layers,
} from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceDetailSections, ServiceHero } from '@/components/services/ServiceDetailSections';
import { projectFinanceContent } from '@/lib/content/glCapitalRedactionnel';
import { projectFinanceRegulatoryNote } from '@/lib/content/complianceDisclaimers';
import RegulatoryDisclaimerBar from '@/components/services/RegulatoryDisclaimerBar';
import { useLanguage } from '@/context/LanguageContext';

const relatedLinks = [
  {
    href: '/services/prets',
    icon: Banknote,
    titleFr: 'Prêts commerciaux',
    titleEn: 'Commercial loans',
    descFr:
      'Procédure USD (5 à 5,5 Md), taux indicatif 3 %, caution d\'assurance, prêteurs USA, Vietnam et Dubaï.',
    descEn:
      'USD procedure (5M to 5.5B), indicative 3% rate, surety bond, US, Vietnam, and Dubai lenders.',
  },
  {
    href: '/services/placement-prive',
    icon: Layers,
    titleFr: 'Placement privé',
    titleEn: 'Private placement',
    descFr: 'PPP : Small Cap à partir de 100 K ; Large Cap cash 100 M à 5 Md ; instruments 125 M à 5 Md.',
    descEn: 'PPP: Small Cap from 100K; Large Cap cash 100M to 5B; instruments 125M to 5B.',
  },
  {
    href: '/services/instruments-bancaires',
    icon: Shield,
    titleFr: 'Instruments bancaires',
    titleEn: 'Banking instruments',
    descFr: 'SBLC, BG et collatéral pour structurer un dossier avant soumission.',
    descEn: 'SBLC, BG, and collateral to structure a file before submission.',
  },
  {
    href: '/contact',
    icon: Landmark,
    titleFr: 'Soumettre un projet',
    titleEn: 'Submit a project',
    descFr: 'LOI et documents de conformité pour lancer la préqualification.',
    descEn: 'LOI and compliance documents to start pre-qualification.',
  },
] as const;

export default function FinancementProjetPage() {
  const { lang, t } = useLanguage();

  const eligibilityCriteria =
    lang === 'fr'
      ? [
          {
            icon: Banknote,
            label: 'Fourchette de montants',
            value: '2 000 000 EUR à 4 000 000 000 EUR',
          },
          { icon: Shield, label: 'Durée', value: '1 à 25 ans' },
          { icon: Building2, label: 'Taux indicatif', value: '4 %' },
          {
            icon: Globe,
            label: 'Délai de pré-qualification',
            value: 'Éligibilité vérifiable sous 48 heures',
          },
        ]
      : [
          { icon: Banknote, label: 'Amount range', value: 'EUR 2,000,000 to EUR 4,000,000,000' },
          { icon: Shield, label: 'Tenor', value: '1 to 25 years' },
          { icon: Building2, label: 'Indicative rate', value: '4%' },
          { icon: Globe, label: 'Pre-qualification', value: 'Eligibility check within 48 hours' },
        ];

  const steps =
    lang === 'fr'
      ? [
          {
            number: '01',
            icon: FileText,
            title: 'Soumission du dossier',
            description: "Lettre d'Intention (LOI) + documents de conformité",
          },
          {
            number: '02',
            icon: Search,
            title: 'Analyse de faisabilité',
            description: 'Examen par nos experts sous 48h à 10 jours ouvrés',
          },
          {
            number: '03',
            icon: Handshake,
            title: 'Mise en relation institutionnelle',
            description: 'Introduction formelle auprès des partenaires bancaires éligibles',
          },
          {
            number: '04',
            icon: FileSignature,
            title: 'Montage contractuel',
            description: 'Deed of Agreement (DOA), accord fiduciaire, apostille',
          },
          {
            number: '05',
            icon: Banknote,
            title: 'Décaissement',
            description: 'Virement des fonds sous 30 jours ouvrés après finalisation des accords',
          },
        ]
      : [
          {
            number: '01',
            icon: FileText,
            title: 'File submission',
            description: 'Letter of Intent (LOI) + compliance documents',
          },
          {
            number: '02',
            icon: Search,
            title: 'Feasibility analysis',
            description: 'Review by our experts within 48h to 10 business days',
          },
          {
            number: '03',
            icon: Handshake,
            title: 'Institutional introduction',
            description: 'Formal introduction to eligible banking partners',
          },
          {
            number: '04',
            icon: FileSignature,
            title: 'Contractual structuring',
            description: 'Deed of Agreement (DOA), fiduciary agreement, apostille',
          },
          {
            number: '05',
            icon: Banknote,
            title: 'Disbursement',
            description: 'Fund transfer within 30 business days after finalisation of agreements',
          },
        ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{
          fr: 'Financement de projets',
          en: 'Project Investment',
        }}
        titleAccent={{
          fr: "d'investissement",
          en: 'Financing',
        }}
        subtitle={projectFinanceContent.heroSubtitle}
        backgroundImage="/assets/images/financial-hero-v2.png"
      />

      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy mb-5">
            {t('Pages associées', 'Related pages')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-gold/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center">
                  <link.icon size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-navy text-sm mb-1">
                    {lang === 'fr' ? link.titleFr : link.titleEn}
                  </p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {lang === 'fr' ? link.descFr : link.descEn}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-gold text-xs font-semibold mt-auto">
                  {t('Voir', 'View')}
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ServiceDetailSections sections={projectFinanceContent.sections} showBottomCta={false} />
      {/* Eligibility */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Conditions' : 'Conditions'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? "Critères d'éligibilité" : 'Eligibility Criteria'}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr'
                ? 'Vérifiez que votre projet répond aux critères minimaux avant de soumettre votre dossier.'
                : 'Verify that your project meets the minimum criteria before submitting your file.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eligibilityCriteria?.map((item) => (
              <div
                key={`eligibility-${item?.label}`}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start gap-5"
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

          <p className="text-slate-500 text-sm text-center max-w-2xl mx-auto mt-10 leading-relaxed">
            {t(
              "Programme projet en euros ci dessus. Pour un prêt commercial en dollars (5 à 5,5 Md USD, 3 % indicatif), voir la page Prêts.",
              'Euro project programme above. For a commercial loan in US dollars (USD 5M to 5.5B, indicative 3%), see the Loans page.'
            )}{' '}
            <Link href="/services/prets" className="text-gold font-semibold hover:underline">
              {t('Prêts', 'Loans')}
            </Link>
          </p>
        </div>
      </section>
      {/* Process */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Méthodologie' : 'Methodology'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? (
                <>
                  Notre processus en <span className="text-gradient-gold">5 étapes</span>
                </>
              ) : (
                <>
                  Our <span className="text-gradient-gold">5-step process</span>
                </>
              )}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr'
                ? 'Un cadre structuré et transparent pour accompagner chaque dossier de la soumission au décaissement.'
                : 'A structured and transparent framework to guide each file from submission to disbursement.'}
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent z-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              {steps?.map((step, index) => (
                <div
                  key={`step-${step?.number}`}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-navy flex flex-col items-center justify-center mb-5 shadow-lg shadow-navy/20 group-hover:bg-gold transition-colors duration-300">
                    <span className="text-gold group-hover:text-navy text-xs font-bold tracking-widest transition-colors duration-300">
                      {lang === 'fr' ? 'ÉTAPE' : 'STEP'}
                    </span>
                    <span className="text-white group-hover:text-navy text-2xl font-display font-bold leading-none transition-colors duration-300">
                      {step?.number}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                    <step.icon size={18} className="text-gold" />
                  </div>
                  <h3 className="font-display text-base font-bold text-navy mb-2 leading-snug">
                    {step?.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step?.description}</p>
                  {index < steps?.length - 1 && (
                    <div
                      className="hidden lg:flex absolute items-center justify-center"
                      style={{ display: 'none' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-sm text-center max-w-2xl mx-auto mt-12 leading-relaxed">
            {t(
              "Ce processus en 5 étapes couvre la structuration d'un dossier de financement de projet. La demande de prêt commercial suit une procédure distincte (résumé exécutif, caution d'assurance, 12 pièces) décrite sur la page",
              'This 5 step process covers project finance dossier structuring. Commercial loan applications follow a separate procedure (executive summary, insurance surety bond, 12 documents) described on the'
            )}{' '}
            <Link href="/services/prets" className="text-gold font-semibold hover:underline">
              {t('Prêts', 'Loans')}
            </Link>
            .
          </p>
        </div>
      </section>
      {/* Partner Network */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Partenaires' : 'Partners'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-6">
              {lang === 'fr' ? 'Notre réseau' : 'Our Network'}
            </h2>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8">
              <div className="flex items-start gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <Shield size={22} className="text-gold" />
                </div>
                <p className="text-navy font-semibold text-base leading-snug">
                  {lang === 'fr' ? (
                    <>
                      GL Capital s'appuie sur un réseau de banques d'affaires, d'investisseurs
                      institutionnels et d'opérateurs financiers spécialisés en{' '}
                      <strong>Europe de l'Ouest</strong>, en <strong>Amérique du Nord</strong>, en{' '}
                      <strong>Asie</strong> et au <strong>Moyen-Orient</strong>. Les identités de
                      ces partenaires sont protégées par le secret bancaire et ne sont communiquées
                      qu'aux porteurs de dossiers éligibles, dans le cadre strict de la procédure de
                      conformité.
                    </>
                  ) : (
                    <>
                      GL Capital relies on a network of investment banks, institutional investors
                      and specialised financial operators in <strong>Western Europe</strong>,{' '}
                      <strong>North America</strong>, <strong>Asia</strong> and the{' '}
                      <strong>Middle East</strong>. The identities of these partners are protected
                      by banking secrecy and are only communicated to eligible file holders, within
                      the strict framework of the compliance procedure.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {(lang === 'fr'
                ? ["Europe de l'Ouest", 'Amérique du Nord', 'Asie', 'Moyen-Orient']
                : ['Western Europe', 'North America', 'Asia', 'Middle East']
              )?.map((region) => (
                <div
                  key={`region-${region}`}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-5 py-2.5 shadow-sm"
                >
                  <CheckCircle size={14} className="text-gold" />
                  <span className="text-navy text-sm font-medium">{region}</span>
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
            {lang === 'fr' ? 'Prêt à soumettre votre projet ?' : 'Ready to submit your project?'}
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-10">
            {lang === 'fr'
              ? "Accédez à votre espace sécurisé pour déposer votre Lettre d'Intention et vos documents de conformité."
              : 'Access your secure space to submit your Letter of Intent and compliance documents.'}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-lg shadow-gold/20"
          >
            {lang === 'fr' ? 'Soumettre mon dossier' : 'Submit my file'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <RegulatoryDisclaimerBar additionalNote={projectFinanceRegulatoryNote} />
      <PublicFooter />
    </div>
  );
}
