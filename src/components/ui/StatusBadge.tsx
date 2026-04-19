import React from 'react';

export type DossierStatus =
  | 'RECU' |'A_COMPLETER' |'EN_ANALYSE' |'EN_REVUE_COMPLIANCE' |'ELIGIBLE' |'SOUMIS_PARTENAIRE' |'RETOUR_PARTENAIRE' |'EN_NEGOCIATION' |'CLOTURE' |'REJETE';

const statusConfig: Record<DossierStatus, { label: string; labelFr: string; className: string }> = {
  RECU: { label: 'Received', labelFr: 'Reçu', className: 'status-recu' },
  A_COMPLETER: { label: 'To Complete', labelFr: 'À compléter', className: 'status-a_completer' },
  EN_ANALYSE: { label: 'Under Analysis', labelFr: 'En analyse', className: 'status-en_analyse' },
  EN_REVUE_COMPLIANCE: { label: 'Compliance Review', labelFr: 'Revue conformité', className: 'status-en_revue_compliance' },
  ELIGIBLE: { label: 'Eligible', labelFr: 'Éligible', className: 'status-eligible' },
  SOUMIS_PARTENAIRE: { label: 'Submitted', labelFr: 'Soumis partenaire', className: 'status-soumis_partenaire' },
  RETOUR_PARTENAIRE: { label: 'Partner Response', labelFr: 'Retour partenaire', className: 'status-retour_partenaire' },
  EN_NEGOCIATION: { label: 'In Negotiation', labelFr: 'En négociation', className: 'status-en_negociation' },
  CLOTURE: { label: 'Closed', labelFr: 'Clôturé', className: 'status-cloture' },
  REJETE: { label: 'Rejected', labelFr: 'Rejeté', className: 'status-rejete' },
};

interface StatusBadgeProps {
  status: DossierStatus;
  lang?: 'en' | 'fr';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, lang = 'en', size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.className} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      {lang === 'en' ? config.label : config.labelFr}
    </span>
  );
}