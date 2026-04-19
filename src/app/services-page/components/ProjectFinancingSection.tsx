'use client';
import React from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, XCircle, ArrowRight, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProjectFinancingSection() {
  const { t } = useLanguage();

  const eligibilityCriteria = [
    t('Budget de projet minimum 5M€ (sans plafond)', 'Project budget minimum €5M (no upper limit)'),
    t('Porteurs de projet identifiés avec capacité démontrée', 'Identified project sponsors with demonstrated capacity'),
    t('Secteur viable : énergie, infrastructure, immobilier, agro-industriel, télécom', 'Viable sector: energy, infrastructure, real estate, agri-industrial, telecom'),
    t('Juridiction bancable (pays non sanctionnés uniquement)', 'Bankable jurisdiction (non-sanctioned countries only)'),
    t('Apport en fonds propres disponible', 'Equity contribution available (skin in the game)'),
    t('Visibilité off-take, concession ou revenus', 'Off-take, concession, or revenue visibility'),
    t('Étude de faisabilité ou business plan disponible', 'Feasibility study or business plan available'),
  ];

  const requiredDocs = [
    { id: 'pf-exec', docFr: 'Résumé exécutif', docEn: 'Executive Summary', required: true, format: 'PDF, 2–5 pages' },
    { id: 'pf-bp', docFr: 'Business Plan / Étude de faisabilité', docEn: 'Business Plan / Feasibility Study', required: true, format: 'PDF or DOCX' },
    { id: 'pf-fin', docFr: 'Modèle financier avec hypothèses', docEn: 'Financial Model with assumptions', required: true, format: 'Excel (.xlsx)' },
    { id: 'pf-capex', docFr: 'Calendrier Capex / Opex détaillé', docEn: 'Detailed Capex / Opex schedule', required: true, format: 'Excel or PDF' },
    { id: 'pf-kyc', docFr: 'KYC porteur + Registre des sociétés', docEn: 'Sponsor KYC + Company Registry', required: true, format: 'PDF' },
    { id: 'pf-fin-stmts', docFr: 'États financiers (2–3 ans)', docEn: 'Financial statements (2–3 years)', required: false, format: t('Si entité existante', 'If existing entity') },
    { id: 'pf-contracts', docFr: 'Contrats clés (off-take, EPC, licences)', docEn: 'Key contracts (off-take, EPC, licenses)', required: false, format: t('Si disponible', 'If available') },
    { id: 'pf-equity', docFr: 'Preuve de fonds propres', docEn: 'Proof of equity / skin in the game', required: false, format: t('Relevés bancaires ou engagement', 'Bank statements or commitment') },
  ];

  const useCases = [
    { id: 'uc-solar', titleFr: 'Énergie renouvelable (Solaire, Éolien, Hydro)', titleEn: 'Renewable Energy (Solar, Wind, Hydro)', descFr: 'Structuration IPP, financement adossé PPA', descEn: 'IPP structuring, PPA-backed financing' },
    { id: 'uc-infra', titleFr: 'Infrastructure & Transport', titleEn: 'Infrastructure & Transport', descFr: 'Routes, ports, aéroports, services publics', descEn: 'Roads, ports, airports, utilities' },
    { id: 'uc-re', titleFr: 'Immobilier commercial', titleEn: 'Commercial Real Estate', descFr: 'Bureaux, commerce, développement mixte', descEn: 'Office, retail, mixed-use development' },
    { id: 'uc-agri', titleFr: 'Agro-industriel', titleEn: 'Agri-Industrial', descFr: 'Usines de transformation, irrigation, chaîne du froid', descEn: 'Processing plants, irrigation, cold chain' },
    { id: 'uc-mining', titleFr: 'Mines & Ressources', titleEn: 'Mining & Resources', descFr: 'Financement de l\'exploration à la production', descEn: 'Exploration to production financing' },
    { id: 'uc-telecom', titleFr: 'Télécom & Infrastructure numérique', titleEn: 'Telecom & Digital Infrastructure', descFr: 'Tours, fibre, centres de données', descEn: 'Towers, fiber, data centers' },
  ];

  const notEligible = [
    t('Pays sanctionnés ou secteurs interdits', 'Sanctioned countries or prohibited sectors'),
    t('Aucun porteur de projet identifié ou apport en fonds propres', 'No identified sponsor or equity contribution'),
    t('Purement spéculatif ou stade pré-concept', 'Purely speculative or pre-concept stage'),
    t('Financement personnel ou prêts à la consommation', 'Personal financing or consumer loans'),
    t('Source de fonds invérifiable', 'Unverifiable fund source'),
  ];

  const timeline = [
    { step: '01', labelFr: 'Pré-qualification', labelEn: 'Pre-qualification', durationFr: '1–3 jours', durationEn: '1–3 days' },
    { step: '02', labelFr: 'Revue KYC/AML', labelEn: 'KYC/AML Review', durationFr: '3–7 jours', durationEn: '3–7 days' },
    { step: '03', labelFr: 'Structuration', labelEn: 'Structuring', durationFr: '5–10 jours', durationEn: '5–10 days' },
    { step: '04', labelFr: 'Soumission institutionnelle', labelEn: 'Institutional Submission', durationFr: 'Variable', durationEn: 'Variable' },
  ];

  return (
    <section id="project-financing" className="py-24 scroll-mt-20" style={{ background: '#F7F8FA' }}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex items-start gap-6 mb-12">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#1E2D4A' }}>
            <Building2 size={26} style={{ color: '#B8912A' }} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-bold" style={{ color: '#1E2D4A' }}>{t('Financement de projet', 'Project Financing')}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ color: '#B8912A', border: '1px solid #D8E0EC', background: '#F5EDD0' }}>{t('À partir de 5M€', 'From €5M')}</span>
            </div>
            <p className="text-lg max-w-2xl" style={{ color: '#4A5C7A' }}>
              {t(
                'Structuration et documentation de projets d\'infrastructure, d\'énergie, d\'immobilier et industriels à grande échelle pour soumission aux institutions financières agréées et aux institutions de financement du développement.',
                'Structuring and documentation of large-scale infrastructure, energy, real estate, and industrial projects for submission to licensed financial institutions and development finance institutions.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Use cases */}
          <div>
            <h3 className="text-base font-bold mb-4" style={{ color: '#1E2D4A' }}>{t('Cas d\'usage', 'Use Cases')}</h3>
            <div className="space-y-3">
              {useCases?.map((uc) => (
                <div key={uc?.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors" style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: '#B8912A' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1E2D4A' }}>{t(uc?.titleFr, uc?.titleEn)}</p>
                    <p className="text-xs" style={{ color: '#4A5C7A' }}>{t(uc?.descFr, uc?.descEn)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility */}
          <div>
            <h3 className="text-base font-bold mb-4" style={{ color: '#1E2D4A' }}>{t('Critères d\'éligibilité', 'Eligibility Criteria')}</h3>
            <div className="space-y-2 mb-6">
              {eligibilityCriteria?.map((c, i) => (
                <div key={`pf-elig-${i}`} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm" style={{ color: '#4A5C7A' }}>{c}</p>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
              <XCircle size={14} />
              {t('Non éligible', 'Not Eligible')}
            </h4>
            <div className="space-y-1.5">
              {notEligible?.map((item, i) => (
                <div key={`pf-no-${i}`} className="flex items-start gap-2">
                  <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs" style={{ color: '#4A5C7A' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Required documents */}
          <div>
            <h3 className="text-base font-bold mb-4" style={{ color: '#1E2D4A' }}>{t('Documents requis', 'Required Documents')}</h3>
            <div className="space-y-2 mb-6">
              {requiredDocs?.map((doc) => (
                <div key={doc?.id} className="flex items-start gap-2 p-2.5 rounded-lg transition-colors hover:bg-gray-50">
                  <FileText size={13} className={`flex-shrink-0 mt-0.5 ${doc?.required ? 'text-navy-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-medium ${doc?.required ? 'text-navy-800' : 'text-gray-500'}`}>
                      {t(doc?.docFr, doc?.docEn)}
                      {doc?.required && <span className="text-red-400 ml-1">*</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">{doc?.format}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/dossier-submission-wizard"
              className="flex items-center justify-center gap-2 w-full py-3 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm"
              style={{ background: '#1E2D4A', color: '#FFFFFF' }}
            >
              {t('Soumettre un dossier de projet', 'Submit Project Dossier')}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Process preview */}
        <div className="mt-10 p-6 rounded-2xl" style={{ background: '#1E2D4A' }}>
          <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: '#B8912A' }}>{t('Calendrier type', 'Typical Timeline')}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {timeline?.map((s, i) => (
              <React.Fragment key={`pf-timeline-${s?.step}`}>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold font-mono block" style={{ color: 'rgba(184,145,42,0.3)' }}>{s?.step}</span>
                  <p className="text-white text-xs font-semibold">{t(s?.labelFr, s?.labelEn)}</p>
                  <p className="text-white/40 text-[10px] font-mono">{t(s?.durationFr, s?.durationEn)}</p>
                </div>
                {i < 3 && <div className="hidden sm:flex items-center" style={{ color: '#4A5C7A' }}>→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}