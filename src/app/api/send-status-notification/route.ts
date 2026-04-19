import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';

type CaseStatus =
  | 'RECU' | 'A_COMPLETER' | 'EN_ANALYSE' | 'EN_REVUE_COMPLIANCE' |'ELIGIBLE'| 'SOUMIS_PARTENAIRE' | 'RETOUR_PARTENAIRE' |'EN_NEGOCIATION' | 'CLOTURE' | 'REJETE';

const statusLabels: Record<CaseStatus, { fr: string; en: string; color: string }> = {
  RECU: { fr: 'Reçu', en: 'Received', color: '#3b82f6' },
  A_COMPLETER: { fr: 'À compléter', en: 'To Complete', color: '#f97316' },
  EN_ANALYSE: { fr: 'En analyse', en: 'Under Review', color: '#f59e0b' },
  EN_REVUE_COMPLIANCE: { fr: 'En revue conformité', en: 'Compliance Review', color: '#6366f1' },
  ELIGIBLE: { fr: 'Éligible', en: 'Eligible', color: '#10b981' },
  SOUMIS_PARTENAIRE: { fr: 'Soumis à un partenaire', en: 'Submitted to Partner', color: '#0ea5e9' },
  RETOUR_PARTENAIRE: { fr: 'Retour partenaire', en: 'Partner Feedback', color: '#8b5cf6' },
  EN_NEGOCIATION: { fr: 'En négociation', en: 'In Negotiation', color: '#a855f7' },
  CLOTURE: { fr: 'Clôturé', en: 'Closed', color: '#14b8a6' },
  REJETE: { fr: 'Rejeté', en: 'Rejected', color: '#ef4444' },
};

// Statuses that trigger client notification
const CLIENT_NOTIFY_STATUSES: CaseStatus[] = [
  'RECU', 'A_COMPLETER', 'EN_REVUE_COMPLIANCE', 'ELIGIBLE', 'SOUMIS_PARTENAIRE', 'REJETE', 'CLOTURE',
];

