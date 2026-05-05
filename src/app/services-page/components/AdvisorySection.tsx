'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BarChart3, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdvisorySection() {
  const { t } = useLanguage();

  const advisoryServices = [
    {
      id: 'adv-bankability',
      titleFr: 'Évaluation de bancabilité',
      titleEn: 'Bankability Assessment',
      descFr: 'Revue indépendante de votre projet ou transaction au regard des critères de prêt institutionnels. Identifie les écarts avant la soumission formelle.',
      descEn: 'Independent review of your project or transaction against institutional lending criteria. Identifies gaps before formal submission.',
      deliverableFr: 'Rapport de bancabilité écrit',
      deliverableEn: 'Written bankability report',
      timelineFr: '5–10 jours',
      timelineEn: '5–10 days',
    },
    {
      id: 'adv-doc',
      titleFr: 'Revue & structuration documentaire',
      titleEn: 'Documentation Review & Structuring',
      descFr: 'Revue complète et restructuration du dossier : résumé exécutif, business plan, modèle financier et KYC.',
      descEn: 'Complete review and restructuring of the application package: executive summary, business plan, financial model, and KYC.',
      deliverableFr: 'Documents annotés + structure révisée',
      deliverableEn: 'Annotated documents + revised structure',
      timelineFr: '7–14 jours',
      timelineEn: '7–14 days',
    },
    {
      id: 'adv-compliance',
      titleFr: 'Pré-screening KYC/AML',
      titleEn: 'KYC/AML Pre-Screening',
      descFr: 'Contrôle de conformité avant soumission : vérification d\'identité, screening des sanctions, revue PPE et validation de la source des fonds.',
      descEn: 'Pre-submission compliance check: identity verification, sanctions screening, PEP review, and source-of-funds validation.',
      deliverableFr: 'Rapport de pré-validation conformité',
      deliverableEn: 'Compliance pre-clearance report',
      timelineFr: '3–7 jours',
      timelineEn: '3–7 days',
    },
    {
      id: 'adv-fin-plan',
      titleFr: 'Optimisation du plan de financement',
      titleEn: 'Financing Plan Optimization',
      descFr: 'Revue et optimisation de la structure dette/fonds propres, du package de garanties et de la stratégie de présentation institutionnelle.',
      descEn: 'Review and optimization of debt/equity structure, guarantee package, and institutional submission strategy.',
      deliverableFr: 'Plan de financement révisé',
      deliverableEn: 'Revised financing plan',
      timelineFr: '5–10 jours',
      timelineEn: '5–10 days',
    },
  ];

  const forWhom = [
    {
      id: 'for-1',
      titleFr: 'Porteurs de projet novices',
      titleEn: 'First-time project sponsors',
      descFr: 'Entreprises ou porteurs de projet sollicitant un financement institutionnel pour la première fois et ayant besoin d\'un cadre documentaire clair.',
      descEn: 'Companies or project sponsors seeking institutional financing for the first time and needing clear documentation guidance.',
    },
    {
      id: 'for-2',
      titleFr: 'Dossiers précédemment rejetés',
      titleEn: 'Previously rejected applications',
      descFr: 'Projets rejetés par des banques ou IFD qui nécessitent une analyse des causes de rejet et un plan de remédiation.',
      descEn: 'Projects rejected by banks or DFIs that require analysis of rejection causes and a remediation plan.',
    },
    {
      id: 'for-3',
      titleFr: 'Structures multi-parties complexes',
      titleEn: 'Complex multi-party structures',
      descFr: 'SPV, coentreprises ou projets multi-juridictions nécessitant une expertise de structuration spécialisée.',
      descEn: 'SPVs, joint ventures, or multi-jurisdiction projects that require specialized structuring expertise.',
    },
  ];

  return (
    <section id="advisory" className="py-24 scroll-mt-20" style={{ background: '#F7F8FA' }}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header with image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#1E2D4A' }}>
              <BarChart3 size={26} style={{ color: '#B8912A' }} />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-2" style={{ color: '#1E2D4A' }}>{t('Conseil & Structuration', 'Advisory & Structuring')}</h2>
              <p className="text-lg max-w-2xl" style={{ color: '#4A5C7A' }}>
                {t(
                  'Évaluation de bancabilité, revue documentaire, pré-screening conformité et structuration de dossier. Pour les clients qui ont besoin d\'un cadrage expert avant la soumission formelle ou en appui parallèle.',
                  'Bankability assessment, documentation review, compliance pre-screening, and application structuring. For clients who need expert guidance before formal submission or as parallel support.'
                )}
              </p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-56 hidden lg:block">
            <Image
              src="/assets/images/advisory-consultation.png"
              alt="Financial advisory experts reviewing structuring diagrams in a professional office"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0" style={{ background: 'rgba(30,45,74,0.15)' }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {advisoryServices?.map((svc) => (
            <div key={svc?.id} className="rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300" style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}>
              <h3 className="font-bold text-base mb-3" style={{ color: '#1E2D4A' }}>{t(svc?.titleFr, svc?.titleEn)}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#4A5C7A' }}>{t(svc?.descFr, svc?.descEn)}</p>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #D8E0EC' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span className="text-xs font-medium" style={{ color: '#4A5C7A' }}>{t(svc?.deliverableFr, svc?.deliverableEn)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#B8912A' }}>
                  <Clock size={11} />
                  {t(svc?.timelineFr, svc?.timelineEn)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Who is this for */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: '#1E2D4A' }}>
          <h3 className="text-white font-bold text-lg mb-6">{t('À qui s\'adresse le Conseil & Structuration ?', 'Who Is Advisory & Structuring For?')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {forWhom?.map((item) => (
              <div key={item?.id}>
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#B8912A' }}>{t(item?.titleFr, item?.titleEn)}</h4>
                <p className="text-white/60 text-sm leading-relaxed">{t(item?.descFr, item?.descEn)}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/dossier-submission-wizard"
          className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm"
          style={{ background: '#1E2D4A', color: '#FFFFFF' }}
        >
          {t('Demander des services de conseil', 'Request Advisory Services')}
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}