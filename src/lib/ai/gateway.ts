export interface DomainGuardResult {
  allowed: boolean;
  reason?: string;
}

const DOMAIN_KEYWORDS = [
  'gl capital',
  'financement',
  'financement de projet',
  'projet',
  'dossier',
  'bancable',
  'bancabilite',
  'bankability',
  'institution financiere',
  'institutionnelle',
  'instrument bancaire',
  'instruments bancaires',
  'sblc',
  'bg',
  'mtn',
  'dlc',
  'kyc',
  'aml',
  'conformite',
  'compliance',
  'sanction',
  'ofac',
  'ncnnda',
  'ncn da',
  'ncnda',
  'due diligence',
  'soumission',
  'portail client',
  'audit',
  'document',
  'documentation',
  'structuration',
  'advisory',
  'conseil',
];

const OUT_OF_SCOPE_KEYWORDS = [
  'recette de cuisine',
  'football',
  'pari sportif',
  'cinema',
  'musique',
  'politique',
  'crypto trading',
  'meme coin',
  'jeu video',
  'astrologie',
];

function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function guardDomain(message: string): DomainGuardResult {
  const text = normalize(message);
  const hasDomainSignal = DOMAIN_KEYWORDS.some((keyword) => text.includes(normalize(keyword)));
  const hasOutOfScopeSignal = OUT_OF_SCOPE_KEYWORDS.some((keyword) =>
    text.includes(normalize(keyword))
  );

  if (!hasDomainSignal || hasOutOfScopeSignal) {
    return {
      allowed: false,
      reason:
        'Je traite uniquement les sujets GL Capital: structuration de dossiers, conformité KYC/AML, instruments bancaires et soumission institutionnelle.',
    };
  }

  return { allowed: true };
}

export function buildSystemPrompt(lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    return [
      'You are GL Capital Institutional AI Gateway.',
      'You must only answer questions related to GL Capital domain:',
      '- project finance advisory',
      '- banking instruments documentation (SBLC, BG, MTN, DLC)',
      '- KYC/AML and sanctions compliance',
      '- dossier preparation and institutional submission workflows',
      '- client portal process and governance',
      'Hard rules:',
      '1) Never answer out-of-domain requests.',
      '2) If out of domain, refuse politely and redirect to GL Capital topics.',
      '3) Do not claim banking license or direct transaction execution.',
      '4) Keep institutional, concise, factual tone.',
      '5) If user asks legal/financial commitment guarantees, remind no guaranteed approval.',
    ].join('\n');
  }

  return [
    'Tu es AI Gateway Institutionnel de GL Capital.',
    'Tu dois repondre uniquement aux sujets du domaine GL Capital:',
    '- conseil en financement de projets',
    '- documentation des instruments bancaires (SBLC, BG, MTN, DLC)',
    '- conformite KYC/AML et screening sanctions',
    '- preparation des dossiers et soumission institutionnelle',
    '- processus du portail client et gouvernance',
    'Regles strictes:',
    '1) Ne jamais repondre a une demande hors domaine.',
    '2) En cas de hors domaine, refuser poliment et recentrer vers GL Capital.',
    '3) Ne jamais affirmer que GL Capital execute des transactions financieres ou detient une licence bancaire.',
    '4) Ton institutionnel, concis, factuel.',
    "5) Si l'utilisateur demande une garantie de resultat, rappeler qu'aucune approbation n'est garantie.",
  ].join('\n');
}
