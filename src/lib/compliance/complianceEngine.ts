/**
 * GL Capital - Compliance Rule Engine
 * Auto-validates country restrictions, entity types, and ownership thresholds
 * before dossier data is persisted to Supabase.
 */

export type ComplianceSeverity = 'BLOCK' | 'FLAG' | 'WARN';

export interface ComplianceViolation {
  code: string;
  severity: ComplianceSeverity;
  message: string;
  field?: string;
}

export interface ComplianceResult {
  passed: boolean;
  blocked: boolean;
  violations: ComplianceViolation[];
}

// ─── Restricted / High-Risk Countries ────────────────────────────────────────
// FATF blacklist + EU/UN high-risk jurisdictions
const BLOCKED_COUNTRIES = new Set([
  'IR', // Iran
  'KP', // North Korea
  'SY', // Syria
  'CU', // Cuba
  'SD', // Sudan
  'LY', // Libya (conflict zone)
  'YE', // Yemen (conflict zone)
  'MM', // Myanmar
  'BY', // Belarus
  'RU', // Russia (OFAC/EU sanctions)
]);

// FATF grey-list / enhanced due-diligence required
const HIGH_RISK_COUNTRIES = new Set([
  'AF', // Afghanistan
  'AL', // Albania
  'BB', // Barbados
  'BF', // Burkina Faso
  'CM', // Cameroon
  'CD', // DR Congo
  'GI', // Gibraltar
  'HT', // Haiti
  'JM', // Jamaica
  'JO', // Jordan
  'ML', // Mali
  'MZ', // Mozambique
  'NG', // Nigeria
  'PA', // Panama
  'PH', // Philippines
  'SN', // Senegal (FATF grey-list)
  'SS', // South Sudan
  'TZ', // Tanzania
  'TT', // Trinidad & Tobago
  'UG', // Uganda
  'AE', // UAE (enhanced monitoring)
  'VN', // Vietnam
]);

// ─── Restricted Entity Types ──────────────────────────────────────────────────
// Entity types that require additional scrutiny or are blocked
const BLOCKED_ENTITY_TYPES = new Set(['shell', 'anonymous_trust', 'bearer_shares']);

const HIGH_RISK_ENTITY_TYPES = new Set([
  'individual', // Sole proprietors require enhanced KYC
]);

// ─── Ownership Thresholds ─────────────────────────────────────────────────────
const UBO_DISCLOSURE_THRESHOLD = 25; // % - EU 4AMLD standard
const UBO_HIGH_RISK_THRESHOLD = 10; // % - enhanced due-diligence threshold

// ─── Amount Thresholds (EUR) ──────────────────────────────────────────────────
const MIN_FINANCING_AMOUNT = 500_000; // EUR - minimum ticket size
const MAX_UNVERIFIED_AMOUNT = 50_000_000; // EUR - above this requires enhanced review

// ─── Rule Definitions ─────────────────────────────────────────────────────────

interface DossierPayload {
  orgCountry?: string;
  uboNationality?: string;
  orgType?: string;
  uboOwnership?: string | number;
  projectCountry?: string;
  totalBudget?: string | number;
  currency?: string;
  requestType?: string;
  fundSource?: string;
}

function parseAmount(value: string | number | undefined): number {
  if (!value) return 0;
  const str = String(value).replace(/[^0-9.]/g, '');
  return parseFloat(str) || 0;
}

function parseOwnership(value: string | number | undefined): number {
  if (!value) return 0;
  const str = String(value).replace(/[^0-9.]/g, '');
  return parseFloat(str) || 0;
}

// Rule 1: Blocked country check (org registration)
function checkBlockedOrgCountry(data: DossierPayload): ComplianceViolation | null {
  if (data.orgCountry && BLOCKED_COUNTRIES.has(data.orgCountry.toUpperCase())) {
    return {
      code: 'COUNTRY_BLOCKED_ORG',
      severity: 'BLOCK',
      message: `Organizations registered in ${data.orgCountry} are subject to international sanctions and cannot be processed.`,
      field: 'orgCountry',
    };
  }
  return null;
}

// Rule 2: Blocked country check (project location)
function checkBlockedProjectCountry(data: DossierPayload): ComplianceViolation | null {
  if (data.projectCountry && BLOCKED_COUNTRIES.has(data.projectCountry.toUpperCase())) {
    return {
      code: 'COUNTRY_BLOCKED_PROJECT',
      severity: 'BLOCK',
      message: `Projects located in ${data.projectCountry} cannot be financed due to active sanctions.`,
      field: 'projectCountry',
    };
  }
  return null;
}

// Rule 3: UBO nationality blocked
function checkBlockedUBONationality(data: DossierPayload): ComplianceViolation | null {
  if (data.uboNationality && BLOCKED_COUNTRIES.has(data.uboNationality.toUpperCase())) {
    return {
      code: 'UBO_NATIONALITY_BLOCKED',
      severity: 'BLOCK',
      message: `Beneficial owners holding nationality from ${data.uboNationality} are subject to sanctions restrictions.`,
      field: 'uboNationality',
    };
  }
  return null;
}

// Rule 4: High-risk country - flag for enhanced due diligence
function checkHighRiskCountry(data: DossierPayload): ComplianceViolation | null {
  const country = data.orgCountry || data.projectCountry;
  if (country && HIGH_RISK_COUNTRIES.has(country.toUpperCase())) {
    return {
      code: 'COUNTRY_HIGH_RISK',
      severity: 'FLAG',
      message: `This jurisdiction (${country}) is on the FATF enhanced monitoring list. Enhanced due diligence documentation will be required.`,
      field: 'orgCountry',
    };
  }
  return null;
}

