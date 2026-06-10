/**
 * Formulations réglementaires harmonisées (site public).
 * À utiliser sur les pages financières ; ne pas présenter comme conseil juridique.
 */

import type { Bilingual } from '@/lib/content/glCapitalRedactionnel';

export const siteRegulatoryDisclaimer: Bilingual = {
  fr: "GL Capital Investment SA n'est pas un établissement de crédit ni une banque. Elle structure les dossiers et assure la mise en relation ; les opérations financières sont exécutées par des institutions agréées. Aucun rendement ni décaissement n'est garanti.",
  en: 'GL Capital Investment SA is not a credit institution or a bank. It structures files and facilitates introductions; financial operations are carried out by licensed institutions. No return or disbursement is guaranteed.',
};

export const pppRegulatoryNote: Bilingual = {
  fr: "Les programmes de placement privé ne constituent pas une offre publique continue. Participation sur invitation, après conformité. Fourchettes indicatives : Small Cap à partir de 100 K USD/EUR ; Large Cap (cash) 100 M à 5 Md ; instruments 125 M à 5 Md. Instruments loués non acceptés. Rendements indicatifs uniquement, confirmés par la plateforme au moment de l'opération.",
  en: 'Private placement programmes do not constitute a continuous public offer. Participation by invitation, after compliance. Indicative ranges: Small Cap from USD/EUR 100K; Large Cap (cash) USD/EUR 100M to 5B; instruments USD/EUR 125M to 5B. Leased instruments not accepted. Returns are indicative only, confirmed by the platform at the time of the operation.',
};

export const loanRegulatoryNote: Bilingual = {
  fr: "Les prêts sont accordés par des prêteurs partenaires, pas par GL Capital. Taux et montants indicatifs (ex. 3 % APR, 5 à 5,5 Md USD) selon dossier et prêteur retenu. Caution d'assurance obligatoire après approbation, avant décaissement.",
  en: 'Loans are granted by partner lenders, not by GL Capital. Indicative rates and amounts (e.g. 3% APR, USD 5M to 5.5B) depend on file and selected lender. Insurance surety bond mandatory after approval, before disbursement.',
};

export const projectFinanceRegulatoryNote: Bilingual = {
  fr: "Programme de structuration en euros (indicatif 2 M€ à 4 Md€, taux indicatif 4 %). GL Capital prépare le dossier ; le décaissement relève de l'institution retenue après conformité.",
  en: 'Euro structuring programme (indicative EUR 2M to EUR 4B, indicative 4% rate). GL Capital prepares the file; disbursement is carried out by the selected institution after compliance.',
};
