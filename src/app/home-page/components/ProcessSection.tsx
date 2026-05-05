'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProcessSection() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState<boolean[]>([false, false, false, false, false, false]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    {
      num: '01',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>,
      titleFr: 'Pré-qualification',
      titleEn: 'Pre-qualification',
      descFr: "Soumettez votre résumé exécutif. Notre équipe vérifie l'éligibilité, la cohérence du projet et les prérequis de conformité.",
      descEn: "Submit your executive summary. Our team checks eligibility, project coherence, and compliance prerequisites.",
      timingFr: '1–3 jours ouvrés',
      timingEn: '1–3 business days',
      delay: 0,
    },
    {
      num: '02',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>,
      titleFr: 'NCNDA & Engagement',
      titleEn: 'NCNDA & Engagement',
      descFr: "Signature d'un accord de non-divulgation mutuel. Le cadre de confidentialité partenaire est activé et les modalités d'engagement sont fixées.",
      descEn: "A mutual non-disclosure agreement is signed. The partner confidentiality framework is activated and engagement terms are set.",
      timingFr: '1–2 jours ouvrés',
      timingEn: '1–2 business days',
      delay: 0.1,
    },
    {
      num: '03',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>,
      titleFr: 'Revue documentaire & KYC',
      titleEn: 'Document Review & KYC',
      descFr: "Screening KYC/AML complet, contrôle de l'exhaustivité des documents et évaluation des risques (juridiction, secteur, sanctions, traçabilité des fonds).",
      descEn: "Full KYC/AML screening, document completeness check, and risk assessment (jurisdiction, sector, sanctions, fund traceability).",
      timingFr: '3–7 jours ouvrés',
      timingEn: '3–7 business days',
      delay: 0.2,
    },
    {
      num: '04',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path></svg>,
      titleFr: 'Structuration & plan de financement',
      titleEn: 'Structuring & Financing Plan',
      descFr: 'Analyse de bancabilité, restructuration du dossier si nécessaire, puis formalisation du plan de financement.',
      descEn: 'Bankability analysis, application restructuring when needed, then formalization of the financing plan.',
      timingFr: '5–10 jours ouvrés',
      timingEn: '5–10 business days',
      delay: 0.3,
    },
    {
      num: '05',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>,
      titleFr: 'Soumission à institution agréée',
      titleEn: 'Submission to Licensed Institution',
      descFr: 'Dossier transmis à des institutions financières agréées ou à des partenaires spécialisés sélectionnés. Le client est notifié via le portail.',
      descEn: 'The application is sent to selected licensed financial institutions or specialized partners. The client is notified through the portal.',
      timingFr: 'Variable',
      timingEn: 'Variable',
      delay: 0.4,
    },
    {
      num: '06',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#B8912A' }} aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>,
      titleFr: 'Suivi & clôture',
      titleEn: 'Follow-up & Closing',
      descFr: "Coordination des retours institutionnels, revue des term sheets et négociation des conditions. La clôture finale est exécutée par l'institution.",
      descEn: "Institutional feedback is coordinated, term sheets are reviewed, and conditions are negotiated. Final closing is executed by the institution.",
      timingFr: 'Variable',
      timingEn: 'Variable',
      delay: 0.5,
    },
  ];

  const statusRows = [
    { code: 'RECEIVED', fr: 'Reçu', en: 'Received', meaningFr: 'Dossier créé, documents peuvent être partiels', meaningEn: 'Case created, documents may be partial', visFr: 'Oui', visEn: 'Yes', visClass: 'text-emerald-600' },
    { code: 'TO COMPLETE', fr: 'À compléter', en: 'To Complete', meaningFr: 'Documents supplémentaires requis', meaningEn: 'Additional documents required', visFr: 'Oui + checklist', visEn: 'Yes + checklist', visClass: 'text-emerald-600' },
    { code: 'UNDER ANALYSIS', fr: 'En analyse', en: 'Under Analysis', meaningFr: 'Analyste en cours de revue', meaningEn: 'Analyst currently reviewing', visFr: 'Oui', visEn: 'Yes', visClass: 'text-emerald-600' },
    { code: 'COMPLIANCE REVIEW', fr: 'Revue conformité', en: 'Compliance Review', meaningFr: 'Screening KYC/AML en cours', meaningEn: 'KYC/AML screening in progress', visFr: 'Oui', visEn: 'Yes', visClass: 'text-emerald-600' },
    { code: 'ELIGIBLE', fr: 'Éligible', en: 'Eligible', meaningFr: 'Prêt pour structuration et soumission', meaningEn: 'Ready for structuring and submission', visFr: 'Oui', visEn: 'Yes', visClass: 'text-emerald-600' },
    { code: 'SUBMITTED', fr: 'Soumis partenaire', en: 'Partner Submitted', meaningFr: 'Transmis à institution agréée', meaningEn: 'Transmitted to licensed institution', visFr: 'Générique seulement', visEn: 'Generic only', visClass: 'text-amber-600' },
    { code: 'IN NEGOTIATION', fr: 'En négociation', en: 'In Negotiation', meaningFr: 'Term sheet en discussion', meaningEn: 'Term sheet under discussion', visFr: 'Oui', visEn: 'Yes', visClass: 'text-emerald-600' },
    { code: 'CLOSED', fr: 'Clôturé', en: 'Closed', meaningFr: 'Finalisé - raison enregistrée', meaningEn: 'Finalized - reason recorded', visFr: 'Oui + raison', visEn: 'Yes + reason', visClass: 'text-emerald-600' },
    { code: 'REJECTED', fr: 'Rejeté', en: 'Rejected', meaningFr: 'Dossier rejeté - raison catégorisée', meaningEn: 'Case rejected - reason categorized', visFr: 'Oui + raison', visEn: 'Yes + reason', visClass: 'text-emerald-600' },
  ];

  useEffect(() => {
    const observers = steps.map((step, i) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, step.delay * 1000);
          }
        },
        { threshold: 0.1 }
      );
      if (refs.current[i]) observer.observe(refs.current[i]!);
      return observer;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section className="py-24" style={{ background: '#F7F8FA' }} id="process">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono tracking-widest uppercase mb-4" style={{ color: '#B8912A' }}>{t('Notre processus', 'Our Process')}</p>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: '#1E2D4A' }}>
            {t('Du dépôt initial à la', 'From initial submission to')}{' '}
            <span className="text-gradient-gold">{t('Clôture', 'Closing')}</span>
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: '#4A5C7A' }}>
            {t(
              "Un processus structuré et traçable, de la soumission initiale à la revue de conformité puis à la soumission institutionnelle.",
              "A structured, traceable process from initial submission to compliance review and institutional submission."
            )}
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {steps.map((step, i) => (
            <div
              key={step.num}
              ref={(el) => { refs.current[i] = el; }}
              className={`relative p-6 rounded-2xl hover:-translate-y-1 transition-all duration-300 ${
                visible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-5xl font-bold font-mono leading-none" style={{ color: 'rgba(184,145,42,0.2)' }}>{step.num}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F5EDD0', border: '1px solid #D8E0EC' }}>
                  {step.icon}
                </div>
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: '#1E2D4A' }}>{t(step.titleFr, step.titleEn)}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#4A5C7A' }}>{t(step.descFr, step.descEn)}</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#B8912A' }} />
                <span className="text-xs font-medium font-mono" style={{ color: '#B8912A' }}>{t(step.timingFr, step.timingEn)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Status table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #D8E0EC' }}>
            <h3 className="font-bold" style={{ color: '#1E2D4A' }}>{t('Référence des statuts de dossier', 'Case Status Reference')}</h3>
            <span className="text-xs font-mono" style={{ color: '#4A5C7A' }}>{t('10 statuts normalisés', '10 normalized statuses')}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ background: '#F7F8FA' }}>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A5C7A' }}>{t('Statut', 'Status')}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A5C7A' }}>{t('Signification', 'Meaning')}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A5C7A' }}>{t('Visibilité client', 'Client Visibility')}</th>
                </tr>
              </thead>
              <tbody>
                {statusRows.map((row) => (
                  <tr key={row.code} className="transition-colors" style={{ borderTop: '1px solid #D8E0EC' }}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold" style={{ color: '#B8912A' }}>{row.code}</span>
                      <span className="text-xs ml-2" style={{ color: '#4A5C7A' }}>/ {t(row.fr, row.en)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#4A5C7A' }}>{t(row.meaningFr, row.meaningEn)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${row.visClass}`}>{t(row.visFr, row.visEn)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/dossier-submission-wizard"
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 active:scale-95"
            style={{ background: '#B8912A', color: '#FFFFFF' }}
          >
            {t('Démarrer votre dossier', 'Start Your Case')}
          </Link>
        </div>
      </div>
    </section>
  );
}