function buildClientEmailHtml(params: {
  clientName: string;
  caseTitle: string;
  caseId: string;
  newStatus: CaseStatus;
  oldStatus: CaseStatus | null;
  note: string | null;
  lang: 'fr' | 'en';
}): string {
  const { clientName, caseTitle, newStatus, oldStatus, note, lang } = params;
  const isFr = lang === 'fr';
  const statusInfo = statusLabels[newStatus];
  const portalLink = `${SITE_URL}/client-dashboard/case-files`;

  const subject = isFr
    ? `Mise à jour de votre dossier — ${caseTitle}`
    : `Update on your case file — ${caseTitle}`;

  const greeting = isFr ? `Bonjour ${clientName},` : `Dear ${clientName},`;
  const intro = isFr
    ? `Nous vous informons que le statut de votre dossier <strong>${caseTitle}</strong> a été mis à jour.`
    : `We are writing to inform you that the status of your case file <strong>${caseTitle}</strong> has been updated.`;

  const statusLabel = isFr ? statusInfo.fr : statusInfo.en;
  const oldStatusLabel = oldStatus ? (isFr ? statusLabels[oldStatus]?.fr : statusLabels[oldStatus]?.en) : null;

  const statusChangeText = oldStatusLabel
    ? (isFr
        ? `Statut précédent : <strong>${oldStatusLabel}</strong> → Nouveau statut : <strong style="color:${statusInfo.color}">${statusLabel}</strong>`
        : `Previous status: <strong>${oldStatusLabel}</strong> → New status: <strong style="color:${statusInfo.color}">${statusLabel}</strong>`)
    : (isFr
        ? `Statut actuel : <strong style="color:${statusInfo.color}">${statusLabel}</strong>`
        : `Current status: <strong style="color:${statusInfo.color}">${statusLabel}</strong>`);

  const noteSection = note
    ? `<tr><td style="padding:0 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding-bottom:8px;">
            <span style="display:inline-block;background:#0a1941;color:#c9a84c;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 12px;border-radius:4px;">
              ${isFr ? 'Note de notre équipe' : 'Note from our team'}
            </span>
          </td></tr>
          <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #c9a84c;border-radius:0 8px 8px 0;padding:16px 20px;">
            <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">${note.replace(/\n/g, '<br/>')}</p>
          </td></tr>
        </table>
      </td></tr>` : '';

  const ctaText = isFr ? 'Accéder à mon portail' : 'Access my portal';
  const footerNote = isFr
    ? 'Ce message vous a été envoyé automatiquement suite à une mise à jour de votre dossier GL Capital.'
    : 'This message was sent automatically following an update to your GL Capital case file.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Mise à jour de dossier' : 'Case File Update'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#ffffff;padding:40px 40px 0;">
          <p style="margin:0 0 8px;color:#0a1941;font-size:16px;font-weight:600;">${greeting}</p>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">${intro}</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding-bottom:12px;border-bottom:1px solid #f1f5f9;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Dossier' : 'Case file'}</span>
                  <p style="margin:4px 0 0;color:#0a1941;font-size:15px;font-weight:700;">${caseTitle}</p>
                </td></tr>
                <tr><td style="padding-top:12px;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Statut' : 'Status'}</span>
                  <p style="margin:4px 0 0;font-size:14px;">${statusChangeText}</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        ${noteSection}
        <tr><td style="background:#ffffff;padding:0 40px 36px;text-align:center;">
          <a href="${portalLink}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">${ctaText}</a>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#475569;font-size:11px;">${footerNote}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildInternalNotificationHtml(params: {
  caseTitle: string;
  caseId: string;
  clientEmail: string;
  clientName: string;
  newStatus: CaseStatus;
  oldStatus: CaseStatus | null;
  changedByEmail: string;
  note: string | null;
  notificationType: 'new_submission' | 'status_change';
}): string {
  const { caseTitle, caseId, clientEmail, clientName, newStatus, oldStatus, changedByEmail, note, notificationType } = params;
  const statusInfo = statusLabels[newStatus];
  const oldStatusInfo = oldStatus ? statusLabels[oldStatus] : null;
  const dashboardLink = `${SITE_URL}/admin/case-management`;

  const isNewSubmission = notificationType === 'new_submission';
  const subject = isNewSubmission
    ? `Nouveau dossier soumis — ${caseTitle}`
    : `Changement de statut — ${caseTitle}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:#0a1941;border-radius:10px 10px 0 0;padding:24px 32px;">
          <h1 style="margin:0;color:#c9a84c;font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">GL Capital — Back-Office</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">${isNewSubmission ? '🆕 Nouvelle soumission de dossier' : '🔄 Changement de statut de dossier'}</p>
        </td></tr>
        <tr><td style="background:#c9a84c;height:2px;"></td></tr>
        <tr><td style="background:#ffffff;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr><td style="background:#f8fafc;padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Dossier</span>
              <p style="margin:3px 0 0;color:#0a1941;font-size:15px;font-weight:700;">${caseTitle}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;font-family:monospace;">${caseId}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Client</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${clientName || '—'} &lt;${clientEmail}&gt;</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Statut</span>
              <p style="margin:3px 0 0;font-size:13px;">
                ${oldStatusInfo ? `<span style="color:#64748b;">${oldStatusInfo.fr}</span> → ` : ''}
                <strong style="color:${statusInfo.color};">${statusInfo.fr}</strong>
              </p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:${note ? '1px solid #e2e8f0' : 'none'};">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Modifié par</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${changedByEmail}</p>
            </td></tr>
            ${note ? `<tr><td style="padding:14px 18px;background:#fffbeb;">
              <span style="color:#92400e;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Note</span>
              <p style="margin:3px 0 0;color:#78350f;font-size:13px;line-height:1.6;">${note.replace(/\n/g, '<br/>')}</p>
            </td></tr>` : ''}
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${dashboardLink}" style="display:inline-block;background:#0a1941;color:#c9a84c;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:8px;text-decoration:none;">Voir dans le back-office</a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">Notification interne GL Capital — Ne pas répondre à cet email</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: {
    clientEmail: string;
    clientName: string;
    caseTitle: string;
    caseId: string;
    newStatus: CaseStatus;
    oldStatus: CaseStatus | null;
    note?: string | null;
    lang?: 'fr' | 'en';
    changedByEmail?: string;
    internalRecipients?: string[];
    notificationType?: 'status_change' | 'new_submission';
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const {
    clientEmail, clientName, caseTitle, caseId, newStatus, oldStatus,
    note = null, lang = 'fr', changedByEmail = 'système',
    internalRecipients = [], notificationType = 'status_change',
  } = body;

  if (!clientEmail || !clientName || !caseTitle || !caseId || !newStatus) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const isFr = lang === 'fr';
  const errors: string[] = [];
  const sent: string[] = [];

  // 1. Client notification — only for relevant statuses
  if (CLIENT_NOTIFY_STATUSES.includes(newStatus)) {
    const clientSubject = isFr
      ? `Mise à jour de votre dossier — ${caseTitle}`
      : `Update on your case file — ${caseTitle}`;
    try {
      const { error } = await resend.emails.send({
        from: 'GL Capital <noreply@glcapital.com>',
        to: clientEmail,
        subject: clientSubject,
        html: buildClientEmailHtml({ clientName, caseTitle, caseId, newStatus, oldStatus, note, lang }),
      });
      if (error) errors.push(`Client: ${error.message}`);
      else sent.push('client');
    } catch (err: any) {
      errors.push(`Client: ${err.message}`);
    }
  }

  // 2. Internal notifications (analysts/admins) — always send if recipients provided
  if (internalRecipients.length > 0) {
    const internalSubject = notificationType === 'new_submission'
      ? `[GL Capital] Nouveau dossier soumis — ${caseTitle}`
      : `[GL Capital] Statut mis à jour — ${caseTitle} → ${statusLabels[newStatus]?.fr}`;
    try {
      const { error } = await resend.emails.send({
        from: 'GL Capital Back-Office <onboarding@resend.dev>',
        to: internalRecipients,
        subject: internalSubject,
        html: buildInternalNotificationHtml({
          caseTitle, caseId, clientEmail, clientName, newStatus, oldStatus,
          changedByEmail, note, notificationType,
        }),
      });
      if (error) errors.push(`Internal: ${error.message}`);
      else sent.push('internal');
    } catch (err: any) {
      errors.push(`Internal: ${err.message}`);
    }
  }

  if (errors.length > 0 && sent.length === 0) {
    return NextResponse.json({ success: false, error: errors.join('; ') }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent, errors: errors.length > 0 ? errors : undefined });
}
