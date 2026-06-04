'use client';
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function CaseStudiesSection() {
  const { t } = useLanguage();

  const cases = [
    {
      typeFr: 'Finance de projet',
      typeEn: 'Project Finance',
      daysFr: '62 jours',
      daysEn: '62 days',
      amount: '€38M',
      sectorFr: 'Énergie renouvelable',
      sectorEn: 'Renewable Energy',
      regionFr: "Afrique de l\'Ouest",
      regionEn: 'West Africa',
      descFr: 'Projet de ferme solaire SPV. KYC/AML validé. Plan de financement structuré avec composantes dette senior et fonds propres.',
      descEn: 'Solar farm SPV project. KYC/AML validated. Financing plan structured with senior debt and equity components.',
      statusFr: 'Éligible - Soumis',
      statusEn: 'Eligible - Submitted',
    },
    {
      typeFr: 'Conseil SBLC',
      typeEn: 'SBLC Advisory',
      daysFr: '34 jours',
      daysEn: '34 days',
      amount: '€12M',
      sectorFr: 'Immobilier commercial',
      sectorEn: 'Commercial Real Estate',
      regionFr: 'Europe du Sud',
      regionEn: 'Southern Europe',
      descFr: 'Structuration de garantie de performance pour un développement mixte. Cadre SBLC documenté et soumis à la banque émettrice.',
      descEn: 'Performance guarantee structuring for a mixed-use development. SBLC framework documented and submitted to issuing bank.',
      statusFr: 'Clôturé - Succès',
      statusEn: 'Closed - Success',
    },
    {
      typeFr: 'Conseil & Structuration',
      typeEn: 'Advisory & Structuring',
      daysFr: '48 jours',
      daysEn: '48 days',
      amount: '€7.5M',
      sectorFr: 'Agro-industriel',
      sectorEn: 'Agro-industrial',
      regionFr: "Afrique de l\'Est",
      regionEn: 'East Africa',
      descFr: "Financement d\'usine de transformation. Évaluation de bancabilité complétée. Documentation restructurée pour soumission à un IFD.",
      descEn: "Processing plant financing. Bankability assessment completed. Documentation restructured for submission to a DFI.",
      statusFr: 'Éligible - En négociation',
      statusEn: 'Eligible - In Negotiation',
    },
  ];

  return (
    <section className="py-24" style={{ background: '#F7F8FA' }} id="case-studies">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono tracking-widest uppercase mb-4" style={{ color: '#4A5C7A' }}>{t('Cas anonymisés', 'Anonymized Cases')}</p>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#1E2D4A' }}>
            {t('Dossiers', 'Representative')}{' '}
            <span className="text-gradient-gold">{t('représentatifs', 'cases')}</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: '#4A5C7A' }}>
            {t(
              'Tous les dossiers sont anonymisés. Le secteur, la fourchette de montant et le type de résultat illustrent notre périmètre de conseil.',
              'All cases are anonymized. The sector, amount range, and outcome type illustrate our advisory scope.'
            )}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {cases?.map((c) => (
            <div
              key={c?.typeFr}
              className="rounded-2xl p-6 transition-all duration-300 shadow-card hover:shadow-card-hover"
              style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ color: '#B8912A', border: '1px solid #D8E0EC', background: '#F5EDD0' }}
                >
                  {t(c?.typeFr, c?.typeEn)}
                </span>
                <span className="text-xs font-mono" style={{ color: '#4A5C7A' }}>{t(c?.daysFr, c?.daysEn)}</span>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold tabular-nums" style={{ color: '#1E2D4A' }}>{c?.amount}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#4A5C7A' }}>
                  <span className="font-medium" style={{ color: '#1E2D4A' }}>{t(c?.sectorFr, c?.sectorEn)}</span>
                  <span>·</span>
                  <span>{t(c?.regionFr, c?.regionEn)}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#4A5C7A' }}>{t(c?.descFr, c?.descEn)}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#B8912A' }} />
                <span className="text-xs font-semibold" style={{ color: '#B8912A' }}>{t(c?.statusFr, c?.statusEn)}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#6B7E9A' }}>
          {t(
            'Dossiers anonymisés pour des raisons de confidentialité. GL Capital ne garantit pas de résultats similaires sur les missions futures.',
            'Cases are anonymized for confidentiality. GL Capital does not guarantee similar outcomes for future engagements.'
          )}
        </p>
      </div>
    </section>
  );
}