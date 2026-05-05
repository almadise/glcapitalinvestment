export type CaseStatus =
  | 'RECU'
  | 'A_COMPLETER'
  | 'EN_ANALYSE'
  | 'EN_REVUE_COMPLIANCE'
  | 'ELIGIBLE'
  | 'SOUMIS_PARTENAIRE'
  | 'RETOUR_PARTENAIRE'
  | 'EN_NEGOCIATION'
  | 'CLOTURE'
  | 'REJETE';

type Lang = 'fr' | 'en';

type StatusMeta = {
  fr: string;
  en: string;
  badgeClass: string;
};

const STATUS_META: Record<CaseStatus, StatusMeta> = {
  RECU: {
    fr: 'Recu',
    en: 'Received',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  A_COMPLETER: {
    fr: 'A completer',
    en: 'To complete',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  EN_ANALYSE: {
    fr: 'En analyse',
    en: 'In analysis',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  EN_REVUE_COMPLIANCE: {
    fr: 'En revue',
    en: 'In review',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  ELIGIBLE: {
    fr: 'Eligible',
    en: 'Eligible',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  SOUMIS_PARTENAIRE: {
    fr: 'Soumis',
    en: 'Submitted',
    badgeClass: 'bg-gold/10 text-gold-dark border-gold/30',
  },
  RETOUR_PARTENAIRE: {
    fr: 'Retour partenaire',
    en: 'Partner feedback',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  EN_NEGOCIATION: {
    fr: 'En negociation',
    en: 'In negotiation',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  CLOTURE: {
    fr: 'Cloture',
    en: 'Closed',
    badgeClass: 'bg-navy/10 text-navy border-navy/20',
  },
  REJETE: {
    fr: 'Rejete',
    en: 'Rejected',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
  },
};

export const CASE_STATUS_ORDER: CaseStatus[] = [
  'RECU',
  'A_COMPLETER',
  'EN_ANALYSE',
  'EN_REVUE_COMPLIANCE',
  'ELIGIBLE',
  'SOUMIS_PARTENAIRE',
  'RETOUR_PARTENAIRE',
  'EN_NEGOCIATION',
  'CLOTURE',
];

export const ACTIVE_CASE_STATUSES: CaseStatus[] = CASE_STATUS_ORDER.filter(
  (status) => status !== 'CLOTURE'
);

const NEXT_MILESTONE: Record<CaseStatus, { fr: string; en: string }> = {
  RECU: {
    fr: 'Verification documentaire',
    en: 'Document review',
  },
  A_COMPLETER: {
    fr: 'Reception des pieces manquantes',
    en: 'Missing documents received',
  },
  EN_ANALYSE: {
    fr: 'Validation compliance',
    en: 'Compliance validation',
  },
  EN_REVUE_COMPLIANCE: {
    fr: 'Decision d eligibilite',
    en: 'Eligibility decision',
  },
  ELIGIBLE: {
    fr: 'Soumission au partenaire',
    en: 'Partner submission',
  },
  SOUMIS_PARTENAIRE: {
    fr: 'Retour institution partenaire',
    en: 'Partner institution feedback',
  },
  RETOUR_PARTENAIRE: {
    fr: 'Negociation des conditions',
    en: 'Terms negotiation',
  },
  EN_NEGOCIATION: {
    fr: 'Decision finale',
    en: 'Final decision',
  },
  CLOTURE: {
    fr: 'Dossier finalise',
    en: 'Application completed',
  },
  REJETE: {
    fr: 'Relance ou nouveau dossier',
    en: 'Resubmission or new application',
  },
};

export function getCaseStatusMeta(status: CaseStatus, lang: Lang) {
  const meta = STATUS_META[status];
  return {
    label: lang === 'fr' ? meta.fr : meta.en,
    badgeClass: meta.badgeClass,
  };
}

export function getCaseStatusLabel(status: CaseStatus, lang: Lang) {
  return lang === 'fr' ? STATUS_META[status].fr : STATUS_META[status].en;
}

export function getCaseProgressPercent(status: CaseStatus) {
  if (status === 'REJETE') return 100;
  const stepIndex = CASE_STATUS_ORDER.indexOf(status);
  if (stepIndex < 0) return 0;
  return Math.round((stepIndex / (CASE_STATUS_ORDER.length - 1)) * 100);
}

export function getNextMilestoneLabel(status: CaseStatus, lang: Lang) {
  return lang === 'fr' ? NEXT_MILESTONE[status].fr : NEXT_MILESTONE[status].en;
}
