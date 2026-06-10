'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Layers,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { trackCTA, trackEvent } from '@/lib/analytics/trackEvent';

interface Package {
  id: string;
  icon: React.ElementType;
  nameFr: string;
  nameEn: string;
  taglineFr: string;
  taglineEn: string;
  priceFr: string;
  priceEn: string;
  entryTicketFr: string;
  entryTicketEn: string;
  timelineFr: string;
  timelineEn: string;
  deliverablesFr: string[];
  deliverablesEn: string[];
  ctaLabelFr: string;
  ctaLabelEn: string;
  ctaHref: string;
  highlight: boolean;
  badge?: { fr: string; en: string };
}

const PACKAGES: Package[] = [
  {
    id: 'pkg-diagnostic',
    icon: Search,
    nameFr: 'Diagnostic',
    nameEn: 'Diagnostic',
    taglineFr: 'Évaluation de faisabilité et éligibilité',
    taglineEn: 'Feasibility and eligibility assessment',
    priceFr: 'Sur devis',
    priceEn: 'On request',
    entryTicketFr: 'À partir de €1M de budget projet',
    entryTicketEn: 'From €1M project budget',
    timelineFr: '7 – 10 jours',
    timelineEn: '7 – 10 days',
    deliverablesFr: [
      "Rapport d'éligibilité détaillé",
      'Analyse de conformité KYC/AML préliminaire',
      'Identification des manques documentaires',
      'Recommandations de structuration',
      'Note de faisabilité commerciale',
    ],
    deliverablesEn: [
      'Detailed eligibility report',
      'Preliminary KYC/AML compliance analysis',
      'Document gap identification',
      'Structuring recommendations',
      'Commercial feasibility note',
    ],
    ctaLabelFr: 'Démarrer un diagnostic',
    ctaLabelEn: 'Start a diagnostic',
    ctaHref: '/contact',
    highlight: false,
  },
  {
    id: 'pkg-structuration',
    icon: Layers,
    nameFr: 'Structuration',
    nameEn: 'Structuring',
    taglineFr: 'Dossier complet prêt pour présentation institutionnelle',
    taglineEn: 'Complete file ready for institutional presentation',
    priceFr: 'Sur devis',
    priceEn: 'On request',
    entryTicketFr: 'À partir de €5M (financement projet) / €1M (instruments)',
    entryTicketEn: 'From €5M (project finance) / €1M (instruments)',
    timelineFr: '21 – 30 jours',
    timelineEn: '21 – 30 days',
    deliverablesFr: [
      'Dossier de financement complet (PDF + Excel)',
      'Revue KYC/AML complète et NCNDA',
      'Modèle financier structuré avec hypothèses',
      'Executive Summary institutionnel',
      'Calendrier Capex/Opex et plan de remboursement',
      'Note de présentation partenaire',
    ],
    deliverablesEn: [
      'Complete financing application package (PDF + Excel)',
      'Full KYC/AML review and NCNDA',
      'Structured financial model with assumptions',
      'Institutional executive summary',
      'Capex/Opex schedule and repayment plan',
      'Partner presentation note',
    ],
    ctaLabelFr: 'Soumettre mon dossier',
    ctaLabelEn: 'Submit my application',
    ctaHref: '/dossier-submission-wizard',
    highlight: true,
    badge: { fr: 'Plus demandé', en: 'Most requested' },
  },
  {
    id: 'pkg-execution',
    icon: TrendingUp,
    nameFr: 'Exécution',
    nameEn: 'Execution',
    taglineFr: "Soumission active et accompagnement jusqu'à décision",
    taglineEn: 'Active submission and support through decision',
    priceFr: 'Sur devis',
    priceEn: 'On request',
    entryTicketFr: '€5M+ · Eligibilité validée requise',
    entryTicketEn: '€5M+ · Validated eligibility required',
    timelineFr: '30 – 90 jours',
    timelineEn: '30 – 90 days',
    deliverablesFr: [
      'Soumission auprès des partenaires institutionnels',
      'Suivi actif des retours partenaires',
      'Accompagnement en phase de négociation',
      'Coordination documentaire continue',
      'Rapport de progression hebdomadaire',
      'Portail client dédié avec timeline en direct',
    ],
    deliverablesEn: [
      'Submission to institutional partners',
      'Active tracking of partner feedback',
      'Support through negotiation phase',
      'Continuous document coordination',
      'Weekly progress report',
      'Dedicated client portal with live timeline',
    ],
    ctaLabelFr: 'Nous contacter',
    ctaLabelEn: 'Contact us',
    ctaHref: '/contact',
    highlight: false,
  },
];

