import { createClient } from '@/lib/supabase/client';

type NotificationType = 'STATUS_UPDATE' | 'ACTION_REQUIRED' | 'COMPLIANCE_DECISION' | 'DOCUMENT_REQUEST' | 'GENERAL';

interface CreateNotificationParams {
  userId: string;
  caseId?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  // Optional: send real email via Resend
  recipientEmail?: string;
  recipientName?: string;
  lang?: 'fr' | 'en';
}

const STATUS_LABELS: Record<string, string> = {
  RECU: 'Reçu',
  A_COMPLETER: 'À compléter',
  EN_ANALYSE: 'En analyse',
  EN_REVUE_COMPLIANCE: 'En revue conformité',
  ELIGIBLE: 'Éligible',
  SOUMIS_PARTENAIRE: 'Soumis partenaire',
  RETOUR_PARTENAIRE: 'Retour partenaire',
  EN_NEGOCIATION: 'En négociation',
  CLOTURE: 'Clôturé',
  REJETE: 'Rejeté',
};

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from('notifications').insert({
      user_id: params.userId,
      case_id: params.caseId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {},
    });

    // Send real email notification via Resend if recipient email provided
    if (params.recipientEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
      fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName || '',
          title: params.title,
          message: params.message,
          type: params.type,
          caseTitle: params.metadata?.case_title,
          actionUrl: params.caseId
            ? `${siteUrl}/client-dashboard/case-files/${params.caseId}`
            : `${siteUrl}/client-dashboard`,
          lang: params.lang || 'fr',
        }),
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Failed to create notification (non-blocking):', err);
  }
}

export async function notifyStatusChange(params: {
  userId: string;
  caseId: string;
  caseTitle: string;
  newStatus: string;
  oldStatus: string;
  note?: string | null;
  recipientEmail?: string;
  recipientName?: string;
  lang?: 'fr' | 'en';
}): Promise<void> {
  const newLabel = STATUS_LABELS[params.newStatus] || params.newStatus;
  const oldLabel = STATUS_LABELS[params.oldStatus] || params.oldStatus;

  let type: NotificationType = 'STATUS_UPDATE';
  let title = `Statut mis à jour : ${newLabel}`;
  let message = `Votre dossier "${params.caseTitle}" est passé de "${oldLabel}" à "${newLabel}".`;

  if (params.newStatus === 'A_COMPLETER') {
    type = 'ACTION_REQUIRED';
    title = 'Action requise sur votre dossier';
    message = `Votre dossier "${params.caseTitle}" nécessite des informations complémentaires. Veuillez le compléter.`;
  } else if (params.newStatus === 'ELIGIBLE') {
    type = 'COMPLIANCE_DECISION';
    title = 'Dossier éligible — Décision favorable';
    message = `Votre dossier "${params.caseTitle}" a été validé et déclaré éligible.`;
  } else if (params.newStatus === 'REJETE') {
    type = 'COMPLIANCE_DECISION';
    title = 'Dossier rejeté';
    message = `Votre dossier "${params.caseTitle}" a été rejeté.${params.note ? ` Motif : ${params.note}` : ''}`;
  } else if (params.newStatus === 'CLOTURE') {
    type = 'STATUS_UPDATE';
    title = 'Dossier clôturé';
    message = `Votre dossier "${params.caseTitle}" a été clôturé avec succès.`;
  } else if (params.newStatus === 'EN_REVUE_COMPLIANCE') {
    type = 'STATUS_UPDATE';
    title = 'Dossier en revue conformité';
    message = `Votre dossier "${params.caseTitle}" est en cours de revue par notre équipe conformité.`;
  }

  if (params.note && type !== 'COMPLIANCE_DECISION') {
    message += ` Note : ${params.note}`;
  }

  await createNotification({
    userId: params.userId,
    caseId: params.caseId,
    type,
    title,
    message,
    metadata: {
      case_title: params.caseTitle,
      old_status: params.oldStatus,
      new_status: params.newStatus,
    },
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    lang: params.lang,
  });
}
