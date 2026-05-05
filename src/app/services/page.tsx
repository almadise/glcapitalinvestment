'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { REGISTERED_ADDRESS_ONE_LINE_EN, REGISTERED_ADDRESS_ONE_LINE_FR } from '@/lib/companyContact';

// ── Icons ────────────────────────────────────────────────────────────────────

function BuildingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h6" />
      <path d="M3 15h6" />
      <path d="M12 7h6" />
      <path d="M12 12h6" />
      <path d="M12 17h6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const services = [
  {
    icon: <BuildingIcon />,
    titleFr: 'Financement de Projets',
    titleEn: 'Project Finance',
    descFr: 'Nous accompagnons les porteurs de projets dans la structuration et la documentation de leur dossier de financement. Notre rôle est celui d\'intermédiaire entre le porteur de projet et les institutions financières agréées.',
    descEn: 'We assist project owners in structuring and documenting their financing file. Our role is that of intermediary between the project owner and licensed financial institutions.',
    bulletsFr: [
      "Projets d\'infrastructure et d\'énergie",
      'Immobilier commercial et industriel',
      "Agro-industrie et projets de développement",
      'Ticket minimum : €5M',
      'Couverture mondiale - 47 pays',
    ],
    bulletsEn: [
      'Infrastructure and energy projects',
      'Commercial and industrial real estate',
      'Agro-industry and development projects',
      'Minimum ticket: €5M',
      'Global coverage - 47 countries',
    ],
  },
  {
    icon: <ShieldIcon />,
    titleFr: 'Instruments Bancaires',
    titleEn: 'Bank Instruments',
    descFr: "GL Capital accompagne les clients dans la compréhension et la documentation des instruments bancaires (SBLC, BG, MTN) utilisés comme garanties ou outils de financement structuré. Nous agissons exclusivement comme conseil documentaire et intermédiaire.",
    descEn: 'GL Capital assists clients in understanding and documenting bank instruments (SBLC, BG, MTN) used as guarantees or structured finance tools. We act exclusively as documentary advisors and intermediaries.',
    bulletsFr: [
      'Standby Letters of Credit (SBLC)',
      'Bank Guarantees (BG)',
      'Medium-Term Notes (MTN)',
      'Lettres de crédit documentaires (DLC)',
      'Conseil documentaire uniquement - aucun instrument émis par GL Capital',
    ],
    bulletsEn: [
      'Standby Letters of Credit (SBLC)',
      'Bank Guarantees (BG)',
      'Medium-Term Notes (MTN)',
      'Documentary Letters of Credit (DLC)',
      'Documentary advisory only - no instrument issued by GL Capital',
    ],
  },
  {
    icon: <ChartIcon />,
    titleFr: 'Conseil & Structuration',
    titleEn: 'Advisory & Structuring',
    descFr: "Évaluation de la bancabilité de votre projet, revue documentaire complète, pré-screening conformité KYC/AML et structuration du dossier pour soumission à des institutions financières partenaires.",
    descEn: "Assessment of your project's bankability, complete documentary review, KYC/AML compliance pre-screening and file structuring for submission to partner financial institutions.",
    bulletsFr: [
      'Évaluation de bancabilité',
      'Revue et structuration documentaire',
      'Screening KYC/AML et sanctions',
      'Préparation du dossier de soumission',
      'Suivi via portail client sécurisé',
    ],
    bulletsEn: [
      'Bankability assessment',
      'Documentary review and structuring',
      'KYC/AML and sanctions screening',
      'Submission file preparation',
      'Monitoring via secure client portal',
    ],
  },
];