export default function PackagesSection() {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>('pkg-structuration');

  return (
    <section className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-3"
            style={{ color: '#B8912A' }}
          >
            {t('Nos formules', 'Our packages')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#1E2D4A' }}>
            {t(
              'Trois offres. Un cadre de conformité unique.',
              'Three offers. One compliance framework.'
            )}
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">
            {t(
              'Chaque engagement est conçu selon votre stade de développement. Diagnostic pour évaluer, Structuration pour préparer, Exécution pour soumettre.',
              'Each engagement is designed for your development stage. Diagnostic to assess, Structuring to prepare, Execution to submit.'
            )}
          </p>
        </div>

        {/* Package cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            const isExpanded = expanded === pkg.id;
            const deliverables = lang === 'fr' ? pkg.deliverablesFr : pkg.deliverablesEn;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border transition-all duration-200 flex flex-col ${
                  pkg.highlight
                    ? 'border-gold shadow-gold bg-white ring-1 ring-gold/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-card-hover'
                }`}
              >
                {/* Badge */}
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white"
                      style={{ background: '#B8912A' }}
                    >
                      <Star size={10} />
                      {lang === 'fr' ? pkg.badge.fr : pkg.badge.en}
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: pkg.highlight ? '#B8912A' : '#1E2D4A' }}
                    >
                      <Icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#1E2D4A' }}>
                        {lang === 'fr' ? pkg.nameFr : pkg.nameEn}
                      </h3>
                      <p className="text-xs text-slate-500 leading-tight">
                        {lang === 'fr' ? pkg.taglineFr : pkg.taglineEn}
                      </p>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div
                      className="rounded-xl p-3"
                      style={{ background: '#F7F8FA', border: '1px solid #E8EDF5' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={11} style={{ color: '#B8912A' }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {t('Délai', 'Timeline')}
                        </span>
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#1E2D4A' }}>
                        {lang === 'fr' ? pkg.timelineFr : pkg.timelineEn}
                      </p>
                    </div>
                    <div
                      className="rounded-xl p-3"
                      style={{ background: '#F7F8FA', border: '1px solid #E8EDF5' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {t('Ticket', 'Entry')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: '#1E2D4A' }}>
                        {lang === 'fr' ? pkg.entryTicketFr : pkg.entryTicketEn}
                      </p>
                    </div>
                  </div>

                  {/* Deliverables - collapsible on mobile */}
                  <div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : pkg.id)}
                      className="flex items-center justify-between w-full mb-3 text-left"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        {t('Livrables inclus', 'Included deliverables')}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className="space-y-2 mb-4">
                        {deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2
                              size={13}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: pkg.highlight ? '#B8912A' : '#10b981' }}
                            />
                            <span className="text-xs text-slate-600">{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  <Link
                    href={pkg.ctaHref}
                    onClick={() => {
                      trackEvent('package_interest', { package: pkg.id, page: '/services-page' });
                      trackCTA(`package_${pkg.id}`, pkg.ctaHref, '/services-page');
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
                    style={
                      pkg.highlight
                        ? { background: '#B8912A', color: '#FFFFFF' }
                        : { background: '#1E2D4A', color: '#FFFFFF' }
                    }
                  >
                    {lang === 'fr' ? pkg.ctaLabelFr : pkg.ctaLabelEn}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer strip */}
        <div className="text-center">
          <p className="text-[11px] text-slate-400 italic max-w-2xl mx-auto">
            {t(
              'GL Capital Investment SA ne garantit pas les résultats de financement. Les délais sont indicatifs. Toutes les transactions sont exécutées par des institutions financières dûment agréées.',
              'GL Capital Investment SA does not guarantee financing outcomes. Timelines are indicative. All transactions are executed by duly licensed financial institutions.'
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
