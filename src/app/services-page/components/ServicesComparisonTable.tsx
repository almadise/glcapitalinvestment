'use client';
import React from 'react';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Check = () => <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />;
const Cross = () => <XCircle size={16} className="text-red-400 mx-auto" />;
const Partial = () => <MinusCircle size={16} className="text-amber-400 mx-auto" />;

const renderCell = (val: string) => {
  if (val === 'yes' || val === 'full') return <Check />;
  if (val === 'no') return <Cross />;
  if (val === 'partial') return <Partial />;
  return <span className="text-xs text-gray-600 font-medium">{val}</span>;
};

export default function ServicesComparisonTable() {
  const { t } = useLanguage();

  const comparisonRows = [
    { id: 'cr-1', featureFr: 'Montant minimum d\'engagement', featureEn: 'Minimum engagement amount', pf: '€5M+', bi: '€1M+', adv: 'Custom' },
    { id: 'cr-2', featureFr: 'KYC/AML requis', featureEn: 'KYC/AML required', pf: 'full', bi: 'full', adv: 'partial' },
    { id: 'cr-3', featureFr: 'Préparation documentaire incluse', featureEn: 'Document preparation included', pf: 'yes', bi: 'yes', adv: 'yes' },
    { id: 'cr-4', featureFr: 'Soumission institutionnelle', featureEn: 'Institutional submission', pf: 'yes', bi: 'yes', adv: 'no' },
    { id: 'cr-5', featureFr: 'Confidentialité partenaire (NCNDA)', featureEn: 'Partner confidentiality (NCNDA)', pf: 'yes', bi: 'yes', adv: 'yes' },
    { id: 'cr-6', featureFr: 'Approbation garantie', featureEn: 'Guaranteed approval', pf: 'no', bi: 'no', adv: 'no' },
    { id: 'cr-7', featureFr: 'Durée d\'engagement type', featureEn: 'Typical engagement duration', pf: t('30–90 jours', '30–90 days'), bi: t('14–45 jours', '14–45 days'), adv: t('7–21 jours', '7–21 days') },
    { id: 'cr-8', featureFr: 'Exécution du financement', featureEn: 'Financing execution', pf: 'no', bi: 'no', adv: 'no' },
  ];

  return (
    <section className="py-16 bg-surface-muted">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-navy-900 mb-3">{t('Comparaison des services', 'Service Comparison')}</h2>
          <p className="text-gray-500 text-sm">{t('Les trois lignes de services appliquent les mêmes standards de conformité et de confidentialité', 'All three service lines follow the same compliance and confidentiality standards')}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy-900">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider w-1/3">{t('Caractéristique', 'Feature')}</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-white">
                    <div className="flex flex-col items-center gap-1">
                      <span>{t('Financement de projet', 'Project Financing')}</span>
                      <span className="text-gold-400 text-[10px] font-mono">€5M+</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-white">
                    <div className="flex flex-col items-center gap-1">
                      <span>{t('Instruments bancaires', 'Banking Instruments')}</span>
                      <span className="text-gold-400 text-[10px] font-mono">SBLC/BG</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-white">
                    <div className="flex flex-col items-center gap-1">
                      <span>{t('Conseil', 'Advisory')}</span>
                      <span className="text-gold-400 text-[10px] font-mono">Custom</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-navy-800">{t(row.featureFr, row.featureEn)}</td>
                    <td className="px-6 py-3.5 text-center">{renderCell(row.pf)}</td>
                    <td className="px-6 py-3.5 text-center">{renderCell(row.bi)}</td>
                    <td className="px-6 py-3.5 text-center">{renderCell(row.adv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 italic">
              {t(
                'GL Capital Investment SA n\'exécute pas de transactions financières, ne détient pas de licences bancaires ou d\'investissement, et ne garantit pas les résultats de financement. Toutes les transactions sont exécutées exclusivement par des institutions financières dûment agréées.',
                'GL Capital Investment SA does not execute financial transactions, does not hold banking or investment licenses, and does not guarantee financing outcomes. All transactions are executed exclusively by duly licensed financial institutions.'
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}