const processSteps = [
  {
    num: '01',
    titleFr: 'Pré-qualification',
    titleEn: 'Pre-qualification',
    descFr: "Soumission du résumé exécutif et vérification des critères d'éligibilité.",
    descEn: 'Submission of the executive summary and verification of eligibility criteria.',
    durationFr: '1–3 jours ouvrés',
    durationEn: '1–3 business days',
  },
  {
    num: '02',
    titleFr: 'NCNDA & Engagement',
    titleEn: 'NCNDA & Engagement',
    descFr: "Signature de l\'accord de confidentialité et définition du cadre d\'engagement.",
    descEn: 'Signing of the confidentiality agreement and definition of the engagement framework.',
    durationFr: '1–2 jours ouvrés',
    durationEn: '1–2 business days',
  },
  {
    num: '03',
    titleFr: 'Revue KYC/AML',
    titleEn: 'KYC/AML Review',
    descFr: 'Screening de conformité complet avant toute soumission institutionnelle.',
    descEn: 'Complete compliance screening before any institutional submission.',
    durationFr: '3–7 jours ouvrés',
    durationEn: '3–7 business days',
  },
  {
    num: '04',
    titleFr: 'Soumission institutionnelle',
    titleEn: 'Institutional Submission',
    descFr: 'Dossier transmis aux institutions financières agréées sélectionnées.',
    descEn: 'File transmitted to selected licensed financial institutions.',
    durationFr: 'Variable',
    durationEn: 'Variable',
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { t, lang } = useLanguage();

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <PublicNavbar />
      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(ellipse, #C9A84C 0%, transparent 70%)' }} />

        <div className="relative max-w-screen-xl mx-auto px-6 lg:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span className="text-gold-400 text-xs font-mono tracking-widest uppercase">
              {t('Conseil en Financement', 'Financing Advisory')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            {t('Nos ', 'Our ')}
            <span className="text-gold-400">{t('Services', 'Services')}</span>
          </h1>
          <p className="text-white/60 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            {t(
              'GL Capital structure votre demande en dossier bancable auprès d\'institutions financières agréées. Nous n\'exécutons aucune transaction financière.',
              'GL Capital structures your request into a bankable file for submission to licensed financial institutions. We do not execute financial transactions.'
            )}
          </p>
        </div>
      </section>
      {/* ── Service Sections ── */}
      <section className="py-8 max-w-screen-xl mx-auto px-6 lg:px-10 space-y-8">
        {services?.map((svc, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={idx}
              className={`rounded-2xl border border-navy-700 overflow-hidden ${isEven ? 'bg-navy-900' : 'bg-navy-900/60'}`}
            >
              <div className={`flex flex-col lg:flex-row ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
                {/* Icon + title panel */}
                <div className="lg:w-80 flex-shrink-0 bg-navy-800/60 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 border-r-0 lg:border-r border-navy-700">
                  <div>
                    <div className="w-14 h-14 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-6">
                      {svc?.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                      {t(svc?.titleFr, svc?.titleEn)}
                    </h2>
                    <div className="w-10 h-0.5 bg-gold-500/50 rounded-full" />
                  </div>
                  <div className="mt-8">
                    <Link
                      href="/dossier-submission-wizard"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95"
                    >
                      {t('Soumettre un dossier', 'Submit a file')}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </Link>
                  </div>
                </div>

                {/* Content panel */}
                <div className="flex-1 p-8 lg:p-10">
                  <p className="text-white/60 text-base leading-relaxed mb-7">
                    {t(svc?.descFr, svc?.descEn)}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(lang === 'fr' ? svc?.bulletsFr : svc?.bulletsEn)?.map((bullet, bi) => (
                      <li key={bi} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
                          <CheckIcon />
                        </span>
                        <span className="text-white/70 text-sm leading-snug">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </section>
      {/* ── Process Timeline ── */}
      <section className="py-20 bg-navy-900/50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              {t('Notre ', 'Our ')}
              <span className="text-gold-400">{t('Processus', 'Process')}</span>
            </h2>
            <p className="text-white/40 text-sm font-mono tracking-widest uppercase">
              {t('De la pré-qualification à la soumission', 'From pre-qualification to submission')}
            </p>
          </div>

          {/* Horizontal step cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {processSteps?.map((step, idx) => (
              <div key={idx} className="relative bg-navy-900 border border-navy-700 rounded-xl p-6 flex flex-col gap-3 group hover:border-gold-500/30 transition-colors duration-200">
                {/* Connector line (desktop) */}
                {idx < processSteps?.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2 w-4 h-px bg-navy-600 z-10" />
                )}
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl font-bold text-gold-500/20 font-mono leading-none">{step?.num}</span>
                  <div className="flex-1 h-px bg-navy-700" />
                  <span className="text-[10px] font-mono text-white/30 bg-navy-800 border border-navy-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {t(step?.durationFr, step?.durationEn)}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white leading-tight">
                  {t(step?.titleFr, step?.titleEn)}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {t(step?.descFr, step?.descEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── Disclaimer ── */}
      <section className="py-12 max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-6 lg:p-8">
          <p className="text-amber-300/90 text-sm leading-relaxed">
            {t(
              `⚠️ Avis important : GL Capital Investment SA n'est pas une banque et ne détient aucune licence bancaire ou d'investissement. GL Capital n'exécute aucune transaction financière, n'émet aucun instrument bancaire, et n'accepte aucun dépôt de la part d'investisseurs. Toute transaction financière, le cas échéant, est exécutée exclusivement par des institutions financières dûment agréées. Les services proposés constituent exclusivement un accompagnement en structuration, documentation et mise en relation. ${REGISTERED_ADDRESS_ONE_LINE_FR}.`,
              `⚠️ Important notice: GL Capital Investment SA is not a bank and holds no banking or investment license. GL Capital does not execute financial transactions, does not issue bank instruments, and does not accept investor deposits. Any financial transaction, where applicable, is executed exclusively by duly licensed financial institutions. The services offered constitute exclusively structuring, documentation and introduction advisory. ${REGISTERED_ADDRESS_ONE_LINE_EN}.`
            )}
          </p>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
