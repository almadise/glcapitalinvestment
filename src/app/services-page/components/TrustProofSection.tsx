'use client';
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Globe, Clock, Users, ArrowRight, Lock, FileCheck, HandshakeIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const STATS = [
  { id: 'st-1', valueFr: '12+', valueEn: '12+', labelFr: 'Pays couverts', labelEn: 'Countries covered' },
  { id: 'st-2', valueFr: '€500M+', valueEn: '€500M+', labelFr: 'Dossiers structurés', labelEn: 'Structured files' },
  { id: 'st-3', valueFr: '3–7j', valueEn: '3–7d', labelFr: 'Revue KYC initiale', labelEn: 'Initial KYC review' },
  { id: 'st-4', valueFr: '100%', valueEn: '100%', labelFr: 'Conformité NCNDA', labelEn: 'NCNDA compliant' },
];

const COMPLIANCE_BADGES = [
  {
    id: 'cb-kyc',
    icon: ShieldCheck,
    labelFr: 'KYC / AML',
    labelEn: 'KYC / AML',
    descFr: 'Revue conformité sur chaque dossier',
    descEn: 'Compliance review on every file',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'cb-ncnda',
    icon: Lock,
    labelFr: 'NCNDA',
    labelEn: 'NCNDA',
    descFr: 'Confidentialité partenaire garantie',
    descEn: 'Partner confidentiality guaranteed',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'cb-gov',
    icon: FileCheck,
    labelFr: 'Gouvernance',
    labelEn: 'Governance',
    descFr: 'Traçabilité et audit complets',
    descEn: 'Full traceability and audit',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    id: 'cb-inst',
    icon: HandshakeIcon,
    labelFr: 'Réseau institutionnel',
    labelEn: 'Institutional network',
    descFr: 'Partenaires financiers agréés uniquement',
    descEn: 'Licensed financial partners only',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
];

const CASE_EXAMPLES = [
  {
    id: 'ce-1',
    sectorFr: 'Énergie solaire – Afrique de l\'Ouest',
    sectorEn: 'Solar energy – West Africa',
    amountFr: '€28M structurés',
    amountEn: '€28M structured',
    timeFr: '45 jours',
    timeEn: '45 days',
    resultFr: 'Éligible · Soumis à 2 IFD',
    resultEn: 'Eligible · Submitted to 2 DFIs',
  },
  {
    id: 'ce-2',
    sectorFr: 'Infrastructure portuaire – Europe',
    sectorEn: 'Port infrastructure – Europe',
    amountFr: '€120M structurés',
    amountEn: '€120M structured',
    timeFr: '62 jours',
    timeEn: '62 days',
    resultFr: 'Éligible · Négociation en cours',
    resultEn: 'Eligible · Negotiation ongoing',
  },
  {
    id: 'ce-3',
    sectorFr: 'Instrument SBLC – Télécommunications',
    sectorEn: 'SBLC instrument – Telecommunications',
    amountFr: '€5M SBLC',
    amountEn: '€5M SBLC',
    timeFr: '21 jours',
    timeEn: '21 days',
    resultFr: 'Structuré · Soumis',
    resultEn: 'Structured · Submitted',
  },
];

export default function TrustProofSection() {
  const { t, lang } = useLanguage();

  return (
    <section className="py-16" style={{ background: '#F7F8FA' }}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {STATS.map((s) => (
            <div
              key={s.id}
              className="text-center p-5 rounded-2xl bg-white border border-slate-200 shadow-card"
            >
              <p className="text-3xl font-bold mb-1" style={{ color: '#1E2D4A' }}>
                {lang === 'fr' ? s.valueFr : s.valueEn}
              </p>
              <p className="text-xs text-slate-500">
                {lang === 'fr' ? s.labelFr : s.labelEn}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compliance badges */}
          <div>
            <h3 className="text-base font-bold mb-4" style={{ color: '#1E2D4A' }}>
              {t('Cadre de conformité & sécurité', 'Compliance & security framework')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMPLIANCE_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${badge.bg} ${badge.border}`}
                  >
                    <Icon size={18} className={`flex-shrink-0 mt-0.5 ${badge.color}`} />
                    <div>
                      <p className={`text-sm font-bold ${badge.color}`}>
                        {lang === 'fr' ? badge.labelFr : badge.labelEn}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {lang === 'fr' ? badge.descFr : badge.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Link
                href="/securite-conformite"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-navy transition-colors"
                style={{ color: '#1E2D4A' }}
              >
                {t('En savoir plus sur notre cadre de conformité', 'Learn more about our compliance framework')}
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Case examples */}
          <div>
            <h3 className="text-base font-bold mb-4" style={{ color: '#1E2D4A' }}>
              {t('Exemples de missions réalisées', 'Examples of completed engagements')}
            </h3>
            <div className="space-y-3">
              {CASE_EXAMPLES.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1E2D4A' }}>
                      {lang === 'fr' ? c.sectorFr : c.sectorEn}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">
                        {lang === 'fr' ? c.amountFr : c.amountEn}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={10} />
                        {lang === 'fr' ? c.timeFr : c.timeEn}
                      </span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {lang === 'fr' ? c.resultFr : c.resultEn}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic mt-3">
              {t(
                '* Les montants et délais sont représentatifs. La confidentialité des clients est préservée.',
                '* Amounts and timelines are representative. Client confidentiality is maintained.'
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
