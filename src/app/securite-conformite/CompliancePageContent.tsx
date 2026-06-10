'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  FileCheck,
  Eye,
  Server,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Key,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface AccordionItem {
  id: string;
  questionFr: string;
  questionEn: string;
  answerFr: string;
  answerEn: string;
}

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: 'faq-1',
    questionFr: 'Que couvre le processus KYC/AML ?',
    questionEn: 'What does the KYC/AML process cover?',
    answerFr:
      "Notre revue KYC (Know Your Customer) couvre l'identification des bénéficiaires effectifs (UBO), la vérification des documents d'identité, le registre des sociétés, l'origine des fonds et la conformité aux listes de sanctions internationales (OFAC, UE, ONU). Le processus AML (Anti-Money Laundering) analyse les structures de transaction et signale les opérations à risque.",
    answerEn:
      'Our KYC (Know Your Customer) review covers ultimate beneficial owner (UBO) identification, identity document verification, company registry, source of funds, and compliance with international sanctions lists (OFAC, EU, UN). The AML (Anti-Money Laundering) process analyzes transaction structures and flags high-risk operations.',
  },
  {
    id: 'faq-2',
    questionFr: "Qu'est-ce que la NCNDA et comment protège-t-elle les parties ?",
    questionEn: 'What is the NCNDA and how does it protect parties?',
    answerFr:
      "La NCNDA (Non-Circumvention Non-Disclosure Agreement) est un accord de confidentialité renforcé qui interdit toute divulgation d'informations partenaires et empêche toute tentative de contournement des relations commerciales établies. Elle est signée par toutes les parties avant tout partage d'informations sensibles sur un dossier.",
    answerEn:
      'The NCNDA (Non-Circumvention Non-Disclosure Agreement) is an enhanced confidentiality agreement that prohibits disclosure of partner information and prevents any attempt to circumvent established business relationships. It is signed by all parties before any sensitive dossier information is shared.',
  },
  {
    id: 'faq-3',
    questionFr: 'Comment mes données sont-elles stockées et protégées ?',
    questionEn: 'How is my data stored and protected?',
    answerFr:
      "Toutes les données sont hébergées sur une infrastructure cloud sécurisée avec chiffrement au repos (AES-256) et en transit (TLS 1.3). L'accès est contrôlé par authentification multi-facteurs et le principe du moindre privilège. Les documents sont stockés dans des espaces isolés par client avec traçabilité complète des accès.",
    answerEn:
      'All data is hosted on a secure cloud infrastructure with encryption at rest (AES-256) and in transit (TLS 1.3). Access is controlled by multi-factor authentication and the principle of least privilege. Documents are stored in client-isolated spaces with complete access traceability.',
  },
  {
    id: 'faq-4',
    questionFr: 'Qui a accès à mon dossier au sein de GL Capital ?',
    questionEn: 'Who has access to my file within GL Capital?',
    answerFr:
      "L'accès à votre dossier est strictement limité aux membres de l'équipe directement impliqués dans son instruction. Chaque accès est journalisé et auditable. Les partenaires externes ne reçoivent que les informations strictement nécessaires à l'analyse, après signature de la NCNDA.",
    answerEn:
      'Access to your file is strictly limited to team members directly involved in its processing. Each access is logged and auditable. External partners only receive the information strictly necessary for analysis, after signing the NCNDA.',
  },
  {
    id: 'faq-5',
    questionFr: 'GL Capital est-il une institution financière agréée ?',
    questionEn: 'Is GL Capital a licensed financial institution?',
    answerFr:
      "GL Capital Investment SA est un cabinet de conseil en structuration financière. Nous ne détenons pas de licence bancaire ou d'investissement et n'exécutons pas de transactions financières. Toutes les transactions sont réalisées exclusivement par des institutions financières dûment agréées. Notre rôle est la structuration, la documentation et la mise en relation avec des partenaires institutionnels.",
    answerEn:
      'GL Capital Investment SA is a financial structuring advisory firm. We do not hold a banking or investment license and do not execute financial transactions. All transactions are carried out exclusively by duly licensed financial institutions. Our role is structuring, documentation and introduction to institutional partners.',
  },
];