// Rule 5: Blocked entity type
function checkBlockedEntityType(data: DossierPayload): ComplianceViolation | null {
  if (data.orgType && BLOCKED_ENTITY_TYPES.has(data.orgType.toLowerCase())) {
    return {
      code: 'ENTITY_TYPE_BLOCKED',
      severity: 'BLOCK',
      message: `Entity type "${data.orgType}" is not eligible for financing. Anonymous structures and bearer-share companies are prohibited.`,
      field: 'orgType',
    };
  }
  return null;
}

// Rule 6: High-risk entity type - flag
function checkHighRiskEntityType(data: DossierPayload): ComplianceViolation | null {
  if (data.orgType && HIGH_RISK_ENTITY_TYPES.has(data.orgType.toLowerCase())) {
    return {
      code: 'ENTITY_TYPE_HIGH_RISK',
      severity: 'FLAG',
      message: `Individual / sole proprietor submissions require enhanced KYC verification and personal financial statements.`,
      field: 'orgType',
    };
  }
  return null;
}

// Rule 7: UBO ownership threshold - disclosure required above 25%
function checkUBOOwnershipThreshold(data: DossierPayload): ComplianceViolation | null {
  const ownership = parseOwnership(data.uboOwnership);
  if (ownership > 0 && ownership < UBO_DISCLOSURE_THRESHOLD) {
    return {
      code: 'UBO_BELOW_DISCLOSURE_THRESHOLD',
      severity: 'WARN',
      message: `UBO ownership declared at ${ownership}% is below the 25% disclosure threshold. Verify if additional UBOs exist above this threshold.`,
      field: 'uboOwnership',
    };
  }
  if (ownership > 75) {
    return {
      code: 'UBO_DOMINANT_OWNERSHIP',
      severity: 'FLAG',
      message: `UBO ownership of ${ownership}% indicates dominant control. Concentration of ownership requires additional governance documentation.`,
      field: 'uboOwnership',
    };
  }
  return null;
}

// Rule 8: High-risk country + individual entity = block
function checkHighRiskCountryIndividual(data: DossierPayload): ComplianceViolation | null {
  const isHighRisk =
    (data.orgCountry && HIGH_RISK_COUNTRIES.has(data.orgCountry.toUpperCase())) ||
    (data.uboNationality && HIGH_RISK_COUNTRIES.has(data.uboNationality.toUpperCase()));
  const isIndividual = data.orgType?.toLowerCase() === 'individual';
  if (isHighRisk && isIndividual) {
    return {
      code: 'HIGH_RISK_INDIVIDUAL_BLOCKED',
      severity: 'BLOCK',
      message: `Individual submissions from high-risk jurisdictions are not accepted. Please submit through a registered legal entity.`,
      field: 'orgType',
    };
  }
  return null;
}

// Rule 9: Minimum financing amount
function checkMinimumAmount(data: DossierPayload): ComplianceViolation | null {
  const amount = parseAmount(data.totalBudget);
  if (amount > 0 && amount < MIN_FINANCING_AMOUNT) {
    return {
      code: 'AMOUNT_BELOW_MINIMUM',
      severity: 'BLOCK',
      message: `Requested financing of ${data.currency || 'EUR'} ${amount.toLocaleString()} is below the minimum ticket size of EUR 500,000.`,
      field: 'totalBudget',
    };
  }
  return null;
}

// Rule 10: Large transaction enhanced review
function checkLargeTransaction(data: DossierPayload): ComplianceViolation | null {
  const amount = parseAmount(data.totalBudget);
  if (amount >= MAX_UNVERIFIED_AMOUNT) {
    return {
      code: 'LARGE_TRANSACTION_REVIEW',
      severity: 'FLAG',
      message: `Financing request exceeds EUR 50M. This submission will be routed for enhanced compliance review and senior approval.`,
      field: 'totalBudget',
    };
  }
  return null;
}

// Rule 11: Fund source - cash/undisclosed flagged
function checkFundSource(data: DossierPayload): ComplianceViolation | null {
  const risky = ['cash', 'undisclosed', 'unknown', 'crypto', 'cryptocurrency'];
  if (data.fundSource && risky.some((r) => data.fundSource!.toLowerCase().includes(r))) {
    return {
      code: 'FUND_SOURCE_SUSPICIOUS',
      severity: 'BLOCK',
      message: `Fund source "${data.fundSource}" is not acceptable. All financing must originate from verifiable, documented banking sources.`,
      field: 'fundSource',
    };
  }
  return null;
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function runComplianceCheck(data: DossierPayload): ComplianceResult {
  const rules = [
    checkBlockedOrgCountry,
    checkBlockedProjectCountry,
    checkBlockedUBONationality,
    checkHighRiskCountry,
    checkBlockedEntityType,
    checkHighRiskEntityType,
    checkUBOOwnershipThreshold,
    checkHighRiskCountryIndividual,
    checkMinimumAmount,
    checkLargeTransaction,
    checkFundSource,
  ];

  const violations: ComplianceViolation[] = [];

  for (const rule of rules) {
    const violation = rule(data);
    if (violation) {
      violations.push(violation);
    }
  }

  const blocked = violations.some((v) => v.severity === 'BLOCK');
  const passed = violations.length === 0;

  return { passed, blocked, violations };
}

export function getComplianceStatus(result: ComplianceResult): 'COMPLIANT' | 'FLAGGED' | 'BLOCKED' {
  if (result.blocked) return 'BLOCKED';
  if (!result.passed) return 'FLAGGED';
  return 'COMPLIANT';
}
