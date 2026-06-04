'use client';
import React from 'react';
import Link from 'next/link';
import { Shield, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function BankingInstrumentsSection() {
  const { t } = useLanguage();

  const whatWeDo = [
    { id: 'bi-do-1', itemFr: 'Conseil sur le type d\'instrument (SBLC vs BG vs LC)', itemEn: 'Advisory on instrument type selection (SBLC vs BG vs LC)', descFr: 'Basé sur les exigences de la transaction sous-jacente', descEn: 'Based on underlying transaction requirements' },
    { id: 'bi-do-2', itemFr: 'Cadre documentaire pour les demandes d\'instruments', itemEn: 'Documentation framework for instrument requests', descFr: 'Contrat sous-jacent, objet, coordonnées du bénéficiaire', descEn: 'Underlying contract, purpose, beneficiary details' },
    { id: 'bi-do-3', itemFr: 'Structuration KYC entreprise pour soumission à la banque émettrice', itemEn: 'Corporate KYC structuring for issuing bank submission', descFr: 'Conforme aux exigences GAFI et des banques correspondantes', descEn: 'Compliant with FATF and correspondent bank requirements' },
    { id: 'bi-do-4', itemFr: 'Coordination avec les institutions émettrices agréées', itemEn: 'Coordination with licensed issuing institutions', descFr: 'Les noms des partenaires ne sont jamais divulgués au client', descEn: 'Partner names are never disclosed to the client' },
    { id: 'bi-do-5', itemFr: 'Pré-screening de conformité de la transaction sous-jacente', itemEn: 'Compliance pre-screening of underlying transaction', descFr: 'Sanctions, PPE, revue de conformité commerciale', descEn: 'Sanctions, PEP, trade compliance review' },
  ];

  const whatWeDontDo = [
    { id: 'bi-no-1', itemFr: 'Émettre, vendre ou louer des instruments bancaires', itemEn: 'Issue, sell, or lease banking instruments', descFr: 'Seules les banques agréées peuvent émettre des SBLC/BG', descEn: 'Only licensed banks can issue SBLC/BG' },
    { id: 'bi-no-2', itemFr: 'Monétiser ou "encaisser" des instruments', itemEn: 'Monetize or "cash" instruments', descFr: 'Illégal dans la plupart des juridictions sans licence bancaire', descEn: 'This is illegal in most jurisdictions without a banking license' },
    { id: 'bi-no-3', itemFr: 'Collecter des codes PIN bancaires, codes SWIFT ou identifiants privés', itemEn: 'Collect banking PINs, SWIFT codes, or private credentials', descFr: 'Jamais requis - signal d\'alerte si demandé', descEn: 'Never required - a red flag if requested' },
    { id: 'bi-no-4', itemFr: 'Garantir l\'émission ou l\'approbation d\'instruments', itemEn: 'Guarantee instrument issuance or approval', descFr: 'Décision prise exclusivement par l\'institution émettrice', descEn: 'Decision made exclusively by issuing institution' },
    { id: 'bi-no-5', itemFr: 'Participer à des programmes de trading PPP', itemEn: 'Participate in PPP trading programs', descFr: 'Les programmes à haut rendement de ce type sont frauduleux', descEn: 'High-yield programs of this nature are fraudulent' },
  ];

  const requiredInfo = [
    { id: 'bi-req-1', labelFr: 'Objet de l\'instrument', labelEn: 'Purpose of instrument', descFr: 'Garantie de performance, paiement, soumission, acompte', descEn: 'Performance, payment, bid, advance payment guarantee' },
    { id: 'bi-req-2', labelFr: 'Montant, devise, durée', labelEn: 'Amount, currency, duration', descFr: 'Spécifications exactes du contrat sous-jacent', descEn: 'Exact specifications from underlying contract' },
    { id: 'bi-req-3', labelFr: 'Forme demandée', labelEn: 'Requested form', descFr: 'Swift MT760, ICPO ou autre forme standard', descEn: 'Swift MT760, ICPO, or other standard form' },
    { id: 'bi-req-4', labelFr: 'Contrat commercial sous-jacent', labelEn: 'Underlying commercial contract', descFr: 'Le contrat que l\'instrument garantit', descEn: 'The contract the instrument is securing' },
    { id: 'bi-req-5', labelFr: 'KYC entreprise (demandeur)', labelEn: 'Corporate KYC (applicant)', descFr: 'Société + UBO - dossier KYC complet', descEn: 'Company + UBO - full KYC package' },
    { id: 'bi-req-6', labelFr: 'Preuve de capacité financière', labelEn: 'Financial capacity proof', descFr: 'Selon les exigences de l\'institution exécutante', descEn: 'As required by the executing institution' },
  ];

  return (
    <section id="banking-instruments" className="py-24 scroll-mt-20" style={{ background: '#E8EDF5' }}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex items-start gap-6 mb-12">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5EDD0', border: '1px solid #D8E0EC' }}>
            <Shield size={26} style={{ color: '#B8912A' }} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-bold" style={{ color: '#1E2D4A' }}>{t('Instruments bancaires', 'Banking Instruments')}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ color: '#B8912A', border: '1px solid #D8E0EC', background: '#F5EDD0' }}>SBLC / BG</span>
            </div>
            <p className="text-lg max-w-2xl" style={{ color: '#4A5C7A' }}>
              {t(
                'Conseil et cadre documentaire pour les lettres de crédit stand-by (SBLC) et garanties bancaires (BG). Adapté aux garanties de performance, de paiement et de soumission, avec des limites de conformité explicites.',
                'Advisory and documentation framework for Standby Letters of Credit (SBLC) and Bank Guarantees (BG). Designed for performance, payment, and bid guarantees, with clear compliance boundaries.'
              )}
            </p>
          </div>
        </div>

        {/* Critical disclaimer */}
        <div className="mb-10 p-5 rounded-2xl flex items-start gap-4" style={{ background: '#FFF8E8', border: '1px solid rgba(184,145,42,0.3)' }}>
          <AlertTriangle size={20} style={{ color: '#B8912A' }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-2" style={{ color: '#8A6B1E' }}>{t('Avis de conformité important', 'Important Compliance Notice')}</p>
            <p className="text-sm leading-relaxed" style={{ color: '#4A5C7A' }}>
              {t(
                'GL Capital fournit uniquement des services de conseil et de documentation. Nous n\'émettons pas, ne monétisons pas, ne louons pas et ne négocions pas d\'instruments bancaires. Nous ne collectons pas de codes PIN bancaires, de codes SWIFT, d\'identifiants d\'opérateurs SWIFT ni d\'informations confidentielles d\'agents bancaires. Toute demande de ce type est un signal de fraude et doit être signalée immédiatement.',
                'GL Capital provides advisory and documentation services only. We do not issue, monetize, lease, or trade banking instruments. We do not collect banking PINs, private codes, SWIFT operator credentials, or confidential banking officer information. Any such request is a fraud signal and should be reported immediately.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* What we do */}
          <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: '#1E2D4A' }}>
              <CheckCircle2 size={16} className="text-emerald-500" />
              {t('Ce que GL Capital fournit', 'What GL Capital Provides')}
            </h3>
            <div className="space-y-3">
              {whatWeDo?.map((item) => (
                <div key={item?.id} className="flex items-start gap-3">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1E2D4A' }}>{t(item?.itemFr, item?.itemEn)}</p>
                    <p className="text-xs" style={{ color: '#4A5C7A' }}>{t(item?.descFr, item?.descEn)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What we don't do */}
          <div className="rounded-2xl p-6" style={{ background: '#FFF5F5', border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 className="text-red-600 font-bold text-base mb-4 flex items-center gap-2">
              <XCircle size={16} className="text-red-500" />
              {t('Ce que GL Capital ne fait PAS', 'What GL Capital Does NOT Do')}
            </h3>
            <div className="space-y-3">
              {whatWeDontDo?.map((item) => (
                <div key={item?.id} className="flex items-start gap-3">
                  <XCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">{t(item?.itemFr, item?.itemEn)}</p>
                    <p className="text-xs text-red-500/70">{t(item?.descFr, item?.descEn)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Required information */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}>
          <h3 className="font-bold text-base mb-4" style={{ color: '#1E2D4A' }}>{t('Informations requises pour le conseil SBLC/BG', 'Required Information for SBLC/BG Advisory')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requiredInfo?.map((req) => (
              <div key={req?.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#F7F8FA', border: '1px solid #D8E0EC' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: '#B8912A' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#1E2D4A' }}>{t(req?.labelFr, req?.labelEn)}</p>
                  <p className="text-[10px]" style={{ color: '#4A5C7A' }}>{t(req?.descFr, req?.descEn)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/dossier-submission-wizard"
          className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm"
          style={{ background: '#B8912A', color: '#FFFFFF' }}
        >
          {t('Soumettre un dossier SBLC/BG', 'Submit SBLC/BG application')}
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}