const SECURITY_PILLARS = [
  {
    id: 'sp-1',
    icon: ShieldCheck,
    titleFr: 'KYC / AML',
    titleEn: 'KYC / AML',
    descFr:
      'Revue systématique de conformité sur chaque dossier. Vérification des bénéficiaires effectifs, origine des fonds et listes de sanctions.',
    descEn:
      'Systematic compliance review on every file. Verification of beneficial owners, source of funds and sanctions lists.',
    pointsFr: [
      'Identification UBO (bénéficiaires effectifs)',
      'Vérification OFAC / UE / ONU',
      "Analyse de l'origine des fonds",
      'Évaluation du risque pays',
    ],
    pointsEn: [
      'UBO (ultimate beneficial owner) identification',
      'OFAC / EU / UN verification',
      'Source of funds analysis',
      'Country risk assessment',
    ],
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
  },
  {
    id: 'sp-2',
    icon: Lock,
    titleFr: 'NCNDA & Confidentialité',
    titleEn: 'NCNDA & Confidentiality',
    descFr:
      'Chaque engagement est couvert par un accord de non-divulgation et de non-contournement signé par toutes les parties.',
    descEn:
      'Every engagement is covered by a non-disclosure and non-circumvention agreement signed by all parties.',
    pointsFr: [
      'NCNDA bilatéral avant tout partage',
      'Confidentialité identité partenaires',
      'Interdiction de contournement',
      'Protection des introductions commerciales',
    ],
    pointsEn: [
      'Bilateral NCNDA before any sharing',
      'Partner identity confidentiality',
      'Circumvention prohibition',
      'Commercial introduction protection',
    ],
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
  },
  {
    id: 'sp-3',
    icon: FileCheck,
    titleFr: 'Gouvernance & Audit',
    titleEn: 'Governance & Audit',
    descFr:
      "Traçabilité complète de chaque action sur un dossier. Journal d'audit horodaté et exportable pour les besoins de conformité.",
    descEn:
      'Complete traceability of every action on a file. Timestamped and exportable audit log for compliance needs.',
    pointsFr: [
      "Journal d'audit complet horodaté",
      'Traçabilité des changements de statut',
      'Historique des accès aux documents',
      'Export CSV pour auditeurs',
    ],
    pointsEn: [
      'Complete timestamped audit log',
      'Status change traceability',
      'Document access history',
      'CSV export for auditors',
    ],
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-100',
  },
  {
    id: 'sp-4',
    icon: Server,
    titleFr: 'Sécurité des données',
    titleEn: 'Data security',
    descFr:
      'Infrastructure cloud sécurisée avec chiffrement de bout en bout, authentification renforcée et cloisonnement des données par client.',
    descEn:
      'Secure cloud infrastructure with end-to-end encryption, strong authentication and client data isolation.',
    pointsFr: [
      'Chiffrement AES-256 au repos',
      'Transit TLS 1.3',
      'Authentification multi-facteurs',
      'Isolation des espaces client',
    ],
    pointsEn: [
      'AES-256 encryption at rest',
      'TLS 1.3 transit',
      'Multi-factor authentication',
      'Client space isolation',
    ],
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
  },
  {
    id: 'sp-5',
    icon: Eye,
    titleFr: 'Confidentialité RGPD',
    titleEn: 'GDPR Privacy',
    descFr:
      "Vos données personnelles sont traitées conformément au règlement européen RGPD. Droit d'accès, de rectification et de suppression garantis.",
    descEn:
      'Your personal data is processed in accordance with European GDPR regulation. Right of access, rectification and deletion guaranteed.',
    pointsFr: [
      'Traitement conforme au RGPD',
      'Minimisation des données',
      "Droit d'accès et rectification",
      'Durée de conservation limitée',
    ],
    pointsEn: [
      'GDPR-compliant processing',
      'Data minimization',
      'Right of access and rectification',
      'Limited retention period',
    ],
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
  },
  {
    id: 'sp-6',
    icon: Globe,
    titleFr: 'Conformité internationale',
    titleEn: 'International compliance',
    descFr:
      'Respect des standards financiers internationaux. Exclusion systématique des juridictions sanctionnées et des secteurs prohibés.',
    descEn:
      'Adherence to international financial standards. Systematic exclusion of sanctioned jurisdictions and prohibited sectors.',
    pointsFr: [
      'Exclusion pays sanctionnés OFAC/UE/ONU',
      'Secteurs prohibés exclus',
      'Standards FATF/GAFI respectés',
      'Due diligence renforcée si nécessaire',
    ],
    pointsEn: [
      'OFAC/EU/UN sanctioned countries excluded',
      'Prohibited sectors excluded',
      'FATF standards respected',
      'Enhanced due diligence when required',
    ],
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    iconBg: 'bg-teal-100',
  },
];

