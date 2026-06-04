'use client';
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function TrustSection() {
  const { t } = useLanguage();

  const trustCards = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      ),
      badgeFr: 'Protégé NCNDA',
      badgeEn: 'NCNDA Protected',
      titleFr: 'Confidentialité partenaire',
      titleEn: 'Partner Confidentiality',
      descFr: 'Toutes les relations partenaires sont couvertes par NCNDA. Les noms et coordonnées des partenaires ne sont jamais communiqués aux clients.',
      descEn: 'All partner relationships are covered by NCNDA. Partner names and contact details are never shared with clients.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
      ),
      badgeFr: 'Conforme KYC/AML',
      badgeEn: 'KYC/AML Compliant',
      titleFr: 'Rigueur de conformité',
      titleEn: 'Compliance Rigour',
      descFr: "Chaque dossier passe un screening KYC/AML, des vérifications de sanctions et un contrôle PPE avant toute soumission.",
      descEn: 'Every application goes through KYC/AML screening, sanctions checks, and PEP verification before submission.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"></path><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"></path><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"></path><circle cx="12" cy="12" r="10"></circle></svg>
      ),
      badgeFr: '47 Pays',
      badgeEn: '47 Countries',
      titleFr: 'Réseau institutionnel',
      titleEn: 'Institutional Network',
      descFr: 'Accès à un réseau sélectionné de banques agréées, de fonds spécialisés et de conseillers en finance structurée dans plusieurs juridictions.',
      descEn: 'Access to a selected network of licensed banks, specialized funds, and structured finance advisors across multiple jurisdictions.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="m9 15 2 2 4-4"></path></svg>
      ),
      badgeFr: "Journal d\'audit immuable",
      badgeEn: 'Immutable Audit Log',
      titleFr: 'Traçabilité complète',
      titleEn: 'Full Traceability',
      descFr: "Journaux d'audit immuables pour chaque action. Versioning des documents, historique des statuts et enregistrements de décision conservés.",
      descEn: 'Immutable audit logs for every action. Document versioning, status history, and decision records are retained.',
    },
  ];

  const notItemsFr = [
    'Exécuter des transactions financières ou détenir des licences bancaires',
    "Garantir l\'approbation d\'un financement ou promettre des rendements fixes",
    "Collecter des dépôts d\'investisseurs ou proposer des investissements publics",
    'Divulguer les noms des partenaires ou les contacts institutionnels confidentiels',
  ];

  const notItemsEn = [
    'Execute financial transactions or hold banking licenses',
    'Guarantee financing approval or promise fixed returns',
    'Collect investor deposits or offer public investments',
    'Disclose partner names or confidential institutional contacts',
  ];

  const notItems = notItemsFr?.map((fr, i) => t(fr, notItemsEn?.[i]));

  return (
    <section className="py-24" style={{ background: '#F7F8FA' }} id="why-us">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono tracking-widest uppercase mb-4" style={{ color: '#B8912A' }}>{t('Pourquoi GL Capital', 'Why GL Capital')}</p>
          <h2 className="text-4xl font-bold mb-6" style={{ color: '#1E2D4A' }}>
            {t('Un cadre fondé sur des', 'A framework built on')}{' '}
            <span className="text-gradient-gold">{t('standards institutionnels', 'institutional standards')}</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {trustCards?.map((card) => (
            <div
              key={card?.titleFr}
              className="group p-6 rounded-2xl transition-all duration-300 hover:shadow-card-hover"
              style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors" style={{ background: '#F5EDD0', border: '1px solid #D8E0EC' }}>
                {card?.icon}
              </div>
              <div className="mb-3">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full" style={{ color: '#B8912A', background: '#F5EDD0', border: '1px solid #D8E0EC' }}>
                  {t(card?.badgeFr, card?.badgeEn)}
                </span>
              </div>
              <h3 className="font-bold text-base mb-3" style={{ color: '#1E2D4A' }}>{t(card?.titleFr, card?.titleEn)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#4A5C7A' }}>{t(card?.descFr, card?.descEn)}</p>
            </div>
          ))}
        </div>

        {/* What GL Capital does NOT do */}
        <div className="mt-12 rounded-2xl p-8" style={{ background: '#FFF5F5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h3 className="text-red-600 font-bold text-base mb-4 flex items-center gap-2">
            <span>⚠️</span>{' '}
            {t('Ce que GL Capital ne fait PAS', 'What GL Capital does NOT do')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {notItems?.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}