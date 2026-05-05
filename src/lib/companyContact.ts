/**
 * Coordonnées officielles — document « ENTETE GL GENERAL LUXURY FRANCE & WORLD OFFICE ».
 */

export const OFFICIAL_PUBLIC_EMAIL = 'glcapitalinvestment@gmail.com';

export const OFFICIAL_WEBSITE_URL = 'https://www.glcapitalinvestment.com';

export const OFFICIAL_WEBSITE_DISPLAY = 'www.glcapitalinvestment.com';

export const ENTITY_GL_CAPITAL = 'GL Capital Investment SA';
export const PARIS_WORLD_OFFICE = 'Paris-France & World Office';

export const ENTITY_GENERAL_LUXURY = 'General Luxury SA';

/** Siège social indiqué sur l'en-tête (Espagne) */
export const REGISTERED_ADDRESS_LINES_FR = [
  'General Luxury SA',
  'Calle Nord 35',
  '17700 La Jonquera, Girona',
  'Espagne',
] as const;

export const REGISTERED_ADDRESS_LINES_EN = [
  'General Luxury SA',
  'Calle Nord 35',
  '17700 La Jonquera, Girona',
  'Spain',
] as const;

export const REGISTERED_ADDRESS_ONE_LINE_FR = REGISTERED_ADDRESS_LINES_FR.join(' — ');

export const REGISTERED_ADDRESS_ONE_LINE_EN = REGISTERED_ADDRESS_LINES_EN.join(' — ');

/** Adresse sans raison sociale (mentions légales, etc.) */
export const REGISTERED_ADDRESS_STREET_FR = REGISTERED_ADDRESS_LINES_FR.slice(1).join(', ');

export const REGISTERED_ADDRESS_STREET_EN = REGISTERED_ADDRESS_LINES_EN.slice(1).join(', ');

export const GENERAL_LUXURY_NIE = 'N.I.E. A.550 16 695';

export const REGISTRO_MERCANTIL_CERT =
  'Registro Mercantil Central (Sección de Denominaciones), Madrid — Certificación N° 08148432';

/**
 * Expéditeur Resend si `RESEND_FROM_EMAIL` est absent.
 * Resend refuse les domaines non vérifiés (ex. gmail.com) : voir https://resend.com/domains
 * En prod : définir `RESEND_FROM_EMAIL` avec un domaine vérifié (ex. noreply@glcapitalinvestment.com).
 */
export const RESEND_FROM_FALLBACK = 'GL Capital <onboarding@resend.dev>';

export const CONTACT_EMAIL_FALLBACK = OFFICIAL_PUBLIC_EMAIL;

/** Pied d'emails transactionnels (une ligne) */
export const TRANSACTIONAL_EMAIL_FOOTER_LINE = `${ENTITY_GL_CAPITAL} · ${PARIS_WORLD_OFFICE} · ${REGISTERED_ADDRESS_ONE_LINE_EN}`;