function Accordion({ item }: { item: AccordionItem }) {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-navy pr-4">
          {lang === 'fr' ? item.questionFr : item.questionEn}
        </span>
        {open ? (
          <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed pt-4">
            {lang === 'fr' ? item.answerFr : item.answerEn}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CompliancePageContent() {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: 'linear-gradient(135deg, #1E2D4A 0%, #2A3D5C 100%)' }}
        />
        <div className="absolute inset-0 opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(184,145,42,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(184,145,42,0.6) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10">
            <ShieldCheck size={14} style={{ color: '#D4B055' }} />
            <p className="text-xs font-mono tracking-widest uppercase" style={{ color: '#D4B055' }}>
              {t('Conformité & Sécurité', 'Compliance & Security')}
            </p>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            {t('Un cadre rigoureux', 'A rigorous framework')}
            <br />
            <span className="text-gradient-gold">
              {t('au service de votre dossier', 'protecting your file')}
            </span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            {t(
              'Chaque dossier traité par GL Capital Investment SA suit un protocole de conformité KYC/AML, de confidentialité NCNDA et de gouvernance strictement documenté.',
              'Every file handled by GL Capital Investment SA follows a KYC/AML compliance protocol, NCNDA confidentiality, and strictly documented governance.'
            )}
          </p>
        </div>
      </section>

      {/* Disclaimer banner */}
      <div className="bg-amber-50 border-y border-amber-200 py-3">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 flex items-center gap-3">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            {t(
              "GL Capital Investment SA est un cabinet de conseil en structuration financière. Nous ne sommes pas une institution bancaire ou d'investissement agréée et n'exécutons pas de transactions financières.",
              'GL Capital Investment SA is a financial structuring advisory firm. We are not a licensed banking or investment institution and do not execute financial transactions.'
            )}
          </p>
        </div>
      </div>

      {/* Security pillars */}
      <section className="py-20" style={{ background: '#F7F8FA' }}>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#1E2D4A' }}>
              {t('6 piliers de conformité', '6 compliance pillars')}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              {t(
                'Notre approche intègre conformité, sécurité et gouvernance dans chaque étape du traitement de votre dossier.',
                'Our approach integrates compliance, security and governance at every step of processing your file.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECURITY_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const points = lang === 'fr' ? pillar.pointsFr : pillar.pointsEn;

              return (
                <div key={pillar.id} className={`rounded-2xl border p-6 bg-white ${pillar.border}`}>
                  <div
                    className={`w-11 h-11 rounded-xl ${pillar.iconBg} flex items-center justify-center mb-4`}
                  >
                    <Icon size={20} className={pillar.color} />
                  </div>
                  <h3 className={`text-base font-bold mb-2 ${pillar.color}`}>
                    {lang === 'fr' ? pillar.titleFr : pillar.titleEn}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {lang === 'fr' ? pillar.descFr : pillar.descEn}
                  </p>
                  <ul className="space-y-1.5">
                    {points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2
                          size={12}
                          className={`flex-shrink-0 mt-0.5 ${pillar.color}`}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process KYC timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#1E2D4A' }}>
              {t('Processus de revue KYC/AML', 'KYC/AML review process')}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              {t(
                'Chaque dossier suit ces étapes avant toute soumission institutionnelle.',
                'Every file follows these steps before any institutional submission.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                titleFr: 'Réception & Enregistrement',
                titleEn: 'Receipt & Registration',
                descFr:
                  "Enregistrement sécurisé du dossier. Génération d'une référence unique. Confirmation au client.",
                descEn:
                  'Secure file registration. Unique reference generation. Client confirmation.',
                durationFr: '1 jour',
                durationEn: '1 day',
                icon: Key,
              },
              {
                step: '02',
                titleFr: 'Vérification documentaire',
                titleEn: 'Document verification',
                descFr:
                  "Contrôle des pièces d'identité, registre des sociétés, documents de projet et justificatifs financiers.",
                descEn:
                  'Verification of identity documents, company registry, project documents and financial statements.',
                durationFr: '2–5 jours',
                durationEn: '2–5 days',
                icon: FileCheck,
              },
              {
                step: '03',
                titleFr: 'Revue AML & Sanctions',
                titleEn: 'AML & Sanctions review',
                descFr:
                  'Criblage sur listes de sanctions (OFAC, UE, ONU), analyse du risque pays et origine des fonds.',
                descEn:
                  'Screening on sanctions lists (OFAC, EU, UN), country risk analysis and source of funds.',
                durationFr: '2–5 jours',
                durationEn: '2–5 days',
                icon: ShieldCheck,
              },
              {
                step: '04',
                titleFr: 'Décision de conformité',
                titleEn: 'Compliance decision',
                descFr:
                  'Rapport de conformité interne. Décision : éligible, à compléter ou rejeté. Notification au client.',
                descEn:
                  'Internal compliance report. Decision: eligible, to complete, or rejected. Client notification.',
                durationFr: '1–2 jours',
                durationEn: '1–2 days',
                icon: CheckCircle2,
              },
            ].map((step, i, arr) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  {i < arr.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-full w-6 h-0.5 bg-slate-200 z-10" />
                  )}
                  <div className="rounded-2xl border border-slate-200 p-5 bg-white h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-2xl font-bold font-mono"
                        style={{ color: 'rgba(184,145,42,0.4)' }}
                      >
                        {step.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center">
                        <Icon size={16} className="text-navy" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold mb-2" style={{ color: '#1E2D4A' }}>
                      {lang === 'fr' ? step.titleFr : step.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {lang === 'fr' ? step.descFr : step.descEn}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/10 text-amber-700 border border-gold/20">
                      <CheckCircle2 size={9} />
                      {lang === 'fr' ? step.durationFr : step.durationEn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ background: '#F7F8FA' }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#1E2D4A' }}>
              {t('Questions fréquentes – Conformité', 'Frequently asked questions – Compliance')}
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <Accordion key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1E2D4A' }}>
            {t('Prêt à soumettre votre dossier ?', 'Ready to submit your file?')}
          </h2>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            {t(
              'Démarrez la procédure en toute sécurité. Notre équipe vous accompagne à chaque étape.',
              'Start the process securely. Our team guides you at every step.'
            )}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/dossier-submission-wizard"
              className="flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm"
              style={{ background: '#B8912A', color: '#FFFFFF' }}
            >
              {t('Soumettre un dossier', 'Submit a file')}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-8 py-4 font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-200 text-sm"
            >
              <Users size={16} />
              {t("Contacter l'équipe", 'Contact the team